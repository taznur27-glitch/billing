import { forwardRef } from 'react';
import type { InventoryItem, Sale, Party } from '@/hooks/useData';

interface SaleBillProps {
  sale: Sale;
  phone: InventoryItem | undefined;
  customer: Party | undefined;
}

const SHOP_DETAILS = {
  name: 'MAISHA MOBILE STORE',
  gstin: '18AEHPH8397E1Z4',
  addressLines: ['Sijubari- Khankah Road, Hatigaon, Guwahati', 'Kamrup Metro, Assam, 781038'],
  phone: '+91 7002309813',
  email: 'maishamobilestoreghy@gmail.com',
  placeOfSupply: 'ASSAM',
  bank: {
    name: 'HDFC Bank',
    accountHolder: 'MAISHA MOBILE STORE',
    accountNo: '50200065022148',
    ifsc: 'HDFC0000757',
    branch: 'GUWAHATI - KHANAPARA',
  },
  watermark: {
    primary: 'MMS',
    secondary: 'MAISHA MOBILE STORE',
    opacity: 0.08,
  },
};

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const numberToWords = (num: number) => {
  if (num === 0) return 'Zero';

  const belowTwenty = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const toWords = (n: number): string => {
    if (n < 20) return belowTwenty[n];
    if (n < 100) return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${belowTwenty[n % 10]}` : ''}`;
    if (n < 1000) return `${belowTwenty[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${toWords(n % 100)}` : ''}`;
    if (n < 100000) return `${toWords(Math.floor(n / 1000))} Thousand${n % 1000 ? ` ${toWords(n % 1000)}` : ''}`;
    if (n < 10000000) return `${toWords(Math.floor(n / 100000))} Lakh${n % 100000 ? ` ${toWords(n % 100000)}` : ''}`;
    return `${toWords(Math.floor(n / 10000000))} Crore${n % 10000000 ? ` ${toWords(n % 10000000)}` : ''}`;
  };

  return toWords(Math.round(num)).trim();
};

const SaleBill = forwardRef<HTMLDivElement, SaleBillProps>(({ sale, phone, customer }, ref) => {
  const invoiceNo = `${new Date(sale.sale_date).getFullYear()}/${sale.id.slice(0, 4).toUpperCase()}-${sale.id.slice(-4).toUpperCase()}`;
  const saleDate = new Date(sale.sale_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const dueDate = saleDate;
  const taxableAmount = sale.selling_price;
  const taxAmount = 0;
  const totalAmount = taxableAmount + taxAmount;

  return (
    <div
      ref={ref}
      className="relative bg-white text-black p-4 w-[794px] mx-auto text-[12px] overflow-hidden"
      style={{ fontFamily: 'Times New Roman, serif' }}
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ opacity: SHOP_DETAILS.watermark.opacity }}>
        <div className="text-center text-[84px] font-bold tracking-wide text-blue-700/70 -rotate-12 leading-[1]">
          {SHOP_DETAILS.watermark.primary}
          <div className="text-[44px] mt-3 tracking-[4px]">{SHOP_DETAILS.watermark.secondary}</div>
        </div>
      </div>

      <div className="relative text-center border border-black border-b-0 py-1">
        <p className="font-bold tracking-[4px] text-[18px] text-blue-700">TAX INVOICE</p>
      </div>

      <table className="relative w-full border border-black border-collapse">
        <tbody>
          <tr>
            <td className="border border-black align-top p-2 w-[48%]">
              <p className="font-bold text-[28px] leading-none">{SHOP_DETAILS.name}</p>
              <p className="mt-1"><span className="font-semibold">GSTIN:</span> {SHOP_DETAILS.gstin}</p>
              {SHOP_DETAILS.addressLines.map((line) => <p key={line}>{line}</p>)}
              <p>Mobile: {SHOP_DETAILS.phone}</p>
              <p>Email: {SHOP_DETAILS.email}</p>
            </td>
            <td className="border border-black align-top p-0">
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-semibold">Invoice #:</td>
                    <td className="border border-black p-2">{invoiceNo}</td>
                    <td className="border border-black p-2 font-semibold">Invoice Date:</td>
                    <td className="border border-black p-2">{saleDate}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-semibold">Place of Supply:</td>
                    <td className="border border-black p-2 font-bold">{SHOP_DETAILS.placeOfSupply}</td>
                    <td className="border border-black p-2 font-semibold">Due Date:</td>
                    <td className="border border-black p-2">{dueDate}</td>
                  </tr>
                </tbody>
              </table>
              <div className="p-2 min-h-[124px]">
                <p className="font-semibold">Customer Details:</p>
                <p className="font-semibold uppercase">{customer?.name || 'Walk-in Customer'}</p>
                <p className="font-semibold mt-1">Billing Address:</p>
                <p>{customer?.city || 'ASSAM'}</p>
                <p>{SHOP_DETAILS.placeOfSupply}</p>
                {customer?.phone && <p>Ph: {customer.phone}</p>}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table className="relative w-full border border-black border-t-0 border-collapse text-[11px]">
        <thead>
          <tr className="bg-gray-100/90">
            <th className="border border-black p-1 w-8">#</th>
            <th className="border border-black p-1 text-left">Item</th>
            <th className="border border-black p-1">HSN/SAC</th>
            <th className="border border-black p-1">Rate / Item</th>
            <th className="border border-black p-1">Qty</th>
            <th className="border border-black p-1">Taxable Value</th>
            <th className="border border-black p-1">Tax Amount</th>
            <th className="border border-black p-1">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black p-1 text-center align-top">1</td>
            <td className="border border-black p-1 align-top">
              <p className="font-semibold">{phone ? `${phone.brand} ${phone.model}` : 'Mobile Phone'}</p>
              <p>Batch No: {sale.imei}</p>
              {phone && <p>Storage: {phone.storage} | RAM: {phone.ram} | Color: {phone.color}</p>}
              <p>Payment Mode: {sale.payment_mode}</p>
            </td>
            <td className="border border-black p-1 text-center align-top">8517</td>
            <td className="border border-black p-1 text-right align-top">{formatCurrency(taxableAmount)}</td>
            <td className="border border-black p-1 text-center align-top">1 PCS</td>
            <td className="border border-black p-1 text-right align-top">{formatCurrency(taxableAmount)}</td>
            <td className="border border-black p-1 text-right align-top">0.00 (0%)</td>
            <td className="border border-black p-1 text-right align-top">{formatCurrency(totalAmount)}</td>
          </tr>
          <tr>
            <td className="border border-black p-1" colSpan={8} style={{ height: 140 }} />
          </tr>
        </tbody>
      </table>

      <table className="relative w-full border border-black border-t-0 border-collapse">
        <tbody>
          <tr>
            <td className="border border-black p-1 w-[60%]">Total Items / Qty : 1 / 1</td>
            <td className="border border-black p-1 text-right font-semibold">Taxable Amount</td>
            <td className="border border-black p-1 text-right font-semibold">{formatCurrency(taxableAmount)}</td>
          </tr>
          <tr>
            <td className="border border-black p-1">Total amount (in words): INR {numberToWords(totalAmount)} Rupees Only.</td>
            <td className="border border-black p-1 text-right font-bold text-[30px] leading-none">Total</td>
            <td className="border border-black p-1 text-right font-bold text-[36px] leading-none">{formatCurrency(totalAmount)}</td>
          </tr>
          <tr>
            <td className="border border-black p-1" />
            <td className="border border-black p-1 text-right font-semibold text-[30px]">✅ Amount Paid</td>
            <td className="border border-black p-1 text-right font-semibold">{formatCurrency(totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      <table className="relative w-full border border-black border-t-0 border-collapse text-[11px]">
        <tbody>
          <tr>
            <td className="border border-black p-2 align-top w-1/2">
              <p className="font-semibold">Bank Details:</p>
              <p>Bank: <span className="font-semibold">{SHOP_DETAILS.bank.name}</span></p>
              <p>Account Holder: <span className="font-semibold">{SHOP_DETAILS.bank.accountHolder}</span></p>
              <p>Account #: <span className="font-semibold">{SHOP_DETAILS.bank.accountNo}</span></p>
              <p>IFSC Code: <span className="font-semibold">{SHOP_DETAILS.bank.ifsc}</span></p>
              <p>Branch: <span className="font-semibold">{SHOP_DETAILS.bank.branch}</span></p>
            </td>
            <td className="border border-black p-2 align-top w-1/2">
              <p className="font-semibold text-right">For {SHOP_DETAILS.name}</p>
              <div className="h-16" />
              <p className="text-right">Authorized Signatory</p>
            </td>
          </tr>
          <tr>
            <td className="border border-black p-2 align-top">
              <p className="font-semibold">Notes:</p>
              <p>Please note that this product is not covered under warranty for any liquid/physical damage, green line issues or dead phones that are non-functional (dead).</p>
              {sale.notes && <p>Additional Note: {sale.notes}</p>}
            </td>
            <td className="border border-black p-2 align-top">
              <p className="font-semibold">Terms and Conditions:</p>
              <p className="font-semibold">DECLARATION:</p>
              <p>Invoice is issued under Rule 32(5) of CGST Rules, 2017. No Input tax credit (ITC) is available to the buyer. GST is paid under Marginal Scheme.</p>
              <p>No warranty for liquid/physical damage, green line issues and dead phones.</p>
              <p className="mt-2">10 Days Store Warranty</p>
              <p>25 Days Store Warranty</p>
              <p>3 Months Store Warranty</p>
              <p>6 Months Store Warranty</p>
              <p>1 Year Store Warranty</p>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="relative mt-2 text-[11px] font-semibold">Page 1 / 1 &nbsp;•&nbsp; This is a digitally signed document.</div>
    </div>
  );
});

SaleBill.displayName = 'SaleBill';
export default SaleBill;