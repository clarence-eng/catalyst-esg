import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCompanyBySlug, companies } from "@/data/companies";
import { CompanyProfile } from "@/components/CompanyProfile";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export async function generateStaticParams() {
  return companies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);
  if (!company) return { title: "Company Not Found" };
  return {
    title: `${company.name} — Catalyst ESG`,
    description: `ESG profile for ${company.name}: ${company.esgScore.rating} rating, ${company.maturity} maturity. ${company.description.slice(0, 120)}`,
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);
  if (!company) notFound();

  return (
    <>
      <div className="px-8 pt-6">
        <Link href="/scout" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
          <ChevronLeft className="w-3 h-3" />
          Back to Scout
        </Link>
      </div>
      <CompanyProfile company={company} />
    </>
  );
}
