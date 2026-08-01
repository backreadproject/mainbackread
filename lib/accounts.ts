// Grouping readers into accounts.
//
// TWO MECHANISMS, deliberately, because they have different strengths.
//
// A shared company DOMAIN is cheap and covers the common case: four people at
// northwind.com are four people at one company. But it is an inference from a
// string, and it fails completely on free mail -- in the real data this was
// written against, nine of twelve addresses were gmail.com, which would have
// produced one meaningless "account" containing nine unrelated strangers.
//
// A FORWARD CHAIN is the stronger signal, and it is the one nobody else has.
// If Ladi forwarded the document to Godwin, those two are connected whatever
// their email addresses say, because it is a fact we observed rather than a
// pattern we matched. It works on personal addresses, across domains, and it
// is the thing that makes this feature unavailable to a competitor without
// forwarding.
//
// A reader on a free-mail address with no chain is not a failure to group.
// There is genuinely no company there, and the honest answer is to list them
// as an individual rather than invent an account.

/** Free-mail and consumer providers. A shared domain here means nothing. */
const FREE_MAIL = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "ymail.com",
  "hotmail.com", "hotmail.co.uk", "outlook.com", "live.com", "msn.com",
  "icloud.com", "me.com", "mac.com", "aol.com", "protonmail.com", "proton.me",
  "gmx.com", "gmx.net", "mail.com", "zoho.com", "yandex.com", "yandex.ru",
  "tutanota.com", "fastmail.com", "hey.com", "pm.me", "qq.com", "163.com",
  "126.com", "naver.com", "daum.net", "web.de", "orange.fr", "free.fr",
  "wanadoo.fr", "laposte.net", "sfr.fr", "bluewin.ch", "libero.it",
  "example.com", "test.com",
]);

export function domainOf(email: string | null | undefined): string | null {
  if (!email || !email.includes("@")) return null;
  const d = email.split("@").pop()?.trim().toLowerCase() ?? "";
  return d.includes(".") ? d : null;
}

export function isCompanyDomain(domain: string | null): boolean {
  return domain !== null && !FREE_MAIL.has(domain);
}

/** A company name worth showing, derived from the domain: northwind.com -> Northwind. */
export function labelForDomain(domain: string): string {
  const first = domain.split(".")[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export type GroupableReader = {
  id: string;
  name: string;
  email: string | null;
  forwardedBy: string | null;
  opens: number;
  questions: number;
  replied: boolean;
  outcome: string | null;
  lastAt: string;
};

export type Account = {
  /** Stable key: the domain, or "chain:<rootId>" for a forward group. */
  key: string;
  label: string;
  /** How this group was established. Shown, because they are different claims. */
  basis: "domain" | "forward";
  readers: GroupableReader[];
  byForward: number;
};

export type Grouped = {
  accounts: Account[];
  /** Readers who belong to no account: free mail, no chain, or no email. */
  individuals: GroupableReader[];
};

/**
 * Union-find over two relations: same company domain, and forwarded-to.
 *
 * Union-find rather than a simpler pass because the relations COMBINE. If Ada
 * at northwind.com forwards to a personal gmail address, and that person
 * forwards on to another northwind colleague, all three belong together --
 * and no single-pass grouping catches that.
 */
export function groupReaders(readers: GroupableReader[]): Grouped {
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== r && parent.has(r)) r = parent.get(r)!;
    return r;
  };
  const union = (a: string, b: string) => {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  for (const r of readers) parent.set(r.id, r.id);

  // Relation 1: a shared COMPANY domain. Free mail is excluded, so two gmail
  // readers are not joined by their provider.
  const byDomain = new Map<string, string[]>();
  for (const r of readers) {
    const d = domainOf(r.email);
    if (!isCompanyDomain(d)) continue;
    const list = byDomain.get(d!) ?? [];
    list.push(r.id);
    byDomain.set(d!, list);
  }
  for (const ids of byDomain.values()) {
    for (let i = 1; i < ids.length; i++) union(ids[0], ids[i]);
  }

  // Relation 2: the forward chain. Observed, so it holds whatever the
  // addresses say -- and it is what joins a personal address to a company.
  const present = new Set(readers.map((r) => r.id));
  for (const r of readers) {
    if (r.forwardedBy && present.has(r.forwardedBy)) union(r.id, r.forwardedBy);
  }

  const groups = new Map<string, GroupableReader[]>();
  for (const r of readers) {
    const root = find(r.id);
    const list = groups.get(root) ?? [];
    list.push(r);
    groups.set(root, list);
  }

  const accounts: Account[] = [];
  const individuals: GroupableReader[] = [];

  for (const [root, members] of groups) {
    // One reader with nobody connected is an individual, not an account of one.
    if (members.length < 2) { individuals.push(members[0]); continue; }

    // Name it after a company domain if the group contains one, since that is
    // more useful than "the group around Ladi". Fall back to the forwarder.
    const domains = members.map((m) => domainOf(m.email)).filter(isCompanyDomain) as string[];
    const byForward = members.filter((m) => m.forwardedBy).length;
    let label: string, basis: "domain" | "forward", key: string;
    if (domains.length) {
      const top = [...new Set(domains)].sort(
        (a, b) => domains.filter((d) => d === b).length - domains.filter((d) => d === a).length
      )[0];
      label = labelForDomain(top);
      basis = "domain";
      key = top;
    } else {
      const rootReader = members.find((m) => m.id === root) ?? members[0];
      label = rootReader.name;
      basis = "forward";
      key = "chain:" + root;
    }
    accounts.push({ key, label, basis, readers: members, byForward });
  }

  // Biggest first, then most recently active.
  accounts.sort((a, b) => b.readers.length - a.readers.length);
  individuals.sort((a, b) => (b.lastAt || "").localeCompare(a.lastAt || ""));
  return { accounts, individuals };
}