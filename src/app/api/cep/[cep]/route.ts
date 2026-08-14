import { NextResponse } from "next/server";
import { onlyDigits } from "@/lib/masks";

export async function GET(_req: Request, { params }: { params: Promise<{ cep: string }> }) {
  const { cep } = await params;
  const digits = onlyDigits(cep);
  if (digits.length !== 8) {
    return NextResponse.json({ error: "CEP inválido." }, { status: 400 });
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Não foi possível consultar o CEP." }, { status: 502 });
    }
    const data = await res.json();
    if (data.erro) {
      return NextResponse.json({ error: "CEP não encontrado." }, { status: 404 });
    }
    return NextResponse.json({
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
      complement: data.complemento || "",
    });
  } catch {
    return NextResponse.json({ error: "Serviço de CEP indisponível no momento." }, { status: 503 });
  }
}
