import React from 'react';
import { AttendanceStatus, PaymentStatus, HonorStatus, MeetingStatus, ScheduleStatus } from '../../types';

interface StatusBadgeProps {
  status: AttendanceStatus | PaymentStatus | HonorStatus | MeetingStatus | ScheduleStatus | 'AKTIF' | 'NONAKTIF' | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-medium'
  };

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;

  switch (status) {
    // Attendance
    case 'HADIR':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Hadir';
      break;
    case 'IZIN':
      colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
      label = 'Izin';
      break;
    case 'SAKIT':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Sakit';
      break;
    case 'ALPA':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Alpa (Tanpa Ket.)';
      break;

    // Payments & Honors
    case 'LUNAS':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Lunas';
      break;
    case 'SEBAGIAN':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Sebagian';
      break;
    case 'BELUM_BAYAR':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Belum Bayar';
      break;
    case 'BELUM_DIBAYAR':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Belum Dibayar';
      break;

    // Meeting & Schedule status
    case 'TERJADWAL':
      colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      label = 'Terjadwal';
      break;
    case 'BERLANGSUNG':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      label = 'Berlangsung';
      break;
    case 'SELESAI':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Selesai';
      break;
    case 'DIBATALKAN':
      colorClasses = 'bg-slate-100 text-slate-600 border-slate-200';
      label = 'Dibatalkan';
      break;

    // Master entity status
    case 'AKTIF':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Aktif';
      break;
    case 'NONAKTIF':
      colorClasses = 'bg-slate-100 text-slate-500 border-slate-200';
      label = 'Nonaktif';
      break;
    default:
      label = status;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${sizeClasses[size]} ${colorClasses} ${className} whitespace-nowrap`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {label}
    </span>
  );
};
