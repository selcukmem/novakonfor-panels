import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function FirmaListesiPage() {
  const { data: firms } = await supabaseAdmin
    .from("providers")
    .select("id, firm_name, category, contact_name, contact_phone, contact_email, status")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Menü üstte sabit */}
      <div className="flex gap-3 mb-6">
        <a href="/admin" className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">Başvurular</a>
        <a href="/admin/firma-listesi" className="px-3 py-2 rounded bg-blue-600 text-white">Firmalar</a>
        <a href="/admin/urunler" className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">Ürün/Hizmetler</a>
        <form action="/api/admin/logout" method="post">
          <button className="px-3 py-2 rounded bg-red-600 text-white">Çıkış</button>
        </form>
      </div>

      <h1 className="text-2xl font-bold">Firma Listesi</h1>

      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">Firma</th>
              <th className="p-2">Kategori</th>
              <th className="p-2">İletişim</th>
              <th className="p-2">E-posta</th>
              <th className="p-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {firms?.length ? firms.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="p-2">{f.firm_name}</td>
                <td className="p-2">{f.category}</td>
                <td className="p-2">{f.contact_name} • {f.contact_phone}</td>
                <td className="p-2">{f.contact_email}</td>
                <td className="p-2">
                  {f.status === "approved" && <span className="text-green-600 font-semibold">Onaylı</span>}
                  {f.status === "pending" && <span className="text-yellow-600 font-semibold">Bekliyor</span>}
                  {f.status === "rejected" && <span className="text-red-600 font-semibold">Reddedildi</span>}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">Henüz firma yok.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
