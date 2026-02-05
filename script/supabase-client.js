// Importa o createClient da biblioteca do Supabase via CDN estável
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Importa as nossas chaves do arquivo de configuração seguro
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// Cria e exporta o cliente Supabase usando as variáveis importadas
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});