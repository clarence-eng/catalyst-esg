import { notFound } from "next/navigation";
import { getCompanyBySlug, companies } from "@/data/companies";
import { CompanyProfile } from "@/components/CompanyProfile";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export async function generateStaticParams() {
  return companies.map((c) => ({ slug: c.slug }));
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
