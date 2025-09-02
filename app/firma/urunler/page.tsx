/* eslint-disable @typescript-eslint/no-explicit-any */
// app/firma/urunler/page.tsx
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

// ====== AYAR ======
const TABLE = "provider_products";
export const dynamic = "force-dynamic";

// Admin client (service_role) — istersen anon’a geçiririz
function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

// ====== SERVER ACTIONS ======
export async function addProduct(formData: FormData) {
  "use server";
  const sb = supabaseAdmin();
  const firmEmail = cookies().get("firm_email")?.value || "";
  if (!firmEmail) return { ok: false, msg: "Giriş yok" };

  const title = String(formData.get("title") || "").trim();
  const price = formData.get("price");
  const sku = String(formData.get("sku") || "").trim();
  const unit = String(formData.get("unit") || "").trim();
  const stock = formData.get("stock");
  const category = String(formData.get("category") || "").trim();
  const status = String(formData.get("status") || "active");

  if (!title || !sku) return { ok: false, msg: "Zorunlu: başlık, SKU" };

  const { data: exists, error: checkErr } = await sb
    .from(TABLE).select("id")
    .eq("provider_email", firmEmail).eq("sku", sku).maybeSingle();
  if (checkErr) return { ok: false, msg: checkErr.message };
  if (exists) return { ok: false, msg: "Bu SKU sende zaten var." };

  const payload: any = {
    provider_email: firmEmail, title, sku, status,
    unit: unit || null, category: category || null,
  };
  if (price !== null && String(price) !== "") payload.price = Number(price);
  if (stock !== null && String(stock) !== "") payload.stock = Number(stock);

  const { error } = await sb.from(TABLE).insert([payload]);
  if (error) return { ok: false, msg: error.message };

  revalidatePath(`/firma/urunler`);
  return { ok: true, msg: "Ürün eklendi." };
}

export async function setStatus(formData: FormData) {
  "use server";
  const sb = supabaseAdmin();
  const firmEmail = cookies().get("firm_email")?.value || "";
  if (!firmEmail) return { ok: false, msg: "Giriş yok" };

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "inactive");
  if (!id) return { ok: false, msg: "id yok" };

  const { error } = await sb.from(TABLE)
    .update({ status })
    .eq("id", id).eq("provider_email", firmEmail);
  if (error) return { ok: false, msg: error.message };

  revalidatePath(`/firma/urunler`);
  return { ok: true, msg: "Durum güncellendi." };
}

export async function delProduct(formData: FormData) {
  "use server";
  const sb = supabaseAdmin();
  const firmEmail = cookies().get("firm_email")?.value || "";
  if (!firmEmail) return { ok: false, msg: "Giriş yok" };

  const id = String(formData.get("id") || "");
  if (!id) return { ok: false, msg: "id yok" };

  const { error } = await sb.from(TABLE)
    .delete().eq("id", id).eq("provider_email", firmEmail);
  if (error) return { ok: false, msg: error.message };

  revalidatePath(`/firma/urunler`);
  return { ok: true, msg: "Silindi." };
}

export async function updateProduct(formData: FormData) {
  "use server";
  const sb = supabaseAdmin();
  const firmEmail = cookies().get("firm_email")?.value || "";
  if (!firmEmail) return { ok: false, msg: "Giriş yok" };

  const id = String(formData.get("id") || "");
  if (!id) return { ok: false, msg: "id yok" };

  const payload: any = {};
  const val = (k: string) => formData.get(k);

  const t = String(val("title") ?? "").trim();
  if (t) payload.title = t;

  const p = String(val("price") ?? "").trim();
  if (p !== "") payload.price = Number(p);

  const s = String(val("sku") ?? "").trim();
  if (s) payload.sku = s;

  const u = String(val("unit") ?? "").trim();
  if (u) payload.unit = u;

  const st = String(val("stock") ?? "").trim();
  if (st !== "") payload.stock = Number(st);

  const c = String(val("category") ?? "").trim();
  if (c) payload.category = c;

  const { error } = await sb.from(TABLE)
    .update(payload).eq("id", id).eq("provider_email", firmEmail);
  if (error) return { ok: false, msg: error.message };

  revalidatePath(`/firma/urunler`);
  return { ok: true, msg: "Güncellendi." };
}

// ====== PAGE (READ + FORM) ======
export default async function Page({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const sb = supabaseAdmin();
  const firmEmail = cookies().get("firm_email")?.value || "";
  if (!firmEmail) {
    return (
      <div style={{ padding: 20, fontFamily: "Arial" }}>
        Giriş yok. Test için{" "}
        <a href="/api/mock-login?email=navikonfortest@gmail.com">mock login</a>
        .
      </div>
    );
  }

  const q = (searchParams?.q || "").trim();
  const status = (searchParams?.status || "").trim();

  let query = sb
    .from(TABLE)
    .select("id,created_at,provider_email,title,price,sku,unit,stock,category,status")
    .eq("provider_email", firmEmail)
    .order("created_at", { ascending: false })
    .limit(200);

  if (status) query = query.eq("status", status);
  if (q) query = query.or(`title.ilike.%${q}%,sku.ilike.%${q}%`);

  const { data: rows, error } = await query;

  return (
    <div style={styles.wrap}>
      <h1 style={styles.h1}>Firma Ürünler</h1>

      <div style={styles.toolbar}>
        <form style={styles.row} action="">
          <input
            type="text"
            name="q"
            placeholder="Ara: Başlık / SKU"
            defaultValue={q}
            style={styles.input}
          />
          <select name="status" defaultValue={status} style={styles.input}>
            <option value="">Hepsi</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
          <button style={styles.btn}>Filtrele</button>
          {(q || status) ? (
            <Link href={`/firma/urunler`} style={styles.linkReset}>Sıfırla</Link>
          ) : null}
        </form>
      </div>

      <details open style={styles.card}>
        <summary style={styles.summary}>Yeni Ürün Ekle</summary>
        <form action={addProduct} style={styles.form}>
          <div style={styles.grid}>
            <input name="title" required placeholder="Başlık *" style={styles.input}/>
            <input name="price" type="number" step="0.01" placeholder="Fiyat" style={styles.input}/>
            <input name="sku" required placeholder="SKU *" style={styles.input}/>
            <input name="unit" placeholder="Birim (adet, lt, kg…)" style={styles.input}/>
            <input name="stock" type="number" placeholder="Stok" style={styles.input}/>
            <input name="category" placeholder="Kategori" style={styles.input}/>
            <select name="status" defaultValue="active" style={styles.input}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </div>
          <button style={styles.btnPrimary}>Kaydet</button>
        </form>
      </details>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Başlık</th>
              <th>Fiyat</th>
              <th>SKU</th>
              <th>Birim</th>
              <th>Stok</th>
              <th>Kategori</th>
              <th>Durum</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr><td colSpan={8} style={{color:"#b00020"}}>Hata: {error.message}</td></tr>
            ) : rows && rows.length ? (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.title}</td>
                  <td>{Number(r.price || 0).toLocaleString("tr-TR")}</td>
                  <td>{r.sku}</td>
                  <td>{r.unit || "-"}</td>
                  <td>{r.stock ?? "-"}</td>
                  <td>{r.category || "-"}</td>
                  <td>{r.status}</td>
                  <td>
                    {/* Durum güncelle */}
                    <form action={setStatus} style={styles.inline}>
                      <input type="hidden" name="id" value={r.id} />
                      <select name="status" defaultValue={r.status} style={styles.inputXs}>
                        <option value="active">active</option>
                        <option value="inactive">inactive</option>
                      </select>
                      <button style={styles.btnXs}>Kaydet</button>
                    </form>

                    {/* Sil */}
                    <form action={delProduct} style={styles.inline}>
                      <input type="hidden" name="id" value={r.id} />
                      <button style={styles.btnDangerXs} aria-label="Sil">Sil</button>
                    </form>

                    {/* Düzenle */}
                    <details style={styles.inlineDetails}>
                      <summary style={styles.linkLike}>Düzenle</summary>
                      <form action={updateProduct} style={styles.editGrid}>
                        <input type="hidden" name="id" value={r.id} />
                        <input name="title" defaultValue={r.title} placeholder="Başlık" style={styles.input}/>
                        <input name="price" type="number" step="0.01" defaultValue={r.price ?? ""} placeholder="Fiyat" style={styles.input}/>
                        <input name="sku" defaultValue={r.sku} placeholder="SKU" style={styles.input}/>
                        <input name="unit" defaultValue={r.unit ?? ""} placeholder="Birim" style={styles.input}/>
                        <input name="stock" type="number" defaultValue={r.stock ?? ""} placeholder="Stok" style={styles.input}/>
                        <input name="category" defaultValue={r.category ?? ""} placeholder="Kategori" style={styles.input}/>
                        <button style={styles.btnXs}>Güncelle</button>
                      </form>
                    </details>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8}>Kayıt yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ====== Stil
const styles: Record<string, React.CSSProperties> = {
  wrap:{maxWidth:1080,margin:"20px auto",padding:"12px",fontFamily:"Arial, sans-serif"},
  h1:{fontSize:22,margin:"0 0 12px"},
  toolbar:{margin:"8px 0 16px"},
  row:{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"},
  input:{padding:"10px 12px",border:"1px solid #cfd8e3",borderRadius:8,minWidth:180},
  inputXs:{padding:"6px 8px",border:"1px solid #cfd8e3",borderRadius:6,minWidth:90},
  btn:{padding:"10px 14px",border:"1px solid #0d6efd",background:"#0d6efd",color:"#fff",borderRadius:8,cursor:"pointer"},
  btnPrimary:{padding:"12px 16px",border:"1px solid #0d6efd",background:"#0d6efd",color:"#fff",borderRadius:10,marginTop:8,cursor:"pointer"},
  btnXs:{padding:"6px 10px",border:"1px solid #0d6efd",background:"#0d6efd",color:"#fff",borderRadius:6,marginLeft:6,cursor:"pointer"},
  btnDangerXs:{padding:"6px 10px",border:"1px solid #c62828",background:"#c62828",color:"#fff",borderRadius:6,marginLeft:6,cursor:"pointer"},
  linkReset:{padding:"10px 14px",border:"1px solid #94a3b8",background:"#fff",color:"#111",borderRadius:8,textDecoration:"none"},
  card:{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:"8px 12px"},
  summary:{fontWeight:600,margin:"6px 0",cursor:"pointer"},
  form:{marginTop:8},
  grid:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px,1fr))",gap:10},
  tableWrap:{overflowX:"auto",marginTop:16},
  table:{width:"100%",borderCollapse:"collapse"},
  inline:{display:"inline-flex",alignItems:"center",marginRight:6},
  inlineDetails:{display:"inline-block",marginLeft:6},
  linkLike:{display:"inline-block",marginLeft:6,cursor:"pointer",color:"#0d6efd"},
  editGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8,marginTop:8,alignItems:"center"},
};

// Tip (opsiyonel)
export type ProviderProduct = {
  id: string;
  created_at: string;
  provider_email: string;
  title: string;
  price: number | null;
  sku: string;
  unit: string | null;
  stock: number | null;
  category: string | null;
  status: "active" | "inactive";
};
