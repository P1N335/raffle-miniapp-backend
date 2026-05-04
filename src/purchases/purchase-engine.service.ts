import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GiftPurchaseStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuditContext } from '../audit/audit.types';
import { PrismaService } from '../prisma/prisma.service';
import {
  GiftMarketplaceListing,
  GiftMarketplaceProvider,
} from './providers/gift-marketplace-provider';
import { ManualMarketplaceProvider } from './providers/manual-marketplace.provider';

type PurchaseRequestRecord = Prisma.GiftPurchaseRequestGetPayload<{
  include: typeof purchaseRequestInclude;
}>;

@Injectable()
export class PurchaseEngineService {
  private readonly providers: GiftMarketplaceProvider[] = [
    new ManualMarketplaceProvider(),
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  getAvailableProviders() {
    return this.providers.map((provider) => ({
      key: provider.key,
      label: provider.label,
    }));
  }

  async searchPurchaseRequest(
    requestId: string,
    auditContext: AuditContext,
  ) {
    const purchaseRequest = await this.prisma.giftPurchaseRequest.findUnique({
      where: { id: requestId },
      include: purchaseRequestInclude,
    });

    if (!purchaseRequest) {
      throw new NotFoundException('Purchase request not found');
    }

    if (
      purchaseRequest.status === GiftPurchaseStatus.DELIVERED ||
      purchaseRequest.status === GiftPurchaseStatus.CANCELLED
    ) {
      throw new BadRequestException('This purchase request can no longer be searched');
    }

    const listings = await this.searchAcrossProviders(purchaseRequest);

    const nextStatus =
      listings.length > 0
        ? GiftPurchaseStatus.OFFER_FOUND
        : GiftPurchaseStatus.SEARCHING;

    const updatedRequest = await this.prisma.giftPurchaseRequest.update({
      where: { id: requestId },
      data: {
        status: nextStatus,
        searchStartedAt: purchaseRequest.searchStartedAt ?? new Date(),
        offerFoundAt:
          listings.length > 0
            ? purchaseRequest.offerFoundAt ?? new Date()
            : purchaseRequest.offerFoundAt,
        metadata: {
          ...(asObject(purchaseRequest.metadata) ?? {}),
          latestSearchResults: listings.map((listing) => mapListingToJson(listing)),
          latestSearchAt: new Date().toISOString(),
        } satisfies Prisma.InputJsonObject,
      },
      include: purchaseRequestInclude,
    });

    await this.auditService.write({
      ...auditContext,
      userId: auditContext.userId ?? null,
      action: 'purchase_request.search',
      entityType: 'gift_purchase_request',
      entityId: requestId,
      metadata: {
        foundOffers: listings.length,
      },
    });

    return this.mapPurchaseRequest(updatedRequest);
  }

  async getPurchaseRequestOrThrow(requestId: string) {
    const purchaseRequest = await this.prisma.giftPurchaseRequest.findUnique({
      where: { id: requestId },
      include: purchaseRequestInclude,
    });

    if (!purchaseRequest) {
      throw new NotFoundException('Purchase request not found');
    }

    return purchaseRequest;
  }

  mapPurchaseRequest(purchaseRequest: PurchaseRequestRecord) {
    return {
      id: purchaseRequest.id,
      status: purchaseRequest.status.toLowerCase(),
      providerKey: purchaseRequest.providerKey,
      providerLabel: purchaseRequest.providerLabel,
      searchQuery: purchaseRequest.searchQuery,
      externalListingId: purchaseRequest.externalListingId,
      externalListingUrl: purchaseRequest.externalListingUrl,
      externalOrderId: purchaseRequest.externalOrderId,
      quotedPriceTon: purchaseRequest.quotedPriceTon,
      purchasedPriceTon: purchaseRequest.purchasedPriceTon,
      deliveryTelegramGiftId: purchaseRequest.deliveryTelegramGiftId,
      failureReason: purchaseRequest.failureReason,
      adminNote: purchaseRequest.adminNote,
      queuedAt: purchaseRequest.queuedAt,
      searchStartedAt: purchaseRequest.searchStartedAt,
      offerFoundAt: purchaseRequest.offerFoundAt,
      purchasedAt: purchaseRequest.purchasedAt,
      deliveredAt: purchaseRequest.deliveredAt,
      cancelledAt: purchaseRequest.cancelledAt,
      metadata: purchaseRequest.metadata,
      user: {
        id: purchaseRequest.user.id,
        telegramId: purchaseRequest.user.telegramId,
        username: purchaseRequest.user.username,
        firstName: purchaseRequest.user.firstName,
        lastName: purchaseRequest.user.lastName,
      },
      opening: {
        id: purchaseRequest.opening.id,
        status: purchaseRequest.opening.status.toLowerCase(),
        createdAt: purchaseRequest.opening.createdAt,
        case: {
          id: purchaseRequest.opening.case.id,
          slug: purchaseRequest.opening.case.slug,
          name: purchaseRequest.opening.case.name,
        },
      },
      giftType: {
        id: purchaseRequest.giftType.id,
        telegramGiftTypeId: purchaseRequest.giftType.telegramGiftTypeId,
        name: purchaseRequest.giftType.name,
        image: purchaseRequest.giftType.image,
        rarity: purchaseRequest.giftType.rarity.toLowerCase(),
        estimatedValueTon: purchaseRequest.giftType.estimatedValueTon,
      },
    };
  }

  private async searchAcrossProviders(purchaseRequest: PurchaseRequestRecord) {
    const results = await Promise.all(
      this.providers.map((provider) =>
        provider.search({
          purchaseRequestId: purchaseRequest.id,
          giftTypeId: purchaseRequest.giftType.id,
          giftName: purchaseRequest.giftType.name,
          searchQuery: purchaseRequest.searchQuery,
        }),
      ),
    );

    return results.flat();
  }
}

function asObject(value: Prisma.JsonValue | null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Prisma.InputJsonObject;
}

function mapListingToJson(
  listing: GiftMarketplaceListing,
): Prisma.InputJsonObject {
  return {
    providerKey: listing.providerKey,
    providerLabel: listing.providerLabel,
    listingId: listing.listingId,
    listingUrl: listing.listingUrl ?? null,
    title: listing.title,
    priceTon: listing.priceTon ?? null,
    metadata: listing.metadata ? (listing.metadata as Prisma.InputJsonObject) : null,
  };
}

const purchaseRequestInclude = {
  user: true,
  opening: {
    include: {
      giftType: true,
      case: true,
    },
  },
  giftType: true,
} satisfies Prisma.GiftPurchaseRequestInclude;
