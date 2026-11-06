/**
 * Cliente de Supabase (servidores en Frankfurt). Solo lleva la URL y la clave pública:
 * lo que protege los datos son las reglas RLS del servidor (supabase/migrations).
 *
 * Sin claves (EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_KEY) la app funciona en modo demo,
 * todo en el dispositivo, como antes de tener servidor.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_KEY;

export const backend: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      })
    : null;

export const hasBackend = backend !== null;

// En el móvil, renovar la sesión solo con la app delante (recomendación de Supabase para React Native).
if (backend && Platform.OS !== 'web') {
  AppState.addEventListener('change', (s) => (s === 'active' ? backend.auth.startAutoRefresh() : backend.auth.stopAutoRefresh()));
}
