import type { Metadata } from "next";
import type { ReactNode } from "react";
import PageShell, { Panel } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Privacy Policy · CleanMail",
  description: "How CleanMail accesses, uses, stores and shares Google user data.",
};

const LAST_UPDATED = "October 30, 2026";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-3 grid gap-3 leading-7 text-slate-700">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <PageShell
      eyebrow="Privacy"
      title="Privacy Policy"
      intro={
        <>
          How CleanMail accesses, uses, stores and shares data from your Google account.{" "}
          <span className="text-sm text-slate-500">Last updated: {LAST_UPDATED}</span>
        </>
      }
    >
      <Panel className="border-emerald-200 bg-emerald-50">
        <h2 className="text-lg font-bold text-emerald-950">Google API Services — Limited Use</h2>
        <p className="mt-2 leading-7 text-emerald-900">
          CleanMail&apos;s use and transfer of information received from Google APIs to any other app will adhere to the{" "}
          <a
            className="font-semibold underline underline-offset-4"
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
      </Panel>

      <Panel>
        <Section title="What CleanMail does">
          <p>
            CleanMail helps you find Gmail messages in categories such as Promotions, Social, Updates, Forums and
            newsletters, review them, and move only the messages you select to Gmail Trash. Nothing is deleted
            automatically, and CleanMail never permanently deletes mail.
          </p>
        </Section>

        <Section title="Google data we access">
          <p>When you choose to connect a Google account, CleanMail requests:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Basic profile</strong> (<code>openid</code>, <code>email</code>, <code>profile</code>): your name,
              email address and profile picture, to sign you in and show which account is connected.
            </li>
            <li>
              <strong>Gmail</strong> (<code>https://www.googleapis.com/auth/gmail.modify</code>): to search for messages
              in a category, read message metadata (sender, subject and date), read your mailbox message and
              conversation totals, list recent Trash, and move messages you confirm to Trash.
            </li>
          </ul>
          <p>
            CleanMail does not read message bodies or attachments, does not send email, and does not change labels
            other than moving the messages you confirm to Trash.
          </p>
        </Section>

        <Section title="How we use Google data">
          <p>
            Google data is used only to provide CleanMail&apos;s user-facing features: signing you in, showing cleanup
            candidates, showing the messages you selected for review, and carrying out actions you confirm.
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>We do not use Google data for advertising, including personalized or retargeted ads.</li>
            <li>We do not sell Google data or transfer it to data brokers or information resellers.</li>
            <li>We do not use Google data to determine creditworthiness or for lending purposes.</li>
            <li>We do not use Google data to develop, improve or train generalized AI or machine-learning models.</li>
            <li>
              No person reads your Gmail data unless you give explicit permission for specific messages (for example,
              for support), it is necessary for security purposes, or it is required by law.
            </li>
          </ul>
        </Section>

        <Section title="Storage">
          <p>
            CleanMail has no database. Message metadata is fetched from Gmail when you use the app, sent to your
            browser to display, and not saved by CleanMail. Your Google access and refresh tokens are kept in an
            encrypted, HTTP-only session cookie in your browser so the app can make Gmail requests on your behalf;
            they are not stored on our servers. API responses are marked not to be cached.
          </p>
        </Section>

        <Section title="Sharing">
          <p>
            We do not share Google data with third parties. Requests pass through our hosting provider (Vercel) and
            Google solely to operate the service. We may disclose information only if required by law or to protect
            the security of the service and its users.
          </p>
        </Section>

        <Section title="Retention and deletion">
          <p>
            Message metadata is discarded as soon as the page that displayed it is closed or refreshed. Signing out
            deletes the session cookie and the tokens in it. Hosting providers may keep standard technical logs
            (such as request times and IP addresses) for their normal operational periods; these logs do not contain
            message content.
          </p>
          <p>
            You can revoke CleanMail&apos;s access at any time at{" "}
            <a
              className="underline underline-offset-4"
              href="https://myaccount.google.com/connections"
              target="_blank"
              rel="noopener noreferrer"
            >
              myaccount.google.com/connections
            </a>
            . Messages moved to Trash follow Gmail&apos;s own rules and are permanently removed by Gmail after 30 days.
          </p>
        </Section>

        <Section title="Security">
          <p>
            CleanMail is served only over HTTPS. Gmail requests are made server-side, input is validated, actions that
            change your mailbox require a same-site request and an explicit confirmation, and security headers prevent
            the app from being embedded in other sites. No internet service can guarantee absolute security.
          </p>
        </Section>

        <Section title="Children">
          <p>CleanMail is not intended for children under 13, and we do not knowingly collect their information.</p>
        </Section>

        <Section title="Changes and contact">
          <p>
            We will update this page and its date if this policy changes. Questions or deletion requests:{" "}
            <a className="underline underline-offset-4" href="mailto:mervilnathan@gmail.com">
              mervilnathan@gmail.com
            </a>
            .
          </p>
        </Section>
      </Panel>
    </PageShell>
  );
}
