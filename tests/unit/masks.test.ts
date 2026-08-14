import { describe, it, expect } from "vitest";
import { isValidCpf, isValidCnpj, isValidCpfCnpj, maskCpf, maskCnpj, maskCep, maskPhone, onlyDigits } from "@/lib/masks";

describe("masks e validação de documentos", () => {
  it("valida CPFs corretos e rejeita inválidos", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("123.456.789-00")).toBe(false);
  });

  it("valida CNPJs corretos e rejeita inválidos", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("11.111.111/1111-11")).toBe(false);
    expect(isValidCnpj("00.000.000/0000-00")).toBe(false);
  });

  it("isValidCpfCnpj escolhe o validador correto pelo tamanho", () => {
    expect(isValidCpfCnpj("529.982.247-25")).toBe(true);
    expect(isValidCpfCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCpfCnpj("123")).toBe(false);
  });

  it("aplica máscaras corretamente", () => {
    expect(maskCpf("52998224725")).toBe("529.982.247-25");
    expect(maskCnpj("11222333000181")).toBe("11.222.333/0001-81");
    expect(maskCep("38400100")).toBe("38400-100");
    expect(maskPhone("34999990000")).toBe("(34) 99999-0000");
    expect(maskPhone("3432100000")).toBe("(34) 3210-0000");
  });

  it("onlyDigits remove tudo que não é número", () => {
    expect(onlyDigits("(34) 99999-0000")).toBe("34999990000");
  });
});
