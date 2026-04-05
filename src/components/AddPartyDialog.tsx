import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAddParty } from '@/hooks/useData';

interface AddPartyDialogProps {
  defaultType?: string;
  onAdded?: (id: string) => void;
  triggerLabel?: string;
}

export default function AddPartyDialog({ defaultType, onAdded, triggerLabel }: AddPartyDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState(defaultType || 'Customer');
  const [city, setCity] = useState('');
  const addParty = useAddParty();

  const handleAdd = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    try {
      const data = await addParty.mutateAsync({ name: name.trim(), phone: phone || null, type, city: city || null });
      toast.success(`${type} "${name}" added!`);
      onAdded?.(data.id);
      setOpen(false);
      setName(''); setPhone(''); setCity('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add party');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1 text-xs shrink-0">
          <PlusCircle className="w-3.5 h-3.5" /> {triggerLabel || 'Add New'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add {type}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name<span className="text-destructive ml-0.5">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter name" className="mt-1" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" className="mt-1" />
          </div>
          {!defaultType && (
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Customer">Customer</SelectItem>
                  <SelectItem value="Dealer">Dealer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label>City</Label>
            <Input value={city} onChange={e => setCity(e.target.value)} placeholder="City" className="mt-1" />
          </div>
          <Button className="w-full" onClick={handleAdd} disabled={addParty.isPending}>
            {addParty.isPending ? 'Adding...' : `Add ${type}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
