import type { UserRole } from "@prisma/client";

// As interfaces `Session`/`User`/`JWT` do next-auth v5 são reexportadas de
// "@auth/core" — a extensão precisa ser feita nesses módulos de origem, não
// no pacote "next-auth" (que apenas faz `export type { ... } from "@auth/core/..."`).
declare module "@auth/core/types" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      companyIds: string[];
      propertyIds: string[];
      tenantId: string | null;
    };
  }
  interface User {
    id: string;
    role: UserRole;
    companyIds: string[];
    propertyIds: string[];
    tenantId: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: UserRole;
    companyIds?: string[];
    propertyIds?: string[];
    tenantId?: string | null;
  }
}
