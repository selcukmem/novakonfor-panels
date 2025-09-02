import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ ok:false, msg:"email yok" }, { status:400 });

  const res = NextResponse.redirect(new URL("/firma/urunler", req.url));
  res.cookies.set("firm_email", email, { httpOnly:true, sameSite:"lax", path:"/" });
  return res;
}
