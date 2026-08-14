import fs from "fs";
import path from "path";
import { vi } from "vitest";

// As server actions chamam `revalidatePath`, que depende do contexto de
// requisição do Next.js (App Router). Nos testes, as actions são chamadas
// diretamente fora desse contexto, então mockamos `next/cache` como no-op.
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    process.env[key] = value;
  }
}

loadEnvFile(path.resolve(__dirname, "../.env.test"));
