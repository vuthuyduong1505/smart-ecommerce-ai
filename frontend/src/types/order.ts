export interface ShippingAddress {
  receiverName: string;
  phoneNumber: string;
  fullAddress: string;
}

export interface PaymentDetails {
  method: string;
  gatewayTransactionId?: string | null;
  paidAt?: string | null;
  refund?: unknown | null;
}

export interface OrderItemResponse {
  productId: string;
  sku: string;
  productName: string;
  thumbnailUrl?: string;
  unitPrice: number;
  quantity: number;
  returnedQuantity: number;
  refundedQuantity: number;
  totalPrice: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'EXPIRED';

export type PaymentStatus =
  | 'UNPAID'
  | 'PENDING_GATEWAY'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'PAID_LATE'
  | 'REFUND_PENDING'
  | 'REFUNDED'
  | 'REFUND_FAILED';

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'RELEASED' | 'EXPIRED';

export interface OrderResponse {
  id: string;
  orderCode: string;
  idempotencyKey: string;
  userId: string;
  activeReservationId: string;
  reservationStatus: ReservationStatus;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: ShippingAddress;
  payment: PaymentDetails;
  items: OrderItemResponse[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  grandTotal: number;
  notes?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutRequest {
  shippingAddress: ShippingAddress;
  notes?: string;
  paymentMethod?: string;
  idempotencyKey?: string;
}

export interface UpdateOrderStatusRequest {
  status: string;
}
