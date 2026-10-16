import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | CleanMail",
  description: "How CleanMail accesses and handles Google account data.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-bold tracking-tight">CleanMail</Link>
          <Link href="/" className="text-sm text-slate-600 underline underline-offset-4">Home</Link>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-slate-500">Last updated: October 16, 2026</p>
        <p className="mt-6 leading-7 text-slate-700">
          CleanMail helps you review Gmail messages and move messages you select to Gmail Trash.
          This policy explains what information CleanMail accesses and how it is handled.
        </p>

        <h2 className="mt-10 text-xl font-bold">Information we access</h2>
        <p className="mt-3 leading-7 text-slate-700">
          If you choose to connect a Google account, CleanMail requests basic Google sign-in
          information and the Gmail permission needed to find messages, read message metadata
          (such as sender, subject, and date), and move messages you confirm to Trash. CleanMail
          does not need to read message bodies for its current cleanup workflow.
        </p>

        <h2 className="mt-8 text-xl font-bold">How information is used</h2>
        <p className="mt-3 leading-7 text-slate-700">
          Google account information and Gmail metadata are used only to sign you in, display
          cleanup candidates, show the messages you select for review, and carry out actions
          you confirm. Gmail requests are made using the Google account you authorized.
        </p>

        <h2 className="mt-8 text-xl font-bold">Storage and sharing</h2>
        <p className="mt-3 leading-7 text-slate-700">
          CleanMail is designed to fetch message metadata from Gmail when you use the app rather
          than maintain a separate mailbox database. OAuth tokens are handled by the application
          server and its authentication session. Requests are processed by the app hosting
          provider and Google to provide the service. CleanMail does not sell Google user data
          or use it for advertising. We do not share it with third parties except as needed to
          operate the service, comply with law, or protect the service and its users.
        </p>

        <h2 className="mt-8 text-xl font-bold">Retention and your choices</h2>
        <p className="mt-3 leading-7 text-slate-700">
          CleanMail does not intentionally retain a separate copy of your message metadata after
          the request and page session used to display it. Authentication cookies and technical
          hosting logs may remain for their normal operational periods. You can sign out of
          CleanMail at any time and revoke CleanMail's Google account access from your Google
          Account security settings. Messages moved to Trash remain subject to Gmail's own
          retention and deletion rules.
        </p>

        <h2 className="mt-8 text-xl font-bold">Security</h2>
        <p className="mt-3 leading-7 text-slate-700">
          CleanMail uses HTTPS hosting and server-side API requests to access Gmail. No internet
          service can guarantee absolute security. Please only connect an account you are
          authorized to use, and review selected messages before confirming a cleanup.
        </p>

        <h2 className="mt-8 text-xl font-bold">Children</h2>
        <p className="mt-3 leading-7 text-slate-700">
          CleanMail is not intended for children under 13, and we do not knowingly collect
          personal information from children under 13.
        </p>

        <h2 className="mt-8 text-xl font-bold">Changes and contact</h2>
        <p className="mt-3 leading-7 text-slate-700">
          We may update this policy as CleanMail changes. Questions about this policy can be
          sent to <a className="underline underline-offset-4" href="mailto:mervilnathan@gmail.com">mervilnathan@gmail.com</a>.
        </p>
      </article>
      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-3xl px-6 py-6 text-sm text-slate-500">
          <Link href="/" className="underline underline-offset-4">Back to CleanMail</Link>
        </div>
      </footer>
    </main>
  );
}
