import { MetadataRoute } from "next";
import { careers } from "../data/careers";

export default function sitemap(): MetadataRoute.Sitemap {
  const careerUrls: MetadataRoute.Sitemap = careers.map((career) => ({
    url: `https://corepath.io/careers/${career.id}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    { url: "https://corepath.io", priority: 1.0 },
    { url: "https://corepath.io/careers", priority: 0.9 },
    { url: "https://corepath.io/quiz", priority: 0.9 },
    { url: "https://corepath.io/recommendation", priority: 0.5 },
    ...careerUrls,
  ];
}
