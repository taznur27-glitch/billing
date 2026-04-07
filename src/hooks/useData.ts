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

// ---- FIXED: mark inventory sold ----
const markInventoryAsSold = async (inventory_id: string) => {
  const { error } = await supabase
    .from('inventory')
    .update({ status: 'sold' })
    .eq('id', inventory_id);

  if (error) throw error;
};

// ---- Parties ----
export function useParties() {
  return useQuery({
    queryKey: ['parties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('parties').select('*');
      if (error) throw error;
      return data as Party[];
    },
  });
}

// ---- Inventory ----
export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InventoryItem[];
    },
  });
}

export function useAddInventory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (item: TablesInsert<'inventory'>) => {
      const { data, error } = await supabase
        .from('inventory')
        .insert(item)
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

// ---- Sales ----
export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('sale_date', { ascending: false });

      if (error) throw error;
      return data as Sale[];
    },
  });
}

export function useAddSale() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (sale: TablesInsert<'sales'>) => {
      const { data, error } = await supabase
        .from('sales')
        .insert(sale)
        .select()
        .single();

      if (error) throw error;

      // update inventory
      if (sale.inventory_id) {
        await markInventoryAsSold(sale.inventory_id);
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sales'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

// ---- Returns ----
export function useReturns() {
  return useQuery({
    queryKey: ['returns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('returns')
        .select('*')
        .order('return_date', { ascending: false });

      if (error) throw error;
      return data as ReturnRecord[];
    },
  });
}

// ---- Transactions ----
export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('txn_date', { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
  });
}

// ---- 🔥 DASHBOARD (MAIN FIX) ----
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data: inventory, error } = await supabase
        .from('inventory')
        .select('*');

      if (error) throw error;

      console.log('Inventory:', inventory);

      // ✅ FIXED COUNT (NO FILTER)
      const inStockCount = inventory?.length || 0;

      // Brand summary
      const brandSummary: Record<string, any> = {};

      inventory?.forEach((item) => {
        if (!brandSummary[item.brand]) {
          brandSummary[item.brand] = {
            inStock: 0,
            stockValue: 0,
          };
        }

        brandSummary[item.brand].inStock += 1;
        brandSummary[item.brand].stockValue += item.purchase_price || 0;
      });

      return {
        inStockCount,
        brandSummary,
      };
    },
  });
}