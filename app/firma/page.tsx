/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const VERIFY_URL = process.env.VERIFY_FN_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const q = await searchParams;
  const email = (q.email as string | undefined || "").toLowerCase();

  if (!email) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-3">
        <h1 className="text-2xl font-bold">Firma Paneli</h1>
        <form className="flex gap-2" method="GET">
          <input
            name="email"
            type="email"
            placeholder="Kayıtlı e-posta"
            className="border p-2 rounded flex-1"
            required
          />
          <button className="bg-black text-white rounded px-3">Giriş</button>
        </form>
      </div>
    );
  }

  const verifyRes = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${ANON}`, "Content-Type":"application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  });
  if (!verifyRes.ok) {
    const j = await verifyRes.json().catch(()=>({reason:""}));
    return <div className="max-w-xl mx-auto p-6">Erişim engellendi: {j.reason || "üyelik yok"}.</div>;
  }

  const { data: prov } = await supabaseAdmin
    .from("providers").select("id, firm_name, approved_with_ticimax")
    .eq("contact_email", email).maybeSingle();

  if (!prov) return <div className="max-w-xl mx-auto p-6">Firma kaydı bulunamadı.</div>;

  const { data: agg } = await supabaseAdmin
    .from("orders").select("total_amount, qty")
    .eq("provider_id", prov.id);

  const totalSales = (agg || []).reduce((s, r:any)=> s + Number(r.total_amount || 0), 0);
  const totalQty   = (agg || []).reduce((s, r:any)=> s + Number(r.qty || 0), 0);

  const { data: last10 } = await supabaseAdmin
    .from("orders")
    .select("customer_email, qty, total_amount, status, ordered_at")
    .eq("provider_id", prov.id)
    .order("ordered_at", { ascending: false })
    .limit(10);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{prov.firm_name} • Panel</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded p-4">
          <div className="text-sm text-gray-500">Toplam Ciro</div>
          <div className="text-2xl font-semibold">{totalSales.toFixed(2)} ₺</div>
        </div>
        <div className="border rounded p-4">
          <div className="text-sm text-gray-500">Toplam Adet</div>
          <div className="text-2xl font-semibold">{totalQty}</div>
        </div>
      </div>

      <div className="border rounded">
        <div className="px-4 py-2 font-semibold bg-gray-50">Son 10 Sipariş</div>
        <div className="divide-y">
          {last10?.map((o, i) => (
            <div key={i} className="px-4 py-2 text-sm flex justify-between">
              <span>{o.customer_email}</span>
              <span>{o.qty} • {Number(o.total_amount).toFixed(2)} ₺ • {o.status}</span>
              <span>{new Date(o.ordered_at as any).toLocaleString()}</span>
            </div>
          )) || <div className="px-4 py-2 text-sm">Kayıt yok</div>}
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Üyelik doğrulaması: {prov.approved_with_ticimax ? "✓" : "—"}
      </div>
    </div>
  );
}
