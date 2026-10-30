import { NextResponse } from "next/server";

// Gmail message IDs are short hexadecimal strings.
const MESSAGE_ID = /^[A-Za-z0-9_-]{1,64}$/;

export function isValidMessageIdList(value: unknown, max = 1000): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= max &&
    value.every((id) => typeof id === "string" && MESSAGE_ID.test(id))
  );
}

// Reject state-changing requests sent from another website.
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // same-origin fetches from older browsers may omit it
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

// Error response that never forwards Google's raw error details to the browser.
export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// Turns a failed Gmail API status into a short, safe message. Raw Gmail error
// bodies are never sent to the browser.
export function gmailFailure(status: number) {
  if (status === 401) return apiError("Your Google session expired. Sign out and sign in again.", 401);
  if (status === 403) return apiError("CleanMail doesn't have Gmail permission. Sign in again and allow access.", 403);
  if (status === 429) return apiError("Gmail is rate-limiting requests. Wait a minute and try again.", 429);
  if (status === 404) return apiError("Some messages no longer exist in Gmail. Scan again.", 404);
  return apiError("Gmail didn't respond as expected. Try again shortly.", 502);
}
