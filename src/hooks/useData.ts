import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import type { PostgrestError } from '@supabase/supabase-js';

// ---- Types ----
export type Party = Tables<'parties'>;
export type InventoryItem = Tables<'inventory'>;
export type Sale = Tables<'sales'>;
export type ReturnRecord = Tables<'returns'>;
export type Transaction = Tables<'transactions'>;

const isMissingTableError = (message?: string, table?: string) => {
  if (!message || !table) return false;
  const lower = message.toLowerCase();
  return (
    (lower.includes('could not find the table') && lower.includes(table.toLowerCase())) ||
    (lower.includes('relation') && lower.includes(table.toLowerCase()) && lower.includes('does not exist'))
  );
};
const isMissingTransactionsTable = (message?: string) => isMissingTableError(message, 'public.transactions');
const isMissingSalesTable = (message?: string) => isMissingTableError(message, 'public.sales');
const isMissingColumnError = (message?: string) =>
  !!message?.includes("Could not find the '") && !!message?.includes("' column");

const markInventoryAsSold = async (imei: string) => {
  const updateResult = await supabase
    .from('inventory')
    .update({ status: 'Sold' })
    .eq('imei', imei)
    .select('id');

  if (!updateResult.error) return;

  const missingStatusColumn =
    updateResult.error.message.includes("Could not find the 'status' column") ||
    updateResult.error.message.includes('column inventory.status does not exist');

  if (!missingStatusColumn) throw updateResult.error;

  // Legacy fallback: if no status column exists, deduct from stock by removing sold row.
  const deleteResult = await supabase.from('inventory').delete().eq('imei', imei).select('id');
  if (deleteResult.error) throw deleteResult.error;
};

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

      const missingStorage = error?.message?.includes("Could not find the 'storage' column");
      const missingSupplier = error?.message?.includes("Could not find the 'supplier_id' column");

      if (missingStorage || missingSupplier) {
        const fallback = await supabase
          .from('inventory')
          .select('id, imei, brand, model, color, condition, purchase_source, purchase_price, purchase_date, status, warranty_status, warranty_expiry, notes, photo_url, created_at')
          .order('created_at', { ascending: false });

        if (fallback.error) throw fallback.error;
        return (fallback.data ?? []).map((item: any) => ({
          ...item,
          ram: '—',
          storage: '—',
          supplier_id: null,
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

      const missingStorage = error?.message?.includes("Could not find the 'storage' column");
      const missingSupplier = error?.message?.includes("Could not find the 'supplier_id' column");

      if (missingStorage || missingSupplier) {
        const { storage, ram, supplier_id, ...legacyItem } = item as any;
        const fallbackInsert = await supabase.from('inventory').insert(legacyItem).select().single();
        data = fallbackInsert.data;
        error = fallbackInsert.error;
      }

      if (error) throw error;

      // Auto-create Purchase transaction
      const purchaseTxn = await supabase.from('transactions').insert({
        type: 'Purchase',
        imei: item.imei,
        party_id: item.supplier_id || null,
        txn_date: item.purchase_date,
        amount: item.purchase_price,
      });
      if (purchaseTxn.error && !isMissingTransactionsTable(purchaseTxn.error.message)) {
        throw purchaseTxn.error;
      }

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
      let { data, error } = await supabase.from('sales').select('*').order('sale_date', { ascending: false });

      if (error && isMissingColumnError(error.message)) {
        const fallbackSales = await supabase.from('sales').select('*').order('created_at', { ascending: false });
        data = fallbackSales.data;
        error = fallbackSales.error;
      }

      if (error && isMissingSalesTable(error.message)) {
        const fallback = await supabase
          .from('transactions')
          .select('*')
          .eq('type', 'Sale')
          .order('txn_date', { ascending: false });

        if (fallback.error && isMissingTransactionsTable(fallback.error.message)) return [];
        if (fallback.error) throw fallback.error;
        return (fallback.data ?? []).map((t) => ({
          id: t.id,
          imei: t.imei ?? '',
          customer_id: t.party_id,
          selling_price: t.amount ?? 0,
          sale_date: t.txn_date,
          payment_mode: 'Cash',
          notes: t.notes ?? null,
          created_at: t.created_at ?? null,
        })) as Sale[];
      }
      if (error) throw error;
      return data as Sale[];
    },
  });
}

export function useAddSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sale: TablesInsert<'sales'>) => {
      let saleData: Sale | null = null;
      let saleInsertError: PostgrestError | null = null;

      const saleInsertResult = await supabase.from('sales').insert(sale).select().single();
      let data = saleInsertResult.data;
      let error = saleInsertResult.error;

      if (!error) {
        saleData = data as Sale;
      }

      if (error && isMissingColumnError(error.message)) {
        const minimalSalePayload = {
          imei: sale.imei,
          selling_price: sale.selling_price,
          sale_date: sale.sale_date,
          customer_id: sale.customer_id || null,
        };
        const fallbackSale = await supabase
          .from('sales')
          .insert(minimalSalePayload as TablesInsert<'sales'>)
          .select()
          .single();
        if (!fallbackSale.error) {
          saleData = fallbackSale.data as Sale;
          error = null;
        } else {
          error = fallbackSale.error;
        }
      }

      if (error && isMissingSalesTable(error.message)) {
        const fallbackTxn = await supabase.from('transactions').insert({
          type: 'Sale',
          imei: sale.imei,
          party_id: sale.customer_id || null,
          txn_date: sale.sale_date,
          amount: sale.selling_price,
          notes: sale.notes || null,
        }).select().single();

        if (fallbackTxn.error && isMissingColumnError(fallbackTxn.error.message)) {
          const minimalTxn = await supabase.from('transactions').insert({
            type: 'Sale',
            imei: sale.imei,
            txn_date: sale.sale_date,
            amount: sale.selling_price,
          } as TablesInsert<'transactions'>).select().single();

          if (!minimalTxn.error) {
            await markInventoryAsSold(sale.imei);
            return {
              id: minimalTxn.data.id,
              imei: sale.imei,
              customer_id: sale.customer_id || null,
              selling_price: sale.selling_price,
              sale_date: sale.sale_date,
              payment_mode: sale.payment_mode || 'Cash',
              notes: sale.notes || null,
              created_at: minimalTxn.data.created_at || null,
            } as Sale;
          }
          if (minimalTxn.error && !isMissingTransactionsTable(minimalTxn.error.message)) throw minimalTxn.error;
        }

        if (fallbackTxn.error && !isMissingTransactionsTable(fallbackTxn.error.message)) throw fallbackTxn.error;

        if (!fallbackTxn.data) {
          await markInventoryAsSold(sale.imei);
          return {
            id: crypto.randomUUID(),
            imei: sale.imei,
            customer_id: sale.customer_id || null,
            selling_price: sale.selling_price,
            sale_date: sale.sale_date,
            payment_mode: sale.payment_mode || 'Cash',
            notes: sale.notes || null,
            created_at: new Date().toISOString(),
          } as Sale;
        }

        await markInventoryAsSold(sale.imei);
        return {
          id: fallbackTxn.data.id,
          imei: sale.imei,
          customer_id: sale.customer_id || null,
          selling_price: sale.selling_price,
          sale_date: sale.sale_date,
          payment_mode: sale.payment_mode || 'Cash',
          notes: sale.notes || null,
          created_at: fallbackTxn.data.created_at || null,
        } as Sale;
      }

      // If sale insert failed and it's not a missing table error, throw the error
      if (error) {
        throw error;
      }

      // Sale was successful, now update inventory status
      await markInventoryAsSold(sale.imei);

      // Create transaction record (non-blocking - failures here won't prevent sale from being recorded)

      const txnPayload = {
        type: 'Sale',
        imei: sale.imei,
        party_id: sale.customer_id || null,
        txn_date: sale.sale_date,
        amount: sale.selling_price,
        notes: sale.notes || null,
      };

      let saleTxn = await supabase.from('transactions').insert(txnPayload).select().single();
      if (saleTxn.error && isMissingColumnError(saleTxn.error.message)) {
        saleTxn = await supabase
          .from('transactions')
          .insert({
            type: 'Sale',
            imei: sale.imei,
            txn_date: sale.sale_date,
            amount: sale.selling_price,
          } as TablesInsert<'transactions'>)
          .select()
          .single();
      }
      
      // Transaction insert is optional - don't fail the sale if it fails
      // Just log it but continue

      return saleData as Sale;
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
      const returnTxn = await supabase.from('transactions').insert({
        type: ret.return_type === 'Sales Return' ? 'Sales Return' : 'Purchase Return',
        imei: ret.imei,
        party_id: ret.party_id || null,
        txn_date: ret.return_date,
        amount: ret.amount_refunded || 0,
      });
      if (returnTxn.error && !isMissingTransactionsTable(returnTxn.error.message)) {
        throw returnTxn.error;
      }

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
      if (error && isMissingTransactionsTable(error.message)) return [];
      if (error) throw error;
      return data as Transaction[];
    },
  });
}