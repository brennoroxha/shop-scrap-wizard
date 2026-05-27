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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      blocked_ips: {
        Row: {
          created_at: string
          id: string
          ip: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ip: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ip?: string
          reason?: string | null
        }
        Relationships: []
      }
      custom_products: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string | null
          discount: number | null
          id: string
          image: string
          images: Json
          installment: string | null
          name: string
          original_price: number | null
          price: number
          updated_at: string
          variant_prices: Json | null
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          description?: string | null
          discount?: number | null
          id: string
          image: string
          images?: Json
          installment?: string | null
          name: string
          original_price?: number | null
          price: number
          updated_at?: string
          variant_prices?: Json | null
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          discount?: number | null
          id?: string
          image?: string
          images?: Json
          installment?: string | null
          name?: string
          original_price?: number | null
          price?: number
          updated_at?: string
          variant_prices?: Json | null
        }
        Relationships: []
      }
      logo_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_cents: number
          created_at: string
          customer_document: string | null
          customer_email: string | null
          customer_ip: string | null
          customer_name: string | null
          customer_phone: string | null
          gateway: string
          id: string
          items: Json
          paid_at: string | null
          pix_copy_paste: string | null
          proof_url: string | null
          shipping: Json | null
          status: string
          track7_sent_at: string | null
          tracking_parameters: Json | null
          transaction_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_ip?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          gateway?: string
          id?: string
          items?: Json
          paid_at?: string | null
          pix_copy_paste?: string | null
          proof_url?: string | null
          shipping?: Json | null
          status?: string
          track7_sent_at?: string | null
          tracking_parameters?: Json | null
          transaction_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_ip?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          gateway?: string
          id?: string
          items?: Json
          paid_at?: string | null
          pix_copy_paste?: string | null
          proof_url?: string | null
          shipping?: Json | null
          status?: string
          track7_sent_at?: string | null
          tracking_parameters?: Json | null
          transaction_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_overrides: {
        Row: {
          active: boolean
          created_at: string
          discount: number | null
          hidden_variants: string[]
          installment: string | null
          name: string | null
          original_price: number | null
          price: number | null
          product_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          discount?: number | null
          hidden_variants?: string[]
          installment?: string | null
          name?: string | null
          original_price?: number | null
          price?: number | null
          product_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          discount?: number | null
          hidden_variants?: string[]
          installment?: string | null
          name?: string | null
          original_price?: number | null
          price?: number | null
          product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      variant_price_overrides: {
        Row: {
          created_at: string
          id: string
          original_price: number | null
          price: number
          product_id: string
          updated_at: string
          variant_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_price?: number | null
          price: number
          product_id: string
          updated_at?: string
          variant_key: string
        }
        Update: {
          created_at?: string
          id?: string
          original_price?: number | null
          price?: number
          product_id?: string
          updated_at?: string
          variant_key?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      attach_payment_proof: {
        Args: { _proof_url: string; _transaction_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
