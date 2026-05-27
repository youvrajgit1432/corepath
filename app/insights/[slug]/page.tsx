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

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const page = getInsightPage(slug);
  if (!page) {
    return { title: "Not found | CorePath" };
  }

  return buildInsightMetadata(page);
}

export function generateStaticParams() {
  return getInsightPages().map((page) => ({ slug: page.slug }));
}

export default async function InsightDetailPage({ params }: Props) {
  const { slug } = await params;
  const page = getInsightPage(slug);
  if (!page) {
    notFound();
  }

  const content = buildInsightContent(page);
  const breadcrumbSchema = getInsightBreadcrumbSchema(page);
  const faqSchema = getInsightFAQSchema(content);

  // Omit filter function — cannot pass functions to Client Components
  const { filter: _filter, ...clientPage } = page;

  return (
    <InsightDetailClient
      page={clientPage}
      content={content}
      breadcrumbSchema={breadcrumbSchema}
      faqSchema={faqSchema}
    />
  );
}
