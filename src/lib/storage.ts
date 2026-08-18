import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * Abstração de armazenamento de arquivos.
 *
 * Quando NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY estão
 * configurados, os arquivos são enviados para um bucket privado do Supabase
 * Storage e o acesso se dá por URL assinada e temporária (nunca pública).
 *
 * Sem essas variáveis (ambiente local/demonstração), os arquivos são salvos
 * em `public/uploads/<categoria>/` no próprio servidor — adequado apenas
 * para desenvolvimento local, nunca para produção em plataformas serverless
 * (disco efêmero). Nenhum dos dois modos é simulado: o modo realmente usado
 * é determinado pela presença das variáveis de ambiente.
 */

const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "patiogestor-arquivos";

export const storageMode: "supabase" | "local" =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY ? "supabase" : "local";

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase Storage não está configurado (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ausentes).");
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export interface StoredFile {
  /** Caminho relativo/chave do arquivo dentro do storage (persistido no banco). */
  key: string;
  /** URL utilizável imediatamente após o upload (pública/local ou assinada). */
  url: string;
}

export async function storeFile(params: {
  category: string;
  fileName: string;
  bytes: Buffer;
  contentType: string;
}): Promise<StoredFile> {
  const ext = path.extname(params.fileName).toLowerCase();
  const key = `${params.category}/${crypto.randomUUID()}${ext}`;

  if (storageMode === "supabase") {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(key, params.bytes, {
      contentType: params.contentType,
      upsert: false,
    });
    if (error) {
      throw new Error(`Falha ao enviar arquivo para o Supabase Storage: ${error.message}`);
    }
    const url = await getSignedUrl(key);
    return { key: `supabase:${key}`, url };
  }

  const dir = path.join(process.cwd(), "public", "uploads", params.category);
  await mkdir(dir, { recursive: true });
  const fileOnDisk = path.basename(key);
  await writeFile(path.join(dir, fileOnDisk), params.bytes);
  const url = `/uploads/${params.category}/${fileOnDisk}`;
  return { key: `local:${url}`, url };
}

/**
 * Gera uma URL assinada e temporária (padrão: 1 hora) para um arquivo salvo
 * no Supabase Storage. Para arquivos locais, retorna a própria URL estática
 * (não há expiração no modo local — mais um motivo para não usá-lo em
 * produção com documentos sensíveis).
 */
export async function getSignedUrl(keyOrLocalUrl: string, expiresInSeconds = 3600): Promise<string> {
  if (keyOrLocalUrl.startsWith("local:")) {
    return keyOrLocalUrl.slice("local:".length);
  }
  const key = keyOrLocalUrl.startsWith("supabase:") ? keyOrLocalUrl.slice("supabase:".length) : keyOrLocalUrl;

  if (storageMode !== "supabase") {
    // Chave gravada como Supabase mas o storage foi desativado depois — não deveria acontecer em uso normal.
    return key;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(SUPABASE_BUCKET).createSignedUrl(key, expiresInSeconds);
  if (error || !data) {
    throw new Error(`Falha ao gerar URL assinada: ${error?.message ?? "resposta vazia"}`);
  }
  return data.signedUrl;
}

/** Resolve a URL de exibição imediata para uma chave armazenada (`fileUrl` do banco). */
export async function resolveFileUrl(storedValue: string): Promise<string> {
  if (storedValue.startsWith("local:") || storedValue.startsWith("supabase:")) {
    return getSignedUrl(storedValue);
  }
  // Compatibilidade com registros antigos que guardavam a URL local direta (ex.: "/uploads/...").
  return storedValue;
}
