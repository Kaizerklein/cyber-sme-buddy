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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          category: string
          content: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          duration_minutes: number | null
          id: string
          is_published: boolean | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category: string
          content?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          id?: string
          is_published?: boolean | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          achievement_alerts: boolean
          course_reminders: boolean
          created_at: string
          email_notifications: boolean
          id: string
          security_alerts: boolean
          updated_at: string
          user_id: string
          weekly_digest: boolean
        }
        Insert: {
          achievement_alerts?: boolean
          course_reminders?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: string
          security_alerts?: boolean
          updated_at?: string
          user_id: string
          weekly_digest?: boolean
        }
        Update: {
          achievement_alerts?: boolean
          course_reminders?: boolean
          created_at?: string
          email_notifications?: boolean
          id?: string
          security_alerts?: boolean
          updated_at?: string
          user_id?: string
          weekly_digest?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      phishing_photo_results: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          photo_test_id: string | null
          question_number: number
          session_id: string | null
          time_taken_seconds: number | null
          user_answer: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          photo_test_id?: string | null
          question_number: number
          session_id?: string | null
          time_taken_seconds?: number | null
          user_answer: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          photo_test_id?: string | null
          question_number?: number
          session_id?: string | null
          time_taken_seconds?: number | null
          user_answer?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phishing_photo_results_photo_test_id_fkey"
            columns: ["photo_test_id"]
            isOneToOne: false
            referencedRelation: "phishing_photo_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phishing_photo_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "phishing_test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      phishing_photo_tests: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          explanation: string | null
          id: string
          image_url: string
          is_phishing: boolean
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          explanation?: string | null
          id?: string
          image_url: string
          is_phishing: boolean
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          explanation?: string | null
          id?: string
          image_url?: string
          is_phishing?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      phishing_results: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          simulation_id: string
          time_taken_seconds: number | null
          user_answer: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          simulation_id: string
          time_taken_seconds?: number | null
          user_answer: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          simulation_id?: string
          time_taken_seconds?: number | null
          user_answer?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phishing_results_simulation_id_fkey"
            columns: ["simulation_id"]
            isOneToOne: false
            referencedRelation: "phishing_simulations"
            referencedColumns: ["id"]
          },
        ]
      }
      phishing_simulations: {
        Row: {
          created_at: string
          description: string | null
          difficulty_level: string | null
          email_content: string
          explanation: string | null
          id: string
          is_phishing: boolean
          sender_email: string
          sender_name: string
          subject: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          email_content: string
          explanation?: string | null
          id?: string
          is_phishing: boolean
          sender_email: string
          sender_name: string
          subject: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          email_content?: string
          explanation?: string | null
          id?: string
          is_phishing?: boolean
          sender_email?: string
          sender_name?: string
          subject?: string
          title?: string
        }
        Relationships: []
      }
      phishing_test_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          current_question: number
          id: string
          is_completed: boolean
          questions_data: Json
          score: number
          session_type: string
          started_at: string
          time_limit_minutes: number | null
          total_questions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_question?: number
          id?: string
          is_completed?: boolean
          questions_data?: Json
          score?: number
          session_type?: string
          started_at?: string
          time_limit_minutes?: number | null
          total_questions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_question?: number
          id?: string
          is_completed?: boolean
          questions_data?: Json
          score?: number
          session_type?: string
          started_at?: string
          time_limit_minutes?: number | null
          total_questions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          progress_percentage: number | null
          started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          progress_percentage?: number | null
          started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          progress_percentage?: number | null
          started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin_user: {
        Args: { user_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
