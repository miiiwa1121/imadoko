import type { MetadataRoute } from "next";

const siteUrl = "https://imadoko.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: "/share/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
