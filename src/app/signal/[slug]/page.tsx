import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMegatrendBySlug, megatrends } from "@/data/megatrends";
import { MegatrendDetail } from "@/components/MegatrendDetail";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export async function generateStaticParams() {
  return megatrends.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const trend = getMegatrendBySlug(slug);
  if (!trend) return { title: "Megatrend Not Found" };
  return {
    title: `${trend.title} — Catalyst Signal`,
    description: trend.summary.slice(0, 160),
  };
}

export default async function MegatrendPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trend = getMegatrendBySlug(slug);
  if (!trend) notFound();

  return (
    <>
      <div className="px-8 pt-6">
        <Link href="/signal" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
          <ChevronLeft className="w-3 h-3" />
          Back to Signal
        </Link>
      </div>
      <MegatrendDetail key={trend.slug} trend={trend} />
    </>
  );
}
