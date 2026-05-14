import type { ReactElement } from "react";
import { TemplateEditorPageContent } from "@/components/templates/TemplateEditorPageContent";

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default async function NewClientTemplatePage(props: PageProps): Promise<ReactElement> {
  const { clientId } = await props.params;
  return <TemplateEditorPageContent key="new" clientId={clientId} />;
}
