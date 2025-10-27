export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      vendors: {
        Row: {
          id: string
          user_id: string | null
          name: string
          email: string
          phone: string
          commission_rate: number
          is_active: boolean
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          email: string
          phone: string
          commission_rate?: number
          is_active?: boolean
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          email?: string
          phone?: string
          commission_rate?: number
          is_active?: boolean
          created_at?: string
          created_by?: string | null
        }
      }
      serials: {
        Row: {
          id: string
          serial_number: string
          vendor_id: string
          qr_code: string
          link: string
          is_used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          serial_number: string
          vendor_id: string
          qr_code: string
          link: string
          is_used?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          serial_number?: string
          vendor_id?: string
          qr_code?: string
          link?: string
          is_used?: boolean
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          serial_id: string | null
          vendor_id: string
          name: string
          email: string
          phone: string
          created_at: string
        }
        Insert: {
          id?: string
          serial_id?: string | null
          vendor_id: string
          name: string
          email: string
          phone: string
          created_at?: string
        }
        Update: {
          id?: string
          serial_id?: string | null
          vendor_id?: string
          name?: string
          email?: string
          phone?: string
          created_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          client_id: string
          serial_id: string
          vendor_id: string
          service_name: string
          service_price: number
          commission_amount: number
          payment_status: string
          payment_intent_id: string | null
          appointment_date: string | null
          appointment_status: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          serial_id: string
          vendor_id: string
          service_name: string
          service_price: number
          commission_amount: number
          payment_status?: string
          payment_intent_id?: string | null
          appointment_date?: string | null
          appointment_status?: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          serial_id?: string
          vendor_id?: string
          service_name?: string
          service_price?: number
          commission_amount?: number
          payment_status?: string
          payment_intent_id?: string | null
          appointment_date?: string | null
          appointment_status?: string
          created_at?: string
        }
      }
    }
  }
}
