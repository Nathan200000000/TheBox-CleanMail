import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Gmail is not connected." },
      { status: 401 }
    );
  }

  const response = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
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
