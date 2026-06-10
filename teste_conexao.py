import os
from supabase import create_client
from dotenv import load_dotenv

# Carrega o arquivo explicitamente
load_dotenv(dotenv_path=".env")

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

print(f"URL lida: '{url}'")
print(f"KEY lida: '{key}'")

if url and key:
    try:
        supabase = create_client(url, key)
        print("Sucesso! Conexão estabelecida com o Supabase.")
    except Exception as e:
        print(f"Erro ao criar cliente: {e}")
else:
    print("ERRO: As variáveis não foram lidas pelo Python. Verifique o arquivo .env.")