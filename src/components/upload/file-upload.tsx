"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

export function FileUpload({
  category,
  onUploaded,
  accept = "image/png,image/jpeg,image/webp,application/pdf",
  label = "Enviar arquivo",
}: {
  category: string;
  onUploaded: (url: string, fileName: string) => void;
  accept?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha no upload.");
      onUploaded(data.url, file.name);
      toast.success("Arquivo enviado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
      <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => inputRef.current?.click()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {label}
      </Button>
    </div>
  );
}
