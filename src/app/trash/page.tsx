import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import TrashView from "./TrashView";

export const metadata: Metadata = { title: "Trash · CleanMail" };

export default function TrashPage() {
  return (
    <PageShell
      eyebrow="Trash"
      title="Changed your mind?"
      intro="Everything CleanMail moves goes to Gmail Trash, where it stays recoverable for 30 days."
    >
      <TrashView />
    </PageShell>
  );
}
