import { NextResponse } from "next/server";
import { apiError, gmailFailure } from "@/lib/api-guards";
import { getGoogleAccessToken } from "@/lib/google-access-token";

const allowedQueries: Record<string, string> = {
  promotions: "category:promotions",
  social: "category:social",
  updates: "category:updates",
  forums: "category:forums",
  newsletters: "unsubscribe",
};

export async function GET(request: Request) {
  const accessToken = await getGoogleAccessToken(request);

  if (!accessToken) {
    return NextResponse.json(
      { error: "Gmail is not connected." },
      { status: 401 }
    );
  }

  const requestUrl = new URL(request.url);
  const category = requestUrl.searchParams.get("category") ?? "promotions";
  const pageToken = requestUrl.searchParams.get("pageToken");

  if (pageToken !== null && !/^[A-Za-z0-9_-]{1,256}$/.test(pageToken)) {
    return apiError("Invalid page token.", 400);
  }

  const query = Object.hasOwn(allowedQueries, category) ? allowedQueries[category] : undefined;

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
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return gmailFailure(response.status);
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
