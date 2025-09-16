export interface ListingPrice {
  id: string;
  value: number;
  currency: string;
  address: string | null;
  requiredMeta: string | null;
}

export interface Listing {
  id: string;
  shopId: string;

  itemName: string;
  itemNbt: string | null;
  itemDisplayName: string | null;
  itemDescription: string | null;

  shopBuysItem?: boolean | null;
  noLimit?: boolean | null;

  dynamicPrice: boolean;
  madeOnDemand: boolean;
  requiresInteraction: boolean;
  stock: number;

  prices?: ListingPrice[];
  shop?: Shop;
  addresses?: string[];

  createdDate?: string | null;
  updatedDate?: string | null;
}

export interface Shop {
  id: string;

  // shop info fields
  name: string;
  description: string | null;
  owner: string | null;
  computerId: number;

  softwareName: string | null;
  softwareVersion: string | null;

  locationCoordinates: string | null;
  locationDescription: string | null;
  locationDimension: string | null;

  items?: Listing[];
  addresses?: string[];

  createdDate?: string | null;
  updatedDate?: string | null;
}