"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { logDocumentDownload } from "@/server/actions/document-actions";

export function DocumentDownloadLink({ documentId, fileUrl }: { documentId: string; fileUrl: string }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
      onClick={() => {
        logDocumentDownload(documentId).catch(() => {});
      }}
    >
      <a href={fileUrl} target="_blank" rel="noopener noreferrer" aria-label="Baixar documento">
        <Download className="h-4 w-4" />
      </a>
    </Button>
  );
}
