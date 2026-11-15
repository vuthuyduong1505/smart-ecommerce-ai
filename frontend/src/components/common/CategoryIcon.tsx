import React from 'react';
import {
  Laptop,
  Gamepad2,
  Briefcase,
  Smartphone,
  Tablet,
  Headphones,
} from 'lucide-react';

interface CategoryIconProps {
  slug: string;
  className?: string;
}

export interface CategoryVisualConfig {
  icon: React.ReactNode;
  gradientBg: string;
  iconColor: string;
  hoverBorder: string;
  tagline: string;
}

export const getCategoryVisualConfig = (slug: string): CategoryVisualConfig => {
  const norm = slug.toLowerCase().trim();

  if (norm.includes('gaming')) {
    return {
      icon: <Gamepad2 className="w-6 h-6" />,
      gradientBg: 'from-red-500/10 via-rose-500/10 to-orange-500/5',
      iconColor: 'text-rose-600',
      hoverBorder: 'hover:border-rose-400 hover:shadow-rose-100',
      tagline: 'Cấu hình khủng • Đồ họa',
    };
  }

  if (norm.includes('van-phong') || norm.includes('office')) {
    return {
      icon: <Briefcase className="w-6 h-6" />,
      gradientBg: 'from-emerald-500/10 via-teal-500/10 to-green-500/5',
      iconColor: 'text-emerald-600',
      hoverBorder: 'hover:border-emerald-400 hover:shadow-emerald-100',
      tagline: 'Mỏng nhẹ • Pin bền bỉ',
    };
  }

  if (norm.includes('phone') || norm.includes('dien-thoai')) {
    return {
      icon: <Smartphone className="w-6 h-6" />,
      gradientBg: 'from-purple-500/10 via-indigo-500/10 to-violet-500/5',
      iconColor: 'text-purple-600',
      hoverBorder: 'hover:border-purple-400 hover:shadow-purple-100',
      tagline: 'Smartphone • Flagship AI',
    };
  }

  if (norm.includes('tablet') || norm.includes('may-tinh-bang')) {
    return {
      icon: <Tablet className="w-6 h-6" />,
      gradientBg: 'from-amber-500/10 via-orange-500/10 to-yellow-500/5',
      iconColor: 'text-amber-600',
      hoverBorder: 'hover:border-amber-400 hover:shadow-amber-100',
      tagline: 'Màn hình lớn • Bút vẽ',
    };
  }

  if (norm.includes('accessories') || norm.includes('phu-kien')) {
    return {
      icon: <Headphones className="w-6 h-6" />,
      gradientBg: 'from-cyan-500/10 via-sky-500/10 to-blue-500/5',
      iconColor: 'text-cyan-600',
      hoverBorder: 'hover:border-cyan-400 hover:shadow-cyan-100',
      tagline: 'Chuột, Phím, Tai nghe',
    };
  }

  // Default Laptop
  return {
    icon: <Laptop className="w-6 h-6" />,
    gradientBg: 'from-blue-500/10 via-indigo-500/10 to-sky-500/5',
    iconColor: 'text-blue-600',
    hoverBorder: 'hover:border-blue-400 hover:shadow-blue-100',
    tagline: 'Học tập & Làm việc',
  };
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({ slug, className = 'w-6 h-6' }) => {
  const config = getCategoryVisualConfig(slug);
  return <span className={`${config.iconColor} ${className}`}>{config.icon}</span>;
};
