import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type GmailMessage = {
  id: string;
  threadId: string;
  labelIds?: string[];
};

type GmailHeader = {
  name: string;
  value: string;
};

type GmailMessageMetadata = {
  id: string;
  threadId: string;
  labelIds?: string[];
  payload?: {
    headers?: GmailHeader[];
  };
};

function getHeader(
  headers: GmailHeader[] | undefined,
  name: string
): string {
  return (
    headers?.find(
      (header) => header.name.toLowerCase() === name.toLowerCase()
    )?.value ?? ""
  );
}

function categorizeMessage(
  message: GmailMessageMetadata,
  headers: GmailHeader[]
) {
  const labels = message.labelIds ?? [];
  const from = getHeader(headers, "From").toLowerCase();
  const subject = getHeader(headers, "Subject").toLowerCase();
  const listUnsubscribe = getHeader(headers, "List-Unsubscribe");

  const shoppingKeywords = [
    "order",
    "receipt",
    "shipped",
    "shipping",
    "delivery",
    "tracking",
    "purchase",
    "invoice",
    "payment",
  ];

  const notificationKeywords = [
    "notification",
    "alert",
    "password",
    "security",
    "confirmation",
    "appointment",
    "approved",
    "verification",
    "shift",
  ];

  const promotionalKeywords = [
    "sale",
    "deal",
    "discount",
    "off",
    "promo",
    "promotion",
    "offer",
    "save",
    "limited time",
    "last chance",
    "shop",
  ];

  if (
    shoppingKeywords.some(
      (keyword) => subject.includes(keyword) || from.includes(keyword)
    )
  ) {
    return "Shopping";
  }

  if (
    notificationKeywords.some(
      (keyword) => subject.includes(keyword) || from.includes(keyword)
    )
  ) {
    return "Notifications";
  }

  if (labels.includes("CATEGORY_PROMOTIONS")) {
    return "Promotions";
  }

  if (
    promotionalKeywords.some(
      (keyword) => subject.includes(keyword) || from.includes(keyword)
    )
  ) {
    return "Promotions";
  }

  if (
    listUnsubscribe ||
    from.includes("newsletter") ||
    subject.includes("newsletter") ||
    subject.includes("unsubscribe")
  ) {
    return "Newsletters";
  }

  return "Other";
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Gmail is not connected." },
      { status: 401 }
    );
  }

  const listResponse = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=50",
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    }
  );

  const listData = await listResponse.json();

  if (!listResponse.ok) {
    return NextResponse.json(
      { error: "Unable to list Gmail messages.", details: listData },
      { status: listResponse.status }
    );
  }

  const messages: GmailMessage[] = listData.messages ?? [];

  const detailedMessages = await Promise.all(
    messages.map(async (message) => {
      const response = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=List-Unsubscribe`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      return (await response.json()) as GmailMessageMetadata;
    })
  );

  const analyzedMessages = detailedMessages
    .filter((message): message is GmailMessageMetadata => message !== null)
    .map((message) => {
      const headers = message.payload?.headers ?? [];

      return {
        id: message.id,
        threadId: message.threadId,
        from: getHeader(headers, "From"),
        subject: getHeader(headers, "Subject"),
        date: getHeader(headers, "Date"),
        category: categorizeMessage(message, headers),
      };
    });

  const counts = analyzedMessages.reduce(
    (result, message) => {
      result[message.category] =
        (result[message.category] ?? 0) + 1;
      return result;
    },
    {} as Record<string, number>
  );

  return NextResponse.json({
    analyzed: analyzedMessages.length,
    counts,
    messages: analyzedMessages,
  });
}
