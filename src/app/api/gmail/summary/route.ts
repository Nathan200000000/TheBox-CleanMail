import { NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google-access-token";

const searches = [
  {
    name: "Promotions",
    query: "category:promotions",
  },
  {
    name: "Social",
    query: "category:social",
  },
  {
    name: "Updates",
    query: "category:updates",
  },
  {
    name: "Forums",
    query: "category:forums",
  },
  {
    name: "Newsletters",
    query: "unsubscribe",
  },
];

async function countMessages(
  accessToken: string,
  query: string
): Promise<number> {
  let count = 0;
  let pageToken: string | undefined;

  do {
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
      throw new Error(`Gmail search failed for "${query}".`);
    }

    count += (data.messages ?? []).length;
    pageToken = data.nextPageToken;
  } while (pageToken);

  return count;
}

export async function GET(request: Request) {
  const accessToken = await getGoogleAccessToken(request);

  if (!accessToken) {
    return NextResponse.json(
      { error: "Gmail is not connected." },
      { status: 401 }
    );
  }

  try {
    const categories = await Promise.all(
      searches.map(async (search) => ({
        name: search.name,
        query: search.query,
        count: await countMessages(
          accessToken,
          search.query
        ),
      }))
    );

    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json(
      { error: "Unable to count Gmail messages." },
      { status: 500 }
    );
  }
}
