/**
 * Format số tiền sang định dạng tiền tệ Việt Nam (VND)
 * Ví dụ: 34990000 -> "34.990.000 ₫"
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) {
    return '0 ₫';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Tính phần trăm giảm giá giữa listPrice và salePrice
 */
export function calculateDiscountPercent(listPrice: number, salePrice: number): number | null {
  if (!listPrice || !salePrice || listPrice <= salePrice) {
    return null;
  }
  const discount = Math.round(((listPrice - salePrice) / listPrice) * 100);
  return discount > 0 ? discount : null;
}

/**
 * Định dạng nhãn useCase cho Laptop sang tiếng Việt thân thiện
 */
export function formatUseCaseLabel(useCase: string): string {
  const map: Record<string, string> = {
    GAMING: 'Gaming & Đồ họa',
    OFFICE: 'Văn phòng & Học tập',
    CREATIVE_DESIGN: 'Thiết kế & Sáng tạo',
    DATA_AI: 'Khoa học dữ liệu & AI',
    STUDENT: 'Học sinh - Sinh viên',
    THIN_LIGHT: 'Mỏng nhẹ cao cấp',
  };
  return map[useCase.toUpperCase()] || useCase;
}

