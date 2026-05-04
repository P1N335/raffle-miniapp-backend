import {
  GiftMarketplaceListing,
  GiftMarketplaceProvider,
  GiftMarketplaceSearchInput,
} from './gift-marketplace-provider';

export class ManualMarketplaceProvider implements GiftMarketplaceProvider {
  readonly key = 'manual';
  readonly label = 'Manual Review';

  async search(
    _input: GiftMarketplaceSearchInput,
  ): Promise<GiftMarketplaceListing[]> {
    return [];
  }
}
