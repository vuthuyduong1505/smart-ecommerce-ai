import React from 'react';
import type { LaptopAttributes } from '../../types/product';
import { formatUseCaseLabel } from '../../utils/formatters';

interface ProductSpecTableProps {
  attributes?: LaptopAttributes;
  className?: string;
}

export const ProductSpecTable: React.FC<ProductSpecTableProps> = ({
  attributes,
  className = '',
}) => {
  if (!attributes) {
    return (
      <div className="p-6 text-sm text-slate-500 bg-slate-50 rounded-xl text-center">
        Chưa có thông số kỹ thuật chi tiết cho sản phẩm này.
      </div>
    );
  }

  const specRows = [
    {
      group: 'Bộ xử lý (CPU)',
      rows: [
        { label: 'Model CPU', value: attributes.cpu?.model },
        { label: 'Số nhân / Số luồng', value: attributes.cpu?.cores ? `${attributes.cpu.cores} nhân` : undefined },
        { label: 'Tốc độ tối đa', value: attributes.cpu?.boostClockGhz ? `${attributes.cpu.boostClockGhz} GHz` : undefined },
      ],
    },
    {
      group: 'Đồ họa (GPU)',
      rows: [
        { label: 'Model GPU', value: attributes.gpu?.model },
        { label: 'Bộ nhớ VRAM', value: attributes.gpu?.vramGb ? `${attributes.gpu.vramGb} GB` : 'Shared' },
      ],
    },
    {
      group: 'Bộ nhớ (RAM)',
      rows: [
        { label: 'Dung lượng RAM', value: attributes.ram?.capacityGb ? `${attributes.ram.capacityGb} GB` : undefined },
        { label: 'Chuẩn RAM', value: attributes.ram?.ramType },
      ],
    },
    {
      group: 'Lưu trữ (Ổ cứng)',
      rows: [
        {
          label: 'Dung lượng ổ cứng',
          value: attributes.storage?.capacityGb
            ? attributes.storage.capacityGb >= 1000
              ? `${attributes.storage.capacityGb / 1000} TB`
              : `${attributes.storage.capacityGb} GB`
            : undefined,
        },
        { label: 'Loại ổ cứng', value: attributes.storage?.storageType },
      ],
    },
    {
      group: 'Màn hình (Display)',
      rows: [
        { label: 'Kích thước màn hình', value: attributes.display?.sizeInches ? `${attributes.display.sizeInches} inch` : undefined },
        { label: 'Độ phân giải', value: attributes.display?.resolution },
        { label: 'Tần số quét', value: attributes.display?.refreshRateHz ? `${attributes.display.refreshRateHz} Hz` : undefined },
      ],
    },
    {
      group: 'Pin & Trọng lượng',
      rows: [
        { label: 'Dung lượng Pin', value: attributes.battery?.capacityWh ? `${attributes.battery.capacityWh} Wh` : undefined },
        { label: 'Trọng lượng máy', value: attributes.physical?.weightKg ? `${attributes.physical.weightKg} kg` : undefined },
      ],
    },
  ];

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${className}`}>
      <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200">
        <h3 className="text-base font-bold text-slate-900">Bảng Thông Số Kỹ Thuật Chi Tiết</h3>
      </div>

      <div className="divide-y divide-slate-100">
        {specRows.map((group, gIdx) => {
          const visibleRows = group.rows.filter((r) => r.value != null);
          if (visibleRows.length === 0) return null;

          return (
            <div key={gIdx} className="p-4 sm:p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-3">
                {group.group}
              </h4>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {visibleRows.map((row, rIdx) => (
                  <div key={rIdx} className="flex justify-between sm:justify-start gap-4 py-1 border-b sm:border-b-0 border-slate-50">
                    <dt className="text-slate-500 min-w-[130px] font-medium">{row.label}:</dt>
                    <dd className="text-slate-900 font-semibold text-right sm:text-left">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}

        {/* Nhu cầu phù hợp */}
        {attributes.useCases && attributes.useCases.length > 0 && (
          <div className="p-4 sm:p-5 bg-slate-50/50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-2.5">
              Nhu cầu sử dụng tối ưu
            </h4>
            <div className="flex flex-wrap gap-2">
              {attributes.useCases.map((uc, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs"
                >
                  {formatUseCaseLabel(uc)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

