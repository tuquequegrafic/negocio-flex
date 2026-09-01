import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseService } from './supabase_client';
import { APP_CONFIG } from '../config/app_config';

export const isSupabaseConfigured = APP_CONFIG.supabase.isConfigured;

export const supabase: SupabaseClient | null = supabaseService.getClient();

