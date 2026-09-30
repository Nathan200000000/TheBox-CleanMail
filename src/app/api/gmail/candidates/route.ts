import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const allowedQueries: Record<string, string> = {
  promotions: "category:promotions",
  social: "category:social",
  updates: "category:updates",
  forums: "category:forums",
  newsletters: "unsubscribe",
};

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Gmail is not connected." },
      { status: 401 }
    );
  }

  const requestUrl = new URL(request.url);
  const category = requestUrl.searchParams.get("category") ?? "promotions";
  const pageToken = requestUrl.searchParams.get("pageToken");

  const query = allowedQueries[category];

  if (!query) {
    return NextResponse.json(
      {
        error:
          "Invalid category. Use promotions, social, updates, forums, or newsletters.",
      },
      { status: 400 }
    );
  }

  try {
    const url = new URL(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages"
    );

    url.searchParams.set("maxResults", "500");
    url.searchParams.set("q", query);
    url.searchParams.set("includeSpamTrash", "false");

    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Unable to find Gmail cleanup candidates.",
          details: data,
        },
        { status: response.status }
      );
    }

    const messages = (data.messages ?? []).map(
      (message: { id: string; threadId: string }) => ({
        id: message.id,
        threadId: message.threadId,
      })
    );

    return NextResponse.json({
      category,
      query,
      count: messages.length,
      messages,
      nextPageToken: data.nextPageToken ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to find Gmail cleanup candidates." },
      { status: 500 }
    );
  }
}
