import { useState, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, DollarSign, ShoppingCart, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useInventory, useSales, useParties, useAddSale } from '@/hooks/useData';
import StatusBadge from '@/components/StatusBadge';
import ImeiScanner from '@/components/ImeiScanner';
import AddPartyDialog from '@/components/AddPartyDialog';
import SaleBill from '@/components/SaleBill';
import ExportDialog from '@/components/ExportDialog';
import type { Sale } from '@/hooks/useData';

export default function Sales() {
  const { data: inventory = [] } = useInventory();
  const { data: sales = [], isLoading } = useSales();
  const { data: parties = [] } = useParties();
  const addSale = useAddSale();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedImei, setSelectedImei] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [billSale, setBillSale] = useState<Sale | null>(null);
  const billRef = useRef<HTMLDivElement>(null);

  const isInStock = (status?: string | null) => {
    if (!status) return true;
    const normalized = status.toLowerCase().replace(/[_\s-]/g, '');
    return normalized === 'instock';
  };

  const inStockPhones = inventory.filter(i => isInStock(i.status));
  const selectedPhone = selectedImei ? inventory.find(i => i.imei === selectedImei) : null;
  const profitPreview = selectedPhone ? sellingPrice - selectedPhone.purchase_price : 0;
  const customers = parties.filter(p => p.type === 'Customer' || p.type === 'Dealer');

  const getProfit = (imei: string, sellingPrice: number) => {
    const item = inventory.find(i => i.imei === imei);
    return item ? sellingPrice - item.purchase_price : 0;
  };
  const getImeiTail = (imei: unknown, digits = 6) => String(imei ?? '').slice(-digits) || '—';
  const getPartyName = (id?: string | null) => parties.find(p => p.id === id)?.name || '—';
  const totalProfit = sales.reduce((sum, s) => sum + getProfit(s.imei, s.selling_price), 0);

  const handleImeiScan = (imei: string) => {
    const phone = inStockPhones.find(p => p.imei === imei);
    if (phone) { setSelectedImei(imei); toast.success(`Found: ${phone.brand} ${phone.model}`); }
    else { toast.error(`No in-stock phone found with IMEI: ${imei}`); }
  };

  const handleSell = async () => {
    if (!selectedImei || sellingPrice <= 0) { toast.error('Please fill all required fields'); return; }
    try {
      const createdSale = await addSale.mutateAsync({ imei: selectedImei, customer_id: customerId || null, selling_price: sellingPrice, sale_date: format(saleDate, 'yyyy-MM-dd'), payment_mode: paymentMode, notes: notes || null });
      toast.success('Sale recorded successfully!');
      setDialogOpen(false); setSelectedImei(''); setSellingPrice(0); setNotes('');
      handlePrintBill(createdSale);
    } catch (err: any) { toast.error(err.message || 'Failed to record sale'); }
  };

  const handlePrintBill = (sale: Sale) => {
    setBillSale(sale);
    setTimeout(() => {
      const printContent = billRef.current;
      if (!printContent) return;
      const win = window.open('', '_blank');
      if (!win) { toast.error('Please allow popups'); return; }
      win.document.write(`<html><head><title>Invoice</title><style>body{margin:0;padding:20px;font-family:Georgia,serif}table{border-collapse:collapse;width:100%}th,td{padding:8px}@media print{body{padding:0}}</style></head><body>${printContent.innerHTML}</body></html>`);
      win.document.close(); win.print(); setBillSale(null);
    }, 100);
  };

  const allSalesFields = ['IMEI', 'Phone', 'Customer', 'Selling Price', 'Profit', 'Date', 'Payment'];
  const salesExportData = useMemo(() => sales.map(s => {
    const item = inventory.find(i => i.imei === s.imei);
    return {
      IMEI: s.imei, Phone: item ? `${item.brand} ${item.model}` : '—',
      Customer: getPartyName(s.customer_id), 'Selling Price': s.selling_price,
      Profit: getProfit(s.imei, s.selling_price), Date: s.sale_date, Payment: s.payment_mode,
    };
  }), [sales, inventory, parties]);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Card className="flex-1 mr-3 border-border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Profit</p>
              <p className={`text-lg font-bold ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>₹{totalProfit.toLocaleString('en-IN')}</p>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <ExportDialog data={salesExportData} allFields={allSalesFields} filenamePrefix="sales" title="Sales Export" />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm" className="gap-1.5"><ShoppingCart className="w-4 h-4" /> Sell</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Sell Phone</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Phone (IMEI)<span className="text-destructive ml-0.5">*</span></Label>
                  <div className="flex gap-2 mt-1">
                    <Select value={selectedImei} onValueChange={setSelectedImei}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select in-stock phone" /></SelectTrigger>
                      <SelectContent>
                        {inStockPhones.length === 0 ? (
                          <SelectItem value="__none" disabled>No in-stock phones found</SelectItem>
                        ) : (
                          inStockPhones.map(p => (
                            <SelectItem key={String(p.imei)} value={String(p.imei)}>
                              {p.brand} {p.model} — ₹{p.purchase_price.toLocaleString('en-IN')} ({getImeiTail(p.imei, 6)})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <ImeiScanner onScan={handleImeiScan} />
                  </div>
                </div>
                <div>
                  <Label>Customer / Dealer</Label>
                  <div className="flex gap-1.5 mt-1">
                    <Select value={customerId} onValueChange={setCustomerId}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select customer" /></SelectTrigger>
                      <SelectContent>{customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.type})</SelectItem>)}</SelectContent>
                    </Select>
                    <AddPartyDialog onAdded={(id) => setCustomerId(id)} />
                  </div>
                </div>
                <div>
                  <Label>Selling Price (₹)<span className="text-destructive ml-0.5">*</span></Label>
                  <Input type="number" value={sellingPrice || ''} onChange={(e) => setSellingPrice(Number(e.target.value))} className="mt-1" min={1} />
                  {selectedPhone && sellingPrice > 0 && (
                    <p className={`text-xs mt-1 font-medium ${profitPreview >= 0 ? 'text-success' : 'text-destructive'}`}>Profit: ₹{profitPreview.toLocaleString('en-IN')}</p>
                  )}
                </div>
                <div>
                  <Label>Sale Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full mt-1 justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4" />{format(saleDate, 'PP')}</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={saleDate} onSelect={(d) => d && setSaleDate(d)} className="p-3 pointer-events-auto" /></PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Payment Mode</Label>
                  <Select defaultValue="Cash" onValueChange={setPaymentMode}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{['Cash', 'UPI', 'Bank Transfer', 'Credit'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" rows={2} placeholder="Optional..." />
                </div>
                <Button className="w-full" onClick={handleSell} disabled={addSale.isPending}>{addSale.isPending ? 'Recording...' : 'Record Sale'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <ShoppingCart className="w-12 h-12 text-muted-foreground/50 mb-3" />
          <p className="font-medium">No sales recorded yet</p>
          <Button size="sm" className="mt-3" onClick={() => setDialogOpen(true)}>Record First Sale</Button>
        </div>
      ) : (
        <Card className="border-border shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">IMEI</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Phone</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Customer</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Selling Price</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Profit</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Payment</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Bill</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(s => {
                    const item = inventory.find(i => i.imei === s.imei);
                    const profit = getProfit(s.imei, s.selling_price);
                    return (
                      <tr key={s.id} className="border-b border-border/50">
                        <td className="py-3 px-4 font-mono-imei">{getImeiTail(s.imei, 8)}</td>
                        <td className="py-3 px-4">{item ? `${item.brand} ${item.model}` : '—'}</td>
                        <td className="py-3 px-4 text-muted-foreground">{getPartyName(s.customer_id)}</td>
                        <td className="py-3 px-4 text-right price-text">₹{s.selling_price.toLocaleString('en-IN')}</td>
                        <td className={`py-3 px-4 text-right font-semibold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>₹{profit.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-muted-foreground">{s.sale_date}</td>
                        <td className="py-3 px-4"><StatusBadge status={s.payment_mode} /></td>
                        <td className="py-3 px-4 text-center">
                          <Button variant="ghost" size="icon" onClick={() => handlePrintBill(s)} title="Print Bill"><Printer className="w-4 h-4" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {billSale && (
        <div className="fixed -left-[9999px]">
          <SaleBill ref={billRef} sale={billSale} phone={inventory.find(i => i.imei === billSale.imei)} customer={parties.find(p => p.id === billSale.customer_id)} />
        </div>
      )}
    </div>
  );
}