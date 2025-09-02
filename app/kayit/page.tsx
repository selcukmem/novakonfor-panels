import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function Page() {
  async function submit(formData: FormData) {
    "use server";
    const firm_name = String(formData.get("firm_name") || "");
    const contact_name = String(formData.get("contact_name") || "");
    const contact_phone = String(formData.get("contact_phone") || "");
    const contact_email = String(formData.get("contact_email") || "").toLowerCase();
    const category_slug = String(formData.get("category") || "");
    if (!firm_name || !contact_email || !category_slug) return;

    const { data: cat } = await supabaseAdmin
      .from("categories").select("id").eq("slug", category_slug).maybeSingle();

    await supabaseAdmin.from("providers").insert({
      firm_name, contact_name, contact_phone, contact_email,
      category_id: cat?.id ?? null, status: "pending"
    });
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Tedarikçi Başvurusu</h1>
      <form action={submit} className="grid gap-3">
        <input name="firm_name" placeholder="Firma adı" className="border p-2 rounded" required />
        <input name="contact_name" placeholder="Ad Soyad" className="border p-2 rounded" />
        <input name="contact_phone" placeholder="Telefon" className="border p-2 rounded" />
        <input name="contact_email" type="email" placeholder="E-posta" className="border p-2 rounded" required />
        <select name="category" className="border p-2 rounded" required>
          <option value="">Kategori seç</option>
          <option value="rentacar">Araç Kiralama</option>
          <option value="aracyikama">Araç Yıkama</option>
          <option value="servis">Araç Servis</option>
          <option value="su">Damacana Su</option>
          <option value="market">Market</option>
        </select>
        <button className="bg-black text-white rounded p-2">Gönder</button>
      </form>
      <p className="text-sm text-gray-500">Admin onayı sonrası aktif olur.</p>
    </div>
  );
}
