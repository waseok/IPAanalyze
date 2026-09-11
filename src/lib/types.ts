export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          name: string;
          code: string;
          admin_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          admin_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["schools"]["Insert"]>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          school_id: string;
          title: string;
          position: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          title: string;
          position?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [];
      };
      survey_sessions: {
        Row: {
          id: string;
          school_id: string;
          teacher_label: string | null;
          created_at: string;
          submitted_at: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          teacher_label?: string | null;
          created_at?: string;
          submitted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["survey_sessions"]["Insert"]>;
        Relationships: [];
      };
      responses: {
        Row: {
          id: string;
          school_id: string;
          task_id: string;
          survey_session_id: string;
          importance_score: number;
          performance_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          task_id: string;
          survey_session_id: string;
          importance_score: number;
          performance_score: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["responses"]["Insert"]>;
        Relationships: [];
      };
      survey_campaigns: {
        Row: {
          id: string;
          school_id: string;
          title: string;
          status: "draft" | "open" | "closed" | "archived";
          opens_at: string | null;
          closes_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          title: string;
          status?: "draft" | "open" | "closed" | "archived";
          opens_at?: string | null;
          closes_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["survey_campaigns"]["Insert"]>;
        Relationships: [];
      };
      campaign_tasks: {
        Row: {
          id: string;
          campaign_id: string;
          source_task_id: string | null;
          title: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          source_task_id?: string | null;
          title: string;
          position: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["campaign_tasks"]["Insert"]>;
        Relationships: [];
      };
      participant_tokens: {
        Row: {
          id: string;
          campaign_id: string;
          code_hash: string;
          code_hint: string;
          submitted_at: string | null;
          last_saved_at: string | null;
          revoked_at: string | null;
          legacy_session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          code_hash: string;
          code_hint: string;
          submitted_at?: string | null;
          last_saved_at?: string | null;
          revoked_at?: string | null;
          legacy_session_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["participant_tokens"]["Insert"]>;
        Relationships: [];
      };
      campaign_responses: {
        Row: {
          id: string;
          campaign_id: string;
          participant_token_id: string;
          campaign_task_id: string;
          importance_score: number;
          performance_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          participant_token_id: string;
          campaign_task_id: string;
          importance_score: number;
          performance_score: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["campaign_responses"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      open_survey_campaign: {
        Args: { p_campaign_id: string };
        Returns: undefined;
      };
      save_campaign_response: {
        Args: { p_code_hash: string; p_ratings: Json };
        Returns: string;
      };
      replace_school_tasks: {
        Args: { p_school_id: string; p_titles: Json };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
