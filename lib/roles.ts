/**
 * Canonical role library.
 *
 * A recipient's role is a property of the RECIPIENT, not of any buyer profile.
 * It is captured once when they are added and holds across every document they
 * ever receive. Buyer profiles consume it at analysis time: each persona
 * declares which roles it covers, so attaching a different profile re-matches
 * every reader without touching a single stored row.
 *
 * Seniority variants stay SEPARATE wherever they behave differently in a deal.
 * A Sales Operations Manager and a VP Revenue Operations are not the same buyer,
 * and collapsing them would hide the exact pattern the gap analysis exists to
 * find.
 *
 * Ids are stable and must never be reused or renamed. Labels can change.
 */

export interface Role {
  id: string;
  label: string;
  /** Extra search terms. Never rendered, only matched against. */
  alt?: string[];
}

export interface RoleGroup {
  id: string;
  label: string;
  roles: Role[];
}

export const ROLE_GROUPS: RoleGroup[] = [
  {
    id: "exec",
    label: "Executive and founder",
    roles: [
      { id: "founder", label: "Founder" },
      { id: "cofounder", label: "Co-founder" },
      { id: "ceo", label: "CEO" },
      { id: "coo", label: "COO" },
      { id: "president", label: "President" },
      { id: "gm", label: "General Manager" },
      { id: "md", label: "Managing Director" },
      { id: "chief-of-staff", label: "Chief of Staff" },
      { id: "board-member", label: "Board member" },
      { id: "board-chair", label: "Board Chair" },
      { id: "trustee", label: "Trustee" },
      { id: "advisor", label: "Advisor" },
      { id: "owner", label: "Business owner" },
      { id: "country-manager", label: "Country Manager" },
    ],
  },
  {
    id: "sales",
    label: "Sales and revenue",
    roles: [
      { id: "cro", label: "CRO" },
      { id: "vp-sales", label: "VP Sales" },
      { id: "head-sales", label: "Head of Sales" },
      { id: "director-sales", label: "Director of Sales" },
      { id: "sales-manager", label: "Sales Manager" },
      { id: "ae", label: "Account Executive" },
      { id: "enterprise-ae", label: "Enterprise Account Executive" },
      { id: "sdr", label: "SDR or BDR" },
      { id: "sdr-manager", label: "SDR or BDR Manager" },
      { id: "account-manager", label: "Account Manager" },
      { id: "vp-bizdev", label: "VP Business Development" },
      { id: "head-bizdev", label: "Head of Business Development" },
      { id: "bizdev", label: "Business Development Manager" },
      { id: "sales-engineer", label: "Sales Engineer" },
      { id: "head-partnerships", label: "Head of Partnerships" },
      { id: "partnerships-manager", label: "Partnerships Manager" },
      { id: "channel-manager", label: "Channel Manager" },
      { id: "distributor", label: "Distributor or Reseller" },
    ],
  },
  {
    id: "revops",
    label: "Revenue and sales operations",
    roles: [
      { id: "vp-revops", label: "VP Revenue Operations" },
      { id: "head-revops", label: "Head of Revenue Operations" },
      { id: "director-revops", label: "Director of Revenue Operations" },
      { id: "revops-manager", label: "Revenue Operations Manager" },
      { id: "sales-ops-manager", label: "Sales Operations Manager" },
      { id: "sales-ops-analyst", label: "Sales Operations Analyst" },
      { id: "marketing-ops", label: "Marketing Operations Manager" },
      { id: "cs-ops", label: "Customer Success Operations" },
      { id: "sales-enablement", label: "Sales Enablement Manager" },
      { id: "head-enablement", label: "Head of Enablement" },
      { id: "deal-desk", label: "Deal Desk" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    roles: [
      { id: "cmo", label: "CMO" },
      { id: "vp-marketing", label: "VP Marketing" },
      { id: "head-marketing", label: "Head of Marketing" },
      { id: "director-marketing", label: "Director of Marketing" },
      { id: "marketing-manager", label: "Marketing Manager" },
      { id: "head-growth", label: "Head of Growth" },
      { id: "growth-manager", label: "Growth Manager" },
      { id: "head-demandgen", label: "Head of Demand Generation" },
      { id: "demandgen-manager", label: "Demand Generation Manager" },
      { id: "head-content", label: "Head of Content" },
      { id: "content-manager", label: "Content Manager" },
      { id: "brand-manager", label: "Brand Manager" },
      { id: "product-marketing", label: "Product Marketing Manager" },
      { id: "head-pmm", label: "Head of Product Marketing" },
      { id: "performance-marketing", label: "Performance Marketing Manager" },
      { id: "social-media-manager", label: "Social Media Manager" },
      { id: "comms-manager", label: "Communications Manager" },
      { id: "head-comms", label: "Head of Communications" },
      { id: "events-manager", label: "Events Manager" },
      { id: "seo-manager", label: "SEO Manager" },
      { id: "head-pr", label: "Head of Public Relations" },
    ],
  },
  {
    id: "cs",
    label: "Customer success and support",
    roles: [
      { id: "cco", label: "Chief Customer Officer" },
      { id: "vp-cs", label: "VP Customer Success" },
      { id: "head-cs", label: "Head of Customer Success" },
      { id: "director-cs", label: "Director of Customer Success" },
      { id: "cs-manager", label: "Customer Success Manager" },
      { id: "director-cx", label: "Director of Customer Experience" },
      { id: "head-onboarding", label: "Head of Onboarding" },
      { id: "onboarding-manager", label: "Onboarding Manager" },
      { id: "implementation-lead", label: "Implementation Lead" },
      { id: "solutions-architect", label: "Solutions Architect" },
      { id: "head-support", label: "Head of Support" },
      { id: "support-manager", label: "Support Manager" },
      { id: "account-director", label: "Account Director" },
      { id: "renewals-manager", label: "Renewals Manager" },
      { id: "head-community", label: "Head of Community" },
    ],
  },
  {
    id: "finance",
    label: "Finance and procurement",
    roles: [
      { id: "cfo", label: "CFO" },
      { id: "vp-finance", label: "VP Finance" },
      { id: "head-finance", label: "Head of Finance" },
      { id: "director-finance", label: "Director of Finance" },
      { id: "finance-manager", label: "Finance Manager" },
      { id: "financial-controller", label: "Financial Controller" },
      { id: "fpa", label: "FP and A Manager" },
      { id: "accountant", label: "Accountant" },
      { id: "bookkeeper", label: "Bookkeeper" },
      { id: "treasurer", label: "Treasurer" },
      { id: "accounts-payable", label: "Accounts Payable" },
      { id: "auditor", label: "Internal Auditor" },
      { id: "head-procurement", label: "Head of Procurement" },
      { id: "procurement-manager", label: "Procurement Manager" },
      { id: "buyer", label: "Buyer or Purchasing Officer" },
      { id: "vendor-manager", label: "Vendor Manager" },
    ],
  },
  {
    id: "ops",
    label: "Operations",
    roles: [
      { id: "vp-ops", label: "VP Operations" },
      { id: "head-ops", label: "Head of Operations" },
      { id: "director-ops", label: "Director of Operations" },
      { id: "ops-manager", label: "Operations Manager" },
      { id: "bizops", label: "Business Operations Manager" },
      { id: "head-strategy", label: "Head of Strategy" },
      { id: "programme-manager", label: "Programme Manager" },
      { id: "project-manager", label: "Project Manager" },
      { id: "head-supply-chain", label: "Head of Supply Chain" },
      { id: "logistics-manager", label: "Logistics Manager" },
      { id: "facilities-manager", label: "Facilities Manager" },
      { id: "head-transformation", label: "Head of Transformation" },
      { id: "plant-manager", label: "Plant or Production Manager" },
      { id: "qhse-manager", label: "Quality or HSE Manager" },
    ],
  },
  {
    id: "eng",
    label: "Engineering and product",
    roles: [
      { id: "cto", label: "CTO" },
      { id: "vp-eng", label: "VP Engineering" },
      { id: "head-eng", label: "Head of Engineering" },
      { id: "director-eng", label: "Director of Engineering" },
      { id: "eng-manager", label: "Engineering Manager" },
      { id: "tech-lead", label: "Tech Lead" },
      { id: "principal-engineer", label: "Principal Engineer" },
      { id: "staff-engineer", label: "Staff Engineer" },
      { id: "software-engineer", label: "Software Engineer" },
      { id: "architect", label: "Solution or Enterprise Architect" },
      { id: "devops", label: "DevOps or Platform Engineer" },
      { id: "sre", label: "Site Reliability Engineer" },
      { id: "qa-lead", label: "QA Lead" },
      { id: "cpo", label: "Chief Product Officer" },
      { id: "vp-product", label: "VP Product" },
      { id: "head-product", label: "Head of Product" },
      { id: "product-manager", label: "Product Manager" },
      { id: "product-owner", label: "Product Owner" },
      { id: "head-design", label: "Head of Design" },
      { id: "product-designer", label: "Product Designer" },
      { id: "ux-researcher", label: "UX Researcher" },
    ],
  },
  {
    id: "data",
    label: "Data and analytics",
    roles: [
      { id: "cdo", label: "Chief Data Officer" },
      { id: "head-data", label: "Head of Data" },
      { id: "director-analytics", label: "Director of Analytics" },
      { id: "data-manager", label: "Data Manager" },
      { id: "data-scientist", label: "Data Scientist" },
      { id: "data-engineer", label: "Data Engineer" },
      { id: "data-analyst", label: "Data Analyst" },
      { id: "bi-analyst", label: "BI Analyst" },
      { id: "head-ai", label: "Head of AI or ML" },
      { id: "research-lead", label: "Research Lead" },
    ],
  },
  {
    id: "security",
    label: "Security and IT",
    roles: [
      { id: "ciso", label: "CISO" },
      { id: "head-security", label: "Head of Security" },
      { id: "security-manager", label: "Security Manager" },
      { id: "security-analyst", label: "Security Analyst" },
      { id: "cio", label: "CIO" },
      { id: "head-it", label: "Head of IT" },
      { id: "it-manager", label: "IT Manager" },
      { id: "sysadmin", label: "Systems Administrator" },
      { id: "network-admin", label: "Network Administrator" },
      { id: "head-infrastructure", label: "Head of Infrastructure" },
      { id: "dpo", label: "Data Protection Officer" },
    ],
  },
  {
    id: "people",
    label: "People and HR",
    roles: [
      { id: "chro", label: "CHRO or Chief People Officer" },
      { id: "vp-people", label: "VP People" },
      { id: "head-hr", label: "Head of HR" },
      { id: "hr-director", label: "HR Director" },
      { id: "hr-manager", label: "HR Manager" },
      { id: "hr-business-partner", label: "HR Business Partner" },
      { id: "head-talent", label: "Head of Talent" },
      { id: "recruiter", label: "Recruiter" },
      { id: "head-l-and-d", label: "Head of Learning and Development" },
      { id: "training-manager", label: "Training Manager" },
      { id: "compensation-manager", label: "Compensation and Benefits Manager" },
      { id: "head-culture", label: "Head of Culture or Engagement" },
      { id: "office-manager", label: "Office Manager" },
      { id: "executive-assistant", label: "Executive Assistant" },
    ],
  },
  {
    id: "legal",
    label: "Legal, risk and compliance",
    roles: [
      { id: "general-counsel", label: "General Counsel" },
      { id: "head-legal", label: "Head of Legal" },
      { id: "legal-counsel", label: "Legal Counsel" },
      { id: "contracts-manager-legal", label: "Contracts Manager" },
      { id: "company-secretary", label: "Company Secretary" },
      { id: "head-compliance", label: "Head of Compliance" },
      { id: "compliance-officer", label: "Compliance Officer" },
      { id: "head-risk", label: "Head of Risk" },
      { id: "risk-manager", label: "Risk Manager" },
      { id: "paralegal", label: "Paralegal" },
      { id: "head-governance", label: "Head of Governance" },
    ],
  },
  {
    id: "agency",
    label: "Agency, consulting and practice",
    roles: [
      { id: "agency-md", label: "Agency Managing Director" },
      { id: "agency-founder", label: "Agency Owner or Founder" },
      { id: "client-partner", label: "Client Partner" },
      { id: "agency-account-director", label: "Agency Account Director" },
      { id: "head-new-business", label: "Head of New Business" },
      { id: "creative-director", label: "Creative Director" },
      { id: "studio-manager", label: "Studio Manager" },
      { id: "head-delivery", label: "Head of Delivery" },
      { id: "engagement-manager", label: "Engagement Manager" },
      { id: "principal-consultant", label: "Principal Consultant" },
      { id: "consultant", label: "Consultant" },
      { id: "managing-partner", label: "Managing Partner" },
      { id: "senior-partner", label: "Senior Partner" },
      { id: "practice-manager", label: "Practice Manager" },
      { id: "head-of-chambers", label: "Head of Chambers" },
      { id: "freelancer", label: "Freelancer or Independent" },
    ],
  },
  {
    id: "investor",
    label: "Investor and funder",
    roles: [
      { id: "general-partner", label: "General Partner" },
      { id: "managing-partner-vc", label: "Managing Partner, fund" },
      { id: "venture-partner", label: "Venture Partner" },
      { id: "principal-vc", label: "Principal" },
      { id: "associate-vc", label: "Associate" },
      { id: "investment-analyst", label: "Investment Analyst" },
      { id: "angel-investor", label: "Angel Investor" },
      { id: "family-office-principal", label: "Family Office Principal" },
      { id: "fund-manager", label: "Fund Manager" },
      { id: "portfolio-director", label: "Portfolio Director" },
      { id: "head-platform", label: "Head of Platform" },
      { id: "lp", label: "Limited Partner" },
      { id: "head-ir", label: "Head of Investor Relations" },
      { id: "grant-officer", label: "Grant Officer" },
      { id: "programme-officer-funder", label: "Programme Officer, funder" },
      { id: "dfi-officer", label: "Development Finance Officer" },
      { id: "accelerator-director", label: "Accelerator Director" },
      { id: "bank-relationship-manager", label: "Bank Relationship Manager" },
      { id: "credit-officer", label: "Credit Officer" },
    ],
  },
  {
    id: "nonprofit",
    label: "Nonprofit and NGO",
    roles: [
      { id: "executive-director", label: "Executive Director" },
      { id: "deputy-director", label: "Deputy Director, nonprofit" },
      { id: "country-director", label: "Country Director" },
      { id: "programme-director", label: "Programme Director" },
      { id: "programme-manager-ngo", label: "Programme Manager, nonprofit" },
      { id: "project-officer", label: "Project Officer" },
      { id: "development-director", label: "Development Director" },
      { id: "head-fundraising", label: "Head of Fundraising" },
      { id: "grants-manager", label: "Grants Manager" },
      { id: "grant-writer", label: "Grant Writer" },
      { id: "major-gifts-officer", label: "Major Gifts Officer" },
      { id: "donor-relations", label: "Donor Relations Manager" },
      { id: "head-partnerships-ngo", label: "Head of Partnerships, nonprofit" },
      { id: "advocacy-lead", label: "Advocacy Lead" },
      { id: "me-lead", label: "Monitoring and Evaluation Lead" },
      { id: "impact-manager", label: "Impact Manager" },
      { id: "volunteer-coordinator", label: "Volunteer Coordinator" },
      { id: "head-safeguarding", label: "Head of Safeguarding" },
      { id: "csr-manager", label: "CSR or Sustainability Manager" },
      { id: "foundation-director", label: "Foundation Director" },
    ],
  },
  {
    id: "education",
    label: "Education",
    roles: [
      { id: "vice-chancellor", label: "Vice Chancellor" },
      { id: "provost", label: "Provost" },
      { id: "dean", label: "Dean" },
      { id: "head-of-department", label: "Head of Department" },
      { id: "professor", label: "Professor" },
      { id: "lecturer", label: "Lecturer" },
      { id: "registrar", label: "Registrar" },
      { id: "bursar", label: "Bursar" },
      { id: "head-teacher", label: "Head Teacher or Principal" },
      { id: "deputy-head", label: "Deputy Head" },
      { id: "head-admissions", label: "Head of Admissions" },
      { id: "director-of-studies", label: "Director of Studies" },
      { id: "school-administrator", label: "School Administrator" },
      { id: "head-edtech", label: "Head of Educational Technology" },
      { id: "librarian", label: "Librarian" },
      { id: "school-board-member", label: "School Board Member" },
      { id: "training-provider", label: "Training Provider" },
    ],
  },
  {
    id: "health",
    label: "Healthcare",
    roles: [
      { id: "cmo-health", label: "Chief Medical Officer" },
      { id: "medical-director", label: "Medical Director" },
      { id: "hospital-administrator", label: "Hospital Administrator" },
      { id: "hospital-ceo", label: "Hospital CEO" },
      { id: "head-clinical-services", label: "Head of Clinical Services" },
      { id: "clinical-director", label: "Clinical Director" },
      { id: "head-nursing", label: "Head of Nursing" },
      { id: "matron", label: "Matron or Ward Manager" },
      { id: "pharmacy-director", label: "Pharmacy Director" },
      { id: "pharmacist", label: "Pharmacist" },
      { id: "lab-manager", label: "Laboratory Manager" },
      { id: "practice-manager-health", label: "Practice Manager, clinic" },
      { id: "consultant-physician", label: "Consultant Physician" },
      { id: "gp", label: "General Practitioner" },
      { id: "head-health-informatics", label: "Head of Health Informatics" },
      { id: "public-health-officer", label: "Public Health Officer" },
      { id: "head-quality-health", label: "Head of Clinical Quality" },
    ],
  },
  {
    id: "government",
    label: "Government and public sector",
    roles: [
      { id: "permanent-secretary", label: "Permanent Secretary" },
      { id: "director-general", label: "Director General" },
      { id: "commissioner", label: "Commissioner" },
      { id: "minister-adviser", label: "Special Adviser" },
      { id: "head-of-agency", label: "Head of Agency or Parastatal" },
      { id: "deputy-director-gov", label: "Deputy Director, government" },
      { id: "programme-officer-gov", label: "Programme Officer" },
      { id: "desk-officer", label: "Desk Officer" },
      { id: "procurement-officer-gov", label: "Public Procurement Officer" },
      { id: "policy-adviser", label: "Policy Adviser" },
      { id: "head-of-unit", label: "Head of Unit" },
      { id: "local-government-chairman", label: "Local Government Chairman" },
      { id: "council-officer", label: "Council Officer" },
      { id: "regulator", label: "Regulatory Officer" },
      { id: "diplomat", label: "Diplomat or Attache" },
      { id: "head-of-mission", label: "Head of Mission" },
      { id: "legislative-aide", label: "Legislative Aide" },
    ],
  },
  {
    id: "faith",
    label: "Faith and community",
    roles: [
      { id: "pastor", label: "Pastor" },
      { id: "imam", label: "Imam" },
      { id: "priest", label: "Priest" },
      { id: "bishop", label: "Bishop or Overseer" },
      { id: "church-administrator", label: "Church Administrator" },
      { id: "head-missions", label: "Head of Missions" },
      { id: "youth-pastor", label: "Youth Pastor or Leader" },
      { id: "worship-director", label: "Worship Director" },
      { id: "trustee-faith", label: "Trustee, faith organisation" },
      { id: "community-leader", label: "Community Leader" },
      { id: "association-chairman", label: "Association Chairman" },
      { id: "cooperative-secretary", label: "Cooperative Secretary" },
      { id: "union-official", label: "Union Official" },
    ],
  },
  {
    id: "property",
    label: "Property, construction and trades",
    roles: [
      { id: "property-developer", label: "Property Developer" },
      { id: "head-estates", label: "Head of Estates" },
      { id: "facilities-director", label: "Facilities Director" },
      { id: "quantity-surveyor", label: "Quantity Surveyor" },
      { id: "site-manager", label: "Site Manager" },
      { id: "contracts-manager-build", label: "Contracts Manager, construction" },
      { id: "project-architect", label: "Architect" },
      { id: "structural-engineer", label: "Structural Engineer" },
      { id: "civil-engineer", label: "Civil Engineer" },
      { id: "building-services-engineer", label: "Building Services Engineer" },
      { id: "estate-agent", label: "Estate or Letting Agent" },
      { id: "valuer", label: "Valuer or Surveyor" },
      { id: "head-maintenance", label: "Head of Maintenance" },
      { id: "contractor", label: "Contractor or Builder" },
    ],
  },
  {
    id: "media",
    label: "Media and creative",
    roles: [
      { id: "editor", label: "Editor" },
      { id: "editor-in-chief", label: "Editor in Chief" },
      { id: "publisher", label: "Publisher" },
      { id: "journalist", label: "Journalist" },
      { id: "producer", label: "Producer" },
      { id: "head-production", label: "Head of Production" },
      { id: "commissioning-editor", label: "Commissioning Editor" },
      { id: "creative-director-media", label: "Creative Director, media" },
      { id: "art-director", label: "Art Director" },
      { id: "talent-manager", label: "Talent Manager" },
      { id: "head-programming", label: "Head of Programming" },
      { id: "station-manager", label: "Station Manager" },
      { id: "creator", label: "Creator or Influencer" },
      { id: "podcast-host", label: "Podcast Host" },
    ],
  },
  {
    id: "retail",
    label: "Retail, hospitality and consumer",
    roles: [
      { id: "head-retail", label: "Head of Retail" },
      { id: "store-manager", label: "Store Manager" },
      { id: "category-manager", label: "Category Manager" },
      { id: "merchandiser", label: "Merchandiser" },
      { id: "head-ecommerce", label: "Head of Ecommerce" },
      { id: "head-buying", label: "Head of Buying" },
      { id: "hotel-manager", label: "Hotel or General Manager, hospitality" },
      { id: "restaurant-manager", label: "Restaurant Manager" },
      { id: "head-franchise", label: "Head of Franchising" },
      { id: "franchisee", label: "Franchisee" },
      { id: "wholesaler", label: "Wholesaler" },
      { id: "distributor-retail", label: "Retail Distributor" },
    ],
  },
  {
    id: "other",
    label: "Other",
    roles: [
      { id: "student", label: "Student" },
      { id: "researcher", label: "Researcher or Academic" },
      { id: "job-seeker", label: "Job Seeker or Candidate" },
      { id: "supplier", label: "Supplier or Vendor" },
      { id: "customer", label: "Existing Customer" },
      { id: "press-contact", label: "Press Contact" },
      { id: "unknown", label: "Not sure yet" },
    ],
  },
];

/** Flat list, in group order. */
export const ALL_ROLES: Role[] = ROLE_GROUPS.flatMap((g) => g.roles);

const BY_ID = new Map<string, Role>(ALL_ROLES.map((r) => [r.id, r]));
const GROUP_OF = new Map<string, RoleGroup>(
  ROLE_GROUPS.flatMap((g) => g.roles.map((r) => [r.id, g] as [string, RoleGroup])),
);

export function isRoleId(id: string): boolean {
  return BY_ID.has(id);
}

/** Unknown ids return null rather than throwing: a role deleted from the library
 *  must not break a recipient row that still references it. */
export function roleLabel(id: string): string | null {
  return BY_ID.get(id)?.label ?? null;
}

export function roleGroupOf(id: string): RoleGroup | null {
  return GROUP_OF.get(id) ?? null;
}

/** Renders a recipient's roles for display, keeping any typed-in role last. */
export function describeRoles(ids: string[], other?: string | null): string {
  const known = ids.map(roleLabel).filter((x): x is string => Boolean(x));
  const all = other && other.trim() ? [...known, other.trim()] : known;
  return all.join(", ");
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Search over the grouped list. Groups keep their order; within a group, a label
 * that STARTS with the query sorts above one that merely contains it, so typing
 * "head" surfaces "Head of Sales" before "Department Head".
 */
export function searchRoles(query: string): RoleGroup[] {
  const q = norm(query);
  if (!q) return ROLE_GROUPS;
  const terms = q.split(" ");
  const out: RoleGroup[] = [];
  for (const g of ROLE_GROUPS) {
    const hits = g.roles.filter((r) => {
      const hay = norm(r.label + " " + (r.alt ?? []).join(" "));
      return terms.every((t) => hay.includes(t));
    });
    if (!hits.length) continue;
    hits.sort((a, b) => {
      const as = norm(a.label).startsWith(q) ? 0 : 1;
      const bs = norm(b.label).startsWith(q) ? 0 : 1;
      return as - bs || a.label.localeCompare(b.label);
    });
    out.push({ ...g, roles: hits });
  }
  return out;
}

/** Total count, used by the picker to decide whether to show the search box. */
export const ROLE_COUNT = ALL_ROLES.length;
