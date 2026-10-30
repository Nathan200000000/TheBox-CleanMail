# Opening CleanMail to every Gmail user

CleanMail uses the **restricted** Gmail scope `https://www.googleapis.com/auth/gmail.modify`.
Until Google verifies the app, only accounts on the OAuth consent screen's **Test users**
list (max 100) can sign in, and everyone else sees "Access blocked". This file is the
checklist for getting it verified.

## What the code already covers

- [x] Public home page (`/`) that explains what the app does without signing in
- [x] Privacy policy (`/privacy`) with the Google API Services **Limited Use** statement,
      what data is accessed, how it is used, stored, shared and deleted
- [x] Only the scopes the features need: `openid email profile gmail.modify`
- [x] Unused routes that scanned the whole mailbox (`analyze`, `summary`, `senders`) removed
- [x] No database; tokens live only in the encrypted NextAuth session cookie
- [x] Raw Gmail error bodies never reach the browser
- [x] Strict input validation on message IDs, page tokens and categories
- [x] Same-origin check on POST routes that change the mailbox
- [x] Security headers (no framing, nosniff, HSTS, referrer and permissions policy)
- [x] `Cache-Control: no-store` on every `/api` response

## What you need to do (in order)

1. **Buy a domain** (e.g. `cleanmail.app` or `getcleanmail.com`). Google won't verify a
   `*.vercel.app` address because you can't prove you own it.
2. **Add it to Vercel**: Project `the-box-clean-mail` → Settings → Domains.
3. **Verify the domain** in [Google Search Console](https://search.google.com/search-console)
   with the Gmail account that owns the Google Cloud project (DNS TXT record).
4. **Update environment variables** in Vercel: `NEXTAUTH_URL=https://<your-domain>`.
5. **Google Cloud Console → Google Auth Platform**:
   - *Branding*: app name `CleanMail`, support email, logo (120×120), home page
     `https://<your-domain>/`, privacy policy `https://<your-domain>/privacy`,
     authorized domain `<your-domain>`.
   - *Clients*: add `https://<your-domain>/api/auth/callback/google` as a redirect URI.
   - *Data access*: confirm the only scopes are `openid`, `email`, `profile`, `gmail.modify`.
   - *Audience*: switch **Publishing status** to **In production**.
6. **Record the demo video** (script below), upload it to YouTube as *Unlisted*.
7. **Submit for verification** and paste the scope justification below.
8. **CASA Tier 2 security assessment.** Google emails you after the first review. Pick an
   authorized lab (TAC Security is the cheapest, from about $540/year). It must be renewed
   every 12 months.

## Scope justification (paste into the form)

> CleanMail is a Gmail cleanup tool. The user picks a category (Promotions, Social,
> Updates, Forums or newsletters); CleanMail lists matching messages showing only the
> sender, subject and date; the user selects messages, reviews them, and explicitly
> confirms moving them to Trash. `gmail.modify` is required because moving messages to
> Trash (`users.messages.batchModify` with the TRASH label) is a modify operation —
> `gmail.readonly` cannot do it and `gmail.metadata` does not allow search queries.
> CleanMail never reads message bodies, never sends email, never deletes permanently, and
> stores no Gmail data.

## Demo video script (2–3 minutes)

1. Show the browser address bar with `https://<your-domain>/` and the home page.
2. Click **Privacy Policy** and scroll to the Limited Use statement.
3. Click **Sign in with Google**. On the consent screen, **pause** so the app name and
   the Gmail permission are readable. In the address bar, show the OAuth `client_id`
   (it must match the one in the submission).
4. Back on the Dashboard, show the account panel and message totals.
5. Go to **Clean up** → choose **Promotions** → **Scan** → explain that only sender,
   subject and date are shown.
6. Select two or three messages → **Review selection** → **Move to Trash**.
7. Go to **Trash** in CleanMail, then open Gmail Trash in a new tab to show the same
   messages there.
8. Sign out, then show revoking access at `myaccount.google.com/connections`.

## CASA tips

- Run the free scan first: the lab will ask about dependency vulnerabilities, so run
  `npm audit` and update before you start.
- They will ask for: where tokens are stored (encrypted session cookie, see
  `src/app/api/auth/[...nextauth]/route.ts`), data flow (browser → Next.js route → Gmail
  API → browser; no storage), TLS (Vercel, HTTPS only, HSTS), and access control
  (only the signed-in user's own token is ever used).
