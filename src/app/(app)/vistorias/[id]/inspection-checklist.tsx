"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/upload/file-upload";
import { updateInspectionItem } from "@/server/actions/inspection-actions";
import { inspectionItemAnswerLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { InspectionItemAnswer } from "@prisma/client";

interface ItemState {
  id: string;
  label: string;
  answer: InspectionItemAnswer | null;
  notes: string | null;
  photoUrl: string | null;
  photoDisplayUrl: string | null;
}

const ANSWER_OPTIONS: InspectionItemAnswer[] = ["CONFORME", "NAO_CONFORME", "NAO_SE_APLICA"];

const ANSWER_STYLES: Record<InspectionItemAnswer, string> = {
  CONFORME: "bg-emerald-600 text-white hover:bg-emerald-700",
  NAO_CONFORME: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  NAO_SE_APLICA: "bg-muted-foreground text-white hover:bg-muted-foreground/90",
};

export function InspectionChecklist({ items, canManage }: { items: ItemState[]; canManage: boolean }) {
  const [state, setState] = useState(items);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function updateLocal(itemId: string, patch: Partial<ItemState>) {
    setState((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item)));
  }

  async function persist(itemId: string, payload: { answer?: InspectionItemAnswer | null; notes?: string | null; photoUrl?: string | null }) {
    setPendingId(itemId);
    try {
      await updateInspectionItem({ itemId, ...payload });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o item.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {state.map((item) => (
        <div key={item.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium">{item.label}</p>
            {pendingId === item.id && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
          </div>

          {canManage ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {ANSWER_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={pendingId === item.id}
                  onClick={() => {
                    const next = item.answer === option ? null : option;
                    updateLocal(item.id, { answer: next });
                    persist(item.id, { answer: next });
                  }}
                  className={cn(
                    "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
                    item.answer === option ? ANSWER_STYLES[option] : "bg-background text-muted-foreground hover:bg-accent",
                  )}
                >
                  {inspectionItemAnswerLabels[option]}
                </button>
              ))}
            </div>
          ) : (
            item.answer && (
              <span className={cn("mt-2 inline-block rounded-md px-3 py-1 text-xs font-medium", ANSWER_STYLES[item.answer])}>
                {inspectionItemAnswerLabels[item.answer]}
              </span>
            )
          )}

          {canManage ? (
            <Textarea
              className="mt-2"
              rows={2}
              placeholder="Observações do item (opcional)"
              value={item.notes ?? ""}
              onChange={(e) => updateLocal(item.id, { notes: e.target.value })}
              onBlur={(e) => persist(item.id, { notes: e.target.value || null })}
            />
          ) : (
            item.notes && <p className="mt-2 text-sm text-muted-foreground">{item.notes}</p>
          )}

          <div className="mt-3 flex items-center gap-3">
            {item.photoDisplayUrl && (
              <a href={item.photoDisplayUrl} target="_blank" rel="noopener noreferrer">
                <Image
                  src={item.photoDisplayUrl}
                  alt={`Foto — ${item.label}`}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-md border object-cover"
                  unoptimized
                />
              </a>
            )}
            {canManage && (
              <FileUpload
                category="vistorias"
                label={item.photoUrl ? "Trocar foto" : "Anexar foto"}
                accept="image/png,image/jpeg,image/webp"
                onUploaded={(key, url) => {
                  updateLocal(item.id, { photoUrl: key, photoDisplayUrl: url });
                  persist(item.id, { photoUrl: key });
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
