export type ShopSortOption =
	| 'smart'
	| 'name-asc'
	| 'name-desc'
	| 'owner-asc'
	| 'owner-desc'
	| 'updated-asc'
	| 'updated-desc'
	| 'created-asc'
	| 'created-desc';

export const SHOP_SORT_OPTIONS: ShopSortOption[] = [
	'smart',
	'name-asc',
	'name-desc',
	'owner-asc',
	'owner-desc',
	'updated-asc',
	'updated-desc',
	'created-asc',
	'created-desc'
];

export const DEFAULT_SHOP_SORT: ShopSortOption = 'name-asc';

export type ItemSortOption =
	| 'smart'
	| 'name-asc'
	| 'name-desc'
	| 'id-asc'
	| 'id-desc'
	| 'price-asc'
	| 'price-desc'
	| 'stock-asc'
	| 'stock-desc';

export const ITEM_SORT_OPTIONS: ItemSortOption[] = [
	'smart',
	'name-asc',
	'name-desc',
	'id-asc',
	'id-desc',
	'price-asc',
	'price-desc',
	'stock-asc',
	'stock-desc'
];

export const DEFAULT_ITEM_SORT: ItemSortOption = 'name-asc';
