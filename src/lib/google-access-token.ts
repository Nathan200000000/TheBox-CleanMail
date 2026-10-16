import { getToken } from "next-auth/jwt";

type TokenPayload = {
  accessToken?: string;
  refreshToken?: string;
  accessTokenExpires?: number;
};

export async function getGoogleAccessToken(request: Request): Promise<string | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const cookie = request.headers.get("cookie") ?? "";
  const token = (await getToken({
    req: { headers: { cookie } } as never,
    secret,
  })) as TokenPayload | null;

  if (!token?.accessToken) return null;

  const expiresAt = token.accessTokenExpires ?? 0;
  if (expiresAt > Date.now() + 60_000) return token.accessToken;
  if (!token.refreshToken) return null;

  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    refresh_token: token.refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!response.ok) return null;
  const refreshed = (await response.json()) as { access_token?: string };
  return refreshed.access_token ?? null;
}
