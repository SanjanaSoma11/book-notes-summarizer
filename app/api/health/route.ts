import { NextResponse } from "next/server";
import { checkGroqHealth } from "@/lib/groq";

export async function GET() {
  const health = await checkGroqHealth();
  return NextResponse.json(health, { status: health.ok ? 200 : 503 });
}
