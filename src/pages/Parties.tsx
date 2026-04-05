import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, PlusCircle, Search, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useParties, useAddParty } from '@/hooks/useData';
import { downloadCsv } from '@/lib/exportCsv';
import type { Party } from '@/hooks/useData';

export default function Parties() {
  const { data: parties = [], isLoading } = useParties();
  const addParty = useAddParty();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partyType, setPartyType] = useState<'Dealer' | 'Customer'>('Dealer');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  const filterParties = (type: string) =>
    parties.filter(p => p.type === type && (!search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.phone || '').includes(search)));

  const handleAddParty = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    try {
      await addParty.mutateAsync({ name, phone: phone || null, type: partyType, city: city || null, notes: notes || null });
      toast.success('Party added successfully!');
      setDialogOpen(false);
      setName(''); setPhone(''); setCity(''); setNotes('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add party');
    }
  };

  const handleExport = (type?: string) => {
    const items = type ? parties.filter(p => p.type === type) : parties;
    const data = items.map(p => ({
      Name: p.name, Phone: p.phone || '', Type: p.type, City: p.city || '', Notes: p.notes || '',
    }));
    downloadCsv(data, `parties_${type || 'all'}_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-full max-w-md" /><Skeleton className="h-64 rounded-xl" /></div>;

  const PartyTable = ({ items }: { items: Party[] }) => (
    items.length === 0 ? (
      <div className="flex flex-col items-center py-16">
        <Users className="w-12 h-12 text-muted-foreground/50 mb-3" />
        <p className="font-medium">{search ? `No results for "${search}"` : 'No parties added yet'}</p>
        <Button size="sm" className="mt-3" onClick={() => setDialogOpen(true)}>Add Party</Button>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Name</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Phone</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">City</th>
              <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Notes</th>
            </tr>
          </thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id} className="border-b border-border/50">
                <td className="py-3 px-4 font-medium">{p.name}</td>
                <td className="py-3 px-4 text-muted-foreground">{p.phone || '—'}</td>
                <td className="py-3 px-4 text-muted-foreground">{p.city || '—'}</td>
                <td className="py-3 px-4 text-muted-foreground">{p.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleExport()}>
            <Download className="w-4 h-4" /> Export
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm" className="gap-1.5"><PlusCircle className="w-4 h-4" /> Add Party</Button></DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Add Party</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name<span className="text-destructive ml-0.5">*</span></Label><Input className="mt-1" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" /></div>
                <div><Label>Phone</Label><Input className="mt-1" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit number" maxLength={10} /></div>
                <div>
                  <Label>Type<span className="text-destructive ml-0.5">*</span></Label>
                  <Select defaultValue="Dealer" onValueChange={(v) => setPartyType(v as any)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Dealer">Dealer</SelectItem><SelectItem value="Customer">Customer</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>City</Label><Input className="mt-1" value={city} onChange={e => setCity(e.target.value)} placeholder="City name" /></div>
                <div><Label>Notes</Label><Textarea className="mt-1" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional..." /></div>
                <Button className="w-full" onClick={handleAddParty} disabled={addParty.isPending}>{addParty.isPending ? 'Adding...' : 'Add Party'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <Tabs defaultValue="dealers">
        <TabsList><TabsTrigger value="dealers">Dealers</TabsTrigger><TabsTrigger value="customers">Customers</TabsTrigger></TabsList>
        <TabsContent value="dealers"><Card className="border-border shadow-sm"><CardContent className="p-0"><PartyTable items={filterParties('Dealer')} /></CardContent></Card></TabsContent>
        <TabsContent value="customers"><Card className="border-border shadow-sm"><CardContent className="p-0"><PartyTable items={filterParties('Customer')} /></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
