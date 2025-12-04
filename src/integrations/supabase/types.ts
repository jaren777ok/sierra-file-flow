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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ad_analysis_conversations: {
        Row: {
          ad_id: string
          conversation_id: string
          conversation_type: string | null
          created_at: string
          id: string
          initial_analysis_sent: boolean | null
          started_at_ms: number | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_id: string
          conversation_id: string
          conversation_type?: string | null
          created_at?: string
          id?: string
          initial_analysis_sent?: boolean | null
          started_at_ms?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_id?: string
          conversation_id?: string
          conversation_type?: string | null
          created_at?: string
          id?: string
          initial_analysis_sent?: boolean | null
          started_at_ms?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ad_analysis_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message: string
          message_type: string | null
          sender_type: string
          webhook_payload: Json | null
          webhook_response: Json | null
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message: string
          message_type?: string | null
          sender_type: string
          webhook_payload?: Json | null
          webhook_response?: Json | null
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          message_type?: string | null
          sender_type?: string
          webhook_payload?: Json | null
          webhook_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_analysis_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ad_analysis_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          message_type: string
          metadata: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          message_type?: string
          metadata?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          message_type?: string
          metadata?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      analisis_conversaciones: {
        Row: {
          analisis_markdown: string | null
          contacto_id: string | null
          conversacion_id: string
          created_at: string
          id: string
          metricas_json: Json | null
          sesion_analisis_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analisis_markdown?: string | null
          contacto_id?: string | null
          conversacion_id: string
          created_at?: string
          id?: string
          metricas_json?: Json | null
          sesion_analisis_id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analisis_markdown?: string | null
          contacto_id?: string | null
          conversacion_id?: string
          created_at?: string
          id?: string
          metricas_json?: Json | null
          sesion_analisis_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analisis_conversaciones_contacto_id_fkey"
            columns: ["contacto_id"]
            isOneToOne: false
            referencedRelation: "contactos_gohighlevel"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_sessions: {
        Row: {
          account_id: string
          created_at: string
          date_start: string
          date_stop: string
          id: string
          page_id: string
          session_name: string
          session_timestamp: number | null
          time_range_days: number
          total_ads: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          date_start: string
          date_stop: string
          id?: string
          page_id: string
          session_name: string
          session_timestamp?: number | null
          time_range_days: number
          total_ads?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          date_start?: string
          date_stop?: string
          id?: string
          page_id?: string
          session_name?: string
          session_timestamp?: number | null
          time_range_days?: number
          total_ads?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blotato_accounts: {
        Row: {
          api_key_encrypted: string
          created_at: string
          facebook_account_id: string | null
          facebook_page_id: string | null
          id: string
          instagram_account_id: string | null
          tiktok_account_id: string | null
          updated_at: string
          user_id: string
          youtube_account_id: string | null
        }
        Insert: {
          api_key_encrypted: string
          created_at?: string
          facebook_account_id?: string | null
          facebook_page_id?: string | null
          id?: string
          instagram_account_id?: string | null
          tiktok_account_id?: string | null
          updated_at?: string
          user_id: string
          youtube_account_id?: string | null
        }
        Update: {
          api_key_encrypted?: string
          created_at?: string
          facebook_account_id?: string | null
          facebook_page_id?: string | null
          id?: string
          instagram_account_id?: string | null
          tiktok_account_id?: string | null
          updated_at?: string
          user_id?: string
          youtube_account_id?: string | null
        }
        Relationships: []
      }
      chats: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_accounts: {
        Row: {
          company_code: string
          company_name: string
          created_at: string
          dress_code_image_url: string | null
          id: string
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_code: string
          company_name: string
          created_at?: string
          dress_code_image_url?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_code?: string
          company_name?: string
          created_at?: string
          dress_code_image_url?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      company_ghl_calendars: {
        Row: {
          calendar_name: string
          color: string | null
          company_id: string
          created_at: string | null
          ghl_calendar_id: string
          id: string
          is_visible: boolean | null
          updated_at: string | null
        }
        Insert: {
          calendar_name: string
          color?: string | null
          company_id: string
          created_at?: string | null
          ghl_calendar_id: string
          id?: string
          is_visible?: boolean | null
          updated_at?: string | null
        }
        Update: {
          calendar_name?: string
          color?: string | null
          company_id?: string
          created_at?: string | null
          ghl_calendar_id?: string
          id?: string
          is_visible?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_ghl_calendars_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      company_metrics: {
        Row: {
          avg_satisfaction: number | null
          company_id: string
          conversion_rate: number | null
          created_at: string
          id: string
          total_revenue: number | null
          total_sales: number | null
          total_sessions: number | null
          updated_at: string
        }
        Insert: {
          avg_satisfaction?: number | null
          company_id: string
          conversion_rate?: number | null
          created_at?: string
          id?: string
          total_revenue?: number | null
          total_sales?: number | null
          total_sessions?: number | null
          updated_at?: string
        }
        Update: {
          avg_satisfaction?: number | null
          company_id?: string
          conversion_rate?: number | null
          created_at?: string
          id?: string
          total_revenue?: number | null
          total_sales?: number | null
          total_sessions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      contactos_gohighlevel: {
        Row: {
          conversacion_id: string
          created_at: string
          id: string
          ID_CONTACTO_GO: string | null
          nombre_contacto: string
          sesion_obtener_id: string | null
          telefono: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conversacion_id: string
          created_at?: string
          id?: string
          ID_CONTACTO_GO?: string | null
          nombre_contacto: string
          sesion_obtener_id?: string | null
          telefono: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conversacion_id?: string
          created_at?: string
          id?: string
          ID_CONTACTO_GO?: string | null
          nombre_contacto?: string
          sesion_obtener_id?: string | null
          telefono?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contactos_gohighlevel_sesion_obtener_id_fkey"
            columns: ["sesion_obtener_id"]
            isOneToOne: false
            referencedRelation: "sesion_obtener_contactos"
            referencedColumns: ["id"]
          },
        ]
      }
      contactos_mensajes: {
        Row: {
          contacto_id: string
          created_at: string
          id: string
          mensajes: Json
          updated_at: string
        }
        Insert: {
          contacto_id: string
          created_at?: string
          id?: string
          mensajes?: Json
          updated_at?: string
        }
        Update: {
          contacto_id?: string
          created_at?: string
          id?: string
          mensajes?: Json
          updated_at?: string
        }
        Relationships: []
      }
      conversations_ghl: {
        Row: {
          content: string
          id: string
          sender: string
          timestamp: string
          user_id: string
        }
        Insert: {
          content: string
          id?: string
          sender: string
          timestamp?: string
          user_id: string
        }
        Update: {
          content?: string
          id?: string
          sender?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      document_embeddings_duplicate: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: number
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string
          created_at: string | null
          document_id: string
          embedding: string | null
          id: number
          metadata: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          document_id: string
          embedding?: string | null
          id?: number
          metadata?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          id?: number
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      generated_videos: {
        Row: {
          config_data: Json | null
          created_at: string
          duration: number | null
          heygen_video_id: string | null
          id: string
          request_id: string | null
          script: string | null
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          config_data?: Json | null
          created_at?: string
          duration?: number | null
          heygen_video_id?: string | null
          id?: string
          request_id?: string | null
          script?: string | null
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          config_data?: Json | null
          created_at?: string
          duration?: number | null
          heygen_video_id?: string | null
          id?: string
          request_id?: string | null
          script?: string | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      ghl_calendars_sync: {
        Row: {
          company_id: string | null
          created_at: string | null
          ghl_calendar_id: string
          ghl_calendar_name: string
          id: string
          last_sync_at: string | null
          sync_status: string | null
          updated_at: string | null
          user_id: string
          zoom_calendar_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          ghl_calendar_id: string
          ghl_calendar_name: string
          id?: string
          last_sync_at?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id: string
          zoom_calendar_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          ghl_calendar_id?: string
          ghl_calendar_name?: string
          id?: string
          last_sync_at?: string | null
          sync_status?: string | null
          updated_at?: string | null
          user_id?: string
          zoom_calendar_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ghl_calendars_sync_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ghl_calendars_sync_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ghl_calendars_sync_zoom_calendar_id_fkey"
            columns: ["zoom_calendar_id"]
            isOneToOne: false
            referencedRelation: "company_calendar_access"
            referencedColumns: ["accessible_calendar_id"]
          },
          {
            foreignKeyName: "ghl_calendars_sync_zoom_calendar_id_fkey"
            columns: ["zoom_calendar_id"]
            isOneToOne: false
            referencedRelation: "user_calendars"
            referencedColumns: ["id"]
          },
        ]
      }
      ghl_credentials: {
        Row: {
          account_id: string
          api_key: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          api_key: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          api_key?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ghl_sessions_sync: {
        Row: {
          created_at: string | null
          ghl_calendar_id: string
          ghl_event_id: string
          id: string
          last_synced_at: string | null
          scheduled_session_id: string | null
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          ghl_calendar_id: string
          ghl_event_id: string
          id?: string
          last_synced_at?: string | null
          scheduled_session_id?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          ghl_calendar_id?: string
          ghl_event_id?: string
          id?: string
          last_synced_at?: string | null
          scheduled_session_id?: string | null
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ghl_sessions_sync_scheduled_session_id_fkey"
            columns: ["scheduled_session_id"]
            isOneToOne: false
            referencedRelation: "scheduled_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ghl_sync_log: {
        Row: {
          calendar_id: string | null
          company_id: string | null
          created_at: string | null
          created_count: number | null
          error_message: string | null
          id: string
          sync_status: string | null
          sync_type: string
          synced_count: number | null
          updated_count: number | null
          user_id: string
        }
        Insert: {
          calendar_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_count?: number | null
          error_message?: string | null
          id?: string
          sync_status?: string | null
          sync_type: string
          synced_count?: number | null
          updated_count?: number | null
          user_id: string
        }
        Update: {
          calendar_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_count?: number | null
          error_message?: string | null
          id?: string
          sync_status?: string | null
          sync_type?: string
          synced_count?: number | null
          updated_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ghl_sync_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ghl_sync_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gohighlevel_config: {
        Row: {
          account_id: string
          api_key: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          api_key: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          api_key?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      heygen_api_keys: {
        Row: {
          api_key_encrypted: string
          api_key_name: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          api_key_name: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          api_key_name?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_documents: {
        Row: {
          document_id: string
          file_size: number
          file_type: string
          filename: string
          id: string
          processed_at: string | null
          upload_status: string
          uploaded_at: string
          user_id: string
          vectorization_status: string
          webhook_response: Json | null
        }
        Insert: {
          document_id: string
          file_size: number
          file_type: string
          filename: string
          id?: string
          processed_at?: string | null
          upload_status?: string
          uploaded_at?: string
          user_id: string
          vectorization_status?: string
          webhook_response?: Json | null
        }
        Update: {
          document_id?: string
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          processed_at?: string | null
          upload_status?: string
          uploaded_at?: string
          user_id?: string
          vectorization_status?: string
          webhook_response?: Json | null
        }
        Relationships: []
      }
      meeting_configurations: {
        Row: {
          company_info: string
          created_at: string
          id: string
          meeting_objective: string
          number_of_people: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_info: string
          created_at?: string
          id?: string
          meeting_objective: string
          number_of_people: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company_info?: string
          created_at?: string
          id?: string
          meeting_objective?: string
          number_of_people?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meeting_sessions: {
        Row: {
          company_info: string
          created_at: string
          id: string
          meeting_objective: string
          number_of_people: number
          session_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_info: string
          created_at?: string
          id?: string
          meeting_objective: string
          number_of_people: number
          session_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_info?: string
          created_at?: string
          id?: string
          meeting_objective?: string
          number_of_people?: number
          session_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          images: string[] | null
          role: string
          timestamp: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          images?: string[] | null
          role: string
          timestamp?: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          images?: string[] | null
          role?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_ads_adsets: {
        Row: {
          account_id: string
          adset_id: string
          adset_name: string
          analysis_session_id: string | null
          avg_cpc: number | null
          avg_ctr: number | null
          campaign_id: string
          campaign_supabase_id: string | null
          created_at: string
          id: string
          page_id: string | null
          total_ads: number | null
          total_clicks: number | null
          total_impressions: number | null
          total_spend: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          adset_id: string
          adset_name: string
          analysis_session_id?: string | null
          avg_cpc?: number | null
          avg_ctr?: number | null
          campaign_id: string
          campaign_supabase_id?: string | null
          created_at?: string
          id?: string
          page_id?: string | null
          total_ads?: number | null
          total_clicks?: number | null
          total_impressions?: number | null
          total_spend?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          adset_id?: string
          adset_name?: string
          analysis_session_id?: string | null
          avg_cpc?: number | null
          avg_ctr?: number | null
          campaign_id?: string
          campaign_supabase_id?: string | null
          created_at?: string
          id?: string
          page_id?: string | null
          total_ads?: number | null
          total_clicks?: number | null
          total_impressions?: number | null
          total_spend?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_adsets_analysis_session"
            columns: ["analysis_session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_ads_adsets_campaign_supabase_id_fkey"
            columns: ["campaign_supabase_id"]
            isOneToOne: false
            referencedRelation: "meta_ads_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_ads_campaigns: {
        Row: {
          account_id: string
          analysis_session_id: string | null
          avg_cpc: number | null
          avg_ctr: number | null
          campaign_id: string
          campaign_name: string
          color_tag: string | null
          created_at: string
          funnel_position: number | null
          id: string
          page_id: string | null
          pipeline_stage_id: string | null
          total_ads: number
          total_clicks: number | null
          total_impressions: number | null
          total_spend: number | null
          updated_at: string
          user_id: string
          user_notes: string | null
        }
        Insert: {
          account_id: string
          analysis_session_id?: string | null
          avg_cpc?: number | null
          avg_ctr?: number | null
          campaign_id: string
          campaign_name: string
          color_tag?: string | null
          created_at?: string
          funnel_position?: number | null
          id?: string
          page_id?: string | null
          pipeline_stage_id?: string | null
          total_ads?: number
          total_clicks?: number | null
          total_impressions?: number | null
          total_spend?: number | null
          updated_at?: string
          user_id: string
          user_notes?: string | null
        }
        Update: {
          account_id?: string
          analysis_session_id?: string | null
          avg_cpc?: number | null
          avg_ctr?: number | null
          campaign_id?: string
          campaign_name?: string
          color_tag?: string | null
          created_at?: string
          funnel_position?: number | null
          id?: string
          page_id?: string | null
          pipeline_stage_id?: string | null
          total_ads?: number
          total_clicks?: number | null
          total_impressions?: number | null
          total_spend?: number | null
          updated_at?: string
          user_id?: string
          user_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_campaigns_analysis_session"
            columns: ["analysis_session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_ads_campaigns_pipeline_stage_id_fkey"
            columns: ["pipeline_stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_ads_connections: {
        Row: {
          account_id: string
          api_key: string
          created_at: string
          currency: string
          id: string
          label: string | null
          last_used_at: string | null
          page_icon_url: string | null
          page_id: string
          page_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          api_key?: string
          created_at?: string
          currency: string
          id?: string
          label?: string | null
          last_used_at?: string | null
          page_icon_url?: string | null
          page_id: string
          page_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          api_key?: string
          created_at?: string
          currency?: string
          id?: string
          label?: string | null
          last_used_at?: string | null
          page_icon_url?: string | null
          page_id?: string
          page_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meta_ads_creatives: {
        Row: {
          account_id: string
          action_values: Json | null
          actions: Json | null
          ad_body: string | null
          ad_description: string | null
          ad_id: string
          ad_name: string
          ad_title: string | null
          adset_id: string | null
          adset_supabase_id: string | null
          analysis_session_id: string | null
          call_to_action: string | null
          campaign_id: string | null
          campaign_objective: string | null
          campaign_supabase_id: string | null
          carousel_id: string | null
          clicks: number | null
          conversions: number | null
          cost_per_action_type: Json | null
          cost_per_conversion: number | null
          cost_per_inline_link_click: number | null
          cost_per_outbound_click: Json | null
          cpc: number | null
          cpm: number | null
          created_at: string
          creative_analysis: string | null
          creative_type: string | null
          creative_url: string | null
          ctr: number | null
          date_start: string | null
          date_stop: string | null
          frequency: number | null
          id: string
          impressions: number | null
          inline_link_click_ctr: number | null
          inline_link_clicks: number | null
          media_height: number | null
          media_width: number | null
          metrics_analysis: string | null
          outbound_clicks: Json | null
          page_icon_url: string | null
          page_id: string | null
          page_name: string | null
          performance_score: number | null
          purchase_roas: Json | null
          reach: number | null
          recommendations: Json | null
          spend: number | null
          unique_clicks: number | null
          unique_ctr: number | null
          updated_at: string
          user_id: string
          video_avg_time_watched_actions: Json | null
          video_p100_watched_actions: Json | null
          video_p25_watched_actions: Json | null
          video_p50_watched_actions: Json | null
          video_p75_watched_actions: Json | null
          video_p95_watched_actions: Json | null
          website_purchase_roas: Json | null
        }
        Insert: {
          account_id: string
          action_values?: Json | null
          actions?: Json | null
          ad_body?: string | null
          ad_description?: string | null
          ad_id: string
          ad_name: string
          ad_title?: string | null
          adset_id?: string | null
          adset_supabase_id?: string | null
          analysis_session_id?: string | null
          call_to_action?: string | null
          campaign_id?: string | null
          campaign_objective?: string | null
          campaign_supabase_id?: string | null
          carousel_id?: string | null
          clicks?: number | null
          conversions?: number | null
          cost_per_action_type?: Json | null
          cost_per_conversion?: number | null
          cost_per_inline_link_click?: number | null
          cost_per_outbound_click?: Json | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          creative_analysis?: string | null
          creative_type?: string | null
          creative_url?: string | null
          ctr?: number | null
          date_start?: string | null
          date_stop?: string | null
          frequency?: number | null
          id?: string
          impressions?: number | null
          inline_link_click_ctr?: number | null
          inline_link_clicks?: number | null
          media_height?: number | null
          media_width?: number | null
          metrics_analysis?: string | null
          outbound_clicks?: Json | null
          page_icon_url?: string | null
          page_id?: string | null
          page_name?: string | null
          performance_score?: number | null
          purchase_roas?: Json | null
          reach?: number | null
          recommendations?: Json | null
          spend?: number | null
          unique_clicks?: number | null
          unique_ctr?: number | null
          updated_at?: string
          user_id: string
          video_avg_time_watched_actions?: Json | null
          video_p100_watched_actions?: Json | null
          video_p25_watched_actions?: Json | null
          video_p50_watched_actions?: Json | null
          video_p75_watched_actions?: Json | null
          video_p95_watched_actions?: Json | null
          website_purchase_roas?: Json | null
        }
        Update: {
          account_id?: string
          action_values?: Json | null
          actions?: Json | null
          ad_body?: string | null
          ad_description?: string | null
          ad_id?: string
          ad_name?: string
          ad_title?: string | null
          adset_id?: string | null
          adset_supabase_id?: string | null
          analysis_session_id?: string | null
          call_to_action?: string | null
          campaign_id?: string | null
          campaign_objective?: string | null
          campaign_supabase_id?: string | null
          carousel_id?: string | null
          clicks?: number | null
          conversions?: number | null
          cost_per_action_type?: Json | null
          cost_per_conversion?: number | null
          cost_per_inline_link_click?: number | null
          cost_per_outbound_click?: Json | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          creative_analysis?: string | null
          creative_type?: string | null
          creative_url?: string | null
          ctr?: number | null
          date_start?: string | null
          date_stop?: string | null
          frequency?: number | null
          id?: string
          impressions?: number | null
          inline_link_click_ctr?: number | null
          inline_link_clicks?: number | null
          media_height?: number | null
          media_width?: number | null
          metrics_analysis?: string | null
          outbound_clicks?: Json | null
          page_icon_url?: string | null
          page_id?: string | null
          page_name?: string | null
          performance_score?: number | null
          purchase_roas?: Json | null
          reach?: number | null
          recommendations?: Json | null
          spend?: number | null
          unique_clicks?: number | null
          unique_ctr?: number | null
          updated_at?: string
          user_id?: string
          video_avg_time_watched_actions?: Json | null
          video_p100_watched_actions?: Json | null
          video_p25_watched_actions?: Json | null
          video_p50_watched_actions?: Json | null
          video_p75_watched_actions?: Json | null
          video_p95_watched_actions?: Json | null
          website_purchase_roas?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_creatives_analysis_session"
            columns: ["analysis_session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_ads_creatives_adset_supabase_id_fkey"
            columns: ["adset_supabase_id"]
            isOneToOne: false
            referencedRelation: "meta_ads_adsets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meta_ads_creatives_campaign_supabase_id_fkey"
            columns: ["campaign_supabase_id"]
            isOneToOne: false
            referencedRelation: "meta_ads_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_agente_videos: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      n8n_clonegame: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      n8n_grupo_sierra: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          page_id: string | null
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          page_id?: string | null
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          page_id?: string | null
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      premium_access_requests: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          phone_number: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone_number: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone_number?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      processed_files: {
        Row: {
          area: string
          created_at: string
          drive_url: string
          id: string
          notes: string | null
          project_title: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area: string
          created_at?: string
          drive_url: string
          id?: string
          notes?: string | null
          project_title: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string
          drive_url?: string
          id?: string
          notes?: string | null
          project_title?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      processing_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          progress: number
          project_title: string
          request_id: string
          result_html: string | null
          result_html_ppt: string | null
          result_url: string | null
          started_at: string
          status: Database["public"]["Enums"]["processing_status"]
          total_files: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          progress?: number
          project_title: string
          request_id: string
          result_html?: string | null
          result_html_ppt?: string | null
          result_url?: string | null
          started_at?: string
          status: Database["public"]["Enums"]["processing_status"]
          total_files: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          progress?: number
          project_title?: string
          request_id?: string
          result_html?: string | null
          result_html_ppt?: string | null
          result_url?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["processing_status"]
          total_files?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          company_code: string | null
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string | null
          ghl_user_id: string | null
          id: string
          profile_photo_url: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          account_type?: string
          company_code?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          ghl_user_id?: string | null
          id: string
          profile_photo_url?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string
          company_code?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          ghl_user_id?: string | null
          id?: string
          profile_photo_url?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_prompts: {
        Row: {
          content: string
          created_at: string
          id: string
          prompt_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          prompt_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          prompt_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_sessions: {
        Row: {
          calendar_id: string | null
          client_company: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          company_ghl_calendar_id: string | null
          company_id: string
          completed_session_id: string | null
          created_at: string | null
          created_by: string | null
          duration_minutes: number | null
          ghl_event_id: string | null
          id: string
          meeting_notes: string | null
          meeting_objective: string
          scheduled_date: string
          scheduled_time: string
          session_title: string
          status: string | null
          time_zone: string | null
          updated_at: string | null
          vendor_id: string | null
          vendor_name: string | null
          zoom_link: string | null
        }
        Insert: {
          calendar_id?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          company_ghl_calendar_id?: string | null
          company_id: string
          completed_session_id?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          ghl_event_id?: string | null
          id?: string
          meeting_notes?: string | null
          meeting_objective?: string
          scheduled_date: string
          scheduled_time: string
          session_title: string
          status?: string | null
          time_zone?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
          zoom_link?: string | null
        }
        Update: {
          calendar_id?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          company_ghl_calendar_id?: string | null
          company_id?: string
          completed_session_id?: string | null
          created_at?: string | null
          created_by?: string | null
          duration_minutes?: number | null
          ghl_event_id?: string | null
          id?: string
          meeting_notes?: string | null
          meeting_objective?: string
          scheduled_date?: string
          scheduled_time?: string
          session_title?: string
          status?: string | null
          time_zone?: string | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
          zoom_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_sessions_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "company_calendar_access"
            referencedColumns: ["accessible_calendar_id"]
          },
          {
            foreignKeyName: "scheduled_sessions_calendar_id_fkey"
            columns: ["calendar_id"]
            isOneToOne: false
            referencedRelation: "user_calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_sessions_company_ghl_calendar_id_fkey"
            columns: ["company_ghl_calendar_id"]
            isOneToOne: false
            referencedRelation: "company_ghl_calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_sessions_completed_session_id_fkey"
            columns: ["completed_session_id"]
            isOneToOne: false
            referencedRelation: "session_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_sessions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sesion_obtener_contactos: {
        Row: {
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_analytics: {
        Row: {
          analisis_markdown: string | null
          analysis_status: string
          attendance_status: string | null
          avg_connection_speed: number | null
          connection_stability_score: number | null
          created_at: string
          id: string
          internet_quality_end: number | null
          internet_quality_start: number | null
          metricas_json: Json | null
          minutes_late: number | null
          network_type: string | null
          punctuality_score: number | null
          recording_url: string | null
          scheduled_session_id: string | null
          session_duration_minutes: number | null
          session_id: string
          session_name: string | null
          updated_at: string
          url: string | null
          user_id: string
          vestimenta_correcta: boolean | null
          webhook_sent_at: string | null
        }
        Insert: {
          analisis_markdown?: string | null
          analysis_status?: string
          attendance_status?: string | null
          avg_connection_speed?: number | null
          connection_stability_score?: number | null
          created_at?: string
          id?: string
          internet_quality_end?: number | null
          internet_quality_start?: number | null
          metricas_json?: Json | null
          minutes_late?: number | null
          network_type?: string | null
          punctuality_score?: number | null
          recording_url?: string | null
          scheduled_session_id?: string | null
          session_duration_minutes?: number | null
          session_id: string
          session_name?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
          vestimenta_correcta?: boolean | null
          webhook_sent_at?: string | null
        }
        Update: {
          analisis_markdown?: string | null
          analysis_status?: string
          attendance_status?: string | null
          avg_connection_speed?: number | null
          connection_stability_score?: number | null
          created_at?: string
          id?: string
          internet_quality_end?: number | null
          internet_quality_start?: number | null
          metricas_json?: Json | null
          minutes_late?: number | null
          network_type?: string | null
          punctuality_score?: number | null
          recording_url?: string | null
          scheduled_session_id?: string | null
          session_duration_minutes?: number | null
          session_id?: string
          session_name?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
          vestimenta_correcta?: boolean | null
          webhook_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_analytics_scheduled_session_id_fkey"
            columns: ["scheduled_session_id"]
            isOneToOne: false
            referencedRelation: "scheduled_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_attendance: {
        Row: {
          attendance_status: string
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          id: string
          minutes_late: number | null
          punctuality_score: number | null
          scheduled_session_id: string
          scheduled_start_time: string
          session_duration_minutes: number | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          attendance_status?: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          minutes_late?: number | null
          punctuality_score?: number | null
          scheduled_session_id: string
          scheduled_start_time: string
          session_duration_minutes?: number | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          attendance_status?: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          id?: string
          minutes_late?: number | null
          punctuality_score?: number | null
          scheduled_session_id?: string
          scheduled_start_time?: string
          session_duration_minutes?: number | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_scheduled_session_id_fkey"
            columns: ["scheduled_session_id"]
            isOneToOne: false
            referencedRelation: "scheduled_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_attendance_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      session_start_attempts: {
        Row: {
          attempt_timestamp: string
          created_at: string
          failure_reason: string | null
          id: string
          scheduled_session_id: string
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          attempt_timestamp?: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          scheduled_session_id: string
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          attempt_timestamp?: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          scheduled_session_id?: string
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_start_attempts_scheduled_session_id_fkey"
            columns: ["scheduled_session_id"]
            isOneToOne: false
            referencedRelation: "scheduled_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_calendars: {
        Row: {
          can_delete: boolean | null
          color: string
          company_id: string | null
          created_at: string | null
          ghl_calendar_id: string | null
          ghl_source_location_id: string | null
          id: string
          is_company_calendar: boolean | null
          is_default: boolean | null
          is_ghl_calendar: boolean | null
          is_visible: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_delete?: boolean | null
          color?: string
          company_id?: string | null
          created_at?: string | null
          ghl_calendar_id?: string | null
          ghl_source_location_id?: string | null
          id?: string
          is_company_calendar?: boolean | null
          is_default?: boolean | null
          is_ghl_calendar?: boolean | null
          is_visible?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_delete?: boolean | null
          color?: string
          company_id?: string | null
          created_at?: string | null
          ghl_calendar_id?: string | null
          ghl_source_location_id?: string | null
          id?: string
          is_company_calendar?: boolean | null
          is_default?: boolean | null
          is_ghl_calendar?: boolean | null
          is_visible?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_calendars_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string
          id: string
          subscription_type: string
          trial_end_date: string
          trial_start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          subscription_type?: string
          trial_end_date?: string
          trial_start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          subscription_type?: string
          trial_end_date?: string
          trial_start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_video_configs: {
        Row: {
          api_key_id: string | null
          avatar_data: Json | null
          card_customization: Json | null
          config_data: Json
          created_at: string
          current_step: string | null
          generated_script: string | null
          id: string
          manual_customization: Json | null
          presenter_customization: Json | null
          second_avatar_data: Json | null
          session_id: string | null
          style_data: Json | null
          subtitle_customization: Json | null
          updated_at: string
          user_id: string
          voice_data: Json | null
        }
        Insert: {
          api_key_id?: string | null
          avatar_data?: Json | null
          card_customization?: Json | null
          config_data?: Json
          created_at?: string
          current_step?: string | null
          generated_script?: string | null
          id?: string
          manual_customization?: Json | null
          presenter_customization?: Json | null
          second_avatar_data?: Json | null
          session_id?: string | null
          style_data?: Json | null
          subtitle_customization?: Json | null
          updated_at?: string
          user_id: string
          voice_data?: Json | null
        }
        Update: {
          api_key_id?: string | null
          avatar_data?: Json | null
          card_customization?: Json | null
          config_data?: Json
          created_at?: string
          current_step?: string | null
          generated_script?: string | null
          id?: string
          manual_customization?: Json | null
          presenter_customization?: Json | null
          second_avatar_data?: Json | null
          session_id?: string | null
          style_data?: Json | null
          subtitle_customization?: Json | null
          updated_at?: string
          user_id?: string
          voice_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_video_configs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "heygen_api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_calendar_assignments: {
        Row: {
          company_ghl_calendar_id: string
          created_at: string | null
          ghl_user_id: string
          id: string
          is_active: boolean | null
          updated_at: string | null
          vendor_display_name: string
          vendor_id: string | null
        }
        Insert: {
          company_ghl_calendar_id: string
          created_at?: string | null
          ghl_user_id: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          vendor_display_name: string
          vendor_id?: string | null
        }
        Update: {
          company_ghl_calendar_id?: string
          created_at?: string | null
          ghl_user_id?: string
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          vendor_display_name?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_calendar_assignments_company_ghl_calendar_id_fkey"
            columns: ["company_ghl_calendar_id"]
            isOneToOne: false
            referencedRelation: "company_ghl_calendars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_calendar_assignments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_metrics: {
        Row: {
          absent_sessions: number | null
          avg_delay_minutes: number | null
          avg_punctuality_score: number | null
          avg_satisfaction: number | null
          company_id: string | null
          conversion_rate: number | null
          created_at: string
          id: string
          last_session_date: string | null
          late_sessions: number | null
          on_time_sessions: number | null
          performance_score: number | null
          total_revenue: number | null
          total_sales: number | null
          total_scheduled_sessions: number | null
          total_sessions: number | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          absent_sessions?: number | null
          avg_delay_minutes?: number | null
          avg_punctuality_score?: number | null
          avg_satisfaction?: number | null
          company_id?: string | null
          conversion_rate?: number | null
          created_at?: string
          id?: string
          last_session_date?: string | null
          late_sessions?: number | null
          on_time_sessions?: number | null
          performance_score?: number | null
          total_revenue?: number | null
          total_sales?: number | null
          total_scheduled_sessions?: number | null
          total_sessions?: number | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          absent_sessions?: number | null
          avg_delay_minutes?: number | null
          avg_punctuality_score?: number | null
          avg_satisfaction?: number | null
          company_id?: string | null
          conversion_rate?: number | null
          created_at?: string
          id?: string
          last_session_date?: string | null
          late_sessions?: number | null
          on_time_sessions?: number | null
          performance_score?: number | null
          total_revenue?: number | null
          total_sales?: number | null
          total_scheduled_sessions?: number | null
          total_sessions?: number | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_metrics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_metrics_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      video_generation_tracking: {
        Row: {
          created_at: string
          error_message: string | null
          heygen_video_id: string | null
          id: string
          progress: number | null
          request_id: string | null
          script: string | null
          status: string
          updated_at: string
          user_id: string
          video_id: string | null
          webhook_data: Json | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          heygen_video_id?: string | null
          id?: string
          progress?: number | null
          request_id?: string | null
          script?: string | null
          status?: string
          updated_at?: string
          user_id: string
          video_id?: string | null
          webhook_data?: Json | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          heygen_video_id?: string | null
          id?: string
          progress?: number | null
          request_id?: string | null
          script?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          video_id?: string | null
          webhook_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "video_generation_tracking_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "generated_videos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      company_calendar_access: {
        Row: {
          accessible_calendar_id: string | null
          accessing_user_id: string | null
          calendar_name: string | null
          company_id: string | null
          is_company_calendar: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "user_calendars_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_vendor_metrics: {
        Args: { p_vendor_id: string }
        Returns: undefined
      }
      calculate_vendor_punctuality_metrics: {
        Args: { p_vendor_id: string }
        Returns: undefined
      }
      generate_analysis_session_id: {
        Args: {
          p_account_id: string
          p_date_start: string
          p_date_stop: string
          p_page_id: string
          p_session_name: string
          p_time_range_days: number
          p_user_id: string
        }
        Returns: string
      }
      generate_company_code: { Args: never; Returns: string }
      generate_document_id: { Args: { p_user_id: string }; Returns: string }
      generate_next_request_id: { Args: never; Returns: string }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      match_user_documents: {
        Args: {
          filter?: Json
          match_count?: number
          query_embedding: string
          user_filter: string
        }
        Returns: {
          content: string
          document_id: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      request_id_exists: {
        Args: { request_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      processing_status: "completed" | "error" | "timeout" | "processing"
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
      processing_status: ["completed", "error", "timeout", "processing"],
    },
  },
} as const
