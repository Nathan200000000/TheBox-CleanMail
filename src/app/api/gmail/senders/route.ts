import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type GmailMessage = {
  id: string;
  threadId: string;
};

type GmailHeader = {
  name: string;
  value: string;
};

type GmailMessageMetadata = {
  id: string;
  threadId: string;
  payload?: {
    headers?: GmailHeader[];
  };
};

type Sender = {
  email: string;
  name: string;
  count: number;
  messageIds: string[];
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

function getSenderName(from: string): string {
  const match = from.match(/^"?([^"<]+?)"?\s*<[^>]+>$/);

  if (match?.[1]) {
    return match[1].trim();
  }

  return from.trim();
}

function getSenderEmail(from: string): string {
  const match = from.match(/<([^>]+)>/);

  if (match?.[1]) {
    return match[1].trim().toLowerCase();
  }

  return from.trim().toLowerCase();
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Gmail is not connected." },
      { status: 401 }
    );
  }

  try {
    const requestUrl = new URL(request.url);
    const pageToken = requestUrl.searchParams.get("pageToken");

    const listUrl = new URL(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages"
    );

    listUrl.searchParams.set("maxResults", "500");
    listUrl.searchParams.set("includeSpamTrash", "false");

    if (pageToken) {
      listUrl.searchParams.set("pageToken", pageToken);
    }

    const listResponse = await fetch(listUrl.toString(), {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    const listData = await listResponse.json();

    if (!listResponse.ok) {
      return NextResponse.json(
        {
          error: "Unable to list Gmail messages.",
          details: listData,
        },
        { status: listResponse.status }
      );
    }

    const messages: GmailMessage[] = listData.messages ?? [];

    const senders = new Map<string, Sender>();

    for (const message of messages) {
      const url = new URL(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`
      );

      url.searchParams.set("format", "metadata");
      url.searchParams.append("metadataHeaders", "From");

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) {
        continue;
      }

      const detailedMessage =
        (await response.json()) as GmailMessageMetadata;

      const from = getHeader(
        detailedMessage.payload?.headers,
        "From"
      );

      if (!from) {
        continue;
      }

      const email = getSenderEmail(from);
      const name = getSenderName(from);

      const existing = senders.get(email);

      if (existing) {
        existing.count += 1;
        existing.messageIds.push(message.id);
      } else {
        senders.set(email, {
          email,
          name,
          count: 1,
          messageIds: [message.id],
        });
      }
    }

    return NextResponse.json({
      analyzed: messages.length,
      senders: Array.from(senders.values()).sort(
        (a, b) => b.count - a.count
      ),
      nextPageToken: listData.nextPageToken ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to analyze Gmail senders." },
      { status: 500 }
    );
  }
}
