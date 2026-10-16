import { NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google-access-token";

export async function POST(request: Request) {
  const accessToken = await getGoogleAccessToken(request);

  if (!accessToken) {
    return NextResponse.json(
      { error: "Gmail is not connected." },
      { status: 401 }
    );
  }

  let body: { messageIds?: unknown; confirm?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (body.confirm !== true) {
    return NextResponse.json(
      { error: "Explicit confirmation is required before moving messages to Trash." },
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

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/batchModify",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ids: messageIds,
        addLabelIds: ["TRASH"],
        removeLabelIds: ["INBOX"],
      }),
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    return NextResponse.json(
      {
        error: "Unable to move messages to Trash.",
        details: data,
      },
      { status: response.status }
    );
  }

  return NextResponse.json({
    success: true,
    moved: messageIds.length,
  });
}
