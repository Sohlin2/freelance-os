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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          key_prefix: string
          name: string | null
          revoked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          key_prefix: string
          name?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          key_prefix?: string
          name?: string | null
          revoked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          archived_at: string | null
          billing_rate: number | null
          company: string | null
          created_at: string
          currency: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          billing_rate?: number | null
          company?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          billing_rate?: number | null
          company?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          archived_at: string | null
          client_id: string
          content: string
          created_at: string
          id: string
          project_id: string | null
          sent_at: string | null
          subject: string
          type: Database["public"]["Enums"]["follow_up_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          client_id: string
          content: string
          created_at?: string
          id?: string
          project_id?: string | null
          sent_at?: string | null
          subject: string
          type?: Database["public"]["Enums"]["follow_up_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          project_id?: string | null
          sent_at?: string | null
          subject?: string
          type?: Database["public"]["Enums"]["follow_up_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          archived_at: string | null
          client_id: string
          created_at: string
          currency: string
          due_date: string | null
          id: string
          invoice_number: string
          issued_at: string | null
          line_items: Json
          notes: string | null
          paid_at: string | null
          project_id: string
          proposal_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number
          tax_rate: number | null
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          client_id: string
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          issued_at?: string | null
          line_items?: Json
          notes?: string | null
          paid_at?: string | null
          project_id: string
          proposal_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          client_id?: string
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          line_items?: Json
          notes?: string | null
          paid_at?: string | null
          project_id?: string
          proposal_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          archived_at: string | null
          budget: number | null
          client_id: string
          created_at: string
          currency: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          budget?: number | null
          client_id: string
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          budget?: number | null
          client_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          amount: number | null
          archived_at: string | null
          client_id: string
          content: string | null
          created_at: string
          currency: string
          id: string
          project_id: string
          responded_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          title: string
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          amount?: number | null
          archived_at?: string | null
          client_id: string
          content?: string | null
          created_at?: string
          currency?: string
          id?: string
          project_id: string
          responded_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          title: string
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          amount?: number | null
          archived_at?: string | null
          client_id?: string
          content?: string | null
          created_at?: string
          currency?: string
          id?: string
          project_id?: string
          responded_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          title?: string
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scope_changes: {
        Row: {
          archived_at: string | null
          classification: Database["public"]["Enums"]["scope_change_classification"]
          created_at: string
          description: string
          id: string
          impact: string | null
          project_id: string
          requested_at: string
          resolved_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          classification?: Database["public"]["Enums"]["scope_change_classification"]
          created_at?: string
          description: string
          id?: string
          impact?: string | null
          project_id: string
          requested_at?: string
          resolved_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          classification?: Database["public"]["Enums"]["scope_change_classification"]
          created_at?: string
          description?: string
          id?: string
          impact?: string | null
          project_id?: string
          requested_at?: string
          resolved_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scope_changes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      scope_definitions: {
        Row: {
          archived_at: string | null
          assumptions: string | null
          boundaries: string | null
          created_at: string
          deliverables: string
          exclusions: string | null
          id: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          assumptions?: string | null
          boundaries?: string | null
          created_at?: string
          deliverables: string
          exclusions?: string | null
          id?: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          assumptions?: string | null
          boundaries?: string | null
          created_at?: string
          deliverables?: string
          exclusions?: string | null
          id?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scope_definitions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          archived_at: string | null
          billable: boolean
          created_at: string
          description: string
          duration_minutes: number
          entry_date: string
          id: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          billable?: boolean
          created_at?: string
          description: string
          duration_minutes: number
          entry_date?: string
          id?: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          billable?: boolean
          created_at?: string
          description?: string
          duration_minutes?: number
          entry_date?: string
          id?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_app_user_id: { Args: never; Returns: string }
      validate_api_key: { Args: { p_key: string }; Returns: string }
    }
    Enums: {
      follow_up_type:
        | "proposal_follow_up"
        | "invoice_overdue"
        | "check_in"
        | "awaiting_response"
        | "other"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "void"
      project_status: "active" | "paused" | "completed"
      proposal_status: "draft" | "sent" | "accepted" | "declined" | "expired"
      scope_change_classification: "in_scope" | "out_of_scope" | "needs_review"
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
      follow_up_type: [
        "proposal_follow_up",
        "invoice_overdue",
        "check_in",
        "awaiting_response",
        "other",
      ],
      invoice_status: ["draft", "sent", "paid", "overdue", "void"],
      project_status: ["active", "paused", "completed"],
      proposal_status: ["draft", "sent", "accepted", "declined", "expired"],
      scope_change_classification: ["in_scope", "out_of_scope", "needs_review"],
    },
  },
} as const
