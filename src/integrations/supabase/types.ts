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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bank_detection_patterns: {
        Row: {
          bank_code: Database["public"]["Enums"]["bank_code"]
          created_at: string
          id: string
          pattern_type: string
          pattern_value: string
          priority: number | null
        }
        Insert: {
          bank_code: Database["public"]["Enums"]["bank_code"]
          created_at?: string
          id?: string
          pattern_type: string
          pattern_value: string
          priority?: number | null
        }
        Update: {
          bank_code?: Database["public"]["Enums"]["bank_code"]
          created_at?: string
          id?: string
          pattern_type?: string
          pattern_value?: string
          priority?: number | null
        }
        Relationships: []
      }
      document_uploads: {
        Row: {
          analysis_result: Json | null
          created_at: string
          error_message: string | null
          file_hash: string | null
          file_name: string
          file_path: string
          file_size: number
          id: string
          page_count: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_result?: Json | null
          created_at?: string
          error_message?: string | null
          file_hash?: string | null
          file_name: string
          file_path: string
          file_size: number
          id?: string
          page_count?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_result?: Json | null
          created_at?: string
          error_message?: string | null
          file_hash?: string | null
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          page_count?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_templates: {
        Row: {
          bank_code: Database["public"]["Enums"]["bank_code"]
          company_name: string | null
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          priority: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bank_code?: Database["public"]["Enums"]["bank_code"]
          company_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          priority?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bank_code?: Database["public"]["Enums"]["bank_code"]
          company_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          priority?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      template_calculation_rules: {
        Row: {
          created_at: string
          display_label: string
          display_order: number | null
          id: string
          is_visible: boolean | null
          rule_name: string
          rule_type: string
          source_categories: string[] | null
          source_types: string[] | null
          template_id: string
        }
        Insert: {
          created_at?: string
          display_label: string
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          rule_name: string
          rule_type: string
          source_categories?: string[] | null
          source_types?: string[] | null
          template_id: string
        }
        Update: {
          created_at?: string
          display_label?: string
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          rule_name?: string
          rule_type?: string
          source_categories?: string[] | null
          source_types?: string[] | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_calculation_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      template_sections: {
        Row: {
          config: Json | null
          created_at: string
          display_order: number
          id: string
          is_visible: boolean | null
          section_type: string
          template_id: string
          title: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean | null
          section_type: string
          template_id: string
          title: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          display_order?: number
          id?: string
          is_visible?: boolean | null
          section_type?: string
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_sections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          bank_name: string | null
          category: Database["public"]["Enums"]["transaction_category"]
          created_at: string
          date: string
          description: string
          duplicate_of: string | null
          id: string
          is_duplicate: boolean | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          bank_name?: string | null
          category: Database["public"]["Enums"]["transaction_category"]
          created_at?: string
          date: string
          description: string
          duplicate_of?: string | null
          id?: string
          is_duplicate?: boolean | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          bank_name?: string | null
          category?: Database["public"]["Enums"]["transaction_category"]
          created_at?: string
          date?: string
          description?: string
          duplicate_of?: string | null
          id?: string
          is_duplicate?: boolean | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      bank_code: "itau" | "bradesco" | "bb" | "santander" | "nubank" | "generic"
      transaction_category:
        | "pix"
        | "transferencia"
        | "cartao_debito"
        | "cartao_credito"
        | "taxas"
        | "outros"
      transaction_type: "entrada" | "saida"
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
      bank_code: ["itau", "bradesco", "bb", "santander", "nubank", "generic"],
      transaction_category: [
        "pix",
        "transferencia",
        "cartao_debito",
        "cartao_credito",
        "taxas",
        "outros",
      ],
      transaction_type: ["entrada", "saida"],
    },
  },
} as const
