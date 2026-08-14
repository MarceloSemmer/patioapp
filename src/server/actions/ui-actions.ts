"use server";

import { cookies } from "next/headers";
import { ACTIVE_PROPERTY_COOKIE } from "@/lib/constants";

export async function setActiveProperty(propertyId: string | null) {
  const store = await cookies();
  if (!propertyId) {
    store.delete(ACTIVE_PROPERTY_COOKIE);
    return;
  }
  store.set(ACTIVE_PROPERTY_COOKIE, propertyId, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
