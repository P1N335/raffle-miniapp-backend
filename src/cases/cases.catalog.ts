export type CaseRewardRarityName = 'common' | 'rare' | 'epic' | 'legendary';

export type CaseCatalogReward = {
  id: string;
  name: string;
  image: string;
  rarity: CaseRewardRarityName;
  chance: number;
  valueLabel: string;
};

export type CaseCatalogEntry = {
  slug: string;
  name: string;
  tagline: string;
  shortDescription: string;
  priceTon: number;
  image: string;
  rewards: CaseCatalogReward[];
};

export const CASE_CATALOG: CaseCatalogEntry[] = [
  {
    slug: 'starter-case',
    name: 'Starter Case',
    tagline: 'Open for 10 TON',
    shortDescription: 'Friendly drops with bright collectibles and gift staples.',
    priceTon: 10,
    image: '/images/08.png',
    rewards: [
      { id: 'starter-rose', name: 'Rose Bloom', image: '/images/07.png', rarity: 'common', chance: 28, valueLabel: 'Soft drop' },
      { id: 'starter-sweet', name: 'Sweet Spin', image: '/images/12.png', rarity: 'common', chance: 24, valueLabel: 'Candy gift' },
      { id: 'starter-bloom', name: 'Cherry Bloom', image: '/images/13.png', rarity: 'rare', chance: 18, valueLabel: 'Seasonal drop' },
      { id: 'starter-heart', name: 'Ribbon Heart', image: '/images/10.png', rarity: 'rare', chance: 14, valueLabel: 'Love token' },
      { id: 'starter-gift', name: 'Golden Box', image: '/images/08.png', rarity: 'epic', chance: 10, valueLabel: 'Wrapped prize' },
      { id: 'starter-ring', name: 'Silver Ring', image: '/images/02.png', rarity: 'legendary', chance: 6, valueLabel: 'Rare jewel' },
    ],
  },
  {
    slug: 'mystery-case',
    name: 'Mystery Case',
    tagline: 'Open for 25 TON',
    shortDescription: 'Unexpected pulls with playful odds and hidden premium gems.',
    priceTon: 25,
    image: '/images/12.png',
    rewards: [
      { id: 'mystery-bear', name: 'Cozy Bear', image: '/images/09.png', rarity: 'common', chance: 22, valueLabel: 'Cute collectible' },
      { id: 'mystery-cake', name: 'Party Cake', image: '/images/11.png', rarity: 'common', chance: 20, valueLabel: 'Celebration drop' },
      { id: 'mystery-gift', name: 'Gift Crate', image: '/images/08.png', rarity: 'rare', chance: 18, valueLabel: 'Surprise box' },
      { id: 'mystery-heart', name: 'Velvet Heart', image: '/images/10.png', rarity: 'rare', chance: 16, valueLabel: 'Warm charm' },
      { id: 'mystery-gem', name: 'Blue Gem', image: '/images/01.png', rarity: 'epic', chance: 14, valueLabel: 'Spark drop' },
      { id: 'mystery-trophy', name: 'Golden Cup', image: '/images/03.png', rarity: 'legendary', chance: 10, valueLabel: 'Prestige win' },
    ],
  },
  {
    slug: 'premium-case',
    name: 'Premium Case',
    tagline: 'Open for 50 TON',
    shortDescription: 'Shiny gems, rich cosmetics and better premium hit rates.',
    priceTon: 50,
    image: '/images/01.png',
    rewards: [
      { id: 'premium-gem', name: 'Sky Diamond', image: '/images/01.png', rarity: 'rare', chance: 28, valueLabel: 'Premium shard' },
      { id: 'premium-ring', name: 'Diamond Ring', image: '/images/02.png', rarity: 'rare', chance: 24, valueLabel: 'Jewelry drop' },
      { id: 'premium-heart', name: 'Royal Heart', image: '/images/10.png', rarity: 'epic', chance: 18, valueLabel: 'Rare charm' },
      { id: 'premium-cup', name: 'Champion Cup', image: '/images/03.png', rarity: 'epic', chance: 14, valueLabel: 'Glory item' },
      { id: 'premium-bloom', name: 'Sakura Glow', image: '/images/13.png', rarity: 'legendary', chance: 10, valueLabel: 'Festival ultra' },
      { id: 'premium-bear', name: 'Velvet Bear', image: '/images/09.png', rarity: 'legendary', chance: 6, valueLabel: 'Collector ultra' },
    ],
  },
  {
    slug: 'blossom-case',
    name: 'Blossom Case',
    tagline: 'Open for 75 TON',
    shortDescription: 'Seasonal florals, ribbons and soft luxury rewards.',
    priceTon: 75,
    image: '/images/13.png',
    rewards: [
      { id: 'blossom-petal', name: 'Petal Bloom', image: '/images/13.png', rarity: 'common', chance: 26, valueLabel: 'Bloom token' },
      { id: 'blossom-rose', name: 'Rose Deluxe', image: '/images/07.png', rarity: 'rare', chance: 24, valueLabel: 'Romance drop' },
      { id: 'blossom-heart', name: 'Cupid Heart', image: '/images/10.png', rarity: 'rare', chance: 18, valueLabel: 'Ribbon charm' },
      { id: 'blossom-cake', name: 'Pink Cake', image: '/images/11.png', rarity: 'epic', chance: 14, valueLabel: 'Party item' },
      { id: 'blossom-gem', name: 'Love Gem', image: '/images/01.png', rarity: 'epic', chance: 10, valueLabel: 'Blue sparkle' },
      { id: 'blossom-ring', name: 'Promise Ring', image: '/images/02.png', rarity: 'legendary', chance: 8, valueLabel: 'Heart ultra' },
    ],
  },
  {
    slug: 'legendary-case',
    name: 'Legendary Case',
    tagline: 'Open for 100 TON',
    shortDescription: 'Top-shelf trophies, rare gems and prestige collector items.',
    priceTon: 100,
    image: '/images/03.png',
    rewards: [
      { id: 'legendary-cup', name: 'Legend Cup', image: '/images/03.png', rarity: 'rare', chance: 26, valueLabel: 'Prestige prize' },
      { id: 'legendary-ring', name: 'Crystal Ring', image: '/images/02.png', rarity: 'rare', chance: 22, valueLabel: 'Crown jewel' },
      { id: 'legendary-gem', name: 'Grand Diamond', image: '/images/01.png', rarity: 'epic', chance: 18, valueLabel: 'Vault reward' },
      { id: 'legendary-gift', name: 'Royal Present', image: '/images/08.png', rarity: 'epic', chance: 14, valueLabel: 'Wrapped vault' },
      { id: 'legendary-heart', name: 'Golden Heart', image: '/images/10.png', rarity: 'legendary', chance: 12, valueLabel: 'Ultra charm' },
      { id: 'legendary-bear', name: 'Hero Bear', image: '/images/09.png', rarity: 'legendary', chance: 8, valueLabel: 'Collector ultra' },
    ],
  },
  {
    slug: 'royal-case',
    name: 'Royal Case',
    tagline: 'Open for 200 TON',
    shortDescription: 'The highest tier chest with luxe drops and elite odds.',
    priceTon: 200,
    image: '/images/02.png',
    rewards: [
      { id: 'royal-ring', name: 'Royal Ring', image: '/images/02.png', rarity: 'rare', chance: 24, valueLabel: 'Elite jewel' },
      { id: 'royal-gem', name: 'Imperial Diamond', image: '/images/01.png', rarity: 'epic', chance: 22, valueLabel: 'Vault gem' },
      { id: 'royal-cup', name: 'Victory Trophy', image: '/images/03.png', rarity: 'epic', chance: 18, valueLabel: 'Winner relic' },
      { id: 'royal-heart', name: 'Royal Heart', image: '/images/10.png', rarity: 'legendary', chance: 14, valueLabel: 'Luxury charm' },
      { id: 'royal-bloom', name: 'Empress Bloom', image: '/images/13.png', rarity: 'legendary', chance: 12, valueLabel: 'Seasonal ultra' },
      { id: 'royal-bear', name: 'Royal Bear', image: '/images/09.png', rarity: 'legendary', chance: 10, valueLabel: 'Mythic plush' },
    ],
  },
];

export function getCaseCatalogEntry(slug: string) {
  return CASE_CATALOG.find((caseItem) => caseItem.slug === slug);
}
