import { getMemos } from "@/actions/memos/query";
import { MainLayoutClient } from "@/components/layout/MainLayoutClient";
import { cookies } from "next/headers";
import { isAdmin as checkIsAdmin } from "@/features/auth/actions";
import { generateCacheKey } from "@/lib/utils";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const adminCode = (await cookies()).get("memo_access_code")?.value;
  const isAdmin = await checkIsAdmin();

  const flattenedSearchParams: { [key: string]: string | undefined } = {};
  Object.entries(resolvedParams).forEach(([key, value]) => {
    flattenedSearchParams[key] = Array.isArray(value) ? value[0] : value;
  });

  const cacheKey = generateCacheKey(flattenedSearchParams);

  // Note: We no longer fetch memos here because MainLayoutClient handles 
  // its own initial data through SWR and PageDataCache for better SPA experience.
  
  return (
    <MainLayoutClient key={cacheKey} />
  );
}
