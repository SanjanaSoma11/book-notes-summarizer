# 📖 BookNotes — AI Book Summary Engine

Multi-audience, citation-grounded book-notes summarizer powered by **Google Gemini (free tier)**. Deploy to **Vercel** in minutes.

Paste highlights → pick a mode → get **verified, citation-grounded summaries**.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Gemini](https://img.shields.io/badge/Google_Gemini-Free-4285F4)
![Zod](https://img.shields.io/badge/Zod-Validated-green)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)

---

## ✨ Features

| Mode | Constraint | Use Case |
|------|-----------|----------|
| ⏱ **1-Minute** | ≤120 words | Quick review |
| 🔬 **Technical** | ≤250 words, frameworks + tradeoffs | Deep understanding |
| 🧒 **Kid-Friendly** | ≤120 words, must use analogies | Simple explanation |
| 💼 **Interview** | Exactly 5 bullets, ≤18 words each | Job prep |

**Grounding:** Every claim cites source highlights • Click citations to verify • Zod validates every response • Auto-repair on failure

---

## 🚀 Quick Start (Local)

### 1. Get a free Gemini API key (30 seconds)

Go to **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)** → Click "Create API Key" → Copy it.

**Free tier limits:** 15 requests/minute • 1,500 requests/day • 1M tokens/day

### 2. Run locally

```bash
cd book-notes-summarizer
npm install

# Add your key
cp .env.example .env.local
# Edit .env.local → paste your GEMINI_API_KEY

npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)**

### 3. Run tests

```bash
npm test
```

---

## 🌐 Deploy to Vercel (Free)

### Option A: One-click deploy

1. Push this project to a GitHub repo
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repo
4. Add environment variable:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** your Gemini API key
5. Click **Deploy**

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add your API key
vercel env add GEMINI_API_KEY

# Redeploy with the env var
vercel --prod
```

Your site will be live at `https://your-project.vercel.app` in ~60 seconds.

---

## 📁 Project Structure

```
book-notes-summarizer/
├── app/
│   ├── api/
│   │   ├── generate/route.ts   # POST — generation pipeline
│   │   └── health/route.ts     # GET — Gemini health check
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                # Main app
├── components/
│   ├── ui/                     # Button, Tabs, Dialog
│   └── app/                    # NotesPanel, ModeSelector, OutputPanel, etc.
├── lib/
│   ├── schema.ts               # Zod schemas + validators + metrics
│   ├── normalizer.ts           # Raw text → Highlight[]
│   ├── prompts.ts              # System + user + repair prompts
│   ├── gemini.ts               # Google Gemini client + JSON extraction
│   └── utils.ts                # Helpers
├── __tests__/
│   └── schema.test.ts          # 30+ tests
├── .env.example
└── package.json
```

---

## 🔒 How It Works

```
Raw Notes → Normalize → [H1] [H2] [H3] …
                              ↓
              Gemini 1.5 Flash generates JSON
              (responseMimeType: application/json)
                              ↓
                    Zod validates response
                         ↙        ↘
                    PASS            FAIL
                     ↓                ↓
                  Return         Repair prompt
                  result         (1 retry) → Validate again
```

---

## 💰 Cost: $0

| Resource | Free Tier |
|----------|-----------|
| **Gemini API** | 15 RPM, 1,500 RPD, 1M tokens/day |
| **Vercel** | 100GB bandwidth, serverless functions |
| **Total** | **$0/month** |

---

## 🧪 Tests (30+)

```
✓ normalizeNotes — paragraphs, bullets, numbered, empty, short, multiline
✓ oneMinute — valid, word limit, empty citations, wrong format, empty items
✓ technical — valid, word limit
✓ interview — exactly 5, fewer, more, per-bullet limit
✓ kidFriendly — analogy present (multiple markers), absent, word limit
✓ citations — valid IDs, missing IDs, deduplication
✓ metrics — word count, coverage, violations
✓ edge cases — invalid mode, missing mode, empty text, warnings
```

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| "Gemini not connected" | Check GEMINI_API_KEY in .env.local |
| Rate limit (429) | Free tier = 15 req/min. Wait and retry. |
| JSON validation fails | Gemini Flash is good at JSON but repair loop handles edge cases |
| Deploy fails on Vercel | Make sure GEMINI_API_KEY is set in Vercel dashboard → Settings → Environment Variables |

---

## License

MIT
