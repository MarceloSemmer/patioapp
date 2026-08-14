import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { auth } from "@/lib/auth";

/**
 * Upload local de arquivos (imagens de plantas, documentos, fotos de unidades).
 *
 * Em produção com Supabase configurado, este endpoint deve ser substituído
 * pelo upload direto para o Supabase Storage (bucket privado + URLs assinadas
 * temporárias). Nesta versão de demonstração, os arquivos são salvos em
 * `public/uploads/<categoria>/` no próprio servidor, o que É adequado para
 * rodar localmente mas NÃO deve ser usado em produção (disco efêmero na
 * Vercel, sem controle de acesso por usuário).
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
  const ext = path.extname(file.name).toLowerCase() || "";
  const fileName = `${crypto.randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", category);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), bytes);

  return NextResponse.json({ url: `/uploads/${category}/${fileName}` });
}
