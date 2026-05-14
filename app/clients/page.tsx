import type { ReactElement } from "react";
import { ClientsPageContent } from "@/components/clients/ClientsPageContent";
import { parseClientListFilter } from "@/lib/clients/clientAttention";

interface ClientsPageProps {
  searchParams?: Promise<{ filter?: string | string[] }>;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps): Promise<ReactElement> {
  const sp = searchParams != null ? await searchParams : {};
  const initialFilter = parseClientListFilter(sp.filter);
  return <ClientsPageContent initialFilter={initialFilter} />;
}
