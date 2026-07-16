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
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          project_type: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          project_type?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          project_type?: string | null
        }
        Relationships: []
      }
      drum_instruments: {
        Row: {
          category: string
          color: string
          created_at: string
          default_decay: number
          default_pitch: number
          default_velocity: number
          id: string
          instrument_id: string
          name: string
          short_name: string
        }
        Insert: {
          category: string
          color: string
          created_at?: string
          default_decay?: number
          default_pitch?: number
          default_velocity?: number
          id?: string
          instrument_id: string
          name: string
          short_name: string
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          default_decay?: number
          default_pitch?: number
          default_velocity?: number
          id?: string
          instrument_id?: string
          name?: string
          short_name?: string
        }
        Relationships: []
      }
      drum_presets: {
        Row: {
          artists: string[] | null
          bpm: number
          category: string
          clave_pattern: string | null
          complexity: string
          country: string
          country_code: string
          created_at: string
          cultural_description: string | null
          description: string
          id: string
          instrument_roles: Json | null
          konnakol: boolean | null
          name: string
          pulse_grouping: number[]
          region: string
          rhythm_type: string | null
          subdivision_type: string | null
          swing: number
          tala_structure: Json | null
          tempo_range: number[]
          time_feel: string
          time_signature: number[]
          tracks: Json
          variation_tracks: Json | null
        }
        Insert: {
          artists?: string[] | null
          bpm?: number
          category: string
          clave_pattern?: string | null
          complexity?: string
          country: string
          country_code: string
          created_at?: string
          cultural_description?: string | null
          description?: string
          id?: string
          instrument_roles?: Json | null
          konnakol?: boolean | null
          name: string
          pulse_grouping?: number[]
          region: string
          rhythm_type?: string | null
          subdivision_type?: string | null
          swing?: number
          tala_structure?: Json | null
          tempo_range?: number[]
          time_feel?: string
          time_signature?: number[]
          tracks?: Json
          variation_tracks?: Json | null
        }
        Update: {
          artists?: string[] | null
          bpm?: number
          category?: string
          clave_pattern?: string | null
          complexity?: string
          country?: string
          country_code?: string
          created_at?: string
          cultural_description?: string | null
          description?: string
          id?: string
          instrument_roles?: Json | null
          konnakol?: boolean | null
          name?: string
          pulse_grouping?: number[]
          region?: string
          rhythm_type?: string | null
          subdivision_type?: string | null
          swing?: number
          tala_structure?: Json | null
          tempo_range?: number[]
          time_feel?: string
          time_signature?: number[]
          tracks?: Json
          variation_tracks?: Json | null
        }
        Relationships: []
      }
      fretted_instruments: {
        Row: {
          created_at: string
          frets: number | null
          id: string
          key: string
          label: string
          tuning: Json
        }
        Insert: {
          created_at?: string
          frets?: number | null
          id?: string
          key: string
          label: string
          tuning: Json
        }
        Update: {
          created_at?: string
          frets?: number | null
          id?: string
          key?: string
          label?: string
          tuning?: Json
        }
        Relationships: []
      }
      progression_templates: {
        Row: {
          created_at: string
          degrees: number[]
          description: string
          id: string
          label: string
        }
        Insert: {
          created_at?: string
          degrees: number[]
          description?: string
          id?: string
          label: string
        }
        Update: {
          created_at?: string
          degrees?: number[]
          description?: string
          id?: string
          label?: string
        }
        Relationships: []
      }
      scales: {
        Row: {
          category: string
          chords: string[]
          created_at: string
          id: string
          interval_names: string[]
          intervals: number[]
          name: string
        }
        Insert: {
          category: string
          chords?: string[]
          created_at?: string
          id?: string
          interval_names: string[]
          intervals: number[]
          name: string
        }
        Update: {
          category?: string
          chords?: string[]
          created_at?: string
          id?: string
          interval_names?: string[]
          intervals?: number[]
          name?: string
        }
        Relationships: []
      }
      style_presets: {
        Row: {
          chord_tendencies: string
          created_at: string
          description: string
          id: string
          label: string
          preferred_modes: string[]
          rhythm_feel: string
          style_id: string
        }
        Insert: {
          chord_tendencies?: string
          created_at?: string
          description?: string
          id?: string
          label: string
          preferred_modes?: string[]
          rhythm_feel?: string
          style_id: string
        }
        Update: {
          chord_tendencies?: string
          created_at?: string
          description?: string
          id?: string
          label?: string
          preferred_modes?: string[]
          rhythm_feel?: string
          style_id?: string
        }
        Relationships: []
      }
      tuning_presets: {
        Row: {
          created_at: string
          id: string
          instrument_type: string
          label: string
          tuning: Json
        }
        Insert: {
          created_at?: string
          id?: string
          instrument_type: string
          label: string
          tuning: Json
        }
        Update: {
          created_at?: string
          id?: string
          instrument_type?: string
          label?: string
          tuning?: Json
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
