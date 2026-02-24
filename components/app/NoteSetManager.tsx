"use client";

import React, { useState, useEffect } from "react";
import { FolderOpen, Plus, Trash2, BookMarked, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { getAllNoteSets, saveNoteSet, deleteNoteSet, type SavedNoteSet } from "@/lib/storage";
import type { Highlight } from "@/lib/schema";

interface Props {
  rawInput: string;
  highlights: Highlight[];
  onLoad: (noteSet: SavedNoteSet) => void;
}

export function NoteSetManager({ rawInput, highlights, onLoad }: Props) {
  const [noteSets, setNoteSets] = useState<SavedNoteSet[]>([]);
  const [showSave, setShowSave] = useState(false);
  const [title, setTitle] = useState("");

  // Load saved note sets on mount
  useEffect(() => {
    setNoteSets(getAllNoteSets());
  }, []);

  const handleSave = () => {
    if (!title.trim() || highlights.length === 0) return;
    const ns = saveNoteSet(title.trim(), rawInput, highlights);
    setNoteSets(getAllNoteSets());
    setTitle("");
    setShowSave(false);
  };

  const handleDelete = (id: string) => {
    deleteNoteSet(id);
    setNoteSets(getAllNoteSets());
  };

  const handleLoad = (ns: SavedNoteSet) => {
    onLoad(ns);
  };

  return (
    <div className="space-y-2">
      {/* Save button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowSave(true)}
        disabled={highlights.length === 0}
        className="w-full gap-2 text-xs h-8"
      >
        <Plus className="w-3 h-3" />
        Save Note Set
      </Button>

      {/* Saved list */}
      {noteSets.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-1">
            <FolderOpen className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Saved ({noteSets.length})
            </span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-0.5">
            {noteSets.map((ns) => (
              <div
                key={ns.id}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => handleLoad(ns)}
              >
                <BookMarked className="w-3 h-3 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-foreground truncate">{ns.title}</div>
                  <div className="text-[10px] text-muted-foreground/60">
                    {ns.highlights.length} highlights · {ns.runs.length} runs
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(ns.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save dialog */}
      <Dialog open={showSave} onOpenChange={setShowSave}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Note Set</DialogTitle>
            <DialogDescription>Name your notes to find them later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Atomic Habits"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            <Button onClick={handleSave} disabled={!title.trim()} className="w-full" size="sm">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
