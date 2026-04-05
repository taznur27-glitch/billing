import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useParties, useAddInventory, useInventory } from '@/hooks/useData';
import ImeiScanner from '@/components/ImeiScanner';
import AddPartyDialog from '@/components/AddPartyDialog';
import { downloadCsv } from '@/lib/exportCsv';

const defaultBrands = ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Realme', 'Oppo', 'Vivo', 'Nokia', 'Motorola', 'Google', 'Nothing'];
const defaultModels: Record<string, string[]> = {
  Apple: ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16', 'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone SE'],
  Samsung: ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23', 'Galaxy A54', 'Galaxy A34', 'Galaxy M34'],
  OnePlus: ['12', '12R', 'Nord CE 4', 'Nord 3', '11R', '11'],
};
const ramOptions = ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB'];
const storageOptions = ['32GB', '64GB', '128GB', '256GB', '512GB', '1TB'];

const schema = z.object({
  imei: z.string().regex(/^\d{15}$/, 'IMEI must be exactly 15 digits'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  ram: z.string().optional().default(''),
  storage: z.string().min(1, 'Storage is required'),
  color: z.string().optional().default(''),
  condition: z.enum(['New', 'Refurbished', 'Used']),
  purchase_source: z.enum(['Dealer', 'Customer']),
  supplier_id: z.string().optional(),
  purchase_price: z.number().positive('Price must be greater than 0'),
  warranty_status: z.enum(['Under Warranty', 'No Warranty', 'Extended Warranty']),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AddPhone() {
  const navigate = useNavigate();
  const { data: parties = [] } = useParties();
  const { data: inventory = [] } = useInventory();
  const addInventory = useAddInventory();
  const [purchaseDate, setPurchaseDate] = useState<Date>(new Date());
  const [warrantyExpiry, setWarrantyExpiry] = useState<Date | undefined>();
  const [customBrand, setCustomBrand] = useState(false);
  const [customModel, setCustomModel] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('');

  // Dynamic brands & models from existing inventory
  const allBrands = Array.from(new Set([...defaultBrands, ...inventory.map(i => i.brand)])).sort();
  const modelsForBrand = selectedBrand
    ? Array.from(new Set([
        ...(defaultModels[selectedBrand] || []),
        ...inventory.filter(i => i.brand === selectedBrand).map(i => i.model),
      ]))
    : [];

  // Custom brand/model dialog
  const [newBrandDialog, setNewBrandDialog] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newModelDialog, setNewModelDialog] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkAdding, setBulkAdding] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { condition: 'Used', purchase_source: 'Dealer', warranty_status: 'No Warranty', ram: '', color: '' },
  });

  const purchaseSource = watch('purchase_source');
  const warrantyStatus = watch('warranty_status');

  const filteredParties = parties.filter(p =>
    purchaseSource === 'Dealer' ? p.type === 'Dealer' : p.type === 'Customer'
  );

  const onSubmit = async (data: FormData) => {
    try {
      await addInventory.mutateAsync({
        imei: data.imei, brand: data.brand, model: data.model,
        ram: data.ram || '—', storage: data.storage, color: data.color || '—',
        condition: data.condition, purchase_source: data.purchase_source,
        purchase_price: data.purchase_price, warranty_status: data.warranty_status,
        notes: data.notes || null,
        purchase_date: format(purchaseDate, 'yyyy-MM-dd'),
        warranty_expiry: warrantyExpiry ? format(warrantyExpiry, 'yyyy-MM-dd') : null,
        supplier_id: data.supplier_id || null,
      });
      toast.success('Phone added to inventory!');
      navigate('/inventory');
    } catch (err: any) { toast.error(err.message || 'Failed to add phone'); }
  };

  const handleAddBrand = () => {
    if (!newBrandName.trim()) return;
    setSelectedBrand(newBrandName.trim());
    setValue('brand', newBrandName.trim());
    setNewBrandName('');
    setNewBrandDialog(false);
    setCustomBrand(false);
  };

  const handleAddModel = () => {
    if (!newModelName.trim()) return;
    setValue('model', newModelName.trim());
    setNewModelName('');
    setNewModelDialog(false);
    setCustomModel(false);
  };

  const RequiredStar = () => <span className="text-destructive ml-0.5">*</span>;

  const downloadBlankTemplate = () => {
    const headers = [
      'imei',
      'brand',
      'model',
      'ram',
      'storage',
      'color',
      'condition',
      'purchase_source',
      'purchase_price',
      'purchase_date',
      'warranty_status',
      'warranty_expiry',
      'supplier_name',
      'notes',
    ];

    downloadCsv([Object.fromEntries(headers.map((h) => [h, '']))], 'inventory_bulk_template.csv');
    toast.success('Blank spreadsheet downloaded');
  };

  const parseCsvRows = (csvText: string) => {
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) throw new Error('CSV is empty. Add at least one data row.');

    const splitLine = (line: string) => {
      const cells: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"' && inQuotes && nextChar === '"') {
          current += '"';
          i++;
          continue;
        }

        if (char === '"') {
          inQuotes = !inQuotes;
          continue;
        }

        if (char === ',' && !inQuotes) {
          cells.push(current.trim());
          current = '';
          continue;
        }

        current += char;
      }

      cells.push(current.trim());
      return cells;
    };

    const headers = splitLine(lines[0]).map((h) => h.toLowerCase());
    return lines.slice(1).map((line, idx) => {
      const values = splitLine(line);
      const row: Record<string, string> = {};
      headers.forEach((header, i) => {
        row[header] = values[i]?.trim() ?? '';
      });
      row.__rowNumber = String(idx + 2);
      return row;
    });
  };

  const handleBulkAdd = async () => {
    if (!bulkFile) {
      toast.error('Please choose a CSV file first');
      return;
    }

    setBulkAdding(true);
    try {
      const csvText = await bulkFile.text();
      const rows = parseCsvRows(csvText);
      const supplierMap = new Map(parties.map((p) => [p.name.toLowerCase(), p.id]));

      let added = 0;
      const failed: string[] = [];

      for (const row of rows) {
        try {
          if (!row.imei || !/^\d{15}$/.test(row.imei)) throw new Error('IMEI must be 15 digits');
          if (!row.brand) throw new Error('brand is required');
          if (!row.model) throw new Error('model is required');
          if (!row.storage) throw new Error('storage is required');
          if (!row.purchase_price || Number(row.purchase_price) <= 0) throw new Error('purchase_price must be > 0');

          const condition = (row.condition || 'Used') as FormData['condition'];
          const purchaseSource = (row.purchase_source || 'Dealer') as FormData['purchase_source'];
          const warrantyStatus = (row.warranty_status || 'No Warranty') as FormData['warranty_status'];
          const purchaseDateValue = row.purchase_date || format(new Date(), 'yyyy-MM-dd');

          if (!['New', 'Refurbished', 'Used'].includes(condition)) throw new Error('condition must be New/Refurbished/Used');
          if (!['Dealer', 'Customer'].includes(purchaseSource)) throw new Error('purchase_source must be Dealer/Customer');
          if (!['Under Warranty', 'No Warranty', 'Extended Warranty'].includes(warrantyStatus)) throw new Error('invalid warranty_status');

          const supplierName = row.supplier_name?.toLowerCase();
          const supplierId = supplierName ? supplierMap.get(supplierName) ?? null : null;

          await addInventory.mutateAsync({
            imei: row.imei,
            brand: row.brand,
            model: row.model,
            ram: row.ram || '—',
            storage: row.storage,
            color: row.color || '—',
            condition,
            purchase_source: purchaseSource,
            purchase_price: Number(row.purchase_price),
            warranty_status: warrantyStatus,
            notes: row.notes || null,
            purchase_date: purchaseDateValue,
            warranty_expiry: row.warranty_expiry || null,
            supplier_id: supplierId,
          });
          added++;
        } catch (error: any) {
          failed.push(`Row ${row.__rowNumber}: ${error.message || 'Invalid data'}`);
        }
      }

      if (added > 0) {
        toast.success(`${added} phones added successfully`);
      }

      if (failed.length > 0) {
        toast.error(`${failed.length} rows failed. First issue: ${failed[0]}`);
      }

      if (added > 0 && failed.length === 0) {
        navigate('/inventory');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to import CSV');
    } finally {
      setBulkAdding(false);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Bulk Add Phones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Download the blank spreadsheet, fill rows, then upload CSV to add multiple phones at once.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={downloadBlankTemplate}>
              Download Blank Spreadsheet
            </Button>
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => setBulkFile(e.target.files?.[0] ?? null)}
              className="cursor-pointer"
            />
            <Button type="button" onClick={handleBulkAdd} disabled={bulkAdding}>
              {bulkAdding ? 'Importing...' : 'Import Bulk CSV'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Required columns: imei, brand, model, storage, purchase_price. Optional: ram, color, condition, purchase_source, purchase_date, warranty_status, warranty_expiry, supplier_name, notes.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader><CardTitle className="text-lg">Add New Phone</CardTitle></CardHeader>
        <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>IMEI<RequiredStar /></Label>
            <div className="flex gap-2 mt-1">
              <Input {...register('imei')} placeholder="Enter 15-digit IMEI" className="font-mono" maxLength={15} />
              <ImeiScanner onScan={(imei) => setValue('imei', imei, { shouldValidate: true })} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dial *#06# or tap 📷 to scan the barcode</p>
            {errors.imei && <p className="text-xs text-destructive mt-1">{errors.imei.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Brand<RequiredStar /></Label>
              <div className="flex gap-1.5 mt-1">
                {customBrand ? (
                  <>
                    <Input {...register('brand')} placeholder="Enter brand name" />
                    <Button type="button" variant="ghost" size="sm" onClick={() => { setCustomBrand(false); setValue('brand', ''); }}>List</Button>
                  </>
                ) : (
                  <>
                    <Select value={selectedBrand} onValueChange={(v) => {
                      if (v === '__other') { setCustomBrand(true); setValue('brand', ''); setSelectedBrand(''); }
                      else { setValue('brand', v); setSelectedBrand(v); setValue('model', ''); setCustomModel(false); }
                    }}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select brand" /></SelectTrigger>
                      <SelectContent>
                        {allBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                        <SelectItem value="__other">✏️ Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Dialog open={newBrandDialog} onOpenChange={setNewBrandDialog}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon" title="Add new brand"><PlusCircle className="w-4 h-4" /></Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-xs">
                        <DialogHeader><DialogTitle>Add New Brand</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <Input value={newBrandName} onChange={e => setNewBrandName(e.target.value)} placeholder="Brand name" />
                          <Button className="w-full" onClick={handleAddBrand}>Add Brand</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
              {errors.brand && <p className="text-xs text-destructive mt-1">{errors.brand.message}</p>}
            </div>
            <div>
              <Label>Model<RequiredStar /></Label>
              <div className="flex gap-1.5 mt-1">
                {customModel || modelsForBrand.length === 0 ? (
                  <>
                    <Input {...register('model')} placeholder="e.g. iPhone 14" className="flex-1" />
                    {modelsForBrand.length > 0 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => { setCustomModel(false); setValue('model', ''); }}>List</Button>
                    )}
                  </>
                ) : (
                  <>
                    <Select onValueChange={(v) => {
                      if (v === '__other') { setCustomModel(true); setValue('model', ''); }
                      else setValue('model', v);
                    }}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select model" /></SelectTrigger>
                      <SelectContent>
                        {modelsForBrand.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        <SelectItem value="__other">✏️ Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Dialog open={newModelDialog} onOpenChange={setNewModelDialog}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon" title="Add new model"><PlusCircle className="w-4 h-4" /></Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-xs">
                        <DialogHeader><DialogTitle>Add New Model</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <Input value={newModelName} onChange={e => setNewModelName(e.target.value)} placeholder="Model name" />
                          <Button className="w-full" onClick={handleAddModel}>Add Model</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>
              {errors.model && <p className="text-xs text-destructive mt-1">{errors.model.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>RAM</Label>
              <Select onValueChange={(v) => setValue('ram', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>{ramOptions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Storage<RequiredStar /></Label>
              <Select onValueChange={(v) => setValue('storage', v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{storageOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              {errors.storage && <p className="text-xs text-destructive mt-1">{errors.storage.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Color</Label>
              <Input {...register('color')} placeholder="e.g. Black (optional)" className="mt-1" />
            </div>
            <div>
              <Label>Condition<RequiredStar /></Label>
              <Select defaultValue="Used" onValueChange={(v) => setValue('condition', v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Refurbished">Refurbished</SelectItem>
                  <SelectItem value="Used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Purchase Source<RequiredStar /></Label>
              <Select defaultValue="Dealer" onValueChange={(v) => setValue('purchase_source', v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dealer">Dealer</SelectItem>
                  <SelectItem value="Customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Supplier / Seller</Label>
              <div className="flex gap-1.5 mt-1">
                <Select onValueChange={(v) => setValue('supplier_id', v)}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Select party" /></SelectTrigger>
                  <SelectContent>{filteredParties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}{p.phone ? ` (${p.phone})` : ''}</SelectItem>)}</SelectContent>
                </Select>
                <AddPartyDialog
                  defaultType={purchaseSource === 'Dealer' ? 'Dealer' : 'Customer'}
                  onAdded={(id) => setValue('supplier_id', id)}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Purchase Price (₹)<RequiredStar /></Label>
              <Input type="number" {...register('purchase_price', { valueAsNumber: true })} placeholder="0" className="mt-1" min={1} />
              {errors.purchase_price && <p className="text-xs text-destructive mt-1">{errors.purchase_price.message}</p>}
            </div>
            <div>
              <Label>Purchase Date<RequiredStar /></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal", !purchaseDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />{purchaseDate ? format(purchaseDate, 'PP') : 'Pick date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={purchaseDate} onSelect={(d) => d && setPurchaseDate(d)} disabled={(d) => d > new Date()} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Warranty Status<RequiredStar /></Label>
              <Select defaultValue="No Warranty" onValueChange={(v) => setValue('warranty_status', v as any)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Under Warranty">Under Warranty</SelectItem>
                  <SelectItem value="No Warranty">No Warranty</SelectItem>
                  <SelectItem value="Extended Warranty">Extended Warranty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {warrantyStatus === 'Under Warranty' && (
              <div>
                <Label>Warranty Expiry</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal", !warrantyExpiry && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />{warrantyExpiry ? format(warrantyExpiry, 'PP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={warrantyExpiry} onSelect={setWarrantyExpiry} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea {...register('notes')} placeholder="Optional notes..." className="mt-1" rows={3} />
          </div>

          <Button type="submit" className="w-full" disabled={addInventory.isPending}>
            {addInventory.isPending ? 'Adding...' : 'Add Phone to Inventory'}
          </Button>
        </form>
      </CardContent>
      </Card>
    </div>
  );
}
