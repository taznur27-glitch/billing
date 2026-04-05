import { useMemo } from 'react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Package, ShoppingCart, RotateCcw, User, Store } from 'lucide-react';
import type { InventoryItem, Sale, ReturnRecord, Party } from '@/hooks/useData';

interface Props {
  phone: InventoryItem;
  sales: Sale[];
  returns: ReturnRecord[];
  parties: Party[];
}

interface TimelineEvent {
  date: string;
  type: 'purchase' | 'sale' | 'return';
  title: string;
  details: { label: string; value: string }[];
}

export default function PhoneTimeline({ phone, sales, returns, parties }: Props) {
  const getPartyName = (id?: string | null) => parties.find(p => p.id === id)?.name || '—';

  const events = useMemo(() => {
    const list: TimelineEvent[] = [];

    list.push({
      date: phone.purchase_date,
      type: 'purchase',
      title: 'Purchased',
      details: [
        { label: 'Source', value: phone.purchase_source },
        { label: 'Supplier', value: getPartyName(phone.supplier_id) },
        { label: 'Price', value: `₹${phone.purchase_price.toLocaleString('en-IN')}` },
        { label: 'Condition', value: phone.condition },
      ],
    });

    const phoneSales = sales.filter(s => s.imei === phone.imei);
    phoneSales.forEach(s => {
      list.push({
        date: s.sale_date,
        type: 'sale',
        title: 'Sold',
        details: [
          { label: 'Customer', value: getPartyName(s.customer_id) },
          { label: 'Selling Price', value: `₹${s.selling_price.toLocaleString('en-IN')}` },
          { label: 'Profit', value: `₹${(s.selling_price - phone.purchase_price).toLocaleString('en-IN')}` },
          { label: 'Payment', value: s.payment_mode },
        ],
      });
    });

    const phoneReturns = returns.filter(r => r.imei === phone.imei);
    phoneReturns.forEach(r => {
      list.push({
        date: r.return_date,
        type: 'return',
        title: `${r.return_type}`,
        details: [
          { label: 'Party', value: getPartyName(r.party_id) },
          { label: 'Reason', value: r.return_reason },
          { label: 'Refund', value: `₹${(r.amount_refunded || 0).toLocaleString('en-IN')}` },
          { label: 'Status', value: r.status },
        ],
      });
    });

    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [phone, sales, returns, parties]);

  const iconMap = {
    purchase: <Package className="w-4 h-4" />,
    sale: <ShoppingCart className="w-4 h-4" />,
    return: <RotateCcw className="w-4 h-4" />,
  };

  const colorMap = {
    purchase: 'bg-primary text-primary-foreground',
    sale: 'bg-success text-success-foreground',
    return: 'bg-warning text-warning-foreground',
  };

  return (
    <div>
      <DialogHeader>
        <DialogTitle>{phone.brand} {phone.model}</DialogTitle>
        <DialogDescription className="font-mono text-xs">{phone.imei}</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-2 text-xs mt-3 p-3 rounded-lg bg-muted/50">
        {[
          ['RAM / Storage', `${phone.ram} / ${phone.storage}`],
          ['Color', phone.color],
          ['Warranty', phone.warranty_status],
          ['Current Status', phone.status],
        ].map(([l, v]) => (
          <div key={l}>
            <span className="text-muted-foreground">{l}: </span>
            <span className="font-medium text-foreground">{v}</span>
          </div>
        ))}
      </div>

      <Separator className="my-4" />

      <h4 className="text-sm font-semibold mb-3">Product Timeline</h4>
      <div className="space-y-0">
        {events.map((event, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorMap[event.type]}`}>
                {iconMap[event.type]}
              </div>
              {i < events.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
            </div>
            <div className="pb-5 flex-1">
              <div className="flex justify-between items-start">
                <p className="font-semibold text-sm text-foreground">{event.title}</p>
                <span className="text-xs text-muted-foreground">{event.date}</span>
              </div>
              <div className="mt-1.5 space-y-0.5">
                {event.details.map(d => (
                  <div key={d.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{d.label}</span>
                    <span className="font-medium text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
