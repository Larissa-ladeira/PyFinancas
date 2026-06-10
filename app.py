import streamlit as st
import os
import base64
import pandas as pd
from datetime import date, datetime
from supabase import create_client
from dotenv import load_dotenv
import plotly.express as px
import plotly.graph_objects as go

load_dotenv()

CATEGORIAS_RECEITA = ["Salário", "Freelance", "Investimentos", "Presente", "Renda Extra", "Outros"]
CATEGORIAS_DESPESA = [
    "Alimentação", "Transporte", "Moradia", "Saúde", "Educação",
    "Lazer", "Assinaturas", "Compras", "Outros"
]
MESES_PT = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]


st.set_page_config(page_title="PyFinanças", page_icon="💰", layout="wide")

if "modo_escuro" not in st.session_state:
    st.session_state.modo_escuro = False

COR_RECEITA = "#10b981"
COR_DESPESA = "#ef4444"

def get_css(modo_escuro):
    if modo_escuro:
        bg = "#07090f"
        card_bg = "rgba(255,255,255,0.03)"
        card_border = "rgba(255,255,255,0.06)"
        text_primary = "#f0f0f5"
        text_secondary = "rgba(255,255,255,0.35)"
        sidebar_bg = "rgba(255,255,255,0.02)"
        sidebar_border = "rgba(255,255,255,0.05)"
        form_bg = "rgba(255,255,255,0.03)"
        expander_bg = "rgba(255,255,255,0.03)"
        filter_bg = "rgba(255,255,255,0.03)"
        hr_color = "rgba(255,255,255,0.06)"
        table_th_bg = "rgba(255,255,255,0.03)"
        table_th_color = "rgba(255,255,255,0.35)"
        table_border = "rgba(255,255,255,0.05)"
        table_hover = "rgba(255,255,255,0.04)"
        input_bg = "rgba(255,255,255,0.05)"
        input_text = "#f0f0f5"
        input_border = "rgba(255,255,255,0.1)"
        btn_bg = "#ffffff"
        btn_text = "#111111"
        badge_receita_bg = "rgba(16,185,129,0.15)"
        badge_despesa_bg = "rgba(239,68,68,0.15)"
    else:
        bg = "#f5f3ff"
        card_bg = "rgba(255,255,255,0.8)"
        card_border = "rgba(99,102,241,0.1)"
        text_primary = "#0f0f23"
        text_secondary = "rgba(15,15,35,0.4)"
        sidebar_bg = "rgba(255,255,255,0.85)"
        sidebar_border = "rgba(99,102,241,0.08)"
        form_bg = "rgba(255,255,255,0.8)"
        expander_bg = "rgba(255,255,255,0.8)"
        filter_bg = "rgba(255,255,255,0.9)"
        hr_color = "rgba(99,102,241,0.1)"
        table_th_bg = "rgba(99,102,241,0.04)"
        table_th_color = "rgba(15,15,35,0.4)"
        table_border = "rgba(99,102,241,0.08)"
        table_hover = "rgba(99,102,241,0.04)"
        input_bg = "rgba(255,255,255,0.9)"
        input_text = "#0f0f23"
        input_border = "rgba(99,102,241,0.15)"
        btn_bg = "#111111"
        btn_text = "#ffffff"
        badge_receita_bg = "rgba(16,185,129,0.12)"
        badge_despesa_bg = "rgba(239,68,68,0.12)"

    css = """
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
    * { font-family: 'Inter', sans-serif; }
    h1, h2, h3 { font-family: 'Space Grotesk', sans-serif !important; }
    .stApp { background: __BG__; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: __CARD_BORDER__; border-radius: 3px; }

    h1, h2, h3 { font-weight: 700 !important; letter-spacing: -0.03em; color: __TEXT_PRIMARY__ !important; }
    h1 { font-size: 1.8rem !important; }
    p, span, div, label { color: __TEXT_PRIMARY__; }

    .card, .metric-card, div.stForm, div[data-testid="stMetric"],
    div[data-testid="stExpander"], .filter-section, .login-box {
        background: __CARD_BG__;
        -webkit-backdrop-filter: blur(20px);
        backdrop-filter: blur(20px);
        border: 1px solid __CARD_BORDER__;
        box-shadow: 0 8px 32px rgba(0,0,0,0.06);
    }
    .card { border-radius: 20px; padding: 1.2rem 1.5rem; transition: all 0.3s ease; }
    .card:hover { box-shadow: 0 12px 48px rgba(0,0,0,0.1); border-color: __TEXT_SECONDARY__; }
    .metric-card { border-radius: 20px; padding: 1.2rem 1.5rem; border-left: 4px solid __TEXT_SECONDARY__; flex: 1; min-width: 0; transition: all 0.3s ease; }
    .metric-card:hover { box-shadow: 0 12px 48px rgba(0,0,0,0.1); }
    .metric-card.receita { border-left-color: #10b981; }
    .metric-card.despesa { border-left-color: #ef4444; }
    .metric-card.saldo { border-left-color: #818cf8; }

    .metric-label { font-size: 0.82rem; font-weight: 500; color: __TEXT_SECONDARY__; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.04em; }
    .metric-value { font-size: 1.6rem; font-weight: 700; letter-spacing: -0.03em; }
    .metric-value.positive { color: #10b981; }
    .metric-value.negative { color: #ef4444; }
    .metric-value.neutral { color: __TEXT_PRIMARY__; }
    .metric-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; }

    .table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .table th { text-align: left; padding: 0.65rem 0.8rem; border-bottom: 1.5px solid __TABLE_BORDER__; color: __TABLE_TH_COLOR__; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.04em; }
    .table td { padding: 0.65rem 0.8rem; border-bottom: 1px solid __TABLE_BORDER__; }
    .table tr:hover td { background: __TABLE_HOVER__; }
    .table tr:last-child td { border-bottom: none; }

    .filter-summary { text-align: right; margin-top: 1rem; padding: 1rem 0; border-top: 1.5px solid __HR_COLOR__; }
    .filter-summary-text { font-size: 0.88rem; color: __TEXT_SECONDARY__; }
    .filter-count { display: flex; gap: 1.5rem; justify-content: flex-end; font-size: 0.82rem; color: __TEXT_SECONDARY__; }

    /* Sidebar */
    section[data-testid="stSidebar"],
    div[data-testid="stSidebar"],
    div[data-testid="stSidebar"] > div,
    div[data-testid="stSidebar"] > section,
    div[data-testid="stSidebar"] > div:nth-child(1),
    div[data-testid="stSidebar"] > div:nth-child(2),
    div[data-testid="stSidebar"] .st-emotion-cache-1wsyq2i,
    div[data-testid="stSidebar"] [data-testid="stSidebarContent"],
    div[data-testid="stSidebar"] [data-testid="stSidebarContent"] > div,
    div[data-testid="stSidebar"] section:first-child,
    div[data-testid="stSidebar"] section:first-child > div {
        background: __SIDEBAR_BG__ !important;
    }
    div[data-testid="stSidebar"] {
        border-right: 1px solid __SIDEBAR_BORDER__;
    }
    div[data-testid="stSidebar"] div[data-testid="stVerticalBlock"] {
        background: transparent !important;
    }
    div[data-testid="stSidebar"] * {
        color: __TEXT_PRIMARY__ !important;
    }
    .sidebar-brand {
        font-size: 1.5rem; font-weight: 800; letter-spacing: -0.04em;
        margin-bottom: 0.15rem; padding-top: 0.25rem;
    }
    .sidebar-brand span {
        background: linear-gradient(135deg, #818cf8, #6366f1);
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    .sidebar-user {
        font-size: 0.78rem; color: __TEXT_SECONDARY__;
        padding: 0.4rem 0 1rem 0;
        border-bottom: 1.5px solid __SIDEBAR_BORDER__;
        margin-bottom: 1.2rem;
        display: flex; align-items: center; gap: 0.4rem;
    }
    div[data-testid="stSidebar"] div[role="radiogroup"] {
        background: transparent !important;
        gap: 2px;
        padding: 0 !important;
    }
    div[data-testid="stSidebar"] div[role="radiogroup"] label {
        display: flex !important;
        align-items: center !important;
        gap: 0.5rem !important;
        color: __TEXT_SECONDARY__ !important;
        font-weight: 500 !important;
        font-size: 0.85rem !important;
        padding: 0.6rem 0.85rem !important;
        border-radius: 12px !important;
        transition: all 0.2s ease !important;
        position: relative !important;
    }
    div[data-testid="stSidebar"] div[role="radiogroup"] label:hover {
        background: __CARD_BG__ !important;
        color: __TEXT_PRIMARY__ !important;
    }
    div[data-testid="stSidebar"] div[role="radiogroup"] label[data-checked="true"] {
        background: __CARD_BG__ !important;
        color: __TEXT_PRIMARY__ !important;
        font-weight: 700 !important;
        border: 1px solid __CARD_BORDER__;
    }
    div[data-testid="stSidebar"] div[role="radiogroup"] label[data-checked="true"]::before {
        content: '';
        position: absolute; left: -1px; top: 50%; transform: translateY(-50%);
        width: 3px; height: 60%;
        background: linear-gradient(180deg, #818cf8, #6366f1);
        border-radius: 0 3px 3px 0;
    }
    .stSidebar .st-emotion-cache-1wmy9hl {
        background: __SIDEBAR_BG__ !important;
    }
    .stSidebar .st-emotion-cache-1gulkj5 {
        background: __SIDEBAR_BG__ !important;
    }

    /* Login */
    header, header[data-testid="stHeader"], .stApp > header,
    #MainMenu, .stDecoration, .stToolbar, div[data-testid="stToolbar"],
    div[data-testid="collapsedControl"],
    .st-emotion-cache-18ni7ap, .st-emotion-cache-1avcm0n,
    .st-emotion-cache-z5fcl4, .st-emotion-cache-1wrcr25 {
        display: none !important;
        height: 0 !important;
        padding: 0 !important;
        margin: 0 !important;
    }
    .block-container {
        max-width: 1200px !important;
        padding: 2rem 1.5rem !important;
        margin: 0 auto !important;
    }

    /* Fixed Buttons (hamburger + theme) */
    div[data-testid="column"]:first-child {
        position: fixed !important;
        top: 16px !important; left: 16px !important;
        z-index: 9999 !important;
        width: 40px !important; height: 40px !important;
        padding: 0 !important; margin: 0 !important;
        background: transparent !important;
    }
    div[data-testid="column"]:last-child {
        position: fixed !important;
        top: 16px !important; right: 16px !important;
        z-index: 9999 !important;
        width: 40px !important; height: 40px !important;
        padding: 0 !important; margin: 0 !important;
        background: transparent !important;
    }
    div[data-testid="column"]:first-child button,
    div[data-testid="column"]:last-child button {
        width: 40px !important; height: 40px !important;
        border-radius: 50% !important;
        border: 1px solid __CARD_BORDER__ !important;
        background: __CARD_BG__ !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
        color: __TEXT_PRIMARY__ !important;
        font-size: 1.15rem !important;
        padding: 0 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-shadow: 0 2px 12px rgba(0,0,0,0.08) !important;
        transition: all 0.25s ease !important;
        cursor: pointer !important;
        min-width: unset !important;
        line-height: 1 !important;
    }
    div[data-testid="column"]:first-child button:hover,
    div[data-testid="column"]:last-child button:hover {
        transform: scale(1.08) !important;
        box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important;
    }

    /* Buttons */
    .stButton > button {
        border-radius: 12px !important;
        font-weight: 600 !important;
        font-size: 0.9rem !important;
        padding: 0.55rem 1.2rem !important;
        transition: all 0.25s ease !important;
        height: auto !important;
        background: __CARD_BG__ !important;
        border: 1px solid __CARD_BORDER__ !important;
        color: __TEXT_PRIMARY__ !important;
    }
    .stButton > button:hover { border-color: __TEXT_SECONDARY__ !important; box-shadow: 0 4px 20px rgba(0,0,0,0.08) !important; }
    .stButton > button[kind="primary"] {
        background: linear-gradient(135deg, #818cf8, #6366f1) !important;
        border: none !important;
        color: white !important;
        font-weight: 700 !important;
    }
    .stButton > button[kind="primary"]:hover { box-shadow: 0 4px 24px rgba(99,102,241,0.3) !important; }

    /* Inputs */
    div[data-testid="stTextInput"] input,
    div[data-testid="stNumberInput"] input,
    div[data-testid="stTextArea"] textarea,
    div[data-testid="stDateInput"] input {
        background: __INPUT_BG__ !important;
        color: __INPUT_TEXT__ !important;
        border: 1.5px solid __INPUT_BORDER__ !important;
        border-radius: 12px !important;
        transition: all 0.2s ease !important;
        font-size: 0.9rem !important;
    }
    div[data-testid="stTextInput"] input:focus,
    div[data-testid="stNumberInput"] input:focus,
    div[data-testid="stTextArea"] textarea:focus,
    div[data-testid="stDateInput"] input:focus {
        border-color: #818cf8 !important;
        box-shadow: 0 0 0 3px rgba(129,140,248,0.15) !important;
    }
    div[data-testid="stSelectbox"] > div {
        background: __INPUT_BG__ !important;
        border: 1.5px solid __INPUT_BORDER__ !important;
        border-radius: 12px !important;
    }
    div[data-testid="stSelectbox"] > div:hover { border-color: __TEXT_SECONDARY__ !important; }
    div[data-testid="stSelectbox"] [data-baseweb="select"] { border-radius: 10px !important; }

    /* Tabs */
    .stTabs { display: flex; justify-content: center; }
    .stTabs [data-baseweb="tab-list"] { gap: 0.3rem; background: transparent; padding: 0; width: 100%; justify-content: center; }
    .stTabs [data-baseweb="tab"] {
        border-radius: 10px !important;
        padding: 0.45rem 1rem !important;
        font-weight: 500 !important;
        color: __TEXT_SECONDARY__ !important;
        transition: all 0.2s ease !important;
        background: transparent !important;
    }
    .stTabs [data-baseweb="tab"]:hover { color: __TEXT_PRIMARY__ !important; background: __CARD_BG__ !important; }
    .stTabs [aria-selected="true"] { background: __CARD_BG__ !important; color: __TEXT_PRIMARY__ !important; border: 1px solid __CARD_BORDER__ !important; font-weight: 600 !important; }

    /* Forms */
    div.stForm { border-radius: 20px; padding: 1.5rem; }

    /* Metrics */
    div[data-testid="stMetric"] { border-radius: 16px; padding: 1rem 1.2rem; }
    div[data-testid="stMetric"] label { font-size: 0.82rem !important; font-weight: 500 !important; color: __TEXT_SECONDARY__ !important; text-transform: uppercase; letter-spacing: 0.03em; }
    div[data-testid="stMetric"] [data-testid="stMetricValue"] { font-weight: 700 !important; font-size: 1.4rem !important; letter-spacing: -0.03em !important; }

    /* DataFrame */
    div[data-testid="stDataFrame"] { border: 1px solid __CARD_BORDER__; border-radius: 14px; overflow: hidden; }

    /* Expander */
    div[data-testid="stExpander"] { border-radius: 16px; }
    div[data-testid="stExpander"] summary { font-weight: 600; padding: 0.6rem 1rem; }

    /* Filter Section */
    .filter-section { border-radius: 20px; padding: 1.2rem 1.5rem; margin-bottom: 1.5rem; }

    /* Badges */
    .badge { display: inline-block; padding: 0.15rem 0.6rem; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
    .badge.receita { background: __BADGE_RECEITA_BG__; color: #10b981; }
    .badge.despesa { background: __BADGE_DESPESA_BG__; color: #ef4444; }

    /* Alerts */
    .stAlert { border-radius: 14px !important; background: __CARD_BG__ !important; border: 1px solid __CARD_BORDER__ !important; }
    div[data-testid="stNotification"] { border-radius: 16px !important; background: __CARD_BG__ !important; border: 1px solid __CARD_BORDER__ !important; }

    hr { margin: 1.5rem 0; border-color: __HR_COLOR__; border-width: 0.5px; }
    div[data-testid="column"] { gap: 1rem; }
    .row-widget { gap: 0.5rem; }
    .st-emotion-cache-1r4qj8v { font-size: 0.9rem; }

    /* Plotly */
    .stPlotlyChart { border-radius: 16px; overflow: hidden; }
    .js-plotly-plot .plotly .main-svg { border-radius: 16px; }

    @media (max-width: 1024px) {
        .metric-row { flex-wrap: wrap; }
        .metric-card { min-width: 200px; flex: 1 1 calc(50% - 0.5rem); }
    }

    @media (max-width: 768px) {
        h1 { font-size: 1.3rem !important; }
        .metric-value { font-size: 1.2rem; }
        .metric-card { padding: 0.8rem 1rem; min-width: 100%; }
        .metric-row { flex-direction: column; gap: 0.6rem; }
        .login-box { padding: 1.5rem; border-radius: 18px; }
        .login-box h1 { font-size: 1.4rem; }
        .card { padding: 1rem; }
        div.stForm { padding: 1rem; }
        .sidebar-brand { font-size: 1.2rem; }
        div[data-testid="stSidebar"] { width: 100% !important; min-width: 0 !important; }
        .filter-section { padding: 0.8rem 1rem; }
        .table { font-size: 0.78rem; }
        .table th, .table td { padding: 0.4rem 0.5rem !important; }
        div[data-testid="column"] { min-width: 100% !important; flex: 1 0 100% !important; }
        div.row-widget.stSelectbox, div[data-testid="stDateInput"] { margin-bottom: 0.5rem; }
        div[data-testid="stExpander"] .stDataFrame { overflow-x: auto !important; }
        div[data-testid="stDataFrame"] [data-testid="stDataFrame"] { overflow-x: auto !important; }
        .stPlotlyChart { overflow-x: auto; }
    }

    @media (max-width: 480px) {
        h1 { font-size: 1.15rem !important; }
        .metric-value { font-size: 1.1rem; }
        .badge { font-size: 0.62rem; padding: 0.1rem 0.4rem; }
    }
</style>
"""
    css = css.replace("__BG__", bg)
    css = css.replace("__CARD_BG__", card_bg)
    css = css.replace("__CARD_BORDER__", card_border)
    css = css.replace("__TEXT_PRIMARY__", text_primary)
    css = css.replace("__TEXT_SECONDARY__", text_secondary)
    css = css.replace("__SIDEBAR_BG__", sidebar_bg)
    css = css.replace("__SIDEBAR_BORDER__", sidebar_border)
    css = css.replace("__FORM_BG__", form_bg)
    css = css.replace("__EXPANDER_BG__", expander_bg)
    css = css.replace("__FILTER_BG__", filter_bg)
    css = css.replace("__HR_COLOR__", hr_color)
    css = css.replace("__BADGE_RECEITA_BG__", badge_receita_bg)
    css = css.replace("__BADGE_DESPESA_BG__", badge_despesa_bg)
    css = css.replace("__TABLE_TH_BG__", table_th_bg)
    css = css.replace("__TABLE_TH_COLOR__", table_th_color)
    css = css.replace("__TABLE_BORDER__", table_border)
    css = css.replace("__TABLE_HOVER__", table_hover)
    css = css.replace("__INPUT_BG__", input_bg)
    css = css.replace("__INPUT_TEXT__", input_text)
    css = css.replace("__INPUT_BORDER__", input_border)
    css = css.replace("__BTN_BG__", btn_bg)
    css = css.replace("__BTN_TEXT__", btn_text)
    return css

st.markdown(get_css(st.session_state.modo_escuro), unsafe_allow_html=True)

@st.cache_resource
def init_supabase():
    return create_client(
        os.getenv("SUPABASE_URL", "").strip(),
        os.getenv("SUPABASE_KEY", "").strip()
    )

supabase = init_supabase()

def restaurar_sessao():
    if "access_token" in st.session_state and "refresh_token" in st.session_state:
        try:
            supabase.auth.set_session(
                st.session_state.access_token,
                st.session_state.refresh_token
            )
            supabase.auth.get_user()
            return True
        except Exception:
            for k in ["access_token", "refresh_token", "user_email"]:
                st.session_state.pop(k, None)
    return False

def pagina_login():
    if "login_view" not in st.session_state:
        st.session_state.login_view = "index"

    st.markdown("""<style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap');
        div[data-testid="stSidebar"], section[data-testid="stSidebar"],
        div[data-testid="stSidebar"] *, section[data-testid="stSidebar"] * {
            display: none !important; width: 0 !important; min-width: 0 !important;
            max-width: 0 !important; padding: 0 !important; margin: 0 !important;
            opacity: 0 !important; overflow: hidden !important; flex: 0 0 0 !important;
        }
        .stApp::before {
            content: '';
            position: fixed; top: -50%; left: -50%;
            width: 200%; height: 200%;
            background: radial-gradient(ellipse at 30% 20%, rgba(99,102,241,0.12) 0%, transparent 50%),
                        radial-gradient(ellipse at 70% 80%, rgba(167,139,250,0.08) 0%, transparent 50%);
            pointer-events: none;
            z-index: 0;
        }
        section[data-testid="stAppViewBlock"],
        div[data-testid="stAppViewBlock"], div[data-testid="stAppViewContainer"],
        .main, .block-container {
            padding: 0 !important; margin: 0 !important;
            max-width: none !important; width: 100% !important; gap: 0 !important;
        }
        .block-container {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            max-width: 400px !important; width: 100% !important;
            padding: 2rem 1rem !important;
            margin: 0 !important;
            z-index: 10 !important;
        }
        h1 {
            font-family: 'Space Grotesk', sans-serif !important;
            font-size: 2.4rem !important; font-weight: 600 !important;
            letter-spacing: -0.05em !important; line-height: 1.1 !important;
            margin-bottom: 0.4rem !important; text-align: center !important;
        }
        h1 span { background: linear-gradient(135deg, #6366f1, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .login-desc {
            font-size: 0.82rem; line-height: 1.8; color: __TEXT_SECONDARY__;
            text-align: center; margin-bottom: 1.5rem;
        }
        .login-btn .stButton button {
            border-radius: 100px !important; font-weight: 500 !important;
            font-size: 0.72rem !important; padding: 0.28rem 0.65rem !important;
            border: none !important; background: __BTN_BG__ !important;
            color: __BTN_TEXT__ !important; transition: all 0.25s !important;
            letter-spacing: 0.03em !important;
        }
        .login-btn .stButton button:hover {
            opacity: 0.85 !important;
            transform: translateY(-1px) !important;
        }
        .login-card {
            background: __CARD_BG__; backdrop-filter: blur(24px); padding: 2.25rem 2rem;
            border-radius: 28px; border: 1px solid __CARD_BORDER__;
            position: relative; z-index: 1;
        }
        .login-card::before {
            content: '';
            position: absolute; top: 0; left: 50%; transform: translateX(-50%);
            width: 60px; height: 3px;
            background: linear-gradient(90deg, #6366f1, #a78bfa);
            border-radius: 0 0 3px 3px;
        }
        .block-container::after {
            content: '';
            position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
            width: 500px; height: 500px;
            background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);
            pointer-events: none;
            z-index: 0;
        }
        .login-card .stForm { border: none !important; padding: 0 !important; background: transparent !important; }
        .login-card .stForm [data-testid="stForm"] { background: transparent !important; border: none !important; padding: 0 !important; }
        .login-card .stTextInput input {
            border-radius: 100px !important; border: 1.5px solid __CARD_BORDER__ !important;
            background: __INPUT_BG__ !important; color: __INPUT_TEXT__ !important;
            padding: 0.55rem 1rem !important; font-size: 0.85rem !important;
        }
        .login-card .stTextInput input:focus {
            border-color: #818cf8 !important; box-shadow: 0 0 0 3px rgba(129,140,248,0.15) !important;
        }
        .login-card .stButton button[kind="primary"] {
            border-radius: 100px !important; font-weight: 600 !important;
            font-size: 0.85rem !important; padding: 0.55rem !important;
        }
        .login-card .stAlert { border-radius: 12px !important; font-size: 0.82rem !important; }
        .login-voltar .stButton button {
            background: none !important; border: none !important;
            color: #818cf8 !important; font-weight: 600 !important;
            font-size: 0.85rem !important; padding: 0 !important;
        }
        .login-voltar .stButton button:hover { opacity: 0.8 !important; }
        .login-switch .stButton button {
            background: none !important; border: none !important;
            color: __TEXT_SECONDARY__ !important; font-size: 0.82rem !important;
            padding: 0.5rem 0 !important; width: auto !important;
        }
        .login-switch .stButton button:hover { color: #818cf8 !important; }
    </style>""", unsafe_allow_html=True)

    _col_l, _col_c, _col_r = st.columns([1, 10, 1])
    with _col_r:
        icon_tema = "☀️" if st.session_state.modo_escuro else "🌙"
        if st.button(icon_tema, key="tema_btn_login"):
            st.session_state.modo_escuro = not st.session_state.modo_escuro
            st.rerun()

    if st.session_state.login_view == "index":
        st.markdown('<div class="login-card" style="text-align:center;">', unsafe_allow_html=True)
        st.markdown('<h1 style="margin-bottom:0.3rem !important;">PyFinanças</h1>', unsafe_allow_html=True)
        st.markdown('<p style="font-size:0.9rem;color:__TEXT_SECONDARY__;margin-bottom:1.5rem;">Seu assistente pessoal de controle financeiro</p>', unsafe_allow_html=True)
        st.markdown('<div style="height:1px;background:__CARD_BORDER__;margin-bottom:1.5rem;"></div>', unsafe_allow_html=True)
        st.markdown('<p class="login-desc">Acompanhe receitas, despesas e organize seu orçamento com facilidade.</p>', unsafe_allow_html=True)
        bc1, bc2 = st.columns(2)
        with bc1:
            st.markdown('<div class="login-btn">', unsafe_allow_html=True)
            if st.button("Entrar", key="btn_entrar", use_container_width=True):
                st.session_state.login_view = "login"
                st.rerun()
            st.markdown('</div>', unsafe_allow_html=True)
        with bc2:
            st.markdown('<div class="login-btn">', unsafe_allow_html=True)
            if st.button("Cadastrar", key="btn_cadastrar", use_container_width=True):
                st.session_state.login_view = "signup"
                st.rerun()
            st.markdown('</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)
    else:
        st.markdown('<div class="login-card">', unsafe_allow_html=True)
        st.markdown('<div class="login-voltar">', unsafe_allow_html=True)
        if st.button("← Voltar", key="btn_voltar"):
            st.session_state.login_view = "index"
            st.rerun()
        st.markdown('</div>', unsafe_allow_html=True)
        if st.session_state.login_view == "login":
            st.markdown('<h3 style="margin-bottom:1.25rem;">Entrar</h3>', unsafe_allow_html=True)
            with st.form("login"):
                email = st.text_input("Email")
                password = st.text_input("Senha", type="password")
                if st.form_submit_button("Entrar", use_container_width=True, type="primary"):
                    try:
                        res = supabase.auth.sign_in_with_password({"email": email, "password": password})
                        st.session_state.access_token = res.session.access_token
                        st.session_state.refresh_token = res.session.refresh_token
                        st.session_state.user_email = res.session.user.email
                        st.rerun()
                    except Exception as e:
                        st.error(f"Erro: {e}")
            st.markdown('<div class="login-switch">', unsafe_allow_html=True)
            if st.button("Não tem conta? Cadastre-se", key="ir_cadastro"):
                st.session_state.login_view = "signup"
                st.rerun()
            st.markdown('</div>', unsafe_allow_html=True)
        elif st.session_state.login_view == "signup":
            st.markdown('<h3 style="margin-bottom:1.25rem;">Criar Conta</h3>', unsafe_allow_html=True)
            with st.form("signup"):
                nome = st.text_input("Nome")
                email = st.text_input("Email")
                password = st.text_input("Senha", type="password")
                if st.form_submit_button("Cadastrar", use_container_width=True, type="primary"):
                    try:
                        res = supabase.auth.sign_up({"email": email, "password": password, "options": {"data": {"full_name": nome}}})
                        if res.session:
                            st.session_state.access_token = res.session.access_token
                            st.session_state.refresh_token = res.session.refresh_token
                            st.session_state.user_email = res.session.user.email
                            st.rerun()
                        else:
                            st.success("Conta criada! Verifique seu email para confirmar.")
                    except Exception as e:
                        st.error(f"Erro: {e}")
            st.markdown('<div class="login-switch">', unsafe_allow_html=True)
            if st.button("Já tem conta? Entre", key="ir_login"):
                st.session_state.login_view = "login"
                st.rerun()
            st.markdown('</div>', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

    st.stop()

def carregar_transacoes(usuario_id, mes=None, ano=None, tipo=None, categoria=None):
    query = supabase.table("transacoes").select("*").eq("usuario_id", usuario_id)
    if mes and ano:
        inicio = date(ano, mes, 1)
        fim = date(ano + 1, 1, 1) if mes == 12 else date(ano, mes + 1, 1)
        query = query.gte("data_transacao", inicio.isoformat()).lt("data_transacao", fim.isoformat())
    if tipo:
        query = query.eq("tipo", tipo)
    if categoria:
        query = query.eq("categoria", categoria)
    return query.order("data_transacao", desc=True).execute().data

def format_valor(val, tipo="receita"):
    if tipo == "receita":
        return f'+R$ {val:,.2f}'
    return f'-R$ {abs(val):,.2f}'

def pagina_dashboard(usuario_id):
    st.markdown('<h1>📊 Dashboard</h1>', unsafe_allow_html=True)

    hoje = date.today()
    col_periodo, _ = st.columns([1, 3])
    with col_periodo:
        mes = st.selectbox("", range(1, 13), index=hoje.month - 1,
                           format_func=lambda m: MESES_PT[m - 1], label_visibility="collapsed")
        ano = st.selectbox("", list(range(2020, 2031)), index=hoje.year - 2020,
                           label_visibility="collapsed")

    dados = carregar_transacoes(usuario_id, mes=mes, ano=ano)
    df = pd.DataFrame(dados)

    receitas = despesas = 0.0
    if not df.empty:
        df["valor"] = pd.to_numeric(df["valor"], errors="coerce")
        receitas = df[df["tipo"] == "receita"]["valor"].sum()
        despesas = df[df["tipo"] == "despesa"]["valor"].sum()

    saldo = receitas - despesas

    st.markdown(f"""
    <div class="metric-row">
        <div class="metric-card receita"><div class="metric-label">📈 Receitas</div><div class="metric-value positive">{format_valor(receitas, "receita")}</div></div>
        <div class="metric-card despesa"><div class="metric-label">📉 Despesas</div><div class="metric-value negative">{format_valor(despesas, "despesa")}</div></div>
        <div class="metric-card saldo"><div class="metric-label">💰 Saldo</div><div class="metric-value {'positive' if saldo >= 0 else 'negative'}">{'R$ ' + f'{saldo:,.2f}' if True else ''}</div></div>
    </div>
    """, unsafe_allow_html=True)

    col4, col5 = st.columns(2)

    with col4:
        st.markdown('<div class="card"><h3 style="margin-top:0;">📦 Despesas por Categoria</h3>', unsafe_allow_html=True)
        if not df.empty:
            desp_cat = df[df["tipo"] == "despesa"].groupby("categoria")["valor"].sum().reset_index()
            if not desp_cat.empty:
                fig = px.pie(desp_cat, values="valor", names="categoria",
                             color_discrete_sequence=px.colors.qualitative.Set2, hole=0.45)
                fig.update_layout(margin=dict(t=0, b=0, l=0, r=0), paper_bgcolor="rgba(0,0,0,0)",
                                  font_family="Inter", showlegend=True, legend=dict(orientation="h", y=-0.2))
                st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})
            else:
                st.info("Nenhuma despesa no período.")
        else:
            st.info("Nenhuma despesa no período.")
        st.markdown('</div>', unsafe_allow_html=True)

    with col5:
        st.markdown('<div class="card"><h3 style="margin-top:0;">📈 Evolução Mensal</h3>', unsafe_allow_html=True)
        dados_ano = carregar_transacoes(usuario_id, ano=ano)
        if dados_ano:
            df_ano = pd.DataFrame(dados_ano)
            df_ano["valor"] = pd.to_numeric(df_ano["valor"], errors="coerce")
            df_ano["mes"] = pd.to_datetime(df_ano["data_transacao"]).dt.month
            df_ano["tipo_label"] = df_ano["tipo"].map({"receita": "Receitas", "despesa": "Despesas"})
            agrupado = df_ano.groupby(["mes", "tipo_label"])["valor"].sum().reset_index()
            fig = px.bar(agrupado, x="mes", y="valor", color="tipo_label",
                         color_discrete_map={"Receitas": COR_RECEITA, "Despesas": COR_DESPESA},
                         labels={"mes": "Mês", "valor": "Valor (R$)", "tipo_label": ""})
            fig.update_layout(margin=dict(t=0, b=0, l=0, r=0), paper_bgcolor="rgba(0,0,0,0)",
                              font_family="Inter", xaxis=dict(tickmode="array",
                              tickvals=list(range(1, 13)), ticktext=[m[:3] for m in MESES_PT]),
                              legend=dict(orientation="h", y=1.1))
            fig.update_yaxes(tickprefix="R$ ")
            st.plotly_chart(fig, use_container_width=True, config={"displayModeBar": False})
        else:
            st.info("Nenhum dado no ano.")
        st.markdown('</div>', unsafe_allow_html=True)

    with st.expander("📄 Últimas Transações", expanded=False):
        if not df.empty:
            df_exibir = df.head(10).copy()
            df_exibir["Valor"] = df_exibir.apply(
                lambda r: f'<span style="color:{COR_RECEITA};font-weight:600;">+R$ {r["valor"]:,.2f}</span>'
                if r["tipo"] == "receita" else
                f'<span style="color:{COR_DESPESA};font-weight:600;">-R$ {abs(r["valor"]):,.2f}</span>', axis=1
            )
            df_exibir["data_fmt"] = pd.to_datetime(df_exibir["data_transacao"]).dt.strftime("%d/%m/%Y")
            df_exibir["Tipo"] = df_exibir["tipo"].apply(
                lambda t: f'<span class="badge {"receita" if t == "receita" else "despesa"}">{t.capitalize()}</span>'
            )
            html = df_exibir.head(10).to_html(escape=False, index=False,
                                              columns=["data_fmt", "descricao", "categoria", "Tipo", "Valor"],
                                              header=["Data", "Descrição", "Categoria", "Tipo", "Valor"],
                                              classes="table")
            st.markdown(html, unsafe_allow_html=True)
        else:
            st.info("Nenhuma transação neste período.")

def pagina_nova_transacao(usuario_id):
    st.markdown('<h1>➕ Nova Transação</h1>', unsafe_allow_html=True)

    col_form, _ = st.columns([1, 1])
    with col_form:
        with st.form("nova_transacao"):
            tipo = st.selectbox("Tipo", ["despesa", "receita"],
                                format_func=lambda x: "Despesa" if x == "despesa" else "Receita")
            categoria = st.selectbox("Categoria", CATEGORIAS_DESPESA if tipo == "despesa" else CATEGORIAS_RECEITA)
            descricao = st.text_input("Descrição", placeholder="Ex: Almoço, Freela, etc.")
            valor = st.number_input("Valor (R$)", min_value=0.01, step=0.01, format="%.2f")
            data_t = st.date_input("Data", value=date.today())

            st.markdown("<br>", unsafe_allow_html=True)
            if st.form_submit_button("💾 Salvar Transação", use_container_width=True, type="primary"):
                try:
                    supabase.table("transacoes").insert({
                        "usuario_id": usuario_id,
                        "descricao": descricao,
                        "valor": valor,
                        "tipo": tipo,
                        "categoria": categoria,
                        "data_transacao": data_t.isoformat(),
                    }).execute()
                    st.success("Transação salva com sucesso!")
                    st.rerun()
                except Exception as e:
                    st.error(f"Erro: {e}")

def pagina_extrato(usuario_id):
    st.markdown('<h1>📋 Extrato</h1>', unsafe_allow_html=True)

    st.markdown('<div class="filter-section">', unsafe_allow_html=True)
    col_f1, col_f2, col_f3, col_f4 = st.columns(4)
    with col_f1:
        filtro_mes = st.selectbox("Mês", ["Todos"] + list(range(1, 13)),
                                  format_func=lambda x: MESES_PT[x - 1] if x != "Todos" else "Todos")
    with col_f2:
        filtro_ano = st.selectbox("Ano", ["Todos"] + list(range(2020, 2031)))
    with col_f3:
        filtro_tipo = st.selectbox("Tipo", ["Todos", "receita", "despesa"],
                                   format_func=lambda x: "Receita" if x == "receita" else ("Despesa" if x == "despesa" else "Todos"))
    with col_f4:
        filtro_cat = st.selectbox("Categoria", ["Todas"] + sorted(CATEGORIAS_RECEITA + CATEGORIAS_DESPESA))
    st.markdown('</div>', unsafe_allow_html=True)

    dados = carregar_transacoes(usuario_id)
    df = pd.DataFrame(dados)
    if not df.empty:
        df["data"] = pd.to_datetime(df["data_transacao"])
        if filtro_mes != "Todos":
            df = df[df["data"].dt.month == filtro_mes]
        if filtro_ano != "Todos":
            df = df[df["data"].dt.year == filtro_ano]
        if filtro_tipo != "Todos":
            df = df[df["tipo"] == filtro_tipo]
        if filtro_cat != "Todas":
            df = df[df["categoria"] == filtro_cat]

    if not df.empty:
        df["valor_num"] = pd.to_numeric(df["valor"], errors="coerce")
        df["data_fmt"] = df["data"].dt.strftime("%d/%m/%Y")
        df["Valor"] = df.apply(
            lambda r: f'<span style="color:{COR_RECEITA};font-weight:600;">+R$ {r["valor_num"]:,.2f}</span>'
            if r["tipo"] == "receita" else
            f'<span style="color:{COR_DESPESA};font-weight:600;">-R$ {abs(r["valor_num"]):,.2f}</span>', axis=1
        )
        df["Tipo"] = df["tipo"].apply(
            lambda t: f'<span class="badge {"receita" if t == "receita" else "despesa"}">{t.capitalize()}</span>'
        )

        total = df["valor_num"].sum()
        html = df.to_html(escape=False, index=False,
                          columns=["data_fmt", "descricao", "categoria", "Tipo", "Valor"],
                          header=["Data", "Descrição", "Categoria", "Tipo", "Valor"],
                          classes="table")
        st.markdown(html, unsafe_allow_html=True)

        saldo_class = "positive" if total >= 0 else "negative"
        st.markdown(f"""
        <div class="filter-summary">
            <span class="filter-summary-text">Saldo do filtro: </span>
            <span style="font-size:1.3rem; font-weight:800; color:{COR_RECEITA if total >= 0 else COR_DESPESA};">
                R$ {total:,.2f}
            </span>
        </div>
        """, unsafe_allow_html=True)

        qtd_rec = len(df[df["tipo"] == "receita"])
        qtd_desp = len(df[df["tipo"] == "despesa"])
        st.markdown(f"""
        <div class="filter-count">
            <span>📈 {qtd_rec} receitas</span>
            <span>📉 {qtd_desp} despesas</span>
            <span>📄 {len(df)} transações</span>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.info("Nenhuma transação encontrada com esses filtros.")

def pagina_config(usuario_id):
    st.markdown('<h1>⚙️ Configurações</h1>', unsafe_allow_html=True)

    config = supabase.table("configuracoes").select("*").eq("usuario_id", usuario_id).execute()
    salario_atual = float(config.data[0]["salario_base"]) if config.data else 0.0
    config_id = config.data[0]["id"] if config.data else None

    col_config, _ = st.columns([1, 1])
    with col_config:
        with st.form("config_form"):
            st.markdown("##### 💼 Salário Base")
            novo = st.number_input("Valor do salário mensal", min_value=0.0, step=100.0,
                                   value=salario_atual, format="%.2f", label_visibility="collapsed",
                                   placeholder="Ex: 5000.00")
            if st.form_submit_button("💾 Salvar", use_container_width=True, type="primary"):
                try:
                    if config_id:
                        supabase.table("configuracoes").update({"salario_base": novo}).eq("id", config_id).execute()
                    else:
                        supabase.table("configuracoes").insert({"usuario_id": usuario_id, "salario_base": novo}).execute()
                    st.success("Configurações salvas!")
                    st.rerun()
                except Exception as e:
                    st.error(f"Erro: {e}")

    if salario_atual > 0:
        dados = carregar_transacoes(usuario_id)
        df = pd.DataFrame(dados)
        if not df.empty:
            df["valor"] = pd.to_numeric(df["valor"], errors="coerce")
            total_rec = df[df["tipo"] == "receita"]["valor"].sum()
            total_desp = df[df["tipo"] == "despesa"]["valor"].sum()
            economia = total_rec - total_desp
            perc_gasto = (total_desp / salario_atual) * 100 if salario_atual > 0 else 0

            st.markdown("<br><hr>", unsafe_allow_html=True)
            st.markdown("##### 📊 Resumo Geral")
            st.markdown(f"""
            <div class="metric-row">
                <div class="metric-card"><div class="metric-label">💰 Salário Base</div><div class="metric-value neutral">R$ {salario_atual:,.2f}</div></div>
                <div class="metric-card receita"><div class="metric-label">📈 Total Receitas</div><div class="metric-value positive">{format_valor(total_rec, "receita")}</div></div>
                <div class="metric-card despesa"><div class="metric-label">📉 Total Despesas</div><div class="metric-value negative">{format_valor(total_desp, "despesa")}</div></div>
                <div class="metric-card saldo"><div class="metric-label">💵 Economia</div><div class="metric-value {"positive" if economia >= 0 else "negative"}">R$ {economia:,.2f}</div></div>
            </div>
            """, unsafe_allow_html=True)

            st.markdown("##### 📊 Gastos vs Salário")
            st.progress(min(perc_gasto / 100, 1.0),
                       text=f'Você já gastou **{perc_gasto:.1f}%** do seu salário em despesas')

def pagina_renda_extra(usuario_id):
    st.markdown('<h1>💰 Renda Extra</h1>', unsafe_allow_html=True)
    st.markdown('<p style="color: var(--text-secondary, #64748b); margin-bottom: 1.5rem;">Registre receitas extras que entram fora do salário fixo.</p>', unsafe_allow_html=True)

    with st.form("renda_extra"):
        col1, col2 = st.columns(2)
        with col1:
            nome = st.text_input("Nome", placeholder="Ex: Bico, Freela, Venda")
        with col2:
            valor = st.number_input("Valor (R$)", min_value=0.01, step=0.01, format="%.2f")
        descricao = st.text_area("Descrição", placeholder="Descreva a origem dessa renda extra...")

        st.markdown("<br>", unsafe_allow_html=True)
        if st.form_submit_button("💾 Adicionar Renda Extra", use_container_width=True, type="primary"):
            try:
                supabase.table("transacoes").insert({
                    "usuario_id": usuario_id,
                    "descricao": f"{nome} - {descricao}" if descricao else nome,
                    "valor": valor,
                    "tipo": "receita",
                    "categoria": "Renda Extra",
                    "data_transacao": date.today().isoformat(),
                }).execute()
                st.success(f"Renda extra de R$ {valor:,.2f} adicionada com sucesso!")
                st.rerun()
            except Exception as e:
                st.error(f"Erro: {e}")

if restaurar_sessao():
    user = supabase.auth.get_user()
    usuario_id = user.user.id

    if "sidebar_aberto" not in st.session_state:
        st.session_state.sidebar_aberto = False

    _col_l, _col_c, _col_r = st.columns([1, 10, 1])
    with _col_l:
        if not st.session_state.sidebar_aberto:
            if st.button("☰", key="hamburger_btn"):
                st.session_state.sidebar_aberto = True
                st.rerun()
    with _col_r:
        icon_tema = "☀️" if st.session_state.modo_escuro else "🌙"
        if st.button(icon_tema, key="tema_btn"):
            st.session_state.modo_escuro = not st.session_state.modo_escuro
            st.rerun()

    # Dynamic CSS for sidebar slide
    sidebar_x = "0" if st.session_state.sidebar_aberto else "-100%"
    overlay_op = "1" if st.session_state.sidebar_aberto else "0"
    st.markdown(f"""
    <style>
        section[data-testid="stSidebar"] {{
            transform: translateX({sidebar_x}) !important;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            position: fixed !important;
            top: 0 !important; left: 0 !important; bottom: 0 !important;
            min-width: 260px !important; width: 260px !important;
            z-index: 1000 !important;
        }}
        .sidebar-backdrop {{
            position: fixed !important; top: 0 !important; left: 0 !important;
            right: 0 !important; bottom: 0 !important;
            background: rgba(0,0,0,0.3) !important;
            opacity: {overlay_op} !important;
            transition: opacity 0.3s ease !important;
            pointer-events: {'auto' if st.session_state.sidebar_aberto else 'none'} !important;
            z-index: 999 !important;
        }}
        div[data-testid="stAppViewContainer"] {{
            margin-left: 0 !important; max-width: 100% !important;
        }}
        section[data-testid="stAppViewBlock"] {{
            margin-left: 0 !important; max-width: 100% !important;
        }}
    </style>
    <div class="sidebar-backdrop"></div>
    """, unsafe_allow_html=True)

    with st.sidebar:
        st.markdown('<div class="sidebar-brand">💰 <span>PyFinanças</span></div>', unsafe_allow_html=True)
        st.markdown(f'<div class="sidebar-user">👤 {st.session_state.user_email}</div>', unsafe_allow_html=True)

        pagina = st.radio("", ["📊 Dashboard", "➕ Nova Transação", "💵 Renda Extra", "📋 Extrato", "⚙️ Configurações"],
                          label_visibility="collapsed")

        st.markdown("<br><br>", unsafe_allow_html=True)
        if st.button("🚪 Sair", use_container_width=True):
            supabase.auth.sign_out()
            for k in ["access_token", "refresh_token", "user_email"]:
                st.session_state.pop(k, None)
            st.rerun()

    mapa_paginas = {
        "📊 Dashboard": "Dashboard",
        "➕ Nova Transação": "Nova Transação",
        "💵 Renda Extra": "Renda Extra",
        "📋 Extrato": "Extrato",
        "⚙️ Configurações": "Configurações",
    }
    if mapa_paginas[pagina] == "Dashboard":
        pagina_dashboard(usuario_id)
    elif mapa_paginas[pagina] == "Nova Transação":
        pagina_nova_transacao(usuario_id)
    elif mapa_paginas[pagina] == "Renda Extra":
        pagina_renda_extra(usuario_id)
    elif mapa_paginas[pagina] == "Extrato":
        pagina_extrato(usuario_id)
    elif mapa_paginas[pagina] == "Configurações":
        pagina_config(usuario_id)
else:
    pagina_login()
