import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, List } from 'lucide-react';
import { useTransactions, useInventory, useParties } from '@/hooks/useData';
import StatusBadge from '@/components/StatusBadge';

const typeFilters = ['All', 'Purchase', 'Sale', 'Purchase Return', 'Sales Return'] as const;
const rowColors: Record<string, string> = {
  Purchase: 'border-l-4 border-l-blue-400',
  Sale: 'border-l-4 border-l-emerald-400',
  'Purchase Return': 'border-l-4 border-l-orange-400',
  'Sales Return': 'border-l-4 border-l-red-400',
};

export default function Transactions() {
  const { data: transactions = [], isLoading } = useTransactions();
  const { data: inventory = [] } = useInventory();
  const { data: parties = [] } = useParties();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  const getPartyName = (id?: string | null) => parties.find(p => p.id === id)?.name || '—';

  const filtered = useMemo(() => {
    let items = [...transactions];
    if (typeFilter !== 'All') items = items.filter(t => t.type === typeFilter);
    if (search) items = items.filter(t => t.imei?.includes(search));
    return items;
  }, [transactions, search, typeFilter]);

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by IMEI..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {typeFilters.map(f => (
          <Button key={f} variant={typeFilter === f ? 'default' : 'outline'} size="sm" onClick={() => setTypeFilter(f)} className="text-xs">{f}</Button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <List className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="font-medium">{search ? `No results for "${search}"` : 'No transactions yet'}</p>
        </div>
      ) : (
        <Card className="border-border shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">IMEI</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Phone</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Party</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => {
                    const item = t.imei ? inventory.find(i => i.imei === t.imei) : undefined;
                    return (
                      <tr key={t.id} className={`border-b border-border/50 ${rowColors[t.type] || ''}`}>
                        <td className="py-3 px-4"><StatusBadge status={t.type} /></td>
                        <td className="py-3 px-4 font-mono-imei">{t.imei?.slice(-8) || '—'}</td>
                        <td className="py-3 px-4">{item ? `${item.brand} ${item.model}` : '—'}</td>
                        <td className="py-3 px-4 text-muted-foreground">{getPartyName(t.party_id)}</td>
                        <td className="py-3 px-4 text-muted-foreground">{t.txn_date}</td>
                        <td className="py-3 px-4 text-right price-text">₹{t.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
