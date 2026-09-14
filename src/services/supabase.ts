import { createClient } from '@supabase/supabase-js';
import { Preferences } from '@capacitor/preferences';

// Adaptador de persistência móvel com Capacitor Preferences
const capacitorStorageAdapter = {
    getItem: async (key: string): Promise<string | null> => {
        const { value } = await Preferences.get({ key });
        return value;
    },
    setItem: async (key: string, value: string): Promise<void> => {
        await Preferences.set({ key, value });
    },
    removeItem: async (key: string): Promise<void> => {
        await Preferences.remove({ key });
    }
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('As variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem ser configuradas.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: capacitorStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false // Desativado para controle manual em apps nativos
    }
});