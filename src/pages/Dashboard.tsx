import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, TrendingUp, AlertTriangle, ShoppingCart, PlusCircle, DollarSign, Search } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useInventory, useSales, useTransactions, useParties, getOldStockFlag } from '@/hooks/useData';
import StatusBadge from '@/components/StatusBadge';
import PhoneTimeline from '@/components/PhoneTimeline';
import ImeiScanner from '@/components/ImeiScanner';
import { useReturns } from '@/hooks/useData';
import type { InventoryItem } from '@/hooks/useData';
import { toast } from 'sonner';

export default function Dashboard() {
  const { data: inventory = [], isLoading: invLoading } = useInventory();
  const { data: sales = [], isLoading: salesLoading } = useSales();
  const { data: transactions = [], isLoading: txnLoading } = useTransactions();
  const { data: parties = [] } = useParties();
  const { data: returns = [] } = useReturns();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<InventoryItem | null>(null);

  const isLoading = invLoading || salesLoading || txnLoading;

  const inStockCount = inventory.filter(i => i.status === 'In Stock').length;
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const salesThisMonth = sales.filter(s => {
    const d = new Date(s.sale_date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const getProfit = (sale: typeof sales[0]) => {
    const item = inventory.find(i => i.imei === sale.imei);
    return item ? sale.selling_price - item.purchase_price : 0;
  };

  const profitThisMonth = salesThisMonth.reduce((sum, s) => sum + getProfit(s), 0);
  const oldStockCount = inventory.filter(i => getOldStockFlag(i).type === 'old').length;

  const chartData = useMemo(() => {
    const months: { name: string; sales: number; profit: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1);
      const mName = d.toLocaleDateString('en-US', { month: 'short' });
      const mSales = sales.filter(s => {
        const sd = new Date(s.sale_date);
        return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
      });
      months.push({
        name: mName,
        sales: mSales.length,
        profit: mSales.reduce((sum, s) => sum + getProfit(s), 0),
      });
    }
    return months;
  }, [sales, inventory]);

  
  const brandSummary = useMemo(() => {
    const summary: Record<string, { inStock: number; sold: number; value: number }> = {};

    inventory.forEach((item) => {
      if (!summary[item.brand]) {
        summary[item.brand] = { inStock: 0, sold: 0, value: 0 };
      }

      if (item.status === 'In Stock') {
        summary[item.brand].inStock += 1;
        summary[item.brand].value += item.purchase_price;
      }

      if (item.status === 'Sold') {
        summary[item.brand].sold += 1;
      }
    });

    return Object.entries(summary)
      .sort((a, b) => b[1].inStock - a[1].inStock)
      .slice(0, 8);
  }, [inventory]);

  const getPartyName = (id?: string | null) => parties.find(p => p.id === id)?.name || '—';

  const recentTxns = [...transactions].slice(0, 5);

  // Search results
  const searchResults = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return inventory.filter(i =>
      i.imei.includes(q) || i.brand.toLowerCase().includes(q) || i.model.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [search, inventory]);

  const stats = [
    { label: 'In Stock', value: inStockCount, icon: Package, color: 'text-success', link: '/inventory' },
    { label: 'Sold This Month', value: salesThisMonth.length, icon: ShoppingCart, color: 'text-primary', link: '/sales' },
    { label: 'Profit This Month', value: `₹${profitThisMonth.toLocaleString('en-IN')}`, icon: TrendingUp, color: profitThisMonth >= 0 ? 'text-success' : 'text-destructive', link: '/sales' },
    { label: 'Old Stock Alert', value: oldStockCount, icon: AlertTriangle, color: 'text-destructive', link: '/inventory' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  const handleImeiScan = (imei: string) => {
    const phone = inventory.find(i => i.imei === imei);
    if (phone) {
      setSelectedPhone(phone);
      toast.success(`Found: ${phone.brand} ${phone.model}`);
    } else {
      toast.error(`No phone found with IMEI: ${imei}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar with Scanner */}
      <div className="relative max-w-lg">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by IMEI, brand, model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ImeiScanner onScan={handleImeiScan} />
        </div>
        {searchResults.length > 0 && (
          <Card className="absolute top-full mt-1 left-0 right-0 z-50 shadow-lg border-border">
            <CardContent className="p-1">
              {searchResults.map(item => (
                <button
                  key={item.id}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-accent flex items-center justify-between text-sm transition-colors"
                  onClick={() => { setSelectedPhone(item); setSearch(''); }}
                >
                  <div>
                    <span className="font-medium text-foreground">{item.brand} {item.model}</span>
                    <span className="text-muted-foreground ml-2 font-mono text-xs">{item.imei.slice(-6)}</span>
                  </div>
                  <StatusBadge status={item.status} />
                </button>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Clickable Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((s) => (
          <Card
            key={s.label}
            className="border-border shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
            onClick={() => navigate(s.link)}
          >
            <CardContent className="p-4 flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                <p className={`text-xl lg:text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Brand-wise Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {brandSummary.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inventory data available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {brandSummary.map(([brand, details]) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => navigate('/inventory')}
                  className="text-left rounded-lg border border-border p-3 hover:border-primary/40 hover:bg-accent/30 transition-colors"
                >
                  <p className="font-semibold text-sm text-foreground truncate">{brand}</p>
                  <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                    <p>In Stock: <span className="text-success font-medium">{details.inStock}</span></p>
                    <p>Sold: <span className="text-foreground font-medium">{details.sold}</span></p>
                    <p>Stock Value: <span className="text-foreground font-medium">₹{details.value.toLocaleString('en-IN')}</span></p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="border-border shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/sales')}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Monthly Sales</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/sales')}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Profit Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Line type="monotone" dataKey="profit" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="border-border shadow-sm lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start gap-2" size="sm">
              <Link to="/inventory/add"><PlusCircle className="w-4 h-4" /> Add Phone</Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2" size="sm">
              <Link to="/sales"><DollarSign className="w-4 h-4" /> Sell Phone</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Type</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">IMEI</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Party</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium text-xs">Amount</th>
                    <th className="text-right py-2 px-2 text-muted-foreground font-medium text-xs">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTxns.map((t) => {
                    const phone = inventory.find(i => i.imei === t.imei);
                    return (
                      <tr
                        key={t.id}
                        className="border-b border-border/50 last:border-0 cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => phone && setSelectedPhone(phone)}
                      >
                        <td className="py-2 px-2"><StatusBadge status={t.type} /></td>
                        <td className="py-2 px-2 font-mono-imei">{t.imei?.slice(-6) || '—'}</td>
                        <td className="py-2 px-2 text-muted-foreground">{getPartyName(t.party_id)}</td>
                        <td className="py-2 px-2 text-right price-text">₹{t.amount.toLocaleString('en-IN')}</td>
                        <td className="py-2 px-2 text-right text-muted-foreground text-xs">{t.txn_date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Phone Timeline Dialog */}
      <Dialog open={!!selectedPhone} onOpenChange={() => setSelectedPhone(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          {selectedPhone && (
            <PhoneTimeline phone={selectedPhone} sales={sales} returns={returns} parties={parties} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
