import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | ZynBuddy",
  description: "The terms governing your use of ZynBuddy.",
};

const EFFECTIVE_DATE = "September 15, 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
      <div className="space-y-2.5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="max-w-3xl mx-auto w-full px-4 py-8 flex-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to map
        </Link>

        <h1 className="text-2xl font-extrabold dark:text-white mb-1">Terms of Service</h1>
        <p className="text-xs text-gray-400 mb-8">Effective {EFFECTIVE_DATE}</p>

        <div className="glass-card p-6 sm:p-8">
          <Section title="1. Acceptance of Terms">
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of
              ZynBuddy (the &ldquo;Service&rdquo;). By accessing or using the Service, you
              agree to be bound by these Terms. If you do not agree, do not use the Service.
            </p>
          </Section>

          <Section title="2. Age Requirement">
            <p>
              The Service provides pricing information about nicotine products, which are
              age-restricted. You must be at least 21 years of age to access or use the
              Service. By using the Service, you represent and warrant that you are 21 or
              older and that it is lawful for you to view this information in your
              jurisdiction.
            </p>
            <p>
              We may terminate any account we believe belongs to a person under 21.
            </p>
          </Section>

          <Section title="3. Description of the Service">
            <p>
              ZynBuddy is an informational platform that aggregates user-submitted retail
              pricing for nicotine pouches and related products. <strong>ZynBuddy does not
              sell, distribute, ship, or broker the sale of any nicotine product.</strong> We
              are not affiliated with, endorsed by, or sponsored by any nicotine product
              manufacturer or retailer.
            </p>
          </Section>

          <Section title="4. Accounts">
            <p>
              You are responsible for maintaining the confidentiality of your account
              credentials and for all activity that occurs under your account. You agree to
              provide accurate registration information and to keep it current. You must
              notify us promptly of any unauthorized use of your account.
            </p>
          </Section>

          <Section title="5. User Content and Price Reports">
            <p>
              The Service depends on content you submit, including price reports, deal
              descriptions, store information, votes, and reviews (&ldquo;User
              Content&rdquo;). You retain ownership of your User Content. By submitting it,
              you grant ZynBuddy a worldwide, non-exclusive, royalty-free, perpetual license
              to host, store, reproduce, display, and distribute that content in connection
              with operating and promoting the Service.
            </p>
            <p>
              You represent that you have the right to submit your User Content and that it
              does not violate any law or third-party right.
            </p>
          </Section>

          <Section title="6. Accuracy Disclaimer">
            <p>
              <strong>Prices displayed on ZynBuddy are submitted by users and are not
              verified by us.</strong> Prices change frequently, may be reported
              incorrectly, may be out of date, and may not reflect taxes, fees, promotions,
              or local availability. ZynBuddy makes no representation or warranty regarding
              the accuracy, completeness, or timeliness of any price, store detail, or other
              information on the Service. You should confirm all pricing directly with the
              retailer before relying on it.
            </p>
          </Section>

          <Section title="7. Prohibited Conduct">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Submit prices you know to be false, misleading, or fabricated;</li>
              <li>
                Post content that is harassing, abusive, defamatory, obscene, hateful, or
                otherwise objectionable;
              </li>
              <li>
                Use the Service to advertise, solicit, or facilitate the sale of nicotine
                products or any other goods;
              </li>
              <li>
                Attempt to manipulate rewards, trust scores, votes, or rankings, including
                through multiple accounts or automated submissions;
              </li>
              <li>
                Scrape, crawl, or harvest data from the Service except as expressly
                permitted;
              </li>
              <li>
                Interfere with or disrupt the Service, or attempt to gain unauthorized
                access to any system or account;
              </li>
              <li>Impersonate any person or entity, or misrepresent your affiliation.</li>
            </ul>
          </Section>

          <Section title="8. Moderation, Suspension, and Termination">
            <p>
              We may review, edit, or remove any User Content at our discretion, and we
              maintain automated and manual systems to detect abuse. We may suspend or
              terminate your account, temporarily or permanently, with or without notice,
              if we believe you have violated these Terms or if your activity harms the
              Service or other users. Repeated submission of inaccurate prices or harmful
              content may result in automatic suspension.
            </p>
          </Section>

          <Section title="9. Rewards Points">
            <p>
              Reward points are a promotional feature of the Service. They have no cash
              value, are not property, cannot be purchased, transferred, or redeemed for
              cash, and may be adjusted, expired, or revoked at any time, including where we
              determine they were earned through abuse or error. We may modify or
              discontinue the rewards program at any time without liability.
            </p>
          </Section>

          <Section title="10. Intellectual Property">
            <p>
              The Service, including its design, text, graphics, and software, is owned by
              ZynBuddy and protected by intellectual property laws. Product names and
              trademarks referenced on the Service belong to their respective owners and are
              used for identification purposes only.
            </p>
          </Section>

          <Section title="11. Health Notice">
            <p>
              Nicotine is an addictive chemical. Nothing on the Service constitutes medical
              advice or an encouragement to begin or continue using nicotine products. The
              Service is intended solely for adults who already use these products and are
              seeking pricing information.
            </p>
          </Section>

          <Section title="12. Disclaimer of Warranties">
            <p>
              THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo;
              WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING
              WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND
              NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
              SECURE, OR ERROR-FREE.
            </p>
          </Section>

          <Section title="13. Limitation of Liability">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, ZYNBUDDY AND ITS OPERATORS WILL NOT BE
              LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
              DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF
              OR INABILITY TO USE THE SERVICE, INCLUDING RELIANCE ON ANY PRICE OR OTHER
              INFORMATION DISPLAYED. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE
              SERVICE WILL NOT EXCEED ONE HUNDRED U.S. DOLLARS ($100).
            </p>
          </Section>

          <Section title="14. Indemnification">
            <p>
              You agree to indemnify and hold harmless ZynBuddy and its operators from any
              claim, demand, loss, or expense (including reasonable attorneys&rsquo; fees)
              arising out of your User Content, your use of the Service, or your violation of
              these Terms or any law.
            </p>
          </Section>

          <Section title="15. Third-Party Content and Links">
            <p>
              The Service may reference third-party retailers, map data, or websites. We do
              not control and are not responsible for third-party content, products, or
              practices.
            </p>
          </Section>

          <Section title="16. Changes to These Terms">
            <p>
              We may modify these Terms at any time. If we make material changes, we will
              update the effective date above and, where appropriate, provide additional
              notice. Your continued use of the Service after changes take effect
              constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="17. Governing Law">
            <p>
              These Terms are governed by the laws of the State of Arizona, without regard
              to its conflict-of-law principles. You agree to the exclusive jurisdiction of
              the state and federal courts located in Maricopa County, Arizona.
            </p>
          </Section>

          <Section title="18. Contact">
            <p>
              Questions about these Terms may be directed to the site operator through the
              contact method listed on the Service.
            </p>
          </Section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
