import { cookies } from "next/headers";
import { ACTIVE_PROPERTY_COOKIE } from "@/lib/constants";

export async function getActivePropertyId(): Promise<string | null> {
  const store = await cookies();
  return store.get(ACTIVE_PROPERTY_COOKIE)?.value ?? null;
}
