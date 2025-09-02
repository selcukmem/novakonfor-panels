'use client';
import { useState } from 'react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.ok) {
        const { next } = await res.json();
        window.location.href = next || '/admin';
      } else {
        const { message } = await res.json();
        setErr(message || 'Hatalı giriş');
      }
    } catch {
      setErr('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f5f9ff'}}>
      <form onSubmit={onSubmit} style={{background:'#fff',padding:24,borderRadius:12,width:360,boxShadow:'0 10px 30px rgba(0,0,0,.08)'}}>
        <h1 style={{margin:'0 0 12px',fontSize:20}}>Admin Girişi</h1>
        <p style={{margin:'0 0 16px',color:'#666'}}>novakonfor • yönetim</p>

        <label style={{display:'block',fontSize:14,marginBottom:6}}>E-posta</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} required
               style={{width:'100%',padding:'10px 12px',border:'1px solid #dbeaff',borderRadius:8,marginBottom:12}}/>

        <label style={{display:'block',fontSize:14,marginBottom:6}}>Şifre</label>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)} required
               style={{width:'100%',padding:'10px 12px',border:'1px solid #dbeaff',borderRadius:8,marginBottom:12}}/>

        {err && <div style={{background:'#ffe8e8',color:'#b20000',padding:10,borderRadius:8,marginBottom:12}}>{err}</div>}

        <button disabled={loading}
                style={{width:'100%',padding:'10px 12px',border:'none',borderRadius:8,background:'#0056b3',color:'#fff',cursor:'pointer'}}>
          {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>
      </form>
    </div>
  );
}
