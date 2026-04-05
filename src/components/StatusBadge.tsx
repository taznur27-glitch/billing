import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  'In Stock': 'badge-in-stock',
  'Sold': 'badge-sold',
  'Returned': 'badge-returned',
  'New': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Refurbished': 'bg-sky-50 text-sky-700 border border-sky-200',
  'Used': 'bg-slate-100 text-slate-700 border border-slate-200',
  'Old Stock': 'badge-old-stock',
  'Aging': 'badge-aging',
  'Pending': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Processed': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Purchase': 'bg-blue-50 text-blue-700 border border-blue-200',
  'Sale': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'Purchase Return': 'bg-orange-50 text-orange-700 border border-orange-200',
  'Sales Return': 'bg-red-50 text-red-700 border border-red-200',
  'Cash': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'UPI': 'bg-violet-50 text-violet-700 border border-violet-200',
  'Bank Transfer': 'bg-blue-50 text-blue-700 border border-blue-200',
  'Credit': 'bg-amber-50 text-amber-700 border border-amber-200',
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
      statusStyles[status] || 'bg-muted text-muted-foreground',
      className
    )}>
      {status}
    </span>
  );
}
