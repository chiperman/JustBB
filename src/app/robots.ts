import type { MetadataRoute } from "next"
import { getPublicAppUrl } from "@/shared/lib/share"

export default function robots(): MetadataRoute.Robots {
  const host = getPublicAppUrl()

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/share/"],
        disallow: [
          "/api/",
          "/auth/",
          "/forgot-password",
          "/gallery",
          "/map",
          "/reset-password",
          "/tags",
          "/trash",
          "/unauthorized",
        ],
      },
    ],
    host: host || undefined,
  }
}
