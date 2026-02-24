import { NextRequest, NextResponse } from "next/server";
import { Highlight, MODES, type Mode } from "@/lib/schema";
import { retrieveEvidence } from "@/lib/retrieval";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { highlights, mode } = body as {
      highlights: Highlight[];
      mode: Mode;
    };

    if (!highlights || highlights.length === 0) {
      return NextResponse.json({ error: "No highlights provided" }, { status: 400 });
    }
    if (!mode || !MODES.includes(mode)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const result = await retrieveEvidence(highlights, mode);

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("[/api/embeddings]", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
