import { NextRequest, NextResponse } from "next/server";

const backendUrl =
  process.env["services__url-shortener-backend__https__0"] ??
  process.env["services__url-shortener-backend__http__0"] ??
  "http://localhost:5112";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = req.headers.get("authorization");
  const res = await fetch(`${backendUrl}/urls/${id}`, {
    method: "DELETE",
    headers: { Authorization: auth ?? "" },
  });
  return new NextResponse(null, { status: res.status });
}
