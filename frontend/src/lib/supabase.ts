import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias')
}

const memoryStore = new Map<string, string>()

function clearLegacyAuthStorage() {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      for (let i = storage.length - 1; i >= 0; i--) {
        const key = storage.key(i)
        if (key && (key.startsWith('sb-') || key === 'pyfinancas_remember')) {
          storage.removeItem(key)
        }
      }
    } catch {
      // armazenamento indisponível — ignora
    }
  }
}

clearLegacyAuthStorage()

const authStorage = {
  getItem(key: string) {
    return memoryStore.get(key) ?? null
  },
  setItem(key: string, value: string) {
    memoryStore.set(key, value)
  },
  removeItem(key: string) {
    memoryStore.delete(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storage: authStorage },
})
