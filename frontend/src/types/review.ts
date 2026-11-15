export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DELETED';

export interface ProductReview {
  id: string;
  productId: string;
  productName: string;
  productSlug?: string;
  productThumbnailUrl?: string;
  userId: string;
  userFullName: string;
  orderId?: string;
  orderCode?: string;
  rating: number;
  title: string;
  content: string;
  isVerifiedPurchase: boolean;
  status: ReviewStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  rating1Count: number;
  rating2Count: number;
  rating3Count: number;
  rating4Count: number;
  rating5Count: number;
}

export interface ReviewEligibility {
  canReview: boolean;
  isVerifiedPurchase: boolean;
  existingReview?: ProductReview | null;
  eligibleOrderId?: string | null;
  message: string;
}

export interface CreateReviewPayload {
  rating: number;
  title: string;
  content: string;
}

export interface UpdateReviewPayload {
  rating: number;
  title: string;
  content: string;
}

export interface ModerateReviewPayload {
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}
