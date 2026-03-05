// Generated schema contract for Supabase queries.
// Keep this in sync with supabase/migrations.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      org_members: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          role: "owner" | "admin" | "member" | "viewer";
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member" | "viewer";
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member" | "viewer";
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          slug: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          name: string;
          slug: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      api_keys: {
        Row: {
          id: string;
          project_id: string;
          label: string;
          key_hash: string;
          last_used_at: string | null;
          revoked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          label?: string;
          key_hash: string;
          last_used_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          label?: string;
          key_hash?: string;
          last_used_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      model_pricing: {
        Row: {
          id: string;
          provider: string;
          model_name: string;
          prompt_price_per_1k: number;
          completion_price_per_1k: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          provider: string;
          model_name: string;
          prompt_price_per_1k: number;
          completion_price_per_1k: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          model_name?: string;
          prompt_price_per_1k?: number;
          completion_price_per_1k?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      recurring_subscriptions: {
        Row: {
          id: string;
          org_id: string;
          project_id: string | null;
          provider: string;
          monthly_cost: number;
          scope: "organization" | "project";
          covers_metered_usage: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          project_id?: string | null;
          provider: string;
          monthly_cost: number;
          scope: "organization" | "project";
          covers_metered_usage?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          project_id?: string | null;
          provider?: string;
          monthly_cost?: number;
          scope?: "organization" | "project";
          covers_metered_usage?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactional_events: {
        Row: {
          id: string;
          project_id: string;
          timestamp: string;
          event_type: "llm" | "api";
          provider: string;
          model_or_endpoint: string;
          cost_incurred: number;
          tokens_prompt: number;
          tokens_completion: number;
          billing_mode: "metered" | "subscription_covered";
          is_unmapped: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          timestamp?: string;
          event_type: "llm" | "api";
          provider: string;
          model_or_endpoint: string;
          cost_incurred?: number;
          tokens_prompt?: number;
          tokens_completion?: number;
          billing_mode?: "metered" | "subscription_covered";
          is_unmapped?: boolean;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          timestamp?: string;
          event_type?: "llm" | "api";
          provider?: string;
          model_or_endpoint?: string;
          cost_incurred?: number;
          tokens_prompt?: number;
          tokens_completion?: number;
          billing_mode?: "metered" | "subscription_covered";
          is_unmapped?: boolean;
          metadata?: Json;
          created_at?: string;
        };
      };
      discovered_resources: {
        Row: {
          id: string;
          project_id: string;
          resource_type: string;
          provider: string;
          status: "active" | "inactive" | "pending" | "error";
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          resource_type: string;
          provider: string;
          status?: "active" | "inactive" | "pending" | "error";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          resource_type?: string;
          provider?: string;
          status?: "active" | "inactive" | "pending" | "error";
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_usage_rollups: {
        Row: {
          project_id: string;
          date: string;
          provider: string;
          model_or_endpoint: string;
          event_type: "llm" | "api";
          total_cost: number;
          total_tokens_prompt: number;
          total_tokens_completion: number;
          event_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          project_id: string;
          date: string;
          provider: string;
          model_or_endpoint: string;
          event_type: "llm" | "api";
          total_cost?: number;
          total_tokens_prompt?: number;
          total_tokens_completion?: number;
          event_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          project_id?: string;
          date?: string;
          provider?: string;
          model_or_endpoint?: string;
          event_type?: "llm" | "api";
          total_cost?: number;
          total_tokens_prompt?: number;
          total_tokens_completion?: number;
          event_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      ingest_request_log: {
        Row: {
          id: string;
          api_key_id: string;
          project_id: string;
          org_id: string;
          request_id: string;
          payload_count: number;
          payload_checksum: string;
          received_at: string;
        };
        Insert: {
          id?: string;
          api_key_id: string;
          project_id: string;
          org_id: string;
          request_id: string;
          payload_count: number;
          payload_checksum: string;
          received_at?: string;
        };
        Update: {
          id?: string;
          api_key_id?: string;
          project_id?: string;
          org_id?: string;
          request_id?: string;
          payload_count?: number;
          payload_checksum?: string;
          received_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_project_tco: {
        Args: {
          p_project_id: string;
          p_start: string;
          p_end: string;
        };
        Returns: number;
      };
      backfill_unmapped_costs: {
        Args: Record<string, never>;
        Returns: number;
      };
      rollup_old_data: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
