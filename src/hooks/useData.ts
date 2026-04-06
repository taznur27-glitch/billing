import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

// ---- Types ----
export type Party = Tables<'parties'>;
export type InventoryItem = Tables<'inventory'>;
export type Sale = Tables<'sales'>;
export type ReturnRecord = Tables<'returns'>;
export type Transaction = Tables<'transactions'>;

// ---- Helpers ----
export function getStockAgeDays(purchaseDate: string): number {
  return Math.floor((Date.now() - new Date(purchaseDate).getTime()) / 86400000);
}

export function getWarrantyAlert(item: InventoryItem): { label: string; type: 'valid' | 'expiring' | 'none' } {
  if (item.warranty_status !== 'Under Warranty' || !item.warranty_expiry) return { label: '—', type: 'none' };
  const expiry = new Date(item.warranty_expiry);
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);
  if (expiry < soon) return { label: '⚠️ Expiring Soon', type: 'expiring' };
  return { label: '✅ Valid', type: 'valid' };
}

export function getOldStockFlag(item: InventoryItem): { label: string; type: 'old' | 'aging' | 'none' } {
  if (item.status !== 'In Stock') return { label: '', type: 'none' };
  const age = getStockAgeDays(item.purchase_date);
  if (age > 30) return { label: '🔴 Old Stock', type: 'old' };
  if (age > 15) return { label: '🟡 Aging', type: 'aging' };
  return { label: '', type: 'none' };
}

// ---- Parties ----
export function useParties() {
  return useQuery({
    queryKey: ['parties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('parties').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Party[];
    },
  });
}

export function useAddParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (party: TablesInsert<'parties'>) => {
      const { data, error } = await supabase.from('parties').insert(party).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parties'] }),
  });
}

// ---- Inventory ----
export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });

       if (error?.message?.includes("Could not find the 'storage' column")) {
        const fallback = await supabase
          .from('inventory')
          .select('id, imei, brand, model, color, condition, purchase_source, purchase_price, purchase_date, supplier_id, status, warranty_status, warranty_expiry, notes, photo_url, created_at')
          .order('created_at', { ascending: false });

        if (fallback.error) throw fallback.error;
        return (fallback.data ?? []).map((item: any) => ({
          ...item,
          ram: '—',
          storage: '—',
        })) as InventoryItem[];
      }

      if (error) throw error;
      return data as InventoryItem[];
    },
  });
}

export function useAddInventory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: TablesInsert<'inventory'>) => {
      // Check IMEI uniqueness
      const { data: existing } = await supabase.from('inventory').select('imei').eq('imei', item.imei).maybeSingle();
      if (existing) throw new Error('This IMEI already exists in inventory');

      let { data, error } = await supabase.from('inventory').insert(item).select().single();

      if (error?.message?.includes("Could not find the 'storage' column")) {
        const { storage, ram, ...legacyItem } = item as any;
        const fallbackInsert = await supabase.from('inventory').insert(legacyItem).select().single();
        data = fallbackInsert.data;
        error = fallbackInsert.error;
      }

      if (error) throw error;

      // Auto-create Purchase transaction
      await supabase.from('transactions').insert({
        type: 'Purchase',
        imei: item.imei,
        party_id: item.supplier_id || null,
        txn_date: item.purchase_date,
        amount: item.purchase_price,
      });

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

// ---- Sales ----
export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sales').select('*').order('sale_date', { ascending: false });
      if (error) throw error;
      return data as Sale[];
    },
  });
}

export function useAddSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sale: TablesInsert<'sales'>) => {
      const { data, error } = await supabase.from('sales').insert(sale).select().single();
      if (error) throw error;

      // Auto-update inventory status to 'Sold'
      await supabase.from('inventory').update({ status: 'Sold' }).eq('imei', sale.imei);

      // Auto-create Sale transaction
      await supabase.from('transactions').insert({
        type: 'Sale',
        imei: sale.imei,
        party_id: sale.customer_id || null,
        txn_date: sale.sale_date,
        amount: sale.selling_price,
      });

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

// ---- Returns ----
export function useReturns() {
  return useQuery({
    queryKey: ['returns'],
    queryFn: async () => {
      const { data, error } = await supabase.from('returns').select('*').order('return_date', { ascending: false });
      if (error) throw error;
      return data as ReturnRecord[];
    },
  });
}

export function useAddReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ret: TablesInsert<'returns'>) => {
      const { data, error } = await supabase.from('returns').insert(ret).select().single();
      if (error) throw error;

      // Auto-update inventory status
      await supabase.from('inventory').update({ status: 'Returned' }).eq('imei', ret.imei);

      // Auto-create return transaction
      await supabase.from('transactions').insert({
        type: ret.return_type === 'Sales Return' ? 'Sales Return' : 'Purchase Return',
        imei: ret.imei,
        party_id: ret.party_id || null,
        txn_date: ret.return_date,
        amount: ret.amount_refunded || 0,
      });

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['returns'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

// ---- Transactions ----
export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('transactions').select('*').order('txn_date', { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    },
  });
}
