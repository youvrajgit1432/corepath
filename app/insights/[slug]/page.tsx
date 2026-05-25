import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "../../../components/JsonLd";
import {
  getInsightPage,
  getInsightUrl,
  getInsightPages,
  buildInsightContent,
  buildInsightMetadata,
  getInsightBreadcrumbSchema,
  getInsightFAQSchema,
} from "../../../data/seo-content";
import InsightDetailClient from "../../../components/InsightDetailClient";

interface InsightPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: InsightPageProps) {
  const page = getInsightPage(params.slug);
  if (!page) {
    return { title: "Not found | CorePath" };
  }

  return buildInsightMetadata(page);
}

export function generateStaticParams() {
  return getInsightPages().map((page) => ({ slug: page.slug }));
}

export default function InsightDetailPage({ params }: InsightPageProps) {
  const page = getInsightPage(params.slug);
  if (!page) {
    notFound();
  }

  const content = buildInsightContent(page);
  const breadcrumbSchema = getInsightBreadcrumbSchema(page);
  const faqSchema = getInsightFAQSchema(content);

  return (
    <InsightDetailClient
      page={page}
      content={content}
      breadcrumbSchema={breadcrumbSchema}
      faqSchema={faqSchema}
    />
  );
}
