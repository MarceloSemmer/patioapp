import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { storeFile } from "@/lib/storage";

/**
 * Upload de arquivos (imagens de plantas, documentos, fotos de unidades).
 *
 * Usa o Supabase Storage (bucket privado + URL assinada) quando
 * NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão configurados
 * (ver src/lib/storage.ts); caso contrário, grava em `public/uploads/` no
 * próprio servidor — modo adequado apenas para desenvolvimento local.
 */

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
]);
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const category = String(formData.get("category") || "geral").replace(/[^a-z0-9-]/gi, "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Tipo de arquivo não permitido." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo excede o limite de 10MB." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const stored = await storeFile({ category, fileName: file.name, bytes, contentType: file.type });
    return NextResponse.json({ key: stored.key, url: stored.url });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Falha no upload." }, { status: 500 });
  }
}
