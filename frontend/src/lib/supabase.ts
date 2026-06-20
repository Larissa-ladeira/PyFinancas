import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias')
}

const STORAGE_KEY = 'pyfinancas_remember'

function isRememberMe(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== 'false'
}

export function setRememberMe(val: boolean) {
  localStorage.setItem(STORAGE_KEY, String(val))
}

const authStorage = {
  getItem(key: string) {
    const remember = isRememberMe()
    if (remember) {
      return localStorage.getItem(key) ?? sessionStorage.getItem(key)
    }
    return sessionStorage.getItem(key) ?? localStorage.getItem(key)
  },
  setItem(key: string, value: string) {
    const remember = isRememberMe()
    if (remember) {
      localStorage.setItem(key, value)
    } else {
      sessionStorage.setItem(key, value)
    }
  },
  removeItem(key: string) {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storage: authStorage },
})
