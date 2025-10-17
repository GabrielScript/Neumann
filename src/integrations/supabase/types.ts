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
      challenge_diary_entries: {
        Row: {
          action_1: string | null
          action_2: string | null
          action_3: string | null
          action_4: string | null
          action_5: string | null
          action_6: string | null
          actions_belief_arguments: string | null
          actions_belief_score: number | null
          challenge_id: string
          change_past: string | null
          created_at: string | null
          date: string
          day_number: number
          forgiveness_completed: boolean | null
          gratitude_1: string | null
          gratitude_2: string | null
          gratitude_3: string | null
          id: string
          learnings: string | null
          reason_to_live: string | null
          updated_at: string | null
          user_id: string
          world_contribution: string | null
        }
        Insert: {
          action_1?: string | null
          action_2?: string | null
          action_3?: string | null
          action_4?: string | null
          action_5?: string | null
          action_6?: string | null
          actions_belief_arguments?: string | null
          actions_belief_score?: number | null
          challenge_id: string
          change_past?: string | null
          created_at?: string | null
          date?: string
          day_number: number
          forgiveness_completed?: boolean | null
          gratitude_1?: string | null
          gratitude_2?: string | null
          gratitude_3?: string | null
          id?: string
          learnings?: string | null
          reason_to_live?: string | null
          updated_at?: string | null
          user_id: string
          world_contribution?: string | null
        }
        Update: {
          action_1?: string | null
          action_2?: string | null
          action_3?: string | null
          action_4?: string | null
          action_5?: string | null
          action_6?: string | null
          actions_belief_arguments?: string | null
          actions_belief_score?: number | null
          challenge_id?: string
          change_past?: string | null
          created_at?: string | null
          date?: string
          day_number?: number
          forgiveness_completed?: boolean | null
          gratitude_1?: string | null
          gratitude_2?: string | null
          gratitude_3?: string | null
          id?: string
          learnings?: string | null
          reason_to_live?: string | null
          updated_at?: string | null
          user_id?: string
          world_contribution?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_diary_entries_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_items: {
        Row: {
          alignment_score: number | null
          challenge_id: string | null
          created_at: string
          description: string | null
          difficulty: number | null
          facilitators: string | null
          happiness_level: number | null
          id: string
          position: number
          priority: Database["public"]["Enums"]["priority_level"]
          reminder_time: string | null
          template_id: string | null
          title: string
        }
        Insert: {
          alignment_score?: number | null
          challenge_id?: string | null
          created_at?: string
          description?: string | null
          difficulty?: number | null
          facilitators?: string | null
          happiness_level?: number | null
          id?: string
          position?: number
          priority?: Database["public"]["Enums"]["priority_level"]
          reminder_time?: string | null
          template_id?: string | null
          title: string
        }
        Update: {
          alignment_score?: number | null
          challenge_id?: string | null
          created_at?: string
          description?: string | null
          difficulty?: number | null
          facilitators?: string | null
          happiness_level?: number | null
          id?: string
          position?: number
          priority?: Database["public"]["Enums"]["priority_level"]
          reminder_time?: string | null
          template_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_items_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "challenge_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_progress: {
        Row: {
          challenge_id: string
          completed: boolean
          created_at: string
          date: string
          id: string
          item_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          created_at?: string
          date?: string
          id?: string
          item_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          created_at?: string
          date?: string
          id?: string
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_progress_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "challenge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_days: number
          id: string
          is_default: boolean
          is_public: boolean
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_days: number
          id?: string
          is_default?: boolean
          is_public?: boolean
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_days?: number
          id?: string
          is_default?: boolean
          is_public?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          alignment_score: number | null
          completed_at: string | null
          completed_days: number
          created_at: string
          difficulty: number | null
          duration_days: number
          end_date: string
          id: string
          is_active: boolean
          name: string
          start_date: string
          template_id: string | null
          user_id: string
        }
        Insert: {
          alignment_score?: number | null
          completed_at?: string | null
          completed_days?: number
          created_at?: string
          difficulty?: number | null
          duration_days: number
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          start_date?: string
          template_id?: string | null
          user_id: string
        }
        Update: {
          alignment_score?: number | null
          completed_at?: string | null
          completed_days?: number
          created_at?: string
          difficulty?: number | null
          duration_days?: number
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "challenge_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          is_public: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_challenges: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          community_id: string | null
          created_at: string
          created_by: string
          id: string
          is_global: boolean
          status: string
          template_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          community_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_global?: boolean
          status?: string
          template_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          community_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_global?: boolean
          status?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_challenges_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_challenges_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "challenge_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      community_chat_messages: {
        Row: {
          community_id: string
          created_at: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_chat_messages_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_join_requests: {
        Row: {
          community_id: string
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          community_id: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          community_id?: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_join_requests_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["community_role"]
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["community_role"]
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["community_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_medals: {
        Row: {
          challenges_completed: number
          created_at: string
          date: string
          id: string
          medal_type: string
          total_challenges: number
          user_id: string
        }
        Insert: {
          challenges_completed?: number
          created_at?: string
          date?: string
          id?: string
          medal_type: string
          total_challenges?: number
          user_id: string
        }
        Update: {
          challenges_completed?: number
          created_at?: string
          date?: string
          id?: string
          medal_type?: string
          total_challenges?: number
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          community_id: string | null
          created_at: string
          id: string
          message: string
          read: boolean
          receiver_id: string
          sender_id: string
        }
        Insert: {
          community_id?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean
          receiver_id: string
          sender_id: string
        }
        Update: {
          community_id?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      feedback_log: {
        Row: {
          created_at: string | null
          id: string
          message: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      gratitude_diary_entries: {
        Row: {
          challenge_id: string
          created_at: string | null
          date: string
          day_number: number
          gratitude_1: string | null
          gratitude_2: string | null
          gratitude_3: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string | null
          date?: string
          day_number: number
          gratitude_1?: string | null
          gratitude_2?: string | null
          gratitude_3?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string | null
          date?: string
          day_number?: number
          gratitude_1?: string | null
          gratitude_2?: string | null
          gratitude_3?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gratitude_diary_entries_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      life_goals: {
        Row: {
          action_plan: string | null
          completed_at: string | null
          created_at: string
          deadline: string | null
          happiness_level: number | null
          id: string
          is_completed: boolean
          motivation: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_plan?: string | null
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          happiness_level?: number | null
          id?: string
          is_completed?: boolean
          motivation?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_plan?: string | null
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          happiness_level?: number | null
          id?: string
          is_completed?: boolean
          motivation?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limit_log: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          status: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          status: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          status?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          community_id: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          community_id?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          community_id?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          best_streak: number
          challenges_completed: number
          created_at: string
          current_streak: number
          daily_medals_bronze: number | null
          daily_medals_gold: number | null
          daily_medals_silver: number | null
          id: string
          last_activity_date: string | null
          level: number
          life_goal_trophies: number | null
          tree_stage: string
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          best_streak?: number
          challenges_completed?: number
          created_at?: string
          current_streak?: number
          daily_medals_bronze?: number | null
          daily_medals_gold?: number | null
          daily_medals_silver?: number | null
          id?: string
          last_activity_date?: string | null
          level?: number
          life_goal_trophies?: number | null
          tree_stage?: string
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          best_streak?: number
          challenges_completed?: number
          created_at?: string
          current_streak?: number
          daily_medals_bronze?: number | null
          daily_medals_gold?: number | null
          daily_medals_silver?: number | null
          id?: string
          last_activity_date?: string | null
          level?: number
          life_goal_trophies?: number | null
          tree_stage?: string
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          started_at: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      xp_audit_log: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          metadata: Json | null
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_xp: {
        Args: {
          _amount: number
          _caller_function?: string
          _metadata?: Json
          _reason: string
          _user_id: string
        }
        Returns: undefined
      }
      can_create_community: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_community_leader_limit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_community_member_limit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_daily_challenge_limit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_leader_limit: {
        Args: { p_community_id: string }
        Returns: boolean
      }
      check_level_limit: {
        Args: { p_new_level: number; p_user_id: string }
        Returns: boolean
      }
      check_monthly_goal_limit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          _endpoint: string
          _ip_address: string
          _max_requests: number
          _user_id: string
          _window_minutes: number
        }
        Returns: boolean
      }
      cleanup_rate_limit_logs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_community_role: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: Database["public"]["Enums"]["community_role"]
      }
      get_xp_multiplier: {
        Args: { _user_id: string }
        Returns: number
      }
      has_community_role: {
        Args: {
          _community_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_plus_subscription: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      is_community_member: {
        Args: { p_community_id: string; p_user_id: string }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          _action: string
          _ip_address: string
          _metadata: Json
          _resource_id: string
          _resource_type: string
          _status: string
          _user_agent: string
          _user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "community_admin" | "community_moderator" | "community_member"
      community_role: "challenger_leader" | "champion" | "novice"
      priority_level: "imprescindivel" | "importante" | "acessorio"
      subscription_tier: "free" | "plus_monthly" | "plus_annual"
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
      app_role: ["community_admin", "community_moderator", "community_member"],
      community_role: ["challenger_leader", "champion", "novice"],
      priority_level: ["imprescindivel", "importante", "acessorio"],
      subscription_tier: ["free", "plus_monthly", "plus_annual"],
    },
  },
} as const
