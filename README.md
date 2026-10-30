# CleanMail

Gmail cleanup with user control. CleanMail finds promotional, social and automated email,
shows you the sender, subject and date, and moves only the messages you pick to Gmail Trash.
Nothing is deleted automatically.

**Live:** https://the-box-clean-mail-two.vercel.app

## Screens

| Page | Path | What it does |
| --- | --- | --- |
| Dashboard | `/` | Public overview; after sign-in, mailbox totals and category shortcuts |
| Clean up | `/clean?category=promotions` | Choose a category → review matches → confirm Move to Trash |
| Trash | `/trash` | The 50 most recent messages in Gmail Trash |
| Privacy Policy | `/privacy` | Data use, including the Google Limited Use statement |

## Tech

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · NextAuth (Google OAuth) ·
Gmail REST API · Vercel.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

`.env.local`:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...          # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

In Google Cloud, add `http://localhost:3000/api/auth/callback/google` as an authorized
redirect URI and add your Gmail address under **Audience → Test users**.

## Letting anyone sign in

Gmail access is a restricted scope, so Google must verify the app first. See
[docs/google-verification.md](docs/google-verification.md).
