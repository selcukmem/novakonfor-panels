import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM!;
const BASE = process.env.BASE_URL!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;

export default async function Page() {
  async function guard(formData: FormData) {
    "use server";
    const e = String(formData.get("admin_email") || "").toLowerCase();
    if (e !== ADMIN_EMAIL.toLowerCase()) throw new Error("Admin değil");
  }

  async function approve(formData: FormData) {
    "use server";
    const id = String(formData.get("id"));
    const email = String(formData.get("email")).toLowerCase();

    const { data: prov } = await supabaseAdmin
      .from("providers")
      .update({ status: "approved" })
      .eq("id", id)
      .select("id, contact_email")
      .maybeSingle();

    if (prov?.id)
      await supabaseAdmin
        .from("provider_users")
        .upsert({ provider_id: prov.id, email });

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "NovaKonfor Firma Paneli",
      html: `<p>Merhaba, başvurunuz onaylandı.</p>
             <p>Panel: <a href="${BASE}/firma?email=${encodeURIComponent(email)}">
             ${BASE}/firma?email=${encodeURIComponent(email)}</a></p>
             <p>Not: Panel girişi Ticimax üyeliği ile doğrulanır.</p>`,
    });
  }

  async function reject(formData: FormData) {
    "use server";
    const id = String(formData.get("id"));
    await supabaseAdmin
      .from("providers")
      .update({ status: "rejected" })
      .eq("id", id);
  }

  const { data: list } = await supabaseAdmin
    .from("providers")
    .select(
      "id, firm_name, contact_name, contact_phone, contact_email, status"
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* ---- Dashboard Menü ---- */}
      <div className="flex gap-3 mb-6">
        <a
          href="/admin"
          className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
        >
          Başvurular
        </a>
        <a
          href="/admin/firma-listesi"
          className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
        >
          Firmalar
        </a>
        <a
          href="/admin/urunler"
          className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
        >
          Ürün/Hizmetler
        </a>
        <form action="/api/admin/logout" method="post">
          <button className="px-3 py-2 rounded bg-red-600 text-white">
            Çıkış
          </button>
        </form>
      </div>

      {/* ---- Başvuru Yönetimi ---- */}
      <h1 className="text-2xl font-bold">Admin Onay</h1>

      <form
        action={guard}
        className="flex gap-2 items-center border p-3 rounded"
      >
        <input
          name="admin_email"
          type="email"
          placeholder="Admin e-posta"
          className="border p-2 rounded flex-1"
          required
        />
        <button className="bg-black text-white rounded p-2">
          Yetki Doğrula
        </button>
      </form>

      <div className="space-y-4">
        {list?.length ? (
          list.map((p) => (
            <div
              key={p.id}
              className="border rounded p-3 flex flex-col gap-2"
            >
              <div className="font-semibold">{p.firm_name}</div>
              <div className="text-sm text-gray-600">
                {p.contact_name} • {p.contact_phone} • {p.contact_email}
              </div>
              <div className="flex gap-2">
                <form action={approve}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="email" value={p.contact_email} />
                  <button className="bg-green-600 text-white rounded px-3 py-1">
                    Onayla + Mail
                  </button>
                </form>
                <form action={reject}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="bg-red-600 text-white rounded px-3 py-1">
                    Reddet
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div>Bekleyen başvuru yok.</div>
        )}
      </div>
    </div>
  );
}
