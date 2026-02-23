import { NextRequest, NextResponse } from "next/server";

const backendUrl =
  process.env["services__url-shortener-backend__https__0"] ??
  process.env["services__url-shortener-backend__http__0"] ??
  "http://localhost:5112";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shortCode: string }> }
) {
  const { shortCode } = await params;
  const auth = req.headers.get("authorization");
  const res = await fetch(`${backendUrl}/analytics/${shortCode}`, {
    headers: { Authorization: auth ?? "" },
  });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
