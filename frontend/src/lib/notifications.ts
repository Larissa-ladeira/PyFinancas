import { supabase } from './supabase'

let registered = false

export async function registerPushNotifications() {
  if (registered) return
  registered = true

  if (!window.Capacitor) return

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')

    let permStatus = await PushNotifications.checkPermissions()
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions()
    }
    if (permStatus.receive !== 'granted') return

    await PushNotifications.register()

    PushNotifications.addListener('registration', async (token: { value: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const platform = navigator.platform?.includes('Win') ? 'web' : 'android'

      await supabase.from('device_tokens').upsert({
        usuario_id: user.id,
        token: token.value,
        platform,
      }, { onConflict: 'usuario_id, token' })
    })

    PushNotifications.addListener('registrationError', (err: unknown) => {
      console.error('Push registration error:', err)
    })
  } catch {
    // Capacitor not available (web browser)
  }
}
