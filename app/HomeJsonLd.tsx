import { PLANS, PLAN_ORDER } from "@/lib/plans";
// Structured data for the marketing home page.
//
// Two types only. Organization feeds the brand knowledge panel; SoftwareApplication
// states unambiguously what this is and what it costs, which is what Google uses
// when deciding whether the result deserves more than a blue link.
//
// FAQPage is deliberately absent. Google restricted FAQ rich results to
// government and health sites in 2023, so the markup would be dead weight on a
// SaaS site regardless of how many guides still recommend it.
//
// Nothing here claims a rating, a review count or a customer number. Fabricated
// aggregateRating is both a manual-action risk and the same dishonesty we just
// took off the stats strip.
const BASE = "https://readprospects.com";
export default function HomeJsonLd() {
  const organization = {
    "@type": "Organization",
    "@id": BASE + "/#organization",
    name: "ReadProspects",
    legalName: "ReadProspects Technologies Nigeria",
    url: BASE,
    email: "support@readprospects.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "325 Enugu Road, FCDA, Bwari",
      addressLocality: "Abuja",
      addressCountry: "NG",
    },
  };
  const website = {
    "@type": "WebSite",
    "@id": BASE + "/#website",
    url: BASE,
    name: "ReadProspects",
    publisher: { "@id": BASE + "/#organization" },
    inLanguage: ["en", "fr"],
  };
  const application = {
    "@type": "SoftwareApplication",
    "@id": BASE + "/#software",
    name: "ReadProspects",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Document intelligence for people who send proposals. See which pages held a reader, what they asked the document, and who they forwarded it to.",
    url: BASE,
    publisher: { "@id": BASE + "/#organization" },
    // Real prices, straight from the plan definitions, so they cannot drift
    // from what the pricing page charges.
    offers: PLAN_ORDER.map((id) => ({
      "@type": "Offer",
      name: PLANS[id].name,
      price: (PLANS[id].price.monthly / 100).toFixed(2),
      priceCurrency: "USD",
      url: BASE + "/pricing",
    })),
    featureList: [
      "Page-level reading signals",
      "A document companion that answers your reader's questions",
      "Verdicts on what a reader is thinking and what to do next",
      "A and B document versions",
      "Reading reports as PDF",
    ],
  };
  const graph = { "@context": "https://schema.org", "@graph": [organization, website, application] };
  return (
    <script
      type="application/ld+json"
      // Server-rendered from our own constants, no user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}