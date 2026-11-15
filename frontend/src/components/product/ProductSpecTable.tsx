import React from 'react';
import {
  Cpu,
  HardDrive,
  Monitor,
  Battery,
  Layers,
  Zap,
  Tag,
} from 'lucide-react';
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
      <div className="p-8 text-sm text-slate-500 bg-slate-50 rounded-2xl text-center border border-slate-200">
        Chưa có thông số kỹ thuật chi tiết cho sản phẩm này trong Catalog.
      </div>
    );
  }

  const specGroups = [
    {
      group: 'Bộ xử lý (CPU)',
      icon: <Cpu className="w-4 h-4 text-blue-600" />,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      rows: [
        { label: 'Model CPU', value: attributes.cpu?.model },
        {
          label: 'Số nhân / Số luồng',
          value: attributes.cpu?.cores ? `${attributes.cpu.cores} nhân` : undefined,
        },
        {
          label: 'Tốc độ xung nhịp tối đa',
          value: attributes.cpu?.boostClockGhz ? `${attributes.cpu.boostClockGhz} GHz` : undefined,
        },
      ],
    },
    {
      group: 'Card đồ họa (GPU)',
      icon: <Zap className="w-4 h-4 text-purple-600" />,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      rows: [
        { label: 'Model GPU', value: attributes.gpu?.model },
        {
          label: 'Bộ nhớ đồ họa VRAM',
          value: attributes.gpu?.vramGb ? `${attributes.gpu.vramGb} GB` : 'Tích hợp (Shared)',
        },
      ],
    },
    {
      group: 'Bộ nhớ trong (RAM)',
      icon: <Layers className="w-4 h-4 text-emerald-600" />,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      rows: [
        {
          label: 'Dung lượng RAM',
          value: attributes.ram?.capacityGb ? `${attributes.ram.capacityGb} GB` : undefined,
        },
        { label: 'Chuẩn RAM hỗ trợ', value: attributes.ram?.ramType },
      ],
    },
    {
      group: 'Ổ cứng lưu trữ (Storage)',
      icon: <HardDrive className="w-4 h-4 text-amber-600" />,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
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
      group: 'Màn hình hiển thị (Display)',
      icon: <Monitor className="w-4 h-4 text-indigo-600" />,
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      rows: [
        {
          label: 'Kích thước màn hình',
          value: attributes.display?.sizeInches ? `${attributes.display.sizeInches} inch` : undefined,
        },
        { label: 'Độ phân giải hiển thị', value: attributes.display?.resolution },
        {
          label: 'Tần số quét màn hình',
          value: attributes.display?.refreshRateHz ? `${attributes.display.refreshRateHz} Hz` : undefined,
        },
      ],
    },
    {
      group: 'Pin & Trọng lượng máy (Physical)',
      icon: <Battery className="w-4 h-4 text-rose-600" />,
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      rows: [
        {
          label: 'Dung lượng Pin',
          value: attributes.battery?.capacityWh ? `${attributes.battery.capacityWh} Wh` : undefined,
        },
        {
          label: 'Trọng lượng máy',
          value: attributes.physical?.weightKg ? `${attributes.physical.weightKg} kg` : undefined,
        },
      ],
    },
  ];

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden ${className}`}>
      {/* Table Title Header */}
      <div className="bg-slate-50/90 px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            Bảng Thông Số Kỹ Thuật Chi Tiết
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu cấu hình phần cứng trích xuất trực tiếp từ Catalog nhà sản xuất
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {specGroups.map((group, gIdx) => {
          const visibleRows = group.rows.filter((r) => r.value != null);
          if (visibleRows.length === 0) return null;

          return (
            <div
              key={gIdx}
              className="rounded-2xl border border-slate-200/70 p-4 sm:p-5 bg-white shadow-2xs hover:border-slate-300 transition-colors"
            >
              {/* Group Title */}
              <div className="flex items-center gap-2 mb-3.5 pb-2.5 border-b border-slate-100">
                <span className="p-1.5 rounded-lg bg-slate-100/80">
                  {group.icon}
                </span>
                <h4 className="text-sm font-bold text-slate-900">
                  {group.group}
                </h4>
              </div>

              {/* Rows: Optimized 2-Column Definition List */}
              <dl className="space-y-1.5">
                {visibleRows.map((row, rIdx) => (
                  <div
                    key={rIdx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-6 py-2 px-3 rounded-xl even:bg-slate-50/70 hover:bg-slate-100/60 transition-colors"
                  >
                    <dt className="text-xs sm:text-sm font-medium text-slate-500 w-full sm:w-56 shrink-0">
                      {row.label}:
                    </dt>
                    <dd className="text-xs sm:text-sm font-bold text-slate-900 flex-1 break-words">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}

        {/* Nhu cầu phù hợp */}
        {attributes.useCases && attributes.useCases.length > 0 && (
          <div className="rounded-2xl border border-slate-200/70 p-4 sm:p-5 bg-slate-50/60">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-rose-600" />
              <h4 className="text-sm font-bold text-slate-900">
                Phân loại nhu cầu sử dụng tối ưu
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {attributes.useCases.map((uc, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-slate-800 shadow-2xs"
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
