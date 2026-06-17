import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const amanha = new Date()
    amanha.setDate(amanha.getDate() + 1)
    const amanhaStr = amanha.toISOString().split('T')[0]

    const { data: lembretes } = await supabase
      .from('lembretes')
      .select('descricao, valor, usuario_id')
      .eq('data_vencimento', amanhaStr)
      .eq('pago', false)

    if (!lembretes?.length) {
      return new Response(JSON.stringify({ sent: 0 }), { status: 200 })
    }

    const porUsuario = new Map<string, { descricao: string; valor: number }[]>()
    for (const l of lembretes) {
      const arr = porUsuario.get(l.usuario_id) || []
      arr.push({ descricao: l.descricao, valor: Number(l.valor) })
      porUsuario.set(l.usuario_id, arr)
    }

    let totalSent = 0
    for (const [usuarioId, items] of porUsuario) {
      const { data: tokens } = await supabase
        .from('device_tokens')
        .select('token')
        .eq('usuario_id', usuarioId)

      if (!tokens?.length) continue

      const body = items.map(i => `${i.descricao}: R$ ${i.valor.toFixed(2)}`).join('\n')

      for (const t of tokens) {
        try {
          const res = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `key=${Deno.env.get('FCM_SERVER_KEY')}`,
            },
            body: JSON.stringify({
              to: t.token,
              notification: {
                title: 'Lembrete de amanhã',
                body,
                sound: 'default',
              },
              data: {
                type: 'lembrete',
              },
            }),
          })
          if (res.ok) totalSent++
        } catch {
          // token inválido — pode remover depois
        }
      }
    }

    return new Response(JSON.stringify({ sent: totalSent }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
