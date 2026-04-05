import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import { exportData, type ExportFormat } from '@/lib/exportUtils';

interface ExportDialogProps {
  data: Record<string, any>[];
  allFields: string[];
  defaultFields?: string[];
  filenamePrefix: string;
  title?: string;
  triggerLabel?: string;
  triggerVariant?: 'default' | 'outline' | 'ghost';
}

export default function ExportDialog({
  data, allFields, defaultFields, filenamePrefix, title, triggerLabel = 'Export', triggerVariant = 'outline',
}: ExportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>(defaultFields || allFields);
  const [format, setFormat] = useState<ExportFormat>('csv');

  const toggleField = (field: string) => {
    setSelectedFields(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const toggleAll = () => {
    setSelectedFields(selectedFields.length === allFields.length ? [] : [...allFields]);
  };

  const handleExport = () => {
    if (selectedFields.length === 0) return;
    exportData({
      format, fields: selectedFields, data,
      filename: `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}`,
      title: title || filenamePrefix,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size="sm" className="gap-1.5">
          <Download className="w-4 h-4" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Export Options</DialogTitle></DialogHeader>
        <div className="space-y-4">
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
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium">Fields to Include</Label>
              <button onClick={toggleAll} className="text-xs text-primary hover:underline">
                {selectedFields.length === allFields.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto border border-border rounded-md p-2">
              {allFields.map(field => (
                <label key={field} className="flex items-center gap-1.5 text-xs cursor-pointer py-1 px-1 rounded hover:bg-accent">
                  <Checkbox
                    checked={selectedFields.includes(field)}
                    onCheckedChange={() => toggleField(field)}
                    className="h-3.5 w-3.5"
                  />
                  <span className="truncate">{field}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{selectedFields.length} of {allFields.length} selected</p>
          </div>

          <Button className="w-full" onClick={handleExport} disabled={selectedFields.length === 0}>
            Export {data.length} Records as {format.toUpperCase()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
