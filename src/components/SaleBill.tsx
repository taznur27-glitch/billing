import { forwardRef } from 'react';
import type { InventoryItem, Sale, Party } from '@/hooks/useData';

interface SaleBillProps {
  sale: Sale;
  phone: InventoryItem | undefined;
  customer: Party | undefined;
}

const SaleBill = forwardRef<HTMLDivElement, SaleBillProps>(({ sale, phone, customer }, ref) => {
  const profit = phone ? sale.selling_price - phone.purchase_price : 0;
  
  return (
    <div ref={ref} className="bg-white text-black p-8 max-w-lg mx-auto text-sm" style={{ fontFamily: 'serif' }}>
      <div className="text-center border-b-2 border-black pb-3 mb-4">
        <h1 className="text-xl font-bold tracking-wide">SALE INVOICE</h1>
        <p className="text-xs text-gray-600 mt-1">Mobile Phone Sale Receipt</p>
      </div>

      <div className="flex justify-between mb-4 text-xs">
        <div>
          <p><strong>Invoice #:</strong> {sale.id.slice(0, 8).toUpperCase()}</p>
          <p><strong>Date:</strong> {sale.sale_date}</p>
        </div>
        <div className="text-right">
          <p><strong>Payment:</strong> {sale.payment_mode}</p>
        </div>
      </div>

      {customer && (
        <div className="border border-gray-300 rounded p-3 mb-4 text-xs">
          <p className="font-semibold mb-1">Bill To:</p>
          <p>{customer.name}</p>
          {customer.phone && <p>Phone: {customer.phone}</p>}
          {customer.city && <p>City: {customer.city}</p>}
        </div>
      )}

      <table className="w-full mb-4 text-xs">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-2">Description</th>
            <th className="text-right py-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="py-2">
              <p className="font-semibold">{phone ? `${phone.brand} ${phone.model}` : 'Mobile Phone'}</p>
              <p className="text-gray-600">IMEI: {sale.imei}</p>
              {phone && (
                <>
                  <p className="text-gray-600">Storage: {phone.storage} | RAM: {phone.ram}</p>
                  <p className="text-gray-600">Color: {phone.color} | Condition: {phone.condition}</p>
                </>
              )}
            </td>
            <td className="py-2 text-right font-semibold">₹{sale.selling_price.toLocaleString('en-IN')}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black">
            <td className="py-3 font-bold text-base">Total</td>
            <td className="py-3 text-right font-bold text-base">₹{sale.selling_price.toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>

      {sale.notes && (
        <div className="text-xs border-t border-gray-200 pt-2 mb-4">
          <p><strong>Notes:</strong> {sale.notes}</p>
        </div>
      )}

      <div className="border-t-2 border-black pt-4 mt-8 flex justify-between text-xs">
        <div>
          <p className="text-gray-500">Thank you for your purchase!</p>
        </div>
        <div className="text-right">
          <div className="border-t border-black mt-8 pt-1">
            <p>Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
});

SaleBill.displayName = 'SaleBill';
export default SaleBill;
