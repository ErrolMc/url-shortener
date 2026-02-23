import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    urlDomain: process.env.NEXT_PUBLIC_URL_DOMAIN ?? process.env.URL_DOMAIN ?? "",
  });
}
