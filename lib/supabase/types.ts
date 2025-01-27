export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          company_name: string | null
          company_logo: string | null
          signature: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_name?: string | null
          company_logo?: string | null
          signature?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string | null
          company_logo?: string | null
          signature?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      receipts: {
        Row: {
          id: string
          profile_id: string
          receipt_number: string | null
          customer_name: string
          customer_email: string | null
          customer_whatsapp: string | null
          customer_number: string | null
          customer_address: string | null
          payment_method: string
          items: Json
          currency: string | null
          subtotal: number
          tax_rate: number | null
          tax: number
          total: number
          sent_via: 'email' | 'whatsapp'
          signature: string | null
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          receipt_number?: string | null
          customer_name: string
          customer_email?: string | null
          customer_whatsapp?: string | null
          customer_number?: string | null
          customer_address?: string | null
          payment_method: string
          items: Json
          currency?: string | null
          subtotal: number
          tax_rate?: number | null
          tax: number
          total: number
          sent_via: 'email' | 'whatsapp'
          signature?: string | null
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          receipt_number?: string | null
          customer_name?: string
          customer_email?: string | null
          customer_whatsapp?: string | null
          customer_number?: string | null
          customer_address?: string | null
          payment_method?: string
          items?: Json
          currency?: string | null
          subtotal?: number
          tax_rate?: number | null
          tax?: number
          total?: number
          sent_via?: 'email' | 'whatsapp'
          signature?: string | null
          title?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}