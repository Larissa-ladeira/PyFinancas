import os
import json
from urllib.request import Request, urlopen
from urllib.error import URLError
from datetime import date, timedelta
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()
SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "").strip()

if not all([RESEND_API_KEY, SUPABASE_URL, SUPABASE_KEY]):
    print("Erro: RESEND_API_KEY ou credenciais Supabase incompletas no .env")
    exit(1)


def enviar_email(destino: str, assunto: str, corpo: str):
    payload = json.dumps({
        "from": "PyFinanças <onboarding@resend.dev>",
        "to": [destino],
        "subject": assunto,
        "text": corpo,
    }).encode()
    req = Request(
        "https://api.resend.com/emails",
        data=payload,
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
    )
    try:
        urlopen(req)
        print(f"  Email enviado para {destino}")
        return True
    except URLError as e:
        print(f"  Erro ao enviar email para {destino}: {e}")
        return False


def main():
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    print(f"Verificando lembretes para envio de notificações...")

    notificacoes = supabase.from_("notificacoes").select("*").eq("ativo", True).execute()
    if not notificacoes.data:
        print("Nenhuma notificação ativa encontrada.")
        return

    for config in notificacoes.data:
        usuario_id = config["usuario_id"]
        email_destino = config["email_notificacao"] or obter_email_usuario(supabase, usuario_id)
        dias_antes = config.get("dias_antes") or 1
        data_alvo = date.today() + timedelta(days=dias_antes)

        if not email_destino:
            continue

        lembretes = (
            supabase.from_("lembretes")
            .select("*")
            .eq("usuario_id", usuario_id)
            .eq("pago", False)
            .eq("data_vencimento", data_alvo.isoformat())
            .execute()
        )

        if not lembretes.data:
            continue

        print(f"Usuário {usuario_id}: {len(lembretes.data)} lembrete(s) para {data_alvo}")

        linhas = []
        for l in lembretes.data:
            venc = l["data_vencimento"]
            if l["data_vencimento"]:
                venc = date.fromisoformat(l["data_vencimento"]).strftime("%d/%m/%Y")
            linhas.append(f"- {l['descricao']}: R$ {float(l['valor']):,.2f} (vence {venc})")

        corpo = f"""Olá,

Você tem {len(linhas)} lembrete(s) com vencimento próximo:

{chr(10).join(linhas)}

Acesse o PyFinanças para mais detalhes e confirmar pagamentos.

--
PyFinanças - Seu assistente financeiro
"""

        assunto = f"PyFinanças - {len(linhas)} lembrete(s) vence(m) em breve"
        enviar_email(email_destino, assunto, corpo)


def obter_email_usuario(supabase, usuario_id):
    try:
        user = supabase.auth.admin.get_user_by_id(usuario_id)
        return user.user.email if user.user else None
    except Exception:
        return None


if __name__ == "__main__":
    main()
