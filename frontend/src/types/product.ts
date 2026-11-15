export interface Inventory {
  quantity: number;
  reserved: number;
  availableStock: number;
}

export interface RatingSummary {
  averageRating: number;
  totalReviews: number;
}

export interface LaptopCpu {
  model: string;
  cores?: number;
  boostClockGhz?: number;
}

export interface LaptopGpu {
  model: string;
  vramGb?: number;
}

export interface LaptopRam {
  capacityGb: number;
  ramType?: string;
}

export interface LaptopStorage {
  capacityGb: number;
  storageType?: string;
}

export interface LaptopDisplay {
  sizeInches: number;
  resolution?: string;
  refreshRateHz?: number;
}

export interface LaptopBattery {
  capacityWh?: number;
}

export interface LaptopPhysical {
  weightKg?: number;
}

export interface LaptopAttributes {
  cpu?: LaptopCpu;
  gpu?: LaptopGpu;
  ram?: LaptopRam;
  storage?: LaptopStorage;
  display?: LaptopDisplay;
  battery?: LaptopBattery;
  physical?: LaptopPhysical;
  useCases?: string[];
  [key: string]: unknown;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  categoryId: string;
  categorySlug: string;
  brandId: string;
  brandName: string;
  listPrice: number;
  salePrice: number;
  currency: string;
  inventory: Inventory;
  inStock: boolean;
  status: string;
  thumbnailUrl?: string;
  images: string[];
  shortDescription?: string;
  description?: string;
  tags: string[];
  attributes?: LaptopAttributes;
  ratingSummary?: RatingSummary;
  isSynthetic?: boolean;
  dataOrigin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFilterParams {
  keyword?: string;
  categorySlug?: string;
  categoryId?: string;
  brandName?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
  inStock?: boolean;
  useCase?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

