import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { FileText, Tag } from 'lucide-react';
import { exportPriceList, type ExportFormat } from '@/lib/exportUtils';
import { useInventory } from '@/hooks/useData';

const allPriceFields = ['Brand', 'Model', 'IMEI', 'RAM', 'Storage', 'Color', 'Condition', 'Purchase Price', 'Selling Price', 'Profit', 'Warranty'];
const defaultPriceFields = ['Brand', 'Model', 'Storage', 'Condition', 'Selling Price'];

export default function PriceListGenerator() {
  const { data: inventory = [] } = useInventory();
  const [open, setOpen] = useState(false);
  const [profitPercent, setProfitPercent] = useState(15);
  const [profitFlat, setProfitFlat] = useState(0);
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [selectedFields, setSelectedFields] = useState<string[]>(defaultPriceFields);
  const [shopName, setShopName] = useState('');

  const inStockPhones = inventory.filter(i => i.status === 'In Stock');

  const toggleField = (field: string) => {
    setSelectedFields(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const handleGenerate = () => {
    if (inStockPhones.length === 0 || selectedFields.length === 0) return;

    const data = inStockPhones.map(i => ({
      Brand: i.brand,
      Model: i.model,
      IMEI: i.imei,
      RAM: i.ram,
      Storage: i.storage,
      Color: i.color,
      Condition: i.condition,
      'Purchase Price': i.purchase_price,
      'Selling Price': 0, // calculated in exportPriceList
      Profit: 0, // calculated in exportPriceList
      Warranty: i.warranty_status,
    }));

    exportPriceList({
      data, profitPercent, profitFlat, format, fields: selectedFields, shopName: shopName || undefined,
    });
    setOpen(false);
  };

  // Preview calculation
  const samplePrice = inStockPhones.length > 0 ? inStockPhones[0].purchase_price : 10000;
  const markup = Math.round(samplePrice * (profitPercent / 100)) + profitFlat;
  const sellingPreview = samplePrice + markup;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Tag className="w-4 h-4" /> Price List
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Generate Price List</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Shop Name (optional)</Label>
            <Input value={shopName} onChange={e => setShopName(e.target.value)} placeholder="e.g. My Mobile Shop" className="mt-1" />
          </div>

          <div className="p-3 bg-muted rounded-lg space-y-3">
            <Label className="text-sm font-semibold">Profit Markup</Label>
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Percentage: {profitPercent}%</span>
              </div>
              <Slider
                value={[profitPercent]}
                onValueChange={([v]) => setProfitPercent(v)}
                min={0} max={50} step={1}
              />
            </div>
            <div>
              <Label className="text-xs">Flat Markup (₹)</Label>
              <Input
                type="number" value={profitFlat || ''} onChange={e => setProfitFlat(Number(e.target.value))}
                className="mt-1" min={0} placeholder="0"
              />
            </div>
            <div className="text-xs text-muted-foreground border-t border-border pt-2">
              <p>Preview: ₹{samplePrice.toLocaleString('en-IN')} → <span className="font-semibold text-foreground">₹{sellingPreview.toLocaleString('en-IN')}</span> (profit: ₹{markup.toLocaleString('en-IN')})</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">File Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                <SelectItem value="pdf">PDF Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Fields to Include</Label>
            <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto border border-border rounded-md p-2">
              {allPriceFields.map(field => (
                <label key={field} className="flex items-center gap-1.5 text-xs cursor-pointer py-1 px-1 rounded hover:bg-accent">
                  <Checkbox
                    checked={selectedFields.includes(field)}
                    onCheckedChange={() => toggleField(field)}
                    className="h-3.5 w-3.5"
                  />
                  <span>{field}</span>
                </label>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={handleGenerate} disabled={inStockPhones.length === 0 || selectedFields.length === 0}>
            Generate Price List ({inStockPhones.length} phones)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
