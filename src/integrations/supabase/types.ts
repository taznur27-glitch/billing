export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      delete_requests: {
        Row: {
          created_at: string | null
          id: string
          record_id: string
          requested_by: string
          status: string
          table_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          record_id: string
          requested_by: string
          status?: string
          table_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          record_id?: string
          requested_by?: string
          status?: string
          table_name?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          brand: string
          color: string
          condition: string
          created_at: string | null
          id: string
          imei: string
          model: string
          notes: string | null
          photo_url: string | null
          purchase_date: string
          purchase_price: number
          purchase_source: string
          ram: string
          status: string
          storage: string
          supplier_id: string | null
          warranty_expiry: string | null
          warranty_status: string
        }
        Insert: {
          brand: string
          color: string
          condition: string
          created_at?: string | null
          id?: string
          imei: string
          model: string
          notes?: string | null
          photo_url?: string | null
          purchase_date: string
          purchase_price: number
          purchase_source: string
          ram: string
          status?: string
          storage: string
          supplier_id?: string | null
          warranty_expiry?: string | null
          warranty_status: string
        }
        Update: {
          brand?: string
          color?: string
          condition?: string
          created_at?: string | null
          id?: string
          imei?: string
          model?: string
          notes?: string | null
          photo_url?: string | null
          purchase_date?: string
          purchase_price?: number
          purchase_source?: string
          ram?: string
          status?: string
          storage?: string
          supplier_id?: string | null
          warranty_expiry?: string | null
          warranty_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      parties: {
        Row: {
          city: string | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          type: string
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          type: string
        }
        Update: {
          city?: string | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      returns: {
        Row: {
          amount_refunded: number | null
          created_at: string | null
          id: string
          imei: string
          party_id: string | null
          return_date: string
          return_reason: string
          return_type: string
          status: string
        }
        Insert: {
          amount_refunded?: number | null
          created_at?: string | null
          id?: string
          imei: string
          party_id?: string | null
          return_date?: string
          return_reason: string
          return_type: string
          status?: string
        }
        Update: {
          amount_refunded?: number | null
          created_at?: string | null
          id?: string
          imei?: string
          party_id?: string | null
          return_date?: string
          return_reason?: string
          return_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "returns_imei_fkey"
            columns: ["imei"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["imei"]
          },
          {
            foreignKeyName: "returns_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          imei: string
          notes: string | null
          payment_mode: string
          sale_date: string
          selling_price: number
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          imei: string
          notes?: string | null
          payment_mode: string
          sale_date?: string
          selling_price: number
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          imei?: string
          notes?: string | null
          payment_mode?: string
          sale_date?: string
          selling_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_imei_fkey"
            columns: ["imei"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["imei"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          imei: string | null
          notes: string | null
          party_id: string | null
          txn_date: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          imei?: string | null
          notes?: string | null
          party_id?: string | null
          txn_date?: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          imei?: string | null
          notes?: string | null
          party_id?: string | null
          txn_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_imei_fkey"
            columns: ["imei"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["imei"]
          },
          {
            foreignKeyName: "transactions_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          approved: boolean
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          approved?: boolean
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          approved?: boolean
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member"],
    },
  },
} as const
