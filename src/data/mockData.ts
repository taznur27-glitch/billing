export interface Party {
  id: string;
  name: string;
  phone: string;
  type: 'Dealer' | 'Customer';
  city: string;
  notes?: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  imei: string;
  brand: string;
  model: string;
  ram: string;
  storage: string;
  color: string;
  condition: 'New' | 'Refurbished' | 'Used';
  purchase_source: 'Dealer' | 'Customer';
  supplier_id?: string;
  purchase_price: number;
  purchase_date: string;
  warranty_status: 'Under Warranty' | 'No Warranty' | 'Extended Warranty';
  warranty_expiry?: string;
  status: 'In Stock' | 'Sold' | 'Returned';
  notes?: string;
  photo_url?: string;
  created_at: string;
}

export interface Sale {
  id: string;
  imei: string;
  customer_id?: string;
  selling_price: number;
  sale_date: string;
  payment_mode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Credit';
  notes?: string;
  created_at: string;
}

export interface Return {
  id: string;
  return_type: 'Sales Return' | 'Purchase Return';
  imei: string;
  party_id?: string;
  return_date: string;
  return_reason: string;
  amount_refunded?: number;
  status: 'Pending' | 'Processed';
  created_at: string;
}

export interface Transaction {
  id: string;
  type: 'Purchase' | 'Sale' | 'Purchase Return' | 'Sales Return';
  imei?: string;
  party_id?: string;
  txn_date: string;
  amount: number;
  notes?: string;
  created_at: string;
}

export const parties: Party[] = [
  { id: 'p1', name: 'Rahul Sharma', phone: '9876543210', type: 'Customer', city: 'Mumbai', created_at: '2025-01-01' },
  { id: 'p2', name: 'Ravi Mobile Hub', phone: '9123456789', type: 'Dealer', city: 'Pune', created_at: '2025-01-01' },
  { id: 'p3', name: 'Priya Electronics', phone: '9988776655', type: 'Dealer', city: 'Delhi', created_at: '2025-01-01' },
];

export const inventory: InventoryItem[] = [
  {
    id: 'inv1', imei: '352999001234567', brand: 'Apple', model: 'iPhone 11', ram: '4GB',
    storage: '64GB', color: 'Black', condition: 'Used', purchase_source: 'Customer',
    supplier_id: 'p1', purchase_price: 14000, purchase_date: '2025-03-01',
    warranty_status: 'No Warranty', status: 'In Stock', created_at: '2025-03-01'
  },
  {
    id: 'inv2', imei: '490154203237518', brand: 'Samsung', model: 'Galaxy A52', ram: '6GB',
    storage: '128GB', color: 'Blue', condition: 'Refurbished', purchase_source: 'Dealer',
    supplier_id: 'p2', purchase_price: 16000, purchase_date: '2025-01-15',
    warranty_status: 'Under Warranty', warranty_expiry: '2026-01-15', status: 'In Stock',
    created_at: '2025-01-15'
  },
  {
    id: 'inv3', imei: '356901052345678', brand: 'OnePlus', model: '9R', ram: '8GB',
    storage: '128GB', color: 'Carbon Black', condition: 'Used', purchase_source: 'Dealer',
    supplier_id: 'p2', purchase_price: 18000, purchase_date: '2024-12-01',
    warranty_status: 'No Warranty', status: 'In Stock', created_at: '2024-12-01'
  },
  {
    id: 'inv4', imei: '861536030000001', brand: 'Xiaomi', model: 'Redmi Note 12', ram: '6GB',
    storage: '128GB', color: 'Onyx Gray', condition: 'New', purchase_source: 'Dealer',
    supplier_id: 'p3', purchase_price: 12000, purchase_date: '2026-03-20',
    warranty_status: 'Under Warranty', warranty_expiry: '2027-03-20', status: 'In Stock',
    created_at: '2026-03-20'
  },
  {
    id: 'inv5', imei: '353456789012345', brand: 'Samsung', model: 'Galaxy S21', ram: '8GB',
    storage: '256GB', color: 'Phantom Gray', condition: 'Used', purchase_source: 'Customer',
    supplier_id: 'p1', purchase_price: 22000, purchase_date: '2026-02-10',
    warranty_status: 'No Warranty', status: 'Sold', created_at: '2026-02-10'
  },
];

export const sales: Sale[] = [
  {
    id: 's1', imei: '353456789012345', customer_id: 'p1', selling_price: 28000,
    sale_date: '2026-03-15', payment_mode: 'UPI', created_at: '2026-03-15'
  },
];

export const returns: Return[] = [];

export const transactions: Transaction[] = [
  { id: 't1', type: 'Purchase', imei: '352999001234567', party_id: 'p1', txn_date: '2025-03-01', amount: 14000, created_at: '2025-03-01' },
  { id: 't2', type: 'Purchase', imei: '490154203237518', party_id: 'p2', txn_date: '2025-01-15', amount: 16000, created_at: '2025-01-15' },
  { id: 't3', type: 'Purchase', imei: '356901052345678', party_id: 'p2', txn_date: '2024-12-01', amount: 18000, created_at: '2024-12-01' },
  { id: 't4', type: 'Purchase', imei: '861536030000001', party_id: 'p3', txn_date: '2026-03-20', amount: 12000, created_at: '2026-03-20' },
  { id: 't5', type: 'Purchase', imei: '353456789012345', party_id: 'p1', txn_date: '2026-02-10', amount: 22000, created_at: '2026-02-10' },
  { id: 't6', type: 'Sale', imei: '353456789012345', party_id: 'p1', txn_date: '2026-03-15', amount: 28000, created_at: '2026-03-15' },
];

// Helper functions
export function getStockAgeDays(purchaseDate: string): number {
  const now = new Date();
  const purchased = new Date(purchaseDate);
  return Math.floor((now.getTime() - purchased.getTime()) / (1000 * 60 * 60 * 24));
}

export function getWarrantyAlert(item: InventoryItem): { label: string; type: 'valid' | 'expiring' | 'none' } {
  if (item.warranty_status !== 'Under Warranty' || !item.warranty_expiry) return { label: '—', type: 'none' };
  const expiry = new Date(item.warranty_expiry);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  if (expiry < thirtyDaysFromNow) return { label: '⚠️ Expiring Soon', type: 'expiring' };
  return { label: '✅ Valid', type: 'valid' };
}

export function getOldStockFlag(item: InventoryItem): { label: string; type: 'old' | 'aging' | 'none' } {
  if (item.status !== 'In Stock') return { label: '', type: 'none' };
  const age = getStockAgeDays(item.purchase_date);
  if (age > 30) return { label: '🔴 Old Stock', type: 'old' };
  if (age > 15) return { label: '🟡 Aging', type: 'aging' };
  return { label: '', type: 'none' };
}

export function getPartyName(partyId?: string): string {
  const party = parties.find(p => p.id === partyId);
  return party?.name || '—';
}

export function getInventoryByImei(imei: string): InventoryItem | undefined {
  return inventory.find(i => i.imei === imei);
}

export function getProfit(sale: Sale): number {
  const item = getInventoryByImei(sale.imei);
  if (!item) return 0;
  return sale.selling_price - item.purchase_price;
}
