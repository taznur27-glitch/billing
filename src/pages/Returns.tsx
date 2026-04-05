import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, RotateCcw, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useReturns, useInventory, useParties, useAddReturn } from '@/hooks/useData';
import StatusBadge from '@/components/StatusBadge';
import ImeiScanner from '@/components/ImeiScanner';
import AddPartyDialog from '@/components/AddPartyDialog';

export default function Returns() {
  const { data: returns = [], isLoading } = useReturns();
  const { data: inventory = [] } = useInventory();
  const { data: parties = [] } = useParties();
  const addReturn = useAddReturn();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [returnType, setReturnType] = useState<'Sales Return' | 'Purchase Return'>('Sales Return');
  const [selectedImei, setSelectedImei] = useState('');
  const [partyId, setPartyId] = useState('');
  const [returnDate, setReturnDate] = useState<Date>(new Date());
  const [returnReason, setReturnReason] = useState('');
  const [amountRefunded, setAmountRefunded] = useState<number>(0);
  const [status, setStatus] = useState<'Pending' | 'Processed'>('Pending');
  const [reasonError, setReasonError] = useState('');

  const getPartyName = (id?: string | null) => parties.find(p => p.id === id)?.name || '—';

  const handleImeiScan = (imei: string) => {
    const phone = inventory.find(p => p.imei === imei);
    if (phone) { setSelectedImei(imei); toast.success(`Found: ${phone.brand} ${phone.model}`); }
    else { toast.error(`No phone found with IMEI: ${imei}`); }
  };

  const handleAddReturn = async () => {
    if (!returnReason || returnReason.length < 10) { setReasonError('Please provide a reason for the return (min 10 characters)'); return; }
    if (!selectedImei) { toast.error('Please select a phone'); return; }
    try {
      await addReturn.mutateAsync({ return_type: returnType, imei: selectedImei, party_id: partyId || null, return_date: format(returnDate, 'yyyy-MM-dd'), return_reason: returnReason, amount_refunded: amountRefunded || null, status });
      toast.success('Return recorded successfully!');
      setDialogOpen(false); setReturnReason(''); setSelectedImei(''); setReasonError('');
    } catch (err: any) { toast.error(err.message || 'Failed to record return'); }
  };

  const salesReturns = returns.filter(r => r.return_type === 'Sales Return');
  const purchaseReturns = returns.filter(r => r.return_type === 'Purchase Return');

  if (isLoading) return <Skeleton className="h-64 rounded-xl" />;

  const ReturnTable = ({ items }: { items: typeof returns }) => (
    items.length === 0 ? (
      <div className="flex flex-col items-center py-16">
        <RotateCcw className="w-12 h-12 text-muted-foreground/50 mb-3" />
        <p className="font-medium">No returns recorded</p>
        <Button size="sm" className="mt-3" onClick={() => setDialogOpen(true)}>Record Return</Button>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">IMEI</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Phone</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Party</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Date</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Reason</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Amount</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map(r => {
              const item = inventory.find(i => i.imei === r.imei);
              return (
                <tr key={r.id} className="border-b border-border/50">
                  <td className="py-3 px-4 font-mono-imei">{r.imei.slice(-8)}</td>
                  <td className="py-3 px-4">{item ? `${item.brand} ${item.model}` : '—'}</td>
                  <td className="py-3 px-4 text-muted-foreground">{getPartyName(r.party_id)}</td>
                  <td className="py-3 px-4 text-muted-foreground">{r.return_date}</td>
                  <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">{r.return_reason}</td>
                  <td className="py-3 px-4 text-right price-text">₹{(r.amount_refunded || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4"><StatusBadge status={r.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button size="sm" className="gap-1.5"><PlusCircle className="w-4 h-4" /> Add Return</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Record Return</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Return Type<span className="text-destructive ml-0.5">*</span></Label>
                <Select defaultValue="Sales Return" onValueChange={(v) => setReturnType(v as any)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Sales Return">Sales Return</SelectItem><SelectItem value="Purchase Return">Purchase Return</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phone (IMEI)<span className="text-destructive ml-0.5">*</span></Label>
                <div className="flex gap-2 mt-1">
                  <Select value={selectedImei} onValueChange={setSelectedImei}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select phone" /></SelectTrigger>
                    <SelectContent>{
                      inventory
                        .filter(p => returnType === 'Sales Return' ? p.status === 'Sold' : p.status === 'In Stock')
                        .map(p => <SelectItem key={p.imei} value={p.imei}>{p.brand} {p.model} ({p.imei.slice(-6)})</SelectItem>)
                    }</SelectContent>
                  </Select>
                  <ImeiScanner onScan={handleImeiScan} />
                </div>
              </div>
              <div>
                <Label>Party</Label>
                <div className="flex gap-1.5 mt-1">
                  <Select value={partyId} onValueChange={setPartyId}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Select party" /></SelectTrigger>
                    <SelectContent>{parties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <AddPartyDialog onAdded={(id) => setPartyId(id)} />
                </div>
              </div>
              <div>
                <Label>Return Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full mt-1 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />{format(returnDate, 'PP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={returnDate} onSelect={(d) => d && setReturnDate(d)} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Return Reason<span className="text-destructive ml-0.5">*</span></Label>
                <Textarea className="mt-1" rows={3} placeholder="Why is this being returned? (min 10 chars)" value={returnReason} onChange={(e) => { setReturnReason(e.target.value); setReasonError(''); }} />
                {reasonError && <p className="text-xs text-destructive mt-1">{reasonError}</p>}
              </div>
              <div><Label>Amount Refunded (₹)</Label><Input type="number" className="mt-1" value={amountRefunded || ''} onChange={e => setAmountRefunded(Number(e.target.value))} min={0} /></div>
              <div>
                <Label>Status</Label>
                <Select defaultValue="Pending" onValueChange={(v) => setStatus(v as any)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Processed">Processed</SelectItem></SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleAddReturn} disabled={addReturn.isPending}>{addReturn.isPending ? 'Recording...' : 'Record Return'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Tabs defaultValue="sales-returns">
        <TabsList><TabsTrigger value="sales-returns">Sales Returns</TabsTrigger><TabsTrigger value="purchase-returns">Purchase Returns</TabsTrigger></TabsList>
        <TabsContent value="sales-returns"><Card className="border-border shadow-sm"><CardContent className="p-0"><ReturnTable items={salesReturns} /></CardContent></Card></TabsContent>
        <TabsContent value="purchase-returns"><Card className="border-border shadow-sm"><CardContent className="p-0"><ReturnTable items={purchaseReturns} /></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
