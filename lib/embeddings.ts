/**
 * HuggingFace Embeddings — correct URL for 2025/2026
 * Model: sentence-transformers/all-MiniLM-L6-v2
 * Free tier. Get token: https://huggingface.co/settings/tokens
 */

const HF_API_URL =
  "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/feature-extraction";

function getHfToken(): string | null {
  const token = process.env.HF_API_TOKEN?.trim();
  if (!token || token === "your-hf-token-here") return null;
  return token;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const token = getHfToken();
  if (!token) return texts.map((t) => textToSimpleVector(t));

  const BATCH = 16;
  const all: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    try {
      const res = await fetch(HF_API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: batch, options: { wait_for_model: true } }),
      });

      if (!res.ok) {
        console.warn("[HF] API error:", await res.text());
        all.push(...batch.map((t) => textToSimpleVector(t)));
        continue;
      }

      const data = await res.json();
      for (const emb of data) {
        if (Array.isArray(emb) && typeof emb[0] === "number") {
          all.push(emb);
        } else if (Array.isArray(emb) && Array.isArray(emb[0])) {
          all.push(meanPool(emb));
        } else {
          all.push(textToSimpleVector(texts[all.length]));
        }
      }
    } catch (err) {
      console.warn("[HF] Fetch error:", err);
      all.push(...batch.map((t) => textToSimpleVector(t)));
    }
  }
  return all;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, nA = 0, nB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; nA += a[i] * a[i]; nB += b[i] * b[i];
  }
  const d = Math.sqrt(nA) * Math.sqrt(nB);
  return d === 0 ? 0 : dot / d;
}

function meanPool(tokenEmbs: number[][]): number[] {
  const dim = tokenEmbs[0].length;
  const pooled = new Array(dim).fill(0);
  for (const e of tokenEmbs) for (let i = 0; i < dim; i++) pooled[i] += e[i];
  return pooled.map((v) => v / tokenEmbs.length);
}

function textToSimpleVector(text: string): number[] {
  const DIM = 128;
  const vec = new Array(DIM).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
  for (const w of words) {
    let h = 0;
    for (let i = 0; i < w.length; i++) h = (h * 31 + w.charCodeAt(i)) & 0x7fffffff;
    vec[h % DIM] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  return norm > 0 ? vec.map((v) => v / norm) : vec;
}
