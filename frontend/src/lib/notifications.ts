import { supabase } from './supabase'
import { PushNotifications } from '@capacitor/push-notifications'
import type { Token } from '@capacitor/push-notifications'

let registered = false

export async function registerPushNotifications() {
  if (registered) return
  registered = true

  let permStatus = await PushNotifications.checkPermissions()
  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions()
  }
  if (permStatus.receive !== 'granted') return

  await PushNotifications.register()

  PushNotifications.addListener('registration', async (token: Token) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const platform = navigator.platform?.includes('Win') ? 'web' : 'android'

    await supabase.from('device_tokens').upsert({
      usuario_id: user.id,
      token: token.value,
      platform,
    }, { onConflict: 'usuario_id, token' })
  })

  PushNotifications.addListener('registrationError', (err) => {
    console.error('Push registration error:', err)
  })
}
