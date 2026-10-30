import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { isCategoryKey } from "@/lib/categories";
import CleanupWorkspace from "./CleanupWorkspace";

export const metadata: Metadata = { title: "Clean up · CleanMail" };

export default async function CleanPage({ searchParams }: PageProps<"/clean">) {
  const { category } = await searchParams;
  const initialCategory = isCategoryKey(category) ? category : "promotions";

  return (
    <PageShell
      eyebrow="Clean up"
      title="Review before you remove."
      intro="Pick a category, check the messages you no longer need, then confirm. Nothing is deleted automatically."
    >
      <CleanupWorkspace key={initialCategory} initialCategory={initialCategory} />
    </PageShell>
  );
}
