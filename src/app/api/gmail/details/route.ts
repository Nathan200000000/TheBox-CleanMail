import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type GmailHeader = {
  name: string;
  value: string;
};

type GmailMessage = {
  id: string;
  threadId: string;
  payload?: {
    headers?: GmailHeader[];
  };
};

function getHeader(headers: GmailHeader[] | undefined, name: string) {
  return (
    headers?.find(
      (header) => header.name.toLowerCase() === name.toLowerCase()
    )?.value ?? ""
  );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Gmail is not connected." },
      { status: 401 }
    );
  }

  let body: { messageIds?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const messageIds = body.messageIds;

  if (
    !Array.isArray(messageIds) ||
    messageIds.length === 0 ||
    messageIds.length > 1000 ||
    !messageIds.every(
      (id) => typeof id === "string" && id.trim().length > 0
    )
  ) {
    return NextResponse.json(
      { error: "Provide between 1 and 1000 valid Gmail message IDs." },
      { status: 400 }
    );
  }

  const messages: {
    id: string;
    threadId: string;
    from: string;
    subject: string;
    date: string;
  }[] = [];

  try {
    for (let i = 0; i < messageIds.length; i += 25) {
      const batch = messageIds.slice(i, i + 25);

      const results = await Promise.all(
        batch.map(async (messageId) => {
          const url = new URL(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(
              messageId
            )}`
          );

          url.searchParams.set("format", "metadata");
          url.searchParams.append("metadataHeaders", "From");
          url.searchParams.append("metadataHeaders", "Subject");
          url.searchParams.append("metadataHeaders", "Date");

          const response = await fetch(url.toString(), {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
            cache: "no-store",
          });

          if (!response.ok) {
            return null;
          }

          return (await response.json()) as GmailMessage;
        })
      );

      for (const message of results) {
        if (!message) {
          continue;
        }

        const headers = message.payload?.headers;

        messages.push({
          id: message.id,
          threadId: message.threadId,
          from: getHeader(headers, "From"),
          subject: getHeader(headers, "Subject"),
          date: getHeader(headers, "Date"),
        });
      }
    }

    return NextResponse.json({
      messages,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load Gmail message details." },
      { status: 500 }
    );
  }
}
