import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCompanyBySlug, companies as staticCompanies } from "@/data/companies";
import { fetchCompaniesFromSupabase } from "@/lib/fetchCompanies";
import { cache } from "react";
import { CompanyProfile } from "@/components/CompanyProfile";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export async function generateStaticParams() {
  return staticCompanies.map((c) => ({ slug: c.slug }));
}

const getCompanyCached = cache(fetchCompaniesFromSupabase);

async function getCompany(slug: string) {
  // Try Supabase first
  try {
    const dbCompanies = await getCompanyCached();
    if (dbCompanies.length > 0) {
      // Look in Supabase, fall back to static if not found there
      return dbCompanies.find(c => c.slug === slug) || getCompanyBySlug(slug) || null;
    }
  } catch { /* fall through */ }
  // Fall back to static data
  return getCompanyBySlug(slug) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) return { title: "Company Not Found" };
  const dn = (name: string) => name.trim() || "Unnamed company";
  const title = `${dn(company.name)} — Catalyst ESG`;
  const description = `ESG profile for ${dn(company.name)}: ${company.esgScore.rating} rating, ${company.maturity} maturity. ${company.description}`.slice(0, 160);
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await getCompany(slug);
  if (!company) notFound();

  return (
    <>
      <div className="px-8 pt-6">
        <Link href="/scout" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
          <ChevronLeft className="w-3 h-3" />
          Back to Scout
        </Link>
      </div>
      <CompanyProfile key={company.slug} company={company} />
    </>
  );
}
