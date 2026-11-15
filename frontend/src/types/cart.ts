export interface CartItemResponse {
  productId: string;
  sku: string;
  productName: string;
  productSlug: string;
  thumbnailUrl?: string;
  unitPrice: number;
  listPrice?: number;
  quantity: number;
  totalPrice: number;
  inStock: boolean;
  availableStock: number;
  addedAt: string;
}

export interface CartResponse {
  items: CartItemResponse[];
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
