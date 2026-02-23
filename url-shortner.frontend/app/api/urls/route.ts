import { NextRequest, NextResponse } from "next/server";

const backendUrl =
  process.env["services__url-shortener-backend__https__0"] ??
  process.env["services__url-shortener-backend__http__0"] ??
  "http://localhost:5112";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const res = await fetch(`${backendUrl}/urls`, {
    headers: { Authorization: auth ?? "" },
  });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const body = await req.text();
  const res = await fetch(`${backendUrl}/urls`, {
    method: "POST",
    headers: {
      Authorization: auth ?? "",
      "Content-Type": "application/json",
    },
    body,
  });
  const resBody = await res.text();
  return new NextResponse(resBody, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
  });
}
