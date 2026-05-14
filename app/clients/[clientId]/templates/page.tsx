import type { ReactElement } from "react";
import { ClientTemplatesPageContent } from "@/components/templates/ClientTemplatesPageContent";

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientTemplatesPage(props: PageProps): Promise<ReactElement> {
  const { clientId } = await props.params;
  return <ClientTemplatesPageContent clientId={clientId} />;
}
