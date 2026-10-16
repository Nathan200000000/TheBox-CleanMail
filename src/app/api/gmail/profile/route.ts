import { NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google-access-token";

export async function GET(request: Request) {
  const accessToken = await getGoogleAccessToken(request);

  if (!accessToken) {
    return NextResponse.json(
      { error: "Gmail is not connected." },
      { status: 401 }
    );
  }

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { error: "Gmail API request failed.", details: data },
      { status: response.status }
    );
  }

  return NextResponse.json({
    emailAddress: data.emailAddress,
    messagesTotal: data.messagesTotal,
    threadsTotal: data.threadsTotal,
  });
}
