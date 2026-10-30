// The Gmail categories CleanMail can scan. Gmail does the filtering
// (category:promotions, etc.), so CleanMail never downloads the whole mailbox.
export type CategoryKey = "promotions" | "social" | "updates" | "forums" | "newsletters";

export type Category = {
  key: CategoryKey;
  name: string;
  description: string;
};

export const CATEGORIES: Category[] = [
  { key: "promotions", name: "Promotions", description: "Sales, deals, offers, and promotional messages." },
  { key: "social", name: "Social", description: "Social-network messages and activity notifications." },
  { key: "updates", name: "Updates", description: "Automated updates, alerts, and account activity." },
  { key: "forums", name: "Forums", description: "Messages from discussion groups and forums." },
  { key: "newsletters", name: "Newsletters", description: "Messages that contain unsubscribe information." },
];

export function isCategoryKey(value: unknown): value is CategoryKey {
  return CATEGORIES.some((category) => category.key === value);
}

export type CandidateMessage = { id: string; threadId: string };

export type MessageDetails = CandidateMessage & {
  from: string;
  subject: string;
  date: string;
};
