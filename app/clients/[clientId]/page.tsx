import type { ReactElement } from "react";
import { ClientProfileContent } from "@/components/clients/ClientProfileContent";

interface ClientProfilePageProps {
  params: Promise<{ clientId: string }>;
}

export default async function ClientProfilePage(props: ClientProfilePageProps): Promise<ReactElement> {
  const { clientId } = await props.params;
  return <ClientProfileContent clientId={clientId} />;
}
