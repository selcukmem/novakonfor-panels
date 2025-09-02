import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const em = String(body.email || '').trim().toLowerCase();
  const pw = String(body.password || '').trim();

  const envEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const envPass  = String(process.env.ADMIN_PASSWORD || '').trim();

  const ok = em === envEmail && pw === envPass;
  if (!ok) {
    return NextResponse.json({ message: 'E-posta veya şifre hatalı' }, { status: 401 });
  }

  const nextUrl = new URL(req.url).searchParams.get('next') || '/admin';
  const res = NextResponse.json({ next: nextUrl }, { status: 200 });

  res.cookies.set('admin_session', process.env.ADMIN_SESSION_TOKEN!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: 60 * 60 * 8,
  });
  return res;
}
