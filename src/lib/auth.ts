import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          include: {
            companies: { select: { companyId: true } },
            propertyAccess: { select: { propertyId: true } },
            tenantProfile: { select: { id: true } },
          },
        });

        if (!user || !user.isActive || user.deletedAt) {
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginCount: { increment: 1 } },
          });
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: "LOGIN_FALHOU",
              entity: "User",
              entityId: user.id,
            },
          });
          return null;
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginCount: 0, lastLoginAt: new Date() },
        });
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "LOGIN",
            entity: "User",
            entityId: user.id,
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyIds: user.companies.map((c) => c.companyId),
          propertyIds: user.propertyAccess.map((p) => p.propertyId),
          tenantId: user.tenantProfile?.id ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.companyIds = user.companyIds;
        token.propertyIds = user.propertyIds;
        token.tenantId = user.tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as UserRole;
        session.user.companyIds = token.companyIds ?? [];
        session.user.propertyIds = token.propertyIds ?? [];
        session.user.tenantId = token.tenantId ?? null;
      }
      return session;
    },
  },
});
