import { useState, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Camera, X } from 'lucide-react';
import { toast } from 'sonner';

interface ImeiScannerProps {
  onScan: (imei: string) => void;
}

export default function ImeiScanner({ onScan }: ImeiScannerProps) {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }
    scannerRef.current = null;
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    try {
      const scanner = new Html5Qrcode('imei-scanner-region');
      scannerRef.current = scanner;
      setScanning(true);

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 280, height: 120 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          const digits = decodedText.replace(/\D/g, '');
          if (digits.length === 15) {
            onScan(digits);
            toast.success(`IMEI scanned: ${digits}`);
            stopScanner();
            setOpen(false);
          } else if (digits.length > 0) {
            onScan(digits);
            toast.info(`Scanned: ${digits} (verify IMEI)`);
            stopScanner();
            setOpen(false);
          }
        },
        () => {}
      );
    } catch (err: any) {
      toast.error(err?.message || 'Could not access camera');
      setScanning(false);
    }
  }, [onScan, stopScanner]);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) stopScanner();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="shrink-0">
          <Camera className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" aria-describedby="scanner-desc">
        <DialogHeader>
          <DialogTitle>Scan IMEI Barcode</DialogTitle>
          <DialogDescription id="scanner-desc">
            Point your camera at the IMEI barcode on the phone box or under the battery.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div
            id="imei-scanner-region"
            className="w-full min-h-[250px] rounded-md overflow-hidden bg-muted"
          />
          {!scanning ? (
            <Button onClick={startScanner} className="w-full">
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          ) : (
            <Button onClick={stopScanner} variant="destructive" className="w-full">
              <X className="mr-2 h-4 w-4" />
              Stop Camera
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}