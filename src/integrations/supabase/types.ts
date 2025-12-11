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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_invites: {
        Row: {
          activity_data: Json | null
          activity_name: string
          activity_type: string
          counter_count: number
          counter_message: string | null
          counter_time: string | null
          created_at: string
          id: string
          message: string | null
          proposed_time: string
          receiver_id: string
          sender_id: string
          status: Database["public"]["Enums"]["invite_status"]
          updated_at: string
        }
        Insert: {
          activity_data?: Json | null
          activity_name: string
          activity_type: string
          counter_count?: number
          counter_message?: string | null
          counter_time?: string | null
          created_at?: string
          id?: string
          message?: string | null
          proposed_time: string
          receiver_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["invite_status"]
          updated_at?: string
        }
        Update: {
          activity_data?: Json | null
          activity_name?: string
          activity_type?: string
          counter_count?: number
          counter_message?: string | null
          counter_time?: string | null
          created_at?: string
          id?: string
          message?: string | null
          proposed_time?: string
          receiver_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["invite_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_invites_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "activity_invites_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_action_scores: {
        Row: {
          chat_interactions: number
          created_at: string
          daily_score: number
          id: string
          recommendations_tried: number
          score_date: string
          social_engagement: number
          streak_bonus: number
          tasks_completed: number
          tasks_total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_interactions?: number
          created_at?: string
          daily_score?: number
          id?: string
          recommendations_tried?: number
          score_date?: string
          social_engagement?: number
          streak_bonus?: number
          tasks_completed?: number
          tasks_total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_interactions?: number
          created_at?: string
          daily_score?: number
          id?: string
          recommendations_tried?: number
          score_date?: string
          social_engagement?: number
          streak_bonus?: number
          tasks_completed?: number
          tasks_total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          email_type: string
          error_message: string | null
          id: string
          sent_at: string
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          email_type: string
          error_message?: string | null
          id?: string
          sent_at?: string
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          email_type?: string
          error_message?: string | null
          id?: string
          sent_at?: string
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      email_preferences: {
        Row: {
          created_at: string
          daily_digest: boolean
          event_reminders: boolean
          id: string
          marketing_emails: boolean
          task_reminders: boolean
          updated_at: string
          user_id: string
          welcome_email: boolean
        }
        Insert: {
          created_at?: string
          daily_digest?: boolean
          event_reminders?: boolean
          id?: string
          marketing_emails?: boolean
          task_reminders?: boolean
          updated_at?: string
          user_id: string
          welcome_email?: boolean
        }
        Update: {
          created_at?: string
          daily_digest?: boolean
          event_reminders?: boolean
          id?: string
          marketing_emails?: boolean
          task_reminders?: boolean
          updated_at?: string
          user_id?: string
          welcome_email?: boolean
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: Database["public"]["Enums"]["friend_request_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: Database["public"]["Enums"]["friend_request_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: Database["public"]["Enums"]["friend_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friend_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      preferences: {
        Row: {
          ai_formality_level: number | null
          ai_humor_level: number | null
          ai_name: string | null
          ai_personality: string | null
          created_at: string
          dietary_preferences: string[] | null
          enabled_modules: string[] | null
          id: string
          interests: string[] | null
          temperature_unit: string | null
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_formality_level?: number | null
          ai_humor_level?: number | null
          ai_name?: string | null
          ai_personality?: string | null
          created_at?: string
          dietary_preferences?: string[] | null
          enabled_modules?: string[] | null
          id?: string
          interests?: string[] | null
          temperature_unit?: string | null
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_formality_level?: number | null
          ai_humor_level?: number | null
          ai_name?: string | null
          ai_personality?: string | null
          created_at?: string
          dietary_preferences?: string[] | null
          enabled_modules?: string[] | null
          id?: string
          interests?: string[] | null
          temperature_unit?: string | null
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_range: string | null
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          current_streak: number
          email: string | null
          full_name: string | null
          household_type: string | null
          id: string
          interests_public: boolean | null
          last_active_date: string | null
          longest_streak: number
          onboarding_completed: boolean | null
          profile_public: boolean | null
          state: string | null
          timezone: string | null
          updated_at: string
          user_id: string
          username: string | null
          verified: boolean | null
          zip_code: string | null
        }
        Insert: {
          age_range?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_streak?: number
          email?: string | null
          full_name?: string | null
          household_type?: string | null
          id?: string
          interests_public?: boolean | null
          last_active_date?: string | null
          longest_streak?: number
          onboarding_completed?: boolean | null
          profile_public?: boolean | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          verified?: boolean | null
          zip_code?: string | null
        }
        Update: {
          age_range?: string | null
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          current_streak?: number
          email?: string | null
          full_name?: string | null
          household_type?: string | null
          id?: string
          interests_public?: boolean | null
          last_active_date?: string | null
          longest_streak?: number
          onboarding_completed?: boolean | null
          profile_public?: boolean | null
          state?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          verified?: boolean | null
          zip_code?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean
          created_at: string
          due_date: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          due_date?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          due_date?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      weekly_leaderboards: {
        Row: {
          created_at: string
          id: string
          rank: number | null
          recommendations_tried: number
          social_engagement: number
          streak_days: number
          tasks_completed: number
          total_score: number
          updated_at: string
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          rank?: number | null
          recommendations_tried?: number
          social_engagement?: number
          streak_days?: number
          tasks_completed?: number
          total_score?: number
          updated_at?: string
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          rank?: number | null
          recommendations_tried?: number
          social_engagement?: number
          streak_days?: number
          tasks_completed?: number
          total_score?: number
          updated_at?: string
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_leaderboards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_friends: {
        Args: { _friend_id: string; _user_id: string }
        Returns: boolean
      }
      create_friendship: {
        Args: { _friend_id: string; _user_id: string }
        Returns: undefined
      }
      get_friends_leaderboard: {
        Args: { _user_id: string; _week_start: string }
        Returns: {
          avatar_url: string
          full_name: string
          rank: number
          total_score: number
          user_id: string
          username: string
        }[]
      }
      get_pending_request_count: { Args: { _user_id: string }; Returns: number }
      get_safe_public_profile: {
        Args: { profile_user_id: string }
        Returns: {
          avatar_url: string
          city: string
          full_name: string
          interests_public: boolean
          state: string
          user_id: string
          username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_public_profiles: {
        Args: { search_query: string }
        Returns: {
          avatar_url: string
          full_name: string
          user_id: string
          username: string
          verified: boolean
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      friend_request_status: "pending" | "accepted" | "declined"
      invite_status: "pending" | "accepted" | "declined" | "countered"
      notification_type:
        | "welcome"
        | "daily_digest"
        | "event_reminder"
        | "task_reminder"
        | "weather_alert"
        | "new_recommendation"
        | "system"
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
      app_role: ["admin", "moderator", "user"],
      friend_request_status: ["pending", "accepted", "declined"],
      invite_status: ["pending", "accepted", "declined", "countered"],
      notification_type: [
        "welcome",
        "daily_digest",
        "event_reminder",
        "task_reminder",
        "weather_alert",
        "new_recommendation",
        "system",
      ],
    },
  },
} as const
