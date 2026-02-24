# 📖 BookNotes — AI-Powered Book Summary Engine

A multi-audience, **citation-grounded** book-notes summarizer powered by **Groq** (Llama 3.3 70B) with **RAG retrieval** via HuggingFace embeddings. Paste your highlights, pick a mode, and get verified summaries where every claim cites its source.

**[Live Demo →](https://book-notes-summarizer.vercel.app)** · **Completely Free** · **Deploy in 2 minutes**

---

## ✨ What It Does

Paste book notes or highlights → select a summary mode → get a structured, citation-grounded summary. Every claim links back to the specific highlight that supports it.

### 4 Summary Modes

| Mode | What You Get | Constraints |
|---|---|---|
| ⏱ **1-Minute** | Thesis + key points + conclusion | ≤120 words, 3–5 items |
| 🔬 **Technical** | Frameworks, mechanisms, tradeoffs | ≤250 words, 4–8 items |
| 🧒 **Kid-Friendly** | Simple language with analogies | ≤120 words, must include analogy |
| 💼 **Interview Prep** | Professional takeaways | Exactly 5 bullets, ≤18 words each |

### Key Features

- **Citation Grounding** — Every output item cites specific highlights `[H1]`, `[H3]`. Click any citation to see the exact source text.
- **RAG Retrieval** — Before generation, mode-specific queries find the most relevant highlights via semantic similarity (HuggingFace embeddings). Only the best evidence is passed to the LLM.
- **Zod Validation** — Every response is validated against strict per-mode schemas. Failed responses get auto-repaired (1 retry with error feedback).
- **Strictness Modes** — "Strict" allows only directly supported claims. "Balanced" permits mild inference, labeled accordingly.
- **Generate All 4 Modes** — One click to generate all modes. Compare them side-by-side.
- **Save Note Sets** — Save your notes with a name. Load them later. Run history persists per note set.
- **Eval Dashboard** — Track pass rates, citation coverage, word limit compliance, and common failure reasons across all runs.
- **Export** — Download as Markdown, copy Notion-ready format, export as JSON, or copy plain text.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A free Groq API key

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/book-notes-summarizer.git
cd book-notes-summarizer
npm install
```

### 2. Add your API keys

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
GROQ_API_KEY=gsk_your_groq_key_here
HF_API_TOKEN=hf_your_huggingface_token_here  # optional
```

**Get your free keys:**
- **Groq** (required): [console.groq.com/keys](https://console.groq.com/keys) — no credit card, 30 req/min
- **HuggingFace** (optional): [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) — improves RAG quality

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Run tests

```bash
npm test
```

---

## 🌐 Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repo
3. Add environment variables:
   - `GROQ_API_KEY` = your Groq key
   - `HF_API_TOKEN` = your HuggingFace token (optional)
4. Click **Deploy** → live in ~60 seconds

---

## 📁 Project Structure

```
book-notes-summarizer/
├── app/
│   ├── api/
│   │   ├── generate/route.ts     # Main pipeline: normalize → RAG → generate → validate → repair
│   │   ├── embeddings/route.ts   # RAG retrieval endpoint
│   │   ├── evaluate/route.ts     # Faithfulness scoring (embedding similarity)
│   │   └── health/route.ts       # API key health check
│   ├── globals.css               # Dark theme, custom fonts, animations
│   ├── layout.tsx
│   └── page.tsx                  # Main app orchestration
├── components/
│   ├── ui/                       # Button, Tabs, Dialog (shadcn-style)
│   └── app/
│       ├── NotesPanel.tsx        # Text input with sample loader
│       ├── ModeSelector.tsx      # 4-mode tabs with completion indicators
│       ├── HighlightsDrawer.tsx  # Collapsible parsed highlights list
│       ├── OutputPanel.tsx       # Results with citations, metrics, export
│       ├── ExportMenu.tsx        # Markdown, Notion, JSON, plain text
│       ├── ComparisonView.tsx    # Side-by-side 4-mode comparison
│       ├── EvalDashboard.tsx     # Run stats, pass rates, failure analysis
│       ├── NoteSetManager.tsx    # Save/load/delete note sets
│       ├── StrictnessToggle.tsx  # Strict vs Balanced mode
│       └── ApiStatus.tsx         # Groq connection status banner
├── lib/
│   ├── schema.ts                 # Zod schemas, validators, metrics
│   ├── prompts.ts                # System, user, repair prompts (strictness-aware)
│   ├── groq.ts                   # Groq API client
│   ├── embeddings.ts             # HuggingFace embeddings + fallback
│   ├── retrieval.ts              # RAG: query plans, top-k retrieval
│   ├── storage.ts                # localStorage persistence
│   ├── normalizer.ts             # Raw text → Highlight[]
│   └── utils.ts                  # Helpers, markdown export
└── __tests__/
    ├── schema.test.ts            # 30+ validator tests
    └── phase45.test.ts           # RAG + embedding tests
```

---

## 🔒 How Grounding Works

```
Raw Notes
    ↓
Normalize → [H1] [H2] [H3] … [Hn]
    ↓
RAG Retrieval (mode-specific queries → top-k highlights)
    ↓
Groq (Llama 3.3 70B) generates JSON
    ↓
Zod validates against mode schema
    ↓ fail?
Repair prompt (1 retry with error feedback)
    ↓
Citation check (all cited IDs must exist)
    ↓
Return validated output + metrics
```

---

## 🧪 Testing

30+ unit tests covering all validators, normalizer, citation checker, metrics, and embeddings.

```
✓ oneMinute — word limit (120), item count (3–5), citations
✓ technical — word limit (250), item count (4–8)
✓ interview — exactly 5 bullets, ≤18 words each
✓ kidFriendly — word limit (120), analogy required, item count (2–4)
✓ citations — valid/missing ID detection, deduplication
✓ metrics — word count, coverage, schema pass
✓ cosine similarity — identical, orthogonal, opposite vectors
✓ support field — direct/inferred tagging
```

---

## 💰 Cost: $0

| Service | Free Tier |
|---|---|
| **Groq** | 30 req/min, 1000 req/day, never charged |
| **HuggingFace** | Rate-limited embeddings, no cost |
| **Vercel** | 100GB bandwidth, serverless functions |
| **Total** | **$0/month** |

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: TailwindCSS + shadcn/ui + Radix primitives
- **AI Generation**: Groq (Llama 3.3 70B) — free, 30 RPM
- **Embeddings**: HuggingFace Inference (sentence-transformers/all-MiniLM-L6-v2)
- **Validation**: Zod with per-mode schemas + auto-repair
- **Persistence**: localStorage (client-side)
- **Testing**: Vitest
- **Deployment**: Vercel

---

## License

MIT
