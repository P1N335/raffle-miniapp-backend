export type GiftMarketplaceSearchInput = {
  purchaseRequestId: string;
  giftTypeId: string;
  giftName: string;
  searchQuery: string;
};

export type GiftMarketplaceListing = {
  providerKey: string;
  providerLabel: string;
  listingId: string;
  listingUrl?: string;
  title: string;
  priceTon?: number;
  metadata?: Record<string, unknown>;
};

export interface GiftMarketplaceProvider {
  readonly key: string;
  readonly label: string;
  search(input: GiftMarketplaceSearchInput): Promise<GiftMarketplaceListing[]>;
}
