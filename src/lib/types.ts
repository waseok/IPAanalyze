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
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
