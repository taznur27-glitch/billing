import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Search, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { useInventory, useParties, useSales, useReturns, getStockAgeDays, getWarrantyAlert, getOldStockFlag } from '@/hooks/useData';
import StatusBadge from '@/components/StatusBadge';
import PhoneTimeline from '@/components/PhoneTimeline';
import ExportDialog from '@/components/ExportDialog';
import PriceListGenerator from '@/components/PriceListGenerator';
import type { InventoryItem } from '@/hooks/useData';

const statusFilters = ['All', 'In Stock', 'Sold', 'Returned'] as const;
const conditionFilters = ['All', 'New', 'Refurbished', 'Used'] as const;
const sortOptions = [
  { label: 'Newest First', key: 'newest' },
  { label: 'Oldest First', key: 'oldest' },
  { label: 'Price Low→High', key: 'price-asc' },
  { label: 'Price High→Low', key: 'price-desc' },
] as const;

export default function Inventory() {
  const { data: inventory = [], isLoading } = useInventory();
  const { data: parties = [] } = useParties();
  const { data: sales = [] } = useSales();
  const { data: returns = [] } = useReturns();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [conditionFilter, setConditionFilter] = useState<string>('All');
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [sort, setSort] = useState<string>('newest');
  const [selectedPhone, setSelectedPhone] = useState<InventoryItem | null>(null);
  const [showSummary, setShowSummary] = useState(true);

  const getPartyName = (id?: string | null) => parties.find(p => p.id === id)?.name || '—';

  const brandSummary = useMemo(() => {
    const map: Record<string, { total: number; inStock: number; sold: number; totalValue: number }> = {};
    inventory.forEach(item => {
      if (!map[item.brand]) map[item.brand] = { total: 0, inStock: 0, sold: 0, totalValue: 0 };
      map[item.brand].total++;
      if (item.status === 'In Stock') { map[item.brand].inStock++; map[item.brand].totalValue += item.purchase_price; }
      if (item.status === 'Sold') map[item.brand].sold++;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [inventory]);

  const filtered = useMemo(() => {
    let items = [...inventory];
    if (statusFilter !== 'All') items = items.filter(i => i.status === statusFilter);
    if (conditionFilter !== 'All') items = items.filter(i => i.condition === conditionFilter);
    if (brandFilter) items = items.filter(i => i.brand === brandFilter);
    if (priceMin) items = items.filter(i => i.purchase_price >= Number(priceMin));
    if (priceMax) items = items.filter(i => i.purchase_price <= Number(priceMax));
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i => i.imei.includes(q) || i.brand.toLowerCase().includes(q) || i.model.toLowerCase().includes(q));
    }
    switch (sort) {
      case 'oldest': items.sort((a, b) => new Date(a.purchase_date).getTime() - new Date(b.purchase_date).getTime()); break;
      case 'price-asc': items.sort((a, b) => a.purchase_price - b.purchase_price); break;
      case 'price-desc': items.sort((a, b) => b.purchase_price - a.purchase_price); break;
      default: items.sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime());
    }
    return items;
  }, [inventory, search, statusFilter, conditionFilter, brandFilter, priceMin, priceMax, sort]);

  const allExportFields = ['IMEI', 'Brand', 'Model', 'RAM', 'Storage', 'Color', 'Condition', 'Status', 'Purchase Price', 'Purchase Date', 'Source', 'Supplier', 'Warranty', 'Warranty Expiry'];

  const exportData = useMemo(() => filtered.map(i => ({
    IMEI: i.imei, Brand: i.brand, Model: i.model, RAM: i.ram, Storage: i.storage,
    Color: i.color, Condition: i.condition, Status: i.status,
    'Purchase Price': i.purchase_price, 'Purchase Date': i.purchase_date,
    Source: i.purchase_source, Supplier: getPartyName(i.supplier_id),
    Warranty: i.warranty_status, 'Warranty Expiry': i.warranty_expiry || '',
  })), [filtered, parties]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {brandSummary.length > 0 && (
        <div>
          <button onClick={() => setShowSummary(!showSummary)} className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-2">
            Brand Summary {showSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {brandSummary.map(([brand, stats]) => (
                <Card
                  key={brand}
                  className={`border-border shadow-sm cursor-pointer transition-all hover:shadow-md ${brandFilter === brand ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/30'}`}
                  onClick={() => setBrandFilter(brandFilter === brand ? '' : brand)}
                >
                  <CardContent className="p-3">
                    <p className="font-semibold text-sm text-foreground truncate">{brand}</p>
                    <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                      <span>Total: {stats.total}</span>
                      <span className="text-success">Stock: {stats.inStock}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                      <span>Sold: {stats.sold}</span>
                      <span className="font-medium text-foreground">₹{stats.totalValue.toLocaleString('en-IN')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search IMEI, brand, model..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <PriceListGenerator />
          <ExportDialog
            data={exportData}
            allFields={allExportFields}
            filenamePrefix="inventory"
            title="Inventory Export"
          />
          <Button asChild size="sm" className="gap-1.5">
            <Link to="/inventory/add"><PlusCircle className="w-4 h-4" /> Add Phone</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map(f => (
            <Button key={f} variant={statusFilter === f ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(f)} className="text-xs">{f}</Button>
          ))}
        </div>
        <div className="h-5 w-px bg-border hidden sm:block" />
        <div className="flex flex-wrap gap-1.5">
          {conditionFilters.map(f => (
            <Button key={f} variant={conditionFilter === f ? 'default' : 'outline'} size="sm" onClick={() => setConditionFilter(f)} className="text-xs">{f}</Button>
          ))}
        </div>
        {brandFilter && (
          <Button variant="secondary" size="sm" className="text-xs gap-1" onClick={() => setBrandFilter('')}>
            {brandFilter} ✕
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground">Price:</span>
        <Input type="number" placeholder="Min" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className="w-24 h-8 text-xs" />
        <span className="text-xs text-muted-foreground">–</span>
        <Input type="number" placeholder="Max" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className="w-24 h-8 text-xs" />
        {(priceMin || priceMax) && (
          <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => { setPriceMin(''); setPriceMax(''); }}>Clear</Button>
        )}
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="ml-auto text-xs border border-border rounded-md px-2 py-1.5 bg-card text-foreground">
          {sortOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="font-medium text-foreground">{search || brandFilter ? 'No results found' : 'No phones in inventory yet'}</p>
          {!search && !brandFilter && <Button asChild size="sm" className="mt-3"><Link to="/inventory/add">Add Your First Phone</Link></Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((item) => {
            const age = getStockAgeDays(item.purchase_date);
            const warranty = getWarrantyAlert(item);
            const oldFlag = getOldStockFlag(item);
            return (
              <Card key={item.id} className="border-border shadow-sm card-hover cursor-pointer" onClick={() => setSelectedPhone(item)}>
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{item.brand} {item.model}</p>
                      <p className="font-mono-imei text-muted-foreground mt-0.5">{item.imei}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBadge status={item.condition} />
                    {oldFlag.label && <StatusBadge status={oldFlag.type === 'old' ? 'Old Stock' : 'Aging'} />}
                    {warranty.type === 'expiring' && <span className="text-xs text-destructive font-medium">⚠️ Warranty Expiring</span>}
                    {warranty.type === 'valid' && <span className="text-xs text-success font-medium">✅ Warranty</span>}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className="price-text text-foreground">₹{item.purchase_price.toLocaleString('en-IN')}</span>
                    {item.status === 'In Stock' && <span className="text-xs text-muted-foreground">{age} days in stock</span>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
