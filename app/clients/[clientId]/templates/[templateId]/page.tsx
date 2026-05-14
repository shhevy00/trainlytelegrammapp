import type { ReactElement } from "react";
import { TemplateEditorPageContent } from "@/components/templates/TemplateEditorPageContent";

interface PageProps {
  params: Promise<{ clientId: string; templateId: string }>;
}

export default async function EditClientTemplatePage(props: PageProps): Promise<ReactElement> {
  const { clientId, templateId } = await props.params;
  return <TemplateEditorPageContent key={templateId} clientId={clientId} templateId={templateId} />;
}
