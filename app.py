import streamlit as st
import pandas as pd
from datetime import date
from core import Database, TaxpayerService, SourceService, TransactionService, PaymentMethodService, Transaction, TransactionType

# --- APP CONFIG ---
st.set_page_config(page_title="mTax - Finansal Yönetim", layout="wide")

@st.cache_resource
def init_core():
    db = Database()
    db.init_db()
    return {
        "tp": TaxpayerService(db),
        "src": SourceService(db),
        "tx": TransactionService(db),
        "pm": PaymentMethodService(db)
    }

core = init_core()

# --- SIDEBAR: FILTERS ---
st.sidebar.title("🔍 Filtreler")
taxpayers = core["tp"].get_all()
tp_opts = {tp.id: tp.full_name for tp in taxpayers}

current_year = date.today().year
years = [None] + list(range(current_year, current_year - 5, -1))
sel_year = st.sidebar.selectbox("📅 Yıl", options=years, format_func=lambda x: "Tümü" if x is None else str(x), index=1)
sel_tp = st.sidebar.selectbox("👤 Mükellef", options=[None] + list(tp_opts.keys()), format_func=lambda x: "Tümü" if x is None else tp_opts[x])
sel_type = st.sidebar.selectbox("↕️ Tip", options=[None, TransactionType.INCOME, TransactionType.EXPENSE], format_func=lambda x: {None: "Tümü", 1: "Gelir", -1: "Gider"}[x])

st.sidebar.divider()
st.sidebar.caption("mTax v1.2 | Özelleştirilmiş Takip")

# --- MAIN CONTENT ---
st.title("🚀 mTax: Akıllı Finans Yönetimi")
tab1, tab2, tab3 = st.tabs(["📊 Özet & Liste", "➕ Yeni İşlem", "⚙️ Yönetim"])

sources = core["src"].get_all()
pms = core["pm"].get_all()

# TAB 1: DASHBOARD
with tab1:
    txs = core["tx"].get_transactions(sel_year, sel_tp, sel_type)
    sum_data = core["tx"].get_summary(sel_year, sel_tp, sel_type)
    
    col_m1, col_m2, col_m3, col_m4 = st.columns(4)
    col_m1.metric("Toplam Gelir", f"{sum_data['total_income']:,.2f} TL")
    col_m2.metric("Toplam Gider", f"{sum_data['total_expense']:,.2f} TL")
    col_m3.metric("Net Durum", f"{sum_data['net_income']:,.2f} TL")
    col_m4.metric("Vergi Matrahı", f"{sum_data['taxable_income']:,.2f} TL")
    
    st.subheader(f"📝 İşlemler ({len(txs)})")
    if txs:
        df = pd.DataFrame(txs)
        df['Tarih'] = pd.to_datetime(df['transaction_date']).dt.date
        df['Tutar'] = df.apply(lambda x: x['amount'] if x['type'] == 1 else -x['amount'], axis=1)
        df['Tip'] = df['type'].map({1: 'Gelir', -1: 'Gider'})
        df['V.'] = df['is_taxable'].map({1: '✅', 0: '❌'})
        
        view_df = df[['Tarih', 'taxpayer_name', 'Tip', 'source_name', 'description', 'Tutar', 'V.']].rename(
            columns={'taxpayer_name': 'Mükellef', 'source_name': 'Kaynak', 'description': 'Açıklama'}
        )
        st.dataframe(view_df, use_container_width=True, hide_index=True, column_config={"Tutar": st.column_config.NumberColumn(format="%.2f TL")})
        
        csv = view_df.to_csv(index=False).encode('utf-8-sig')
        st.download_button("📥 CSV Olarak İndir", csv, f"mtax_{date.today()}.csv", "text/csv")
    else:
        st.info("Gösterilecek veri bulunamadı.")

# TAB 2: ADD
with tab2:
    st.subheader("Yeni Kayıt Ekle")
    with st.form("add_form", clear_on_submit=True):
        c1, c2 = st.columns(2)
        with c1:
            f_tp = st.selectbox("Mükellef", options=tp_opts.keys(), format_func=lambda x: tp_opts[x])
            f_type = st.radio("Tip", [1, -1], format_func=lambda x: "Gelir" if x == 1 else "Gider", horizontal=True)
            f_amt = st.number_input("Tutar", min_value=0.0, step=100.0)
            f_tax = st.checkbox("Beyana Dahil", value=True)
        with c2:
            sc1, sc2, sc3 = st.columns(3)
            f_y = sc1.number_input("Yıl", 2000, 2100, date.today().year)
            f_m = sc2.number_input("Ay", 0, 12, 0)
            f_d = sc3.number_input("Gün", 0, 31, 0)
            f_src = st.selectbox("Kaynak", options={s.id: s.name for s in sources}.keys(), format_func=lambda x: {s.id: s.name for s in sources}[x])
            f_pm = st.selectbox("Ödeme Yöntemi", options={p.id: p.method_name for p in pms}.keys(), format_func=lambda x: {p.id: p.method_name for p in pms}[x])
            
        f_desc = st.text_area("Açıklama")
        f_doc = st.text_input("Belge No")
        if st.form_submit_button("Kaydet", type="primary", use_container_width=True):
            dt = date(f_y, f_m or 6, f_d or 15)
            new_tx = Transaction(None, f_tp, dt, f_y, f_m or None, f_d or None, f_type, f_src, f_pm, f_amt, f_desc, f_doc, f_tax, None)
            core["tx"].add_transaction(new_tx)
            st.success("Kayıt eklendi!")
            st.toast("Veri Güncellendi")

# TAB 3: MANAGE
with tab3:
    st.subheader("Kayıt Düzenle / Sil")
    all_all = core["tx"].get_transactions()
    search = st.text_input("🔍 Ara (ID, Mükellef, Açıklama)")
    filtered = [t for t in all_all if search.lower() in f"{t['id']} {t['taxpayer_name']} {t['description']}".lower()]
    
    if filtered:
        sel_item = st.selectbox("İşlem Seçin", options=[t['id'] for t in filtered[:100]], format_func=lambda x: next(f"ID:{t['id']} | {t['transaction_date']} | {t['amount']} TL" for t in filtered if t['id'] == x))
        rec = next(t for t in all_all if t['id'] == sel_item)
        with st.form("edit_form"):
            e1, e2 = st.columns(2)
            with e1:
                e_tp = st.selectbox("Mükellef", tp_opts.keys(), format_func=lambda x: tp_opts[x], index=list(tp_opts.keys()).index(rec['taxpayer_id']))
                e_type = st.radio("Tip", [1, -1], index=0 if rec['type'] == 1 else 1, format_func=lambda x: "Gelir" if x == 1 else "Gider", horizontal=True)
                e_amt = st.number_input("Tutar", value=float(rec['amount']))
            with e2:
                ec1, ec2, ec3 = st.columns(3)
                e_y = ec1.number_input("Yıl", 2000, 2100, rec['year'] or 2024)
                e_m = ec2.number_input("Ay", 0, 12, rec['month'] or 0)
                e_d = ec3.number_input("Gün", 0, 31, rec['day'] or 0)
                e_src = st.selectbox("Kaynak", {s.id: s.name for s in sources}.keys(), format_func=lambda x: {s.id: s.name for s in sources}[x], index=list({s.id: s.name for s in sources}.keys()).index(rec['source_id']))
                e_pm = st.selectbox("Ödeme", {p.id: p.method_name for p in pms}.keys(), format_func=lambda x: {p.id: p.method_name for p in pms}[x], index=list({p.id: p.method_name for p in pms}.keys()).index(rec['payment_method_id']))
            
            e_desc = st.text_area("Açıklama", value=rec['description'] or "")
            e_doc = st.text_input("Belge No", value=rec['document_no'] or "")
            e_tax = st.checkbox("Beyana Dahil", value=bool(rec['is_taxable']))
            
            b1, b2 = st.columns(2)
            if b1.form_submit_button("Güncelle", use_container_width=True):
                edt = date(e_y, e_m or 6, e_d or 15)
                up_tx = Transaction(sel_item, e_tp, edt, e_y, e_m or None, e_d or None, e_type, e_src, e_pm, e_amt, e_desc, e_doc, e_tax, rec['tax_item_code'])
                core["tx"].update_transaction(up_tx)
                st.success("Güncellendi!"); st.rerun()
            if b2.form_submit_button("SİL", use_container_width=True):
                core["tx"].delete_transaction(sel_item)
                st.warning("Silindi!"); st.rerun()
