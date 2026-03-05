"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { FileUp, X, FileText, Loader2, AlertTriangle, Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Highlight } from "@/lib/schema";

interface Props {
  onExtractedText: (text: string) => void;
  highlights: Highlight[];
  activeCitation: string | null;
}

async function extractTextFromPdf(file: File): Promise<{ text: string; pages: number }> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items
      .filter((item: any) => "str" in item)
      .map((item: any) => item.str);
    pageTexts.push(strings.join(" "));
  }

  const text = pageTexts.join("\n\n")
    .replace(/([a-z])-\s*\n\s*([a-z])/gi, "$1$2")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { text, pages: pdf.numPages };
}

export function PdfViewer({ onExtractedText, highlights, activeCitation }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [showText, setShowText] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeCitation || !extractedText || !textRef.current) return;
    const hl = highlights.find((h) => h.highlightId === activeCitation);
    if (!hl) return;
    setShowText(true);
    setSearchTerm(hl.text.slice(0, 60));
    setTimeout(() => {
      const marks = textRef.current?.querySelectorAll("mark");
      if (marks && marks.length > 0) marks[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }, [activeCitation, extractedText, highlights]);

  const handleFile = useCallback(async (f: File) => {
    if (f.type !== "application/pdf") { setExtractError("Please upload a PDF file."); return; }
    if (f.size > 20 * 1024 * 1024) { setExtractError("PDF must be under 20MB."); return; }

    setFile(f);
    setPdfUrl(URL.createObjectURL(f));
    setExtractError(null);
    setExtractedText(null);
    setExtracting(true);

    try {
      const { text, pages } = await extractTextFromPdf(f);
      setPageCount(pages);
      const wc = text.split(/\s+/).filter(Boolean).length;
      setWordCount(wc);

      if (wc < 10) {
        setExtractError("Very little text extracted. This PDF may be scanned (image-based). Try a text-based PDF or paste notes manually.");
        setExtracting(false);
        return;
      }

      setExtractedText(text);
      onExtractedText(text);
      setShowText(true);
    } catch (err) {
      console.error("PDF extraction error:", err);
      setExtractError("Failed to extract text. The PDF may be encrypted or corrupted.");
    } finally {
      setExtracting(false);
    }
  }, [onExtractedText]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleRemove = () => {
    setFile(null);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null); setExtractedText(null); setExtractError(null);
    setWordCount(0); setPageCount(0); setSearchTerm(""); setShowText(false);
  };

  const highlightSearch = (text: string, term: string) => {
    if (!term || term.length < 3) return text;
    try {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return text.replace(new RegExp(`(${escaped})`, "gi"), "<mark class='bg-primary/30 text-foreground rounded px-0.5'>$1</mark>");
    } catch { return text; }
  };

  const hiddenInput = (
    <input ref={fileInputRef} type="file" accept=".pdf" onChange={(e) => {
      const f = e.target.files?.[0]; if (f) handleFile(f);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }} className="hidden" />
  );

  if (!file) {
    return (
      <>{hiddenInput}
        <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver ? "border-primary bg-primary/5" : "border-border/40 hover:border-border/80 hover:bg-muted/10"}`}>
          <FileUp className="w-8 h-8 mx-auto mb-2 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">Drop a PDF or click to upload</p>
          <p className="text-[10px] text-muted-foreground/40 mt-1">Extracted in your browser — nothing uploaded to a server</p>
          {extractError && (
            <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />{extractError}
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>{hiddenInput}
      <div className="flex flex-col rounded-xl border border-border/40 overflow-hidden h-full">
        <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/30">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-medium text-foreground truncate max-w-[140px]">{file.name}</span>
            {extracting && <span className="text-[10px] text-amber-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />extracting…</span>}
            {extractedText && !extracting && <span className="text-[10px] text-emerald-500">{wordCount} words · {pageCount} pg</span>}
          </div>
          <div className="flex items-center gap-1">
            {extractedText && <Button variant="ghost" size="sm" onClick={() => setShowText(!showText)} className="h-6 text-[10px] gap-1 px-2"><Eye className="w-3 h-3" />{showText ? "PDF" : "Text"}</Button>}
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemove}><X className="w-3 h-3" /></Button>
          </div>
        </div>
        {extractError && <div className="px-3 py-2 bg-red-500/10 border-b border-red-500/20 text-xs text-red-400 flex items-start gap-1.5"><AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />{extractError}</div>}
        {showText && extractedText && (
          <div className="px-3 py-2 border-b border-border/30 bg-muted/10">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search in text…"
                className="w-full pl-7 pr-3 py-1.5 rounded-md border border-border/40 bg-background text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
          </div>
        )}
        <div className="flex-1 relative bg-muted/5 overflow-hidden">
          {extracting ? (
            <div className="flex flex-col items-center justify-center h-full gap-3"><Loader2 className="w-8 h-8 text-primary animate-spin" /><p className="text-xs text-muted-foreground">Extracting text…</p></div>
          ) : showText && extractedText ? (
            <div ref={textRef} className="h-full overflow-y-auto p-4 text-xs leading-relaxed text-foreground/80"
              dangerouslySetInnerHTML={{ __html: highlightSearch(extractedText.replace(/\n/g, "<br/>"), searchTerm) }} />
          ) : pdfUrl ? (
            <iframe src={`${pdfUrl}#toolbar=0&view=FitH`} className="w-full h-full min-h-[400px]" title="PDF Viewer" />
          ) : null}
        </div>
        {showText && highlights.length > 0 && (
          <div className="px-3 py-2 border-t border-border/30 bg-muted/20">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] text-muted-foreground shrink-0">Jump to:</span>
              {highlights.slice(0, 10).map((h) => (
                <button key={h.highlightId} onClick={() => { setSearchTerm(h.text.slice(0, 50)); setTimeout(() => { const m = textRef.current?.querySelectorAll("mark"); if (m && m.length > 0) m[0].scrollIntoView({ behavior: "smooth", block: "center" }); }, 50); }}
                  className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${activeCitation === h.highlightId ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>{h.highlightId}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
