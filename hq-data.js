/* =============================================================================
   SportPharm HQ — seed content

   One hub for SportPharm: projects, the CMS that feeds the public site, the
   content plan, campaigns, brand, analytics, platforms, the team.

   Campaign REVIEW lives in the Content Studio (campaigns/index.html) — the
   dashboard Brandon and Jessie already use. What lives here is only the index
   of campaigns so HQ can link into it and count what is outstanding.
============================================================================= */

/* ------------------------------- taxonomy -------------------------------- */
const STATUSES = [
  { id: 'someday',  label: 'Someday',     hint: 'Worth keeping, not now' },
  { id: 'next',     label: 'Next up',     hint: 'Agreed, not started' },
  { id: 'building', label: 'In progress', hint: 'Someone is on it' },
  { id: 'review',   label: 'In review',   hint: 'Built, being looked at' },
  { id: 'shipped',  label: 'Done',        hint: 'Out in the world' }
];

const AREAS = [
  { id: 'site',      label: 'Website',      tone: 'navy' },
  { id: 'content',   label: 'Content',      tone: 'blue' },
  { id: 'marketing', label: 'Marketing',    tone: 'red' },
  { id: 'commerce',  label: 'Commerce',     tone: 'amber' },
  { id: 'pro',       label: 'Professional', tone: 'green' }
];

const ROLES = {
  owner:  { label: 'Owner',  can: 'Everything, including the team' },
  editor: { label: 'Editor', can: 'Write, edit, schedule, approve, comment' },
  viewer: { label: 'Viewer', can: 'Read and leave notes' }
};

/* --------------------------------- team ---------------------------------- */
/* Seat passcode is `summit-anchor-40`. Rotated 2026-07-29 — the previous one
   (`sportpharm`) was briefly readable in a git history served by a
   misconfigured deploy, so treat it as burned. Each person can set their own
   in Settings. This is still a door, not a lock — Cloudflare Access is the gate. */
/* --------------------------- the web store --------------------------------
   Orders come from sportpharm.com, which is WordPress + WooCommerce. There is
   no separate WasabiRub store: wasabirub.com is a static marketing site on
   GitHub Pages that links across to sportpharm.com.

   Checkout offers Stripe, Affirm, Klarna, Afterpay and Amazon Pay. That is
   why WooCommerce is the source for ORDERS and Stripe only for money —
   Stripe sees a payment, not a basket, and depending on how the gateways are
   configured some of those methods may not pass through it at all.

   SKU MAP. The live store's SKUs do not match HQ's catalogue, and two
   products carry no SKU whatsoever — including WasabiRub, the flagship. An
   imported line that cannot be matched is kept and flagged rather than
   guessed at, because guessing here silently corrupts stock counts. */
const WEB_SKU_MAP = {
  'TEAM-BUNDLE-1':           'BUNDLE-TRIFECTA',
  'TEAM-BUNDLE':             'BUNDLE-WASABI-TEAM',
  'superhot and icetra':     'BUNDLE-FIREICE',
  'wasabirub and Icestra':   'BUNDLE-RECOVERY',
  'OG-Wasabirub-DUO-BUNDLE': 'BUNDLE-OGHEAT',
  'Icetrarub':               'ICETRARUB',
  'SP-WASABIRUB-SUPER-HOT':  'SUPERHOT'
};
/* Matched on name when the store has no SKU at all. Last resort, and only
   for products whose names are unambiguous on the live store today. */
const WEB_NAME_MAP = {
  'wasabirub (otc) sports recovery': 'WASABIRUB'
};

/* -------------------------------- companies -------------------------------
   Brandon's group is several companies, not one, and an order from SportPharm
   to Enovachem crosses a real boundary. They are data here rather than
   separate installations of HQ: one order record that both sides can see and
   talk on, because the entire reason the Orders form exists is that the same
   order was being retyped at each handoff. Two synced copies would bring that
   straight back, with the added treat that they can now disagree.

   `kind` decides what a company can do:
     own    — the company HQ belongs to. Raises orders, sees everything.
     partner— fulfils or receives orders. Sees only what is addressed to it.

   `tenant` is the Entra directory, where there is one. Enovachem has no
   Microsoft tenant (login.microsoftonline.com returns AADSTS90002 for
   enovachem.com), which is exactly why its people come in as B2B guests
   rather than through their own directory — see azure/README.md. */
const COMPANIES = [
  { id: 'sportpharm', name: 'SportPharm', short: 'SP', kind: 'own', tone: 'red',
    tenant: 'c18f5ce2-49ee-4bb9-9c5e-9ddab1991d0c', domains: ['sportpharm.com'] },
  { id: 'enovachem', name: 'Enovachem', short: 'EN', kind: 'partner', tone: 'blue',
    tenant: null, domains: [],
    note: 'Pick, pack and fulfilment. No Microsoft tenant found — their people sign in as guests.' },
  { id: 'pharmco', name: 'Pharmco', short: 'PH', kind: 'partner', tone: 'green',
    tenant: null, domains: [],
    note: 'In scope. Confirm the real domain and tenant before wiring sign-in — pharmco.com resolves to a tenant that may belong to someone else entirely.' }
];
const OWN_COMPANY = 'sportpharm';

const SEED_USERS = [
  { id: 'u-brandon', company: 'sportpharm', name: 'Brandon Welch', email: 'brandonw@sportpharm.com', role: 'owner',  tone: 'navy',  title: 'President',          pass: 'summit-anchor-40' },
  { id: 'u-jessie', company: 'sportpharm',  name: 'Jessie T',      email: 'jessiet@sportpharm.com',  role: 'editor', tone: 'red',   title: 'Marketing',          pass: 'summit-anchor-40' },
  { id: 'u-kennady', company: 'sportpharm', name: 'Kennady Scott', email: 'kennadyn@sportpharm.com',
    /* The personal address this seat was created under. Kept so the seat
       still matches after the move to Entra sign-in — otherwise the one
       person who cannot get in is the one who built it. */
    altEmails: ['kennady.nickell@gmail.com'],
    role: 'owner', tone: 'blue', title: 'Build & web',        pass: 'summit-anchor-40' },
  /* Julia and Marissa raise the orders, so they need seats to message and to
     fill the form. Nobody has given me their addresses, so the seats exist
     without one and Team shows them as needing an invite rather than my
     guessing an address that silently never reaches them. */
  { id: 'u-julia', company: 'sportpharm',   name: 'Julia',         email: '', role: 'editor', tone: 'amber', title: 'Orders',    pass: 'summit-anchor-40', invite: true },
  { id: 'u-marissa', company: 'sportpharm', name: 'Marissa',       email: '', role: 'editor', tone: 'green', title: 'Orders',    pass: 'summit-anchor-40', invite: true }
];

/* -------------------------------- messages -------------------------------
   One thread per person plus a Team room. Threads, not a single log, because
   the ask was to pick who it goes to — and because "did Julia see it" is the
   question people actually have. Seeded empty: nobody has said anything yet
   and inventing a conversation would be lying about what happened. */
const SEED_MESSAGES = [];
const TEAM_THREAD = 'team';

/* ---------------------------------- KPIs ---------------------------------
   Jessie's weekly report, as a dashboard rather than a spreadsheet she
   rebuilds every Monday. Weekly, monthly and quarterly are the same metrics
   over different periods, so there is one definition and three rollups.

   `derive` metrics are never typed — they are computed from the ones above
   them, because an entered AOV that disagrees with revenue ÷ orders is the
   kind of thing nobody notices until a board meeting.

   NOTHING IS SEEDED WITH REAL NUMBERS, deliberately. The report this is
   modelled on carries customer names, emails and order numbers, and this
   bundle is served publicly from GitHub Pages — anyone with the URL can read
   hq-data.js. Numbers get entered in the browser (they stay in localStorage)
   or arrive over a private connection once one exists. See the note in the
   KPI view and README.md. */
const KPI_METRICS = [
  { k: 'revenue',   label: 'Revenue',            unit: '$',  group: 'Sales' },
  { k: 'orders',    label: 'Orders',             unit: '',   group: 'Sales' },
  { k: 'aov',       label: 'Average order value', unit: '$', group: 'Sales',
    derive: v => v.orders ? v.revenue / v.orders : null },
  { k: 'newCust',   label: 'New customers',      unit: '',   group: 'Customers' },
  { k: 'repeatCust', label: 'Returning customers', unit: '', group: 'Customers' },
  { k: 'repeatRate', label: 'Repeat rate',       unit: '%',  group: 'Customers',
    derive: v => (v.newCust + v.repeatCust) ? (v.repeatCust / (v.newCust + v.repeatCust)) * 100 : null },
  { k: 'sessions',  label: 'Sessions',           unit: '',   group: 'Traffic' },
  { k: 'convRate',  label: 'Conversion rate',    unit: '%',  group: 'Traffic',
    derive: v => v.sessions ? (v.orders / v.sessions) * 100 : null },
  { k: 'spend',     label: 'Ad spend',           unit: '$',  group: 'Paid' },
  { k: 'roas',      label: 'ROAS',               unit: '×',  group: 'Paid',
    derive: v => v.spend ? v.revenue / v.spend : null },
  { k: 'cpo',       label: 'Cost per order',     unit: '$',  group: 'Paid',
    derive: v => v.orders ? v.spend / v.orders : null },
  { k: 'signups',   label: 'Email / SMS signups', unit: '',  group: 'List' }
];
const KPI_PERIODS = [
  { k: 'week',    label: 'Weekly',    n: 8,  note: 'The last eight weeks, Monday to Sunday.' },
  { k: 'month',   label: 'Monthly',   n: 6,  note: 'The last six months.' },
  { k: 'quarter', label: 'Quarterly', n: 4,  note: 'The last four quarters.' }
];

/* ------------------------------- products -------------------------------- */
/* Live-store facts. Referenced by the CMS (product tie-ins) and Branding. */
const PRODUCTS = [
  { id: 'wasabirub', name: 'WasabiRub',            price: 29.95, tone: 'green', tier: 'Balanced',
    line: 'Triple-action: menthol, capsaicin, methyl salicylate. TruShield Certified.', status: 'live' },
  { id: 'icetrarub', name: 'IcetraRub',            price: 39.95, tone: 'blue',  tier: 'Cooling',
    line: '16% menthol professional cooling relief.', status: 'live' },
  { id: 'superhot',  name: 'WasabiRub Super Hot',  price: 39.95, tone: 'red',   tier: 'Maximum heat',
    line: 'Max-strength warming formula for deep muscle work.', status: 'live' },
  { id: 'lidorub',   name: 'LidoRub',              price: null,  tone: 'navy',  tier: 'Lidocaine 4%',
    line: 'The fourth rub. Not announced yet.', status: 'coming' },
  { id: 'ketorub',   name: 'KetoRub',              price: null,  tone: 'amber', tier: 'Rx topical NSAID',
    line: 'First Rx-only NSAID topical in the US to earn TruShield Certification (480+ banned substances screened).', status: 'rx' }
];

/* Promo codes that exist / are proposed. The CMS and Plan both reference these. */
const OFFER_CODES = [
  { code: 'FREESHIP1', what: 'First-order free shipping — the capture lever' },
  { code: 'WELCOME10', what: 'First-order 10% — email/SMS capture alternative' },
  { code: 'FEELIT15',  what: 'Launch stack, 15%' },
  { code: 'LASTCALL',  what: 'Week-5 deadline close' },
  { code: 'COMEDIRECT', what: 'Win-back — customers who bought elsewhere' },
  { code: 'TEAM15',    what: 'Team / bulk orders' },
  { code: 'AGAIN10',   what: 'Repeat purchase' }
];

/* ------------------------------- projects -------------------------------- */
/* Project Planning is for projects now — campaigns and the content plan moved
   to Marketing. One project to start; the rest get built as they are needed. */
const SEED_PROJECTS = [
  {
    id: 'p-web', name: 'Website Redesign', area: 'site', tone: 'navy',
    goal: 'Rebuild sportpharm.com on the new masterbrand, and stop hand-editing 43 static pages.',
    due: '2026-11-30',
    tasks: [
      { id: 't1', title: 'Agree the page inventory — what survives, what merges, what goes', status: 'next', owner: null, due: '2026-08-14' },
      { id: 't2', title: 'Apply the new brand palette and type across the templates', status: 'next', owner: null, due: '2026-08-28' },
      { id: 't3', title: 'Compress the imagery — the ~2MB PNG pass never happened', status: 'next', owner: null, due: '2026-08-29' },
      { id: 't4', title: 'Point articles.html at the published feed', status: 'next', owner: null, due: '2026-09-05' },
      { id: 't5', title: 'Wire the contact forms into Leads', status: 'next', owner: null, due: '2026-09-12' },
      { id: 't6', title: 'Decide: merge Injuries and Recovery, or keep the split', status: 'someday', owner: null, due: '' }
    ]
  }
];


/* ------------------------------- campaigns -------------------------------- */
/* The index only. Every brief, asset mockup, comment thread, calendar, ROI
   table and approval lives in the Content Studio — campaigns/index.html —
   which is mounted inside HQ and talks to its own Supabase project. Opening a
   campaign here deep-links into it with ?c=<id>. */
/* Where a section or asset stands in review. */
const REVIEW_STATES = {
  pending:  { label: 'Not looked at', tone: 'muted', logged: 'reopened' },
  approved: { label: 'Approved',      tone: 'green', logged: 'approved' },
  changes:  { label: 'Needs changes', tone: 'red',   logged: 'asked for changes' }
};

/* The brief sections, in the order they read. */
const BRIEF_SECTIONS = [
  { key: 'platform',    label: 'Campaign Platform' },
  { key: 'strategy',    label: 'The Strategy' },
  { key: 'offers',      label: 'Offers & Incentives' },
  { key: 'messages',    label: 'Message Hierarchy' },
  { key: 'structure',   label: 'Campaign Structure' },
  { key: 'calendar',    label: 'Weekly Calendar' },
  { key: 'stories',     label: 'Supporting Stories' },
  { key: 'adaptations', label: 'Platform Adaptations' },
  { key: 'paidAds',     label: 'Paid Ads · Meta' },
  { key: 'creators',    label: 'Creator Cross-Promotion' },
  { key: 'landing',     label: 'Landing Page' },
  { key: 'visual',      label: 'Visual Direction' },
  { key: 'guardrails',  label: 'Claim & Compliance Guardrails' },
  { key: 'metrics',     label: 'Metrics' }
];

/* The one campaign actually in flight. Project Planning's Campaign view shows
   only this by default so it reads as "what does the push still need" rather
   than a wall of eleven. Change this line when the next one starts. */
const CURRENT_CAMPAIGN = 'wasabi-direct';

const SEED_CAMPAIGNS = [
  { id: 'wasabi-direct', title: 'Feel It Work', strand: 'Direct-to-site sales — WasabiRub & the rub lineup',
    prio: 'Revenue priority', tone: 'red', assets: 14, channels: ['IG', 'FB', 'Email', 'LinkedIn'],
    line: 'Drive direct sales on sportpharm.com. Hero WasabiRub, pull IcetraRub and Super Hot behind it.' },
  { id: 'clean-sport', title: 'Clean Sport', strand: 'Clean sport & banned-substance safety',
    prio: 'Lead campaign', tone: 'navy', assets: 14, channels: ['IG', 'LinkedIn', 'FB', 'Email'],
    line: 'What touches the athlete matters. KetoRub and TruShield are the proof; the position is medication safety through the lens of competitive sport.' },
  { id: 'sideline-ready', title: 'Sideline Ready', strand: 'Emergency preparedness for athletic trainers',
    prio: 'B2B priority', tone: 'green', assets: 4, channels: ['LinkedIn', 'IG', 'Blog'],
    line: 'Sideline kits get restocked all season and audited almost never. Own the readiness standard.' },
  { id: 'dispensing', title: 'Compliance Playbook', strand: 'Compliant in-house dispensing & medication management',
    prio: 'B2B priority', tone: 'green', assets: 4, channels: ['LinkedIn', 'Blog'],
    line: 'The operational answer for programs dispensing in-house without a pharmacist on staff.' },
  { id: 'recovery', title: 'Recovery, Honestly', strand: 'Recovery isn’t one-size-fits-all',
    prio: 'Authority', tone: 'blue', assets: 4, channels: ['LinkedIn', 'IG', 'Blog'],
    line: 'Evidence vs hype. The campaign that earns the right to sell anything else.' },
  { id: 'topicals', title: 'Targeted Relief', strand: 'Topical pain relief & compounded solutions',
    prio: 'Product', tone: 'red', assets: 4, channels: ['LinkedIn', 'IG'],
    line: 'Why a topical, when, and what compounding actually adds.' },
  { id: 'playbooks', title: 'Injury Playbooks', strand: 'Sport-specific injury playbooks',
    prio: 'Engine', tone: 'blue', assets: 4, channels: ['Blog', 'LinkedIn', 'IG'],
    line: 'The SEO engine — every sport, every common injury, every path back.' },
  { id: 'team', title: 'Behind the Counter', strand: 'Meet the team / pharmacist expertise',
    prio: 'Authority', tone: 'amber', assets: 4, channels: ['LinkedIn', 'IG'],
    line: 'People buy the pharmacist before they buy the product.' },
  { id: 'trusted', title: 'Trusted Since 1995', strand: 'Social proof',
    prio: 'Proof', tone: 'amber', assets: 4, channels: ['LinkedIn', 'IG'],
    line: 'Thirty years is the asset nobody else on the shelf has.' },
  { id: 'seasonal', title: 'In Season', strand: 'Seasonal & timely recovery content',
    prio: 'Calendar', tone: 'green', assets: 4, channels: ['IG', 'LinkedIn', 'Blog'],
    line: 'Two-a-days, tournament weekends, first frost. Content that arrives when it is already on their mind.' },
  { id: 'nutrition', title: 'Read the Label', strand: 'Athlete nutrition & supplement science',
    prio: 'Underused asset', tone: 'navy', assets: 4, channels: ['LinkedIn', 'IG', 'Blog'],
    line: 'The most under-served question a tested athlete has, answered by a pharmacist.' }
];

/* ---------------------------------- CMS ---------------------------------- */
/* Field model ported from the admin.html prototype, plus the review layer. */
const ARTICLE_CATS = ['Recovery', 'Pain & Injury', 'Medication', 'Sports Pharmacy', 'Training', 'Nutrition',
  'Clean Sport', 'Recurring Pain', 'Mindset', 'Modify', 'Next Step',
  'Medical', 'Pain Relief', 'Clinic'];

/* A series is a hub page that pulls its own articles. Tagging a piece to one
   is what puts it on that page — the feed carries `series` so the site can
   filter on it without us hand-listing anything. */
const ARTICLE_SERIES = [
  { id: 'push-through-or-stop', label: 'Push Through or Stop?',
    page: 'push-through-or-stop.html',
    line: 'The everyday-athlete decision hub — what to do when something hurts.' },
  { id: 'athlete-hub', label: 'Athlete Hub', page: 'articles.html',
    line: 'The article index on the athlete hub. Everything currently live on sportpharm.com/news/.' }
];

const ARTICLE_STATES = {
  draft:     { label: 'Draft',        tone: 'muted', hint: 'Being written. Only the author sees it as finished.' },
  review:    { label: 'In review',    tone: 'amber', hint: 'Waiting on a reviewer.' },
  changes:   { label: 'Needs changes', tone: 'red',  hint: 'A reviewer sent it back with notes.' },
  approved:  { label: 'Approved',     tone: 'blue',  hint: 'Cleared to go. Publish now or schedule it.' },
  scheduled: { label: 'Scheduled',    tone: 'green', hint: 'Approved, with a date in the future.' },
  published: { label: 'Published',    tone: 'green', hint: 'Live on sportpharm.com.' }
};
/* the order a piece moves through; used for the pipeline strip */
const ARTICLE_FLOW = ['draft', 'review', 'approved', 'scheduled', 'published'];

/* A guardrail is checked at review time, not argued at publish time. */
const ARTICLE_CHECKS = [
  { k: 'otc',      label: 'OTC language only',        why: 'External analgesic claims. No cure, heal, treat, or implied clinical outcome.' },
  { k: 'noleague', label: 'No endorsement implied',   why: 'Naming a team or league must not read as their endorsement.' },
  { k: 'ftc',      label: 'Testimonials disclosed',   why: 'FTC: any incentivised voice discloses. Creator codes count.' },
  { k: 'medical',  label: 'Medical disclaimer',       why: 'Educational only, seek a provider. Every page footer carries it.' },
  { k: 'sourced',  label: 'Claims sourced',           why: 'ACSM / CDC / FDA citation chips where a claim is made.' }
];

/* ----------------------------- the block kit -----------------------------
   An article is built out of blocks, the way a page gets built in Squarespace:
   pick a block, drop it in, fill it. The last group is the point of doing it
   ourselves — brand-correct blocks Squarespace could never give us.
------------------------------------------------------------------------- */
const BLOCK_TYPES = {
  text:       { label: 'Text',        icon: 'text',    group: 'Essentials', hint: 'A paragraph.' },
  heading:    { label: 'Heading',     icon: 'head',    group: 'Essentials', hint: 'Breaks the piece into sections.' },
  image:      { label: 'Image',       icon: 'image',   group: 'Essentials', hint: 'Full width, with a caption.' },
  button:     { label: 'Button',      icon: 'button',  group: 'Essentials', hint: 'One clear call to action.' },
  line:       { label: 'Line',        icon: 'line',    group: 'Essentials', hint: 'A divider.' },
  spacer:     { label: 'Spacer',      icon: 'spacer',  group: 'Essentials', hint: 'Room to breathe.' },

  split:      { label: 'Image + text', icon: 'split',   group: 'Layout', hint: 'Side by side. Flip which side the image sits on.' },
  columns:    { label: 'Two columns',  icon: 'columns', group: 'Layout', hint: 'Two blocks of text, side by side.' },
  gallery:    { label: 'Gallery',      icon: 'gallery', group: 'Layout', hint: 'A row of images.' },

  quote:      { label: 'Quote',       icon: 'quote',   group: 'Editorial', hint: 'A pull quote, with attribution.' },
  list:       { label: 'List',        icon: 'list',    group: 'Editorial', hint: 'Bulleted or numbered.' },
  callout:    { label: 'Callout',     icon: 'callout', group: 'Editorial', hint: 'The box people actually stop and read.' },
  video:      { label: 'Video',       icon: 'video',   group: 'Editorial', hint: 'A YouTube or Vimeo link.' },

  product:    { label: 'Product',     icon: 'box',     group: 'SportPharm', hint: 'A rub, with its real price and a buy link.' },
  offer:      { label: 'Offer code',  icon: 'coin',    group: 'SportPharm', hint: 'A promo code — check it exists in-store first.' },
  disclaimer: { label: 'Disclaimer',  icon: 'shield',  group: 'SportPharm', hint: 'The medical disclaimer, worded correctly, every time.' }
};

const BLOCK_GROUPS = ['Essentials', 'Layout', 'Editorial', 'SportPharm'];

const BLOCK_DEFAULTS = {
  text:       { text: '' },
  heading:    { text: '', level: 2 },
  image:      { src: '', alt: '', caption: '', width: 'full' },
  button:     { label: 'Shop WasabiRub', href: 'https://sportpharm.com/store/', style: 'primary' },
  line:       {},
  spacer:     { size: 'medium' },
  split:      { src: '', alt: '', text: '', side: 'left' },
  columns:    { left: '', right: '' },
  gallery:    { images: [] },
  quote:      { text: '', cite: '' },
  list:       { items: [''], ordered: false },
  callout:    { title: 'Pharmacist’s note', text: '', tone: 'blue' },
  video:      { url: '', caption: '' },
  product:    { productId: 'wasabirub', note: '' },
  offer:      { code: 'FREESHIP1', note: '' },
  disclaimer: {}
};

const CALLOUT_TONES = [
  { id: 'blue',  label: 'Note' },
  { id: 'green', label: 'Do this' },
  { id: 'amber', label: 'Careful' },
  { id: 'red',   label: 'Stop' }
];

const DISCLAIMER_TEXT =
  'Educational information only — not medical advice. Talk to a provider about your situation.';

const SEED_ARTICLES = [
  { id: 'a-soreness', title: 'Soreness or Injury? What to Pay Attention To', slug: 'soreness-or-injury',
    category: 'Pain & Injury', tags: ['soreness', 'injury', 'recovery'], author: 'SportPharm Team',
    status: 'published', date: '2026-07-18', publishedAt: '2026-07-18', views: 1284,
    image: 'https://kennadyscott.github.io/sportpharm-site/assets/ea-recovery.jpg',
    excerpt: 'How to tell normal training soreness from a signal worth acting on — and what to do next.',
    body: '## When soreness is normal\nMuscle soreness after a hard session is common and usually fades in a day or two. It is diffuse, it eases as you warm up, and it does not change how you move.\n\n## Signs worth paying attention to\n- Pain that sharpens with movement rather than easing\n- Swelling that does not settle overnight\n- Discomfort that keeps returning to the same spot\n- Anything that changes your gait or your mechanics\n\n## What to do next\nEase off and reassess before the next hard session. If it is still there in a week, or if any of the above is true, get it looked at.\n\nThis is educational information, not medical advice.',
    checks: { otc: true, noleague: true, ftc: true, medical: true, sourced: true }, thread: [] },

  { id: 'a-habits', title: 'Five Recovery Habits That Make a Real Difference', slug: 'recovery-habits',
    category: 'Recovery', tags: ['recovery', 'habits', 'sleep'], author: 'Dr. Marissa Figueroa',
    status: 'published', date: '2026-07-12', publishedAt: '2026-07-12', views: 2041,
    image: 'https://kennadyscott.github.io/sportpharm-site/assets/ea-runner.jpg',
    excerpt: 'Small, repeatable habits that move recovery from an afterthought to an advantage.',
    body: 'Recovery is built in the quiet hours between sessions. Sleep, hydration, and consistent easy movement do most of the work — long before anything you buy does.\n\n## 1. Sleep is the intervention\nNothing else on this list competes with it.\n\n## 2. Eat enough, close to the session\n\n## 3. Move on the off day\n\n## 4. Make the hard days hard and the easy days easy\n\n## 5. Notice the pattern before it becomes an injury',
    checks: { otc: true, noleague: true, ftc: true, medical: true, sourced: true }, thread: [] },

  { id: 'a-nsaids', title: 'Understanding NSAIDs: When and How to Use Them', slug: 'understanding-nsaids',
    category: 'Medication', tags: ['NSAIDs', 'pain relief', 'medication'], author: 'SportPharm Team',
    status: 'published', date: '2026-07-05', publishedAt: '2026-07-05', views: 1637,
    image: 'https://kennadyscott.github.io/sportpharm-site/assets/ea-medication.jpg',
    excerpt: 'A practical, no-nonsense look at over-the-counter anti-inflammatories for active people.',
    body: 'NSAIDs can help with pain and inflammation, but timing and dosage matter more than most people are told. Talk to a pharmacist about what fits your situation.',
    checks: { otc: true, noleague: true, ftc: true, medical: true, sourced: true }, thread: [] },

  { id: 'a-return', title: 'Returning to Training After Time Off', slug: 'return-to-training',
    category: 'Recovery', tags: ['return', 'progression', 'training'], author: 'Sean Casey',
    status: 'review', date: '2026-07-22', publishedAt: '', views: 0,
    image: 'https://kennadyscott.github.io/sportpharm-site/assets/ea-gym.jpg',
    excerpt: 'A realistic, low-drama framework for easing back into the activities you love.',
    body: 'Start below where you left off. Rebuild volume before intensity. Let confidence catch up to capability.\n\n## The first two weeks\n\n## When to add intensity back',
    checks: { otc: true, noleague: true, ftc: false, medical: false, sourced: false }, thread: [] },

  { id: 'a-pharmacy', title: 'What a Sports Pharmacy Actually Does', slug: 'what-sports-pharmacy-does',
    category: 'Sports Pharmacy', tags: ['pharmacy', 'education'], author: 'Brandon Welch',
    status: 'draft', date: '2026-07-24', publishedAt: '', views: 0,
    image: 'https://kennadyscott.github.io/sportpharm-site/assets/ea-climber.jpg',
    excerpt: 'Compounding, repackaging, concierge support — demystifying the pharmacy behind the athletes.',
    body: 'A sports pharmacy blends clinical rigor with the practical needs of active people and the teams that support them.\n\n## Compounding\n\n## Repackaging and blister packaging\n\n## Concierge support',
    checks: {}, thread: [] },

  { id: 'a-trushield', title: 'What TruShield Certification Actually Screens For', slug: 'trushield-certification',
    category: 'Clean Sport', tags: ['clean sport', 'TruShield', 'KetoRub', 'compliance'], author: 'Brandon Welch',
    status: 'approved', date: '2026-08-04', publishedAt: '', views: 0,
    image: '',
    excerpt: 'More than 480 banned substances, screened by a third party — and what that does and does not promise.',
    body: 'Athletes scrutinise what they swallow. They should be able to bring the same care to what they apply.\n\n## What the screen covers\nMore than 480 substances on the major banned lists, tested by an independent third party.\n\n## What it does not promise\nCertification is a screening result, not a guarantee of eligibility. It removes a preventable question; it does not remove an athlete’s responsibility.',
    checks: { otc: true, noleague: true, ftc: true, medical: true, sourced: true }, thread: [] },

  /* ---------------------------------------------------------------------
     "Push Through or Stop?" — the six pieces the hub page links to.
     Seeded as drafts with the hub page's own content already blocked out,
     so nobody starts from an empty screen. Tagged to the series so the hub
     can pull them.
  --------------------------------------------------------------------- */
  { id: 'a-ptos-soreness', title: 'Is This Normal Post-Workout Soreness?', slug: 'normal-post-workout-soreness',
    category: 'Recovery', series: 'push-through-or-stop',
    tags: ['soreness', 'recovery', 'push through or stop'], author: 'SportPharm Team',
    status: 'draft', date: '2026-07-28', publishedAt: '', views: 0,
    image: 'assets/articles/article-soreness.jpg',
    excerpt: 'Expected soreness and a signal worth investigating can feel similar on day one. The difference is in the pattern.',
    checks: {}, thread: [],
    blocks: [
      { id: 'b-so-1', type: 'text', text: 'Almost every athlete has had the same morning: something aches, and you genuinely cannot tell whether it is the workout talking or something that needs looking at.\n\nSoreness and injury can feel similar on the first day. What separates them is not how much it hurts — it is how it behaves.' },
      { id: 'b-so-2', type: 'heading', level: 2, text: 'More like expected soreness' },
      { id: 'b-so-3', type: 'list', ordered: false, items: [
        'Shows up after a new or harder workout',
        'Improves with light movement and warm-up',
        'Feels general across the muscles you worked',
        'Gradually clears with rest and recovery'
      ] },
      { id: 'b-so-4', type: 'heading', level: 2, text: 'Worth pausing to investigate' },
      { id: 'b-so-5', type: 'list', ordered: false, items: [
        'Begins during a specific movement or incident',
        'Changes your form or how you move',
        'Feels sharp, localised or concentrated in a joint',
        'Persists, worsens or repeatedly returns'
      ] },
      { id: 'b-so-6', type: 'callout', tone: 'amber', title: 'Context, not a diagnosis',
        text: 'These patterns help you decide what to do next. They do not tell you what is wrong. If you are concerned, talk to an appropriate healthcare professional.' },
      { id: 'b-so-7', type: 'disclaimer' }
    ] },

  { id: 'a-ptos-recurring', title: 'Why Does the Same Pain Keep Coming Back?', slug: 'why-pain-keeps-coming-back',
    category: 'Recurring Pain', series: 'push-through-or-stop',
    tags: ['recurring pain', 'patterns', 'push through or stop'], author: 'SportPharm Team',
    status: 'draft', date: '2026-07-28', publishedAt: '', views: 0,
    image: 'assets/articles/article-return.jpg',
    excerpt: 'Pain that keeps interrupting progress is telling you something. Tracking the pattern is how you find out what.',
    checks: {}, thread: [],
    blocks: [
      { id: 'b-rc-1', type: 'text', text: 'Recurring pain is frustrating in a specific way: it settles down enough that you go back to training, then arrives again at the worst possible moment.\n\nThe useful move is not to guess harder. It is to notice the pattern before the next flare-up.' },
      { id: 'b-rc-2', type: 'heading', level: 2, text: 'Track five things' },
      { id: 'b-rc-3', type: 'list', ordered: false, items: [
        'Where it hurts',
        'When it begins',
        'What triggers it',
        'How long it lasts',
        'What changes it'
      ] },
      { id: 'b-rc-4', type: 'text', text: 'Patterns help you make better choices — and they give a professional far better information to work with than "it hurts sometimes".' },
      { id: 'b-rc-5', type: 'button', label: 'Download the Pain Pattern Tracker', href: 'https://sportpharm.com/', style: 'primary' },
      { id: 'b-rc-6', type: 'disclaimer' }
    ] },

  { id: 'a-ptos-train', title: 'Should I Work Out When Something Hurts?', slug: 'work-out-when-something-hurts',
    category: 'Training', series: 'push-through-or-stop',
    tags: ['training', 'decision', 'push through or stop'], author: 'SportPharm Team',
    status: 'draft', date: '2026-07-28', publishedAt: '', views: 0,
    image: 'assets/articles/modify-workout.jpg',
    excerpt: 'A simple three-step check for the moment you are standing there deciding whether to start the session.',
    checks: {}, thread: [],
    blocks: [
      { id: 'b-tr-1', type: 'text', text: 'There is no universal answer, and anyone who gives you one is guessing. What there is, is a way to decide that is better than how you feel about it in the moment.' },
      { id: 'b-tr-2', type: 'heading', level: 2, text: 'Stop. Check. Choose.' },
      { id: 'b-tr-3', type: 'list', ordered: true, items: [
        'Stop — pause long enough to notice what is actually happening.',
        'Check — ask what changed, what you feel, and whether it is affecting how you move.',
        'Choose — continue carefully, modify, stop for the day, or seek guidance.'
      ] },
      { id: 'b-tr-4', type: 'callout', tone: 'red', title: 'Pause and pay attention',
        text: 'Stop activity and seek appropriate care if something feels serious, is getting worse, or changes how your body functions — major swelling or bruising, numbness or tingling, inability to bear weight, severe or worsening pain, instability or giving way, or any symptoms after a head impact.' },
      { id: 'b-tr-5', type: 'disclaimer' }
    ] },

  { id: 'a-ptos-mindset', title: 'Why Pushing Through Isn’t a Recovery Plan', slug: 'pushing-through-isnt-a-plan',
    category: 'Mindset', series: 'push-through-or-stop',
    tags: ['mindset', 'recovery', 'push through or stop'], author: 'Brandon Welch',
    status: 'draft', date: '2026-07-28', publishedAt: '', views: 0,
    image: 'assets/articles/recovery-yoga.jpg',
    excerpt: 'Modification is a strategy, not a setback. Changing the plan is still training.',
    checks: {}, thread: [],
    blocks: [
      { id: 'b-mi-1', type: 'quote', text: 'Recovery isn’t quitting. Changing the plan is still training.', cite: 'SportPharm' },
      { id: 'b-mi-2', type: 'text', text: 'Pushing through is not a plan. It is the absence of one — and it usually costs more time than the adjustment you were avoiding.\n\nSmarter adjustments today help you stay consistent tomorrow, and consistency is the thing that actually produces results.' },
      { id: 'b-mi-3', type: 'split', side: 'left', src: 'assets/articles/recovery-yoga.jpg',
        alt: 'An athlete moving through a gentle session at home',
        text: 'The athletes who stay in it longest are rarely the ones who never back off. They are the ones who back off early, on purpose, and get to keep going.' },
      { id: 'b-mi-4', type: 'disclaimer' }
    ] },

  { id: 'a-ptos-modify', title: 'What Does Modifying a Workout Look Like?', slug: 'modifying-a-workout',
    category: 'Modify', series: 'push-through-or-stop',
    tags: ['modify', 'training', 'push through or stop'], author: 'SportPharm Team',
    status: 'draft', date: '2026-07-28', publishedAt: '', views: 0,
    image: 'assets/articles/article-return.jpg',
    excerpt: 'Five concrete ways to change the session instead of cancelling it.',
    checks: {}, thread: [],
    blocks: [
      { id: 'b-mo-1', type: 'text', text: '"Modify the workout" is easy advice to give and vague to act on. Here is what it actually means in practice.' },
      { id: 'b-mo-2', type: 'list', ordered: false, items: [
        'Reduce the load',
        'Change the movement',
        'Shorten the session',
        'Train something else',
        'Take a recovery day'
      ] },
      { id: 'b-mo-3', type: 'text', text: 'Any one of these keeps the habit intact, which is most of the battle. Pick the smallest change that lets you finish the session without making things worse.' },
      { id: 'b-mo-4', type: 'disclaimer' }
    ] },

  { id: 'a-ptos-checked', title: 'When Is It Time to Get an Injury Checked?', slug: 'when-to-get-an-injury-checked',
    category: 'Next Step', series: 'push-through-or-stop',
    tags: ['next step', 'care', 'push through or stop'], author: 'SportPharm Team',
    status: 'draft', date: '2026-07-28', publishedAt: '', views: 0,
    image: 'assets/articles/article-medication.jpg',
    excerpt: 'Who to see, and what each of them is actually for. These are starting points, not a diagnosis.',
    checks: {}, thread: [],
    blocks: [
      { id: 'b-ch-1', type: 'text', text: 'Most people wait too long, then see whoever they can get an appointment with. Knowing who does what makes the first appointment a lot more useful.' },
      { id: 'b-ch-2', type: 'heading', level: 2, text: 'Common starting points' },
      { id: 'b-ch-3', type: 'list', ordered: false, items: [
        'Primary care — the general front door, and often the referral you need',
        'Sports medicine — clinicians who treat active people all day',
        'Physical therapy — movement, loading and rehabilitation',
        'Athletic trainer — on-site assessment and return-to-play guidance',
        'Pharmacist — what you are taking, what interacts, and what is worth trying'
      ] },
      { id: 'b-ch-4', type: 'heading', level: 2, text: 'Before you reach for something for the pain' },
      { id: 'b-ch-5', type: 'text', text: 'What works depends on where you hurt, what may be causing it, what else you take, and how you intend to use the product. Pain relief is not one-size-fits-all.' },
      { id: 'b-ch-6', type: 'product', productId: 'wasabirub', note: 'Topical relief for sore muscles, aches and everyday wear and tear — one part of a plan, not the whole plan.' },
      { id: 'b-ch-7', type: 'disclaimer' }
    ] },
];

/* Seeded so the library is not empty on first run. Uploads become data URIs. */
const SEED_MEDIA = [
  { id: 'm-recovery', name: 'ea-recovery.jpg', alt: 'Athlete resting after a session', kind: 'link',
    src: 'https://kennadyscott.github.io/sportpharm-site/assets/ea-recovery.jpg', tags: ['recovery', 'lifestyle'] },
  { id: 'm-runner', name: 'ea-runner.jpg', alt: 'Runner on a waterfront path', kind: 'link',
    src: 'https://kennadyscott.github.io/sportpharm-site/assets/ea-runner.jpg', tags: ['running', 'lifestyle'] },
  { id: 'm-med', name: 'ea-medication.jpg', alt: 'Medication on a clean surface', kind: 'link',
    src: 'https://kennadyscott.github.io/sportpharm-site/assets/ea-medication.jpg', tags: ['medication'] },
  { id: 'm-gym', name: 'ea-gym.jpg', alt: 'Rebuilding strength in the gym', kind: 'link',
    src: 'https://kennadyscott.github.io/sportpharm-site/assets/ea-gym.jpg', tags: ['training'] },
  { id: 'm-climber', name: 'ea-climber.jpg', alt: 'Climber mid-route', kind: 'link',
    src: 'https://kennadyscott.github.io/sportpharm-site/assets/ea-climber.jpg', tags: ['lifestyle'] },
  { id: 'm-wasabi', name: 'product-wasabi.jpg', alt: 'WasabiRub on white', kind: 'link',
    src: 'https://kennadyscott.github.io/sportpharm-site/assets/product-wasabi.jpg', tags: ['product', 'wasabirub'] },
  { id: 'm-brandon', name: 'brandon.png', alt: 'Brandon Welch, President', kind: 'link',
    src: 'https://kennadyscott.github.io/sportpharm-site/assets/brandon.png', tags: ['team'] }
];

/* -------------------------------- branding ------------------------------- */
const MESSAGING = [
  { group: 'The brand line', note: 'What goes under the wordmark. Do not invent a fourth.',
    lines: [
      { text: 'We Take Our Drugs Seriously.', use: 'The company tagline. Baked into the primary logo.' },
      { text: 'Perform. Recover. Return.', use: 'Product and recovery contexts — WasabiRub header uses this.' },
      { text: 'Stay ready for whatever moves you.', use: 'Main-site logo tagline, everyday-athlete voice.' },
      { text: 'Sports Recovery and Performance Hub', use: 'The Athlete Hub wordmark tag.' }
    ] },
  { group: 'What we actually sell', note: 'Problem/solution first. Never lead with the jar.',
    lines: [
      { text: 'Browse by what hurts, not by what we stock.', use: 'The organising principle of the whole site.' },
      { text: 'Relief can be part of the plan — not the whole plan.', use: 'Product framing. Keeps us honest.' },
      { text: 'Three sensations. One rub.', use: 'WasabiRub differentiator, leads the landing hero.' },
      { text: 'Only triple-action sports topical.', use: 'WasabiRub claim — soften to "the only one we know of" in paid.' }
    ] },
  { group: 'Professional voice', note: 'ATs, team physicians, compliance staff. Different room, same pharmacy.',
    lines: [
      { text: 'What touches the athlete matters.', use: 'Clean Sport campaign platform.' },
      { text: 'Know what is being used in the training room.', use: 'To athletic trainers.' },
      { text: 'Product decisions are part of the compliance system.', use: 'To compliance staff.' },
      { text: 'We take our drugs seriously so you can take care of your athletes.', use: 'Sports Medicine page footer.' }
    ] },
  { group: 'Never say', note: 'These are not stylistic preferences. They are the guardrails.',
    lines: [
      { text: 'Cure, heal, treat, fix', use: 'OTC external analgesic language only. Always.' },
      { text: 'Any phrasing that implies a league or team endorses us', use: 'Naming a client is not the same as claiming endorsement.' },
      { text: 'Naming or knocking any other retailer or marketplace', use: 'Channel strategy is internal. It never appears in public creative.' },
      { text: 'Guaranteed results, before/after transformation framing', use: 'FTC, and it is not who we are.' }
    ] }
];

const BRAND_TOKENS = [
  { name: 'Brand red',   hex: '#E0312A', use: 'The accent. CTAs, active states, the periods in a headline.' },
  { name: 'Deep navy',   hex: '#0B1E3B', use: 'The primary dark. Heroes, the rail, footers.' },
  { name: 'Navy 2',      hex: '#12294A', use: 'Raised surfaces on navy.' },
  { name: 'Ink',         hex: '#10233F', use: 'Body text on light.' },
  { name: 'Steel',       hex: '#5A6B84', use: 'Secondary text. The user prefers this brighter than most greys.' },
  { name: 'Canvas',      hex: '#F3F6FB', use: 'The light ground everything sits on.' },
  { name: 'Line',        hex: '#E2E8F0', use: 'Hairlines and card borders.' }
];

const BRAND_RULES = [
  'Bebas Neue for display, Inter for body and UI. The main site is Bebas + Inter; the Athlete Hub is still Oswald + Epilogue — do not "fix" one to match the other without asking.',
  'The user is sensitive to letterforms, especially a straight lowercase l. Sora and Archivo were both rejected over it.',
  'WasabiRub is red on dark. It is not green. This has been settled twice and reversed once — do not relitigate it.',
  'Do not redesign the WasabiRub "FEEL IT WORK" landing page. It is the approved design.',
  'Product colours: WasabiRub green, IcetraRub blue, Super Hot red. That is the relief tier, not the brand palette.',
  'Version an image URL (?v=2) when overwriting a filename, or the stale one keeps showing.',
  'Medical disclaimer on every page footer. Educational only, seek a provider.'
];

/* ------------------------------- analytics ------------------------------- */
const ANALYTICS_PLAN = [
  { name: 'Direct sales', metric: 'The number the President is actually watching',
    events: ['add_to_cart', 'begin_checkout', 'purchase', 'promo_applied'] },
  { name: 'Content → commerce', metric: 'Does the education actually move product',
    events: ['view_article', 'article_to_product', 'view_product'] },
  { name: 'Injury pathways', metric: 'Which problem people arrive with',
    events: ['view_injury_guide', 'body_map_click', 'search_symptom'] },
  { name: 'Professional pipeline', metric: 'B2B intent — the slow, valuable one',
    events: ['view_sports_medicine', 'consult_request', 'download_checklist'] }
];

const ROI_ROWS = [
  { k: 'organic', label: 'Organic social' },
  { k: 'email',   label: 'Email' },
  { k: 'meta',    label: 'Meta ads' },
  { k: 'creator', label: 'Creators' },
  { k: 'search',  label: 'Search / blog' },
  { k: 'site',    label: 'Site direct' }
];
const ROI_COLS = [
  { k: 'spend',    label: 'Spend',    money: true },
  { k: 'sessions', label: 'Sessions' },
  { k: 'orders',   label: 'Orders' },
  { k: 'revenue',  label: 'Revenue',  money: true }
];

/* ------------------------------- platforms ------------------------------- */
const PLATFORM_STATES = {
  evaluating: { label: 'Evaluating' },
  trial:      { label: 'In trial' },
  active:     { label: 'Active' },
  passed:     { label: 'Passed' }
};
const PLATFORM_CATS = [
  { id: 'commerce', label: 'Commerce',  tone: 'amber' },
  { id: 'email',    label: 'Email',     tone: 'blue' },
  { id: 'paid',     label: 'Paid',      tone: 'red' },
  { id: 'infra',    label: 'Build',     tone: 'navy' },
  { id: 'ops',      label: 'Ops',       tone: 'green' }
];

/* Wiped 2026-07-29 at the team's request. The previous contents were seeded by
   me, not by them — including a $1,500/mo Meta figure that existed in no
   document. Platforms starts empty; add what you actually pay for. */
const SEED_PLATFORMS = [];


/* ------------------------------ launch gates ----------------------------- */
const REMINDER_LEVELS = {
  blocker:   { label: 'Gate',      tone: 'red' },
  important: { label: 'Important', tone: 'amber' },
  note:      { label: 'Note',      tone: 'blue' }
};

const SEED_REMINDERS = [
  { id: 'r-auth', level: 'blocker', text: 'HQ’s seat login is a door, not a lock — connect Supabase Auth before this link leaves the three of us.',
    due: '2026-08-15',
    why: 'Passcodes are lightly hashed in localStorage and every byte of data lives in the visitor’s own browser. Anyone with devtools is past it in a minute. That is fine while it is Brandon, Jessie and Kennady on a private link. It stops being fine the moment a fourth person gets the URL, or the moment anything that is not already public goes in. hq-config.js + supabase/hq.sql are the whole fix.' },
  { id: 'r-publish', level: 'blocker', text: 'Nothing the CMS publishes reaches the live site until articles.html reads the feed.',
    due: '2026-08-21',
    why: 'The CMS writes to hq_articles in Supabase. sportpharm-site is 43 static pages that know nothing about it. Until articles.html fetches published rows and renders them, "Publish" means "published inside HQ" — which is a real thing (review is done, it is locked, it is dated) but it is not on the internet. Do not let anyone believe otherwise.' },
  { id: 'r-scheduled', level: 'important', text: 'A scheduled article goes live when someone loads the site, not at the minute you picked.',
    due: '2026-09-05',
    why: 'With no server, "scheduled for Friday 9am" really means "the first visitor after Friday 9am sees it." For a blog that is completely fine. For anything time-critical — a launch price ending, a LASTCALL deadline — it is not. Those need a real send, not a static page.' },
  { id: 'r-images', level: 'important', text: 'Uploaded images become data URIs inside the record until Supabase Storage is wired.',
    due: '2026-09-05',
    why: 'It works, and it is genuinely convenient for a prototype, but a few full-size photos will blow past the localStorage quota and the row size. Link to assets in the site repo for anything real; keep uploads for quick mockups until the storage bucket exists.' },
  { id: 'r-compress', level: 'important', text: 'The site is still shipping ~2MB PNGs. The compression pass was requested and never done.',
    due: '2026-08-29',
    why: 'Asked for in July and it keeps sliding. It is the cheapest performance win available and it affects every page.' },
  { id: 'r-disclaimer', level: 'note', text: 'Every published article needs the medical disclaimer in the footer.',
    due: '',
    why: 'It is on all 15 original page footers. Anything the CMS publishes must inherit it — the review checklist covers it, but the template has to actually render it.' }
];

/* ------------------------------- the plan -------------------------------- */
const CHANNELS = {
  instagram: { label: 'Instagram', tone: 'red' },
  linkedin:  { label: 'LinkedIn',  tone: 'blue' },
  facebook:  { label: 'Facebook',  tone: 'navy' },
  email:     { label: 'Email',     tone: 'green' },
  blog:      { label: 'Blog / SEO', tone: 'amber' },
  site:      { label: 'Site',      tone: 'blue' },
  paid:      { label: 'Meta ads',  tone: 'red' }
};

const PLAN_STATUS = {
  drafting:  { label: 'Drafting',  tone: 'muted' },
  review:    { label: 'In review', tone: 'amber' },
  scheduled: { label: 'Scheduled', tone: 'blue' },
  posted:    { label: 'Posted',    tone: 'green' }
};
const PLAN_FORMATS = ['Post', 'Carousel', 'Reel', 'Stories', 'Email', 'Blog', 'Meta ad'];

const DEFAULT_PLAN_RULES = {
  requireReview: true,
  /* The campaign signs off the creative before the Plan schedules it. Only a
     definite "needs changes" blocks — silence from the Studio does not. */
  requireBriefApproval: true,
  avoidWeekends: true,
  perWeek: 4
};

/* Audience + pillar tagging, so the plan reads as a balance and not just a list.
   Two very different rooms: the athlete buying a rub, and the athletic trainer
   deciding what goes in a kit. PILLARS is keyed by who a piece is facing. */
const FACING = {
  athlete: { label: 'Athlete-facing', short: 'Athlete', tone: 'red' },
  pro:     { label: 'Professional',   short: 'Pro',     tone: 'green' }
};
const PILLARS = {
  athlete: ['Feel it work', 'Recovery, honestly', 'Trusted since 1995', 'Find your heat'],
  pro:     ['What touches the athlete', 'Sideline ready', 'Read the label', 'Behind the counter']
};

const SEED_PLAN = [];   /* seeded by LAUNCH_PIECES below */

/* The direct-sales push, reconciled against the Content Studio on 2026-07-29.

   Every Studio asset for Feel It Work (w1–w14) now has a dated slot here, and
   `assetId` links the two so the Plan row and the Studio brief are the same
   piece of work seen from two angles. Pieces with no assetId are HQ-only —
   paid placements and offer mechanics, which the Studio tracks in its own
   Meta Ads and Offers sections rather than as assets.

   Reconciling caught two scheduling errors: the cart-abandon flow was dated
   mid-campaign when it has to exist before week one, and the close was dated
   31 Aug — a Monday — while its own copy says the deadline is Sunday. */
const LAUNCH_PIECES = [
  /* ---- Week 0 · before anything posts ---- */
  { id: 'lp-w14', assetId: 'w14', title: 'Cart-abandon flow — 3 emails', campaign: 'wasabi-direct', format: 'Email', channel: 'email', status: 'drafting', date: '2026-07-30', facing: 'athlete', pillar: 'Feel it work',
    notes: 'Reminder → objection/review → incentive. Studio marks this "core, build before launch" — it has to be firing on a test cart before week one, not bolted on later.' },

  /* ---- Week 1 · three sensations, one rub ---- */
  { id: 'lp-w1', assetId: 'w1', title: 'Hero reel — Feel It Work', campaign: 'wasabi-direct', format: 'Reel', channel: 'instagram', status: 'drafting', date: '2026-08-03', facing: 'athlete', pillar: 'Feel it work',
    notes: 'Opens on the differentiator, not the jar. Menthol / capsaicin / methyl salicylate as three beats. Ends at the product page, not the profile.' },
  { id: 'lp-w12', assetId: 'w12', title: 'Stories — polls, quiz & shop links', campaign: 'wasabi-direct', format: 'Stories', channel: 'instagram', status: 'drafting', date: '2026-08-03', facing: 'athlete', pillar: 'Feel it work',
    notes: 'Always-on from launch. The lowest-effort direct path we have — link stickers on every frame.' },
  { id: 'lp-w11', assetId: 'w11', title: 'Email sequence — 3 sends', campaign: 'wasabi-direct', format: 'Email', channel: 'email', status: 'drafting', date: '2026-08-04', facing: 'athlete', pillar: 'Feel it work',
    notes: 'Runs across all five weeks. Capture is the byproduct; the order is the point.' },
  { id: 'lp-w2', assetId: 'w2', title: 'Meet the lineup carousel', campaign: 'wasabi-direct', format: 'Carousel', channel: 'instagram', status: 'drafting', date: '2026-08-05', facing: 'athlete', pillar: 'Feel it work',
    notes: 'IcetraRub blue / WasabiRub green / Super Hot red. One idea per slide. Prices on the last slide only.' },
  { id: 'lp-w13', assetId: 'w13', title: 'First-order offer — your first order ships free', campaign: 'wasabi-direct', format: 'Post', channel: 'instagram', status: 'drafting', date: '2026-08-06', facing: 'athlete', pillar: 'Feel it work',
    notes: 'FREESHIP1. Always-on across the window. Code has to exist in-store before this posts.' },
  { id: 'lp3', assetId: '', title: 'Launch offer — FEELIT15', campaign: 'wasabi-direct', format: 'Post', channel: 'instagram', status: 'drafting', date: '2026-08-07', facing: 'athlete', pillar: 'Feel it work',
    notes: 'HQ-only — an offer mechanic, not a Studio asset. Code has to exist in-store before this posts. Check with Kennady.' },

  /* ---- Week 2 · why it feels different ---- */
  { id: 'lp-w3', assetId: 'w3', title: 'WasabiRub triple-action', campaign: 'wasabi-direct', format: 'Carousel', channel: 'instagram', status: 'drafting', date: '2026-08-10', facing: 'athlete', pillar: 'Feel it work',
    notes: 'Soften "only triple-action" to something defensible before this goes anywhere near paid.' },
  { id: 'lp-w4', assetId: 'w4', title: 'IcetraRub cooling spotlight', campaign: 'wasabi-direct', format: 'Post', channel: 'instagram', status: 'drafting', date: '2026-08-12', facing: 'athlete', pillar: 'Feel it work',
    notes: '16% menthol, the cooling end of the range. Was in the Studio with no dated slot until the reconcile.' },
  { id: 'lp-w5', assetId: 'w5', title: 'WasabiRub Super Hot spotlight', campaign: 'wasabi-direct', format: 'Post', channel: 'instagram', status: 'drafting', date: '2026-08-14', facing: 'athlete', pillar: 'Feel it work',
    notes: 'The max-heat end. Was in the Studio with no dated slot until the reconcile.' },
  { id: 'lp6', assetId: '', title: 'Cold prospecting reel — Meta', campaign: 'wasabi-direct', format: 'Meta ad', channel: 'paid', status: 'drafting', date: '2026-08-14', facing: 'athlete', pillar: 'Feel it work',
    notes: 'HQ-only — lives in the Studio\'s Meta Ads section, not its assets. No personal-attribute copy. OTC claims only. Pixel + CAPI both firing before spend starts.' },

  /* ---- Week 3 · help them choose ---- */
  { id: 'lp-w6', assetId: 'w6', title: 'Cool → Heat: which rub?', campaign: 'wasabi-direct', format: 'Carousel', channel: 'instagram', status: 'drafting', date: '2026-08-17', facing: 'athlete', pillar: 'Find your heat',
    notes: 'The chooser. Was in the Studio with no dated slot until the reconcile.' },
  { id: 'lp-w7', assetId: 'w7', title: 'Bundle & save', campaign: 'wasabi-direct', format: 'Post', channel: 'instagram', status: 'drafting', date: '2026-08-19', facing: 'athlete', pillar: 'Feel it work',
    notes: 'Fire & Ice / OG Heat / Recovery. Raises basket size. Was in the Studio with no dated slot until the reconcile.' },

  /* ---- Week 4 · proof ---- */
  { id: 'lp-w8', assetId: 'w8', title: 'Trusted by pros & pharmacists', campaign: 'wasabi-direct', format: 'Post', channel: 'instagram', status: 'drafting', date: '2026-08-24', facing: 'athlete', pillar: 'Trusted since 1995',
    notes: 'Describe use, never endorsement. Was in the Studio with no dated slot until the reconcile.' },
  { id: 'lp-w9', assetId: 'w9', title: 'Ask Brandon — triple-action & how to use', campaign: 'wasabi-direct', format: 'Reel', channel: 'instagram', status: 'drafting', date: '2026-08-26', facing: 'athlete', pillar: 'Trusted since 1995',
    notes: 'People buy the pharmacist before the product. Was in the Studio with no dated slot until the reconcile.' },
  { id: 'lp12', assetId: '', title: 'Retargeting proof + LASTCALL', campaign: 'wasabi-direct', format: 'Meta ad', channel: 'paid', status: 'drafting', date: '2026-08-28', facing: 'athlete', pillar: 'Feel it work',
    notes: 'HQ-only — Studio Meta Ads section. Real deadline or do not run it.' },

  /* ---- Week 5 · the close ---- */
  { id: 'lp-w10', assetId: 'w10', title: 'Campaign close — launch pricing ends Sunday', campaign: 'wasabi-direct', format: 'Post', channel: 'instagram', status: 'drafting', date: '2026-08-30', facing: 'athlete', pillar: 'Feel it work',
    notes: 'LASTCALL. 30 Aug is the Sunday — the previous date (31 Aug) was a Monday and contradicted the copy. Deadline is midnight and it has to actually be enforced in-store.' },

  /* ---- other campaigns ---- */
  { id: 'lp8', assetId: '', title: 'What TruShield actually screens for', campaign: 'clean-sport', format: 'Blog', channel: 'blog', status: 'review', date: '2026-08-19', facing: 'pro', pillar: 'What touches the athlete',
    notes: 'Article is approved in the CMS — this is the social pull-through.' },
  { id: 'lp9', assetId: '', title: 'Sideline kit audit — the checklist', campaign: 'sideline-ready', format: 'Post', channel: 'linkedin', status: 'drafting', date: '2026-08-21', facing: 'pro', pillar: 'Sideline ready',
    notes: 'The download has to exist first. It does not yet — see Professional channel.' },
  { id: 'lp10', assetId: '', title: 'Trusted since 1995 — the thirty-year post', campaign: 'trusted', format: 'Post', channel: 'linkedin', status: 'drafting', date: '2026-08-24', facing: 'pro', pillar: 'Trusted since 1995',
    notes: 'Proof, not nostalgia. What thirty years actually bought the customer.' },
  { id: 'lp11', assetId: '', title: 'Ask Brandon — interview cut', campaign: 'team', format: 'Reel', channel: 'instagram', status: 'drafting', date: '2026-08-26', facing: 'athlete', pillar: 'Trusted since 1995',
    notes: 'Behind the Counter campaign. Distinct from the WasabiRub Ask Brandon on the same day — one is product, one is the pharmacist.' }
];

/* The launch window, week by week, sitting above the plan. The checkboxes are
   the operational work that isn't a post — the things that get forgotten
   precisely because they never show up on a content calendar. */
const LAUNCH_PLAYBOOK = {
  title: 'The direct-sales push',
  sub: 'Five weeks ending on a real deadline. The goal is orders on sportpharm.com — not reach, not follows, not list growth.',
  campaign: 'wasabi-direct',
  weeks: [
    { key: 'w0', label: 'Week 0', theme: 'Before anything posts', range: ['2026-07-27', '2026-08-02'],
      goal: 'Nothing in this campaign can run until the store can actually take the order and honour the code.',
      kpis: ['Checkout works end to end', 'FREESHIP1 live', 'Pixel + CAPI firing'],
      actions: [
        'Stripe live, test order placed and refunded',
        'FREESHIP1 and FEELIT15 created in-store and tested',
        'Meta pixel and CAPI both verified — not just installed',
        'Cart-abandon flow built and firing on a test cart',
        'Product pages checked on a phone, not just a laptop'
      ] },
    { key: 'w1', label: 'Week 1', theme: 'Three sensations, one rub', range: ['2026-08-03', '2026-08-09'],
      goal: 'Lead with the differentiator, not the jar. People who have never heard of us should learn one thing.',
      kpis: ['Reel completion rate', 'Product page sessions', 'First direct orders'],
      actions: [
        'Hero reel out Monday',
        'Lineup carousel out Wednesday',
        'Daily shoppable Stories running',
        'Reply to every comment inside a day'
      ] },
    { key: 'w2', label: 'Week 2', theme: 'Why it feels different', range: ['2026-08-10', '2026-08-16'],
      goal: 'Earn the price. Triple-action is the argument — make it defensible before it goes to paid.',
      kpis: ['Add-to-cart rate', 'Email captures', 'Cost per click on the cold ad'],
      actions: [
        'Soften the "only triple-action" claim to something we can defend',
        'Welcome email 1 sending',
        'Cold prospecting reel live on Meta',
        'Check CPO against a $29.95 basket — stop if it is upside down'
      ] },
    { key: 'w3', label: 'Week 3', theme: 'Proof', range: ['2026-08-17', '2026-08-23'],
      goal: 'Thirty years, real sidelines, a real pharmacist. This is the week the brand does the selling.',
      kpis: ['Returning visitors', 'Creator code redemptions', 'Blog → product clicks'],
      actions: [
        'Ask Brandon cut published',
        'TruShield article live and pulled through on social',
        'Creator codes issued, each one disclosed',
        'Trusted Since 1995 post on LinkedIn'
      ] },
    { key: 'w4', label: 'Week 4', theme: 'The close', range: ['2026-08-24', '2026-08-31'],
      goal: 'A real deadline, enforced. If launch pricing does not actually end, do not say it does.',
      kpis: ['Orders in the final 48 hours', 'LASTCALL redemptions', 'Blended ROAS for the window'],
      actions: [
        'Retargeting proof + LASTCALL live',
        'Deadline post Sunday, and the price genuinely changes at midnight',
        'Abandoned-cart incentive arm switched on',
        'Log the numbers in Analytics before anyone forgets them'
      ] }
  ]
};

/* Standing rules for the window — true in every week, so they live outside them. */
const LAUNCH_STANDING = {
  alwaysOn: [
    'Cart abandonment running before week one, not bolted on in week three',
    'Daily shoppable Stories — the lowest-effort direct path we have',
    'Creator codes tracked individually (COACHJEN15 style), disclosed every time',
    'Reply to every comment within a day, in SportPharm voice'
  ],
  gates: [
    'Every offer code exists in-store before the asset that names it posts',
    'OTC external-analgesic language only — no cure, heal, treat',
    'FTC disclosure on every incentivised voice, including creator codes',
    'No implied league or team endorsement, even where we genuinely supply them',
    'Never name or knock another retailer publicly — channel strategy stays internal'
  ]
};

/* -------------------------------- ideas ---------------------------------- */
/* A running log to start from — undated, which is what puts them in the log
   rather than on a day. Tags are free text; they group by eye, not by schema. */
/* ---------------------------------------------------------------------------
   ORDERS

   Julia rewrites this email from scratch every time and it lands differently
   each time, so Enova, the invoicing team and the warehouse all interpret it
   fresh. The CEO's ask: one internal form covering every base — who is
   ordering, what, what is free, what SWAG, how they pay, how it ships — that
   produces a consistent record, can be printed, and can be tracked.

   The status list is the real handoff, not a workflow we invented: Julia
   submits, Enova acknowledges, invoicing raises it, it ships, it is done.
--------------------------------------------------------------------------- */
const ORDER_STATES = {
  draft:     { label: 'Draft',          tone: 'muted', hint: 'Being filled in. Nobody has seen it.' },
  submitted: { label: 'Sent to Enova',  tone: 'blue',  hint: 'With the vendor to pick and pack.' },
  ack:       { label: 'Acknowledged',   tone: 'amber', hint: 'Enova has it and confirmed.' },
  invoiced:  { label: 'Invoiced',       tone: 'amber', hint: 'Invoice raised and sent.' },
  shipped:   { label: 'Shipped',        tone: 'green', hint: 'Out the door, tracking known.' },
  complete:  { label: 'Complete',       tone: 'green', hint: 'Delivered and closed.' }
};
const ORDER_FLOW = ['draft', 'submitted', 'ack', 'invoiced', 'shipped', 'complete'];

const PAY_METHODS = ['Invoice', 'Credit card', 'Purchase order', 'Prepaid', 'No charge'];
const SHIP_METHODS = ['Ground', '2-day', 'Overnight', 'Freight', 'Customer pickup'];

/* Catalogue for the line-item picker — real prices from the live store.

   `of` is what a bundle is made of, and it is what makes inventory mean
   anything: shipping one Team Trifecta takes nine units off the shelf, not
   one. Only Trifecta's contents are actually known — they are printed on the
   order Julia sent. The rest are left empty on purpose rather than guessed,
   and Inventory says "contents not set" against them instead of quietly
   counting a bundle as one unit of itself. Set them in Inventory when someone
   who knows confirms them.

   `unit` items are the things that physically come off a shelf. SWAG is in
   the same list because a hat going out for free is still a hat gone, which
   is exactly what nobody could see before. */
const ORDER_CATALOG = [
  { sku: 'BUNDLE-TRIFECTA', name: 'Team Trifecta Bundle', price: 269.95, kind: 'bundle',
    note: '3 WasabiRub · 3 Super Hot · 3 IcetraRub',
    of: [['WASABIRUB', 3], ['SUPERHOT', 3], ['ICETRARUB', 3]] },
  { sku: 'BUNDLE-WASABI-TEAM', name: 'WasabiRub Team Bundle', price: 240.95, kind: 'bundle', note: '', of: [] },
  { sku: 'BUNDLE-FIREICE', name: 'Fire & Ice Bundle', price: 64.99, kind: 'bundle', note: '', of: [] },
  { sku: 'BUNDLE-OGHEAT', name: 'OG Heat Bundle', price: 59.99, kind: 'bundle', note: '', of: [] },
  { sku: 'BUNDLE-RECOVERY', name: 'Recovery Bundle', price: 64.99, kind: 'bundle', note: '', of: [] },
  { sku: 'WASABIRUB', name: 'WasabiRub', price: 29.95, kind: 'unit', note: '' },
  { sku: 'ICETRARUB', name: 'IcetraRub', price: 39.95, kind: 'unit', note: '' },
  { sku: 'SUPERHOT', name: 'WasabiRub Super Hot', price: 39.95, kind: 'unit', note: '' },
  { sku: 'SWAG-HAT', name: 'SportPharm hat', price: 0, kind: 'swag', note: '' },
  { sku: 'SWAG-TEE', name: 'SportPharm tee', price: 0, kind: 'swag', note: '' },
  { sku: 'SWAG-STICKERS', name: 'Stickers', price: 0, kind: 'swag', note: '' },
  { sku: 'SWAG-BOTTLE', name: 'Water bottle', price: 0, kind: 'swag', note: '' },
  { sku: 'SWAG-TOWEL', name: 'Towel', price: 0, kind: 'swag', note: '' },
  { sku: 'SWAG-SAMPLES', name: 'Sample pack', price: 0, kind: 'swag', note: '' }
];
const SWAG_ITEMS = ORDER_CATALOG.filter(c => c.kind === 'swag').map(c => c.name);

/* Who the form goes to. Kept here so nobody has to remember the distribution. */
const ORDER_RECIPIENTS = [
  { to: 'orders@sportpharm.com', role: 'Enova — pick & pack' },
  { to: 'AdminUnit@sportpharm.com', role: 'Admin, cc' }
];

/* ---------------------------------------------------------------------------
   MONEY

   Deliberately separate from the order's own status. An order can be shipped
   and unpaid, or paid and not yet shipped, and collapsing the two into one
   pipeline is how a delivered order stops being chased. `none` is the honest
   default: most orders have no invoice yet and pretending otherwise would put
   money in the outstanding column that nobody has asked for.
--------------------------------------------------------------------------- */
const MONEY_STATES = {
  none:    { label: 'Not invoiced', tone: 'muted', hint: 'No invoice raised yet.' },
  raised:  { label: 'Invoice raised', tone: 'blue', hint: 'Raised, not sent.' },
  sent:    { label: 'Invoice sent',  tone: 'amber', hint: 'With the customer, awaiting payment.' },
  part:    { label: 'Part paid',     tone: 'amber', hint: 'Something in, a balance still out.' },
  paid:    { label: 'Paid',          tone: 'green', hint: 'Settled in full.' },
  writeoff:{ label: 'Written off',   tone: 'red',   hint: 'Not going to be collected.' }
};

/* Where the money is sent from. Shown on the invoice, editable in Settings. */
const REMIT_TO = {
  name: 'SportPharm',
  lines: ['Accounts Receivable', 'accounts@sportpharm.com'],
  terms: 'Net 30'
};

/* Opening stock. Zero on purpose — nobody has counted a shelf yet, and a
   made-up number would read as a real one. Inventory shows what has gone out
   regardless; on-hand only starts meaning something once someone enters a
   count, which the Inventory page asks for. */
const SEED_STOCK = {};

const SEED_ORDERS = [];

const SEED_TODOS = [
  { id: 'td1', title: 'Compress the site imagery — the ~2MB PNG pass', tag: 'Website' },
  { id: 'td2', title: 'Chase the TruShield one-pager copy', tag: 'Clean Sport' },
  { id: 'td3', title: 'Confirm FREESHIP1 is live in-store before week one', tag: 'Feel It Work' },
  { id: 'td4', title: 'Ask Brandon who signs off articles', tag: 'CMS' },
  { id: 'td5', title: 'Sideline Ready checklist — get the download made', tag: 'Sideline Ready' }
];

const SEED_IDEAS = [
  { id: 'i1', text: 'A "what does this ingredient actually do" explainer series — menthol, capsaicin, methyl salicylate, lidocaine', by: 'u-jessie', area: 'content', votes: 2, state: 'open' },
  { id: 'i2', text: 'Let athletic trainers request a kit audit directly from the Sideline Ready checklist page', by: 'u-brandon', area: 'pro', votes: 3, state: 'open' },
  { id: 'i3', text: 'Injury guide → product tie-in should be a real component, not a hand-placed card', by: 'u-kennady', area: 'site', votes: 1, state: 'open' },
  { id: 'i4', text: 'Bundle the three rubs as a "find your heat" quiz result instead of a static page', by: 'u-jessie', area: 'commerce', votes: 2, state: 'open' },
  { id: 'i5', text: 'Ask Brandon as a recurring short-form column in the CMS, not a one-off band on a page', by: 'u-jessie', area: 'content', votes: 1, state: 'open' },
  { id: 'i6', text: 'Meniscus, patellar tendinitis, achilles, plantar fasciitis — the next four injury guides', by: 'u-kennady', area: 'site', votes: 2, state: 'open' },
  { id: 'i7', text: 'A LidoRub teaser that does not announce LidoRub', by: 'u-brandon', area: 'marketing', votes: 0, state: 'parked' }
];
