import type { MetadataRoute } from "next";

const siteUrl = "https://imadoko.link";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
    },
  ];
}
