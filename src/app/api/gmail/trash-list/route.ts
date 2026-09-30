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

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Gmail is not connected." },
      { status: 401 }
    );
  }

  try {
    const url = new URL(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages"
    );

    url.searchParams.set("maxResults", "50");
    url.searchParams.set("q", "in:trash");

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Unable to find Gmail Trash messages.",
          details: data,
        },
        { status: response.status }
      );
    }

    const messageIds = (data.messages ?? []) as {
      id: string;
      threadId: string;
    }[];

    const messages: {
      id: string;
      threadId: string;
      from: string;
      subject: string;
      date: string;
    }[] = [];

    for (let i = 0; i < messageIds.length; i += 10) {
      const batch = messageIds.slice(i, i + 10);

      const results = await Promise.all(
        batch.map(async (message) => {
          const detailUrl = new URL(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(
              message.id
            )}`
          );

          detailUrl.searchParams.set("format", "metadata");
          detailUrl.searchParams.append("metadataHeaders", "From");
          detailUrl.searchParams.append("metadataHeaders", "Subject");
          detailUrl.searchParams.append("metadataHeaders", "Date");

          const detailResponse = await fetch(detailUrl.toString(), {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
            cache: "no-store",
          });

          if (!detailResponse.ok) {
            return null;
          }

          return (await detailResponse.json()) as GmailMessage;
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
      count: messages.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load Gmail Trash." },
      { status: 500 }
    );
  }
}
