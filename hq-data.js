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
const SEED_USERS = [
  { id: 'u-brandon', name: 'Brandon Welch', email: 'brandonw@sportpharm.com', role: 'owner',  tone: 'navy',  title: 'President',          pass: 'summit-anchor-40' },
  { id: 'u-jessie',  name: 'Jessie T',      email: 'jessiet@sportpharm.com',  role: 'editor', tone: 'red',   title: 'Marketing',          pass: 'summit-anchor-40' },
  { id: 'u-kennady', name: 'Kennady Scott', email: 'kennady.nickell@gmail.com', role: 'owner', tone: 'blue', title: 'Build & web',        pass: 'summit-anchor-40' }
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
const SEED_PROJECTS = [
  {
    id: 'p-cms', name: 'CMS & publishing', area: 'content', tone: 'blue',
    goal: 'Get articles written, reviewed and published from HQ instead of by hand-editing HTML.',
    due: '2026-09-15',
    tasks: [
      { id: 't1', title: 'Point articles.html at the published feed', status: 'next', owner: 'u-kennady', due: '2026-08-14' },
      { id: 't2', title: 'Run supabase/hq.sql — hq_kv, hq_members, and the published_articles view', status: 'next', owner: 'u-kennady', due: '2026-08-07' },
      { id: 't3', title: 'Move the 3 existing articles into the CMS', status: 'next', owner: 'u-jessie', due: '2026-08-21', campaign: 'recovery' },
      { id: 't4', title: 'Agree who approves an article before it goes live', status: 'next', owner: 'u-brandon', due: '2026-08-12' },
      { id: 't5', title: 'Decide the image budget — the site is carrying ~2MB PNGs', status: 'someday', owner: null, due: '' }
    ]
  },
  {
    id: 'p-direct', name: 'Direct-to-site sales', area: 'commerce', tone: 'amber',
    goal: 'Make sportpharm.com the primary sales channel. The President’s stated priority.',
    due: '2026-10-31',
    tasks: [
      { id: 't1', title: 'Stand up Stripe + native promotion codes', status: 'next', owner: null, due: '2026-09-05', campaign: 'wasabi-direct' },
      { id: 't2', title: 'Cart abandonment flow — 3 emails, build before launch', status: 'next', owner: 'u-jessie', due: '2026-09-12', campaign: 'wasabi-direct' },
      { id: 't3', title: 'Set up the offer codes in-store (FREESHIP1 first)', status: 'next', owner: null, due: '2026-09-05', campaign: 'wasabi-direct' },
      { id: 't4', title: 'Mailchimp connected for email + abandoned cart', status: 'next', owner: null, due: '2026-09-19', campaign: 'wasabi-direct' },
      { id: 't5', title: 'Run the Feel It Work campaign', status: 'someday', owner: 'u-jessie', due: '', campaign: 'wasabi-direct' }
    ]
  },
  {
    id: 'p-site', name: 'Website build-out', area: 'site', tone: 'navy',
    goal: 'Close the gaps on the 43-page static site while the Next.js + Payload port is still ahead of us.',
    due: '2026-11-30',
    tasks: [
      { id: 't1', title: 'Compress the imagery — the ~2MB PNG pass never happened', status: 'next', owner: null, due: '2026-08-29' },
      { id: 't2', title: 'Wire the public contact forms into Leads', status: 'next', owner: 'u-kennady', due: '2026-09-05', campaign: 'trusted' },
      { id: 't3', title: 'Build the 4 pathway landing pages', status: 'next', owner: null, due: '2026-09-26', campaign: 'playbooks' },
      { id: 't4', title: 'pro-hero.png and pro-support.png still missing on Sports Medicine', status: 'next', owner: null, due: '2026-08-22' },
      { id: 't5', title: 'Pro / Healthcare persona pages are still on placeholder photos', status: 'someday', owner: null, due: '' },
      { id: 't6', title: 'Decide: merge Injuries and Recovery, or keep the split', status: 'next', owner: 'u-brandon', due: '2026-08-29' }
    ]
  },
  {
    id: 'p-pro', name: 'Professional channel', area: 'pro', tone: 'green',
    goal: 'Turn the Sports Medicine page into a real B2B pipeline — ATs, team physicians, compliance staff.',
    due: '2026-12-15',
    tasks: [
      { id: 't1', title: 'Sideline Ready audit checklist — the actual downloadable', status: 'next', owner: 'u-brandon', due: '2026-09-12', campaign: 'sideline-ready' },
      { id: 't2', title: 'KetoRub / TruShield one-pager for compliance staff', status: 'next', owner: null, due: '2026-09-19', campaign: 'clean-sport' },
      { id: 't3', title: 'Consult request form on the 8 service cards', status: 'next', owner: 'u-kennady', due: '2026-09-26', campaign: 'dispensing' },
      { id: 't4', title: 'Decide whether professionals need a login at all', status: 'someday', owner: 'u-brandon', due: '' }
    ]
  }
];

/* ------------------------------- campaigns -------------------------------- */
/* The index only. Every brief, asset mockup, comment thread, calendar, ROI
   table and approval lives in the Content Studio — campaigns/index.html —
   which is mounted inside HQ and talks to its own Supabase project. Opening a
   campaign here deep-links into it with ?c=<id>. */
const CAMPAIGN_STUDIO = 'campaigns/index.html';

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

const SEED_PLATFORMS = [
  { id: 'pl-stripe', name: 'Stripe', cat: 'commerce', status: 'evaluating', cost: 0,
    pricing: '2.9% + 30¢ per transaction. Promotion Codes included, no add-on.',
    what: 'Payments for direct sales, plus the native promo codes the whole offer stack depends on (FREESHIP1, FEELIT15, LASTCALL).',
    judge: 'It is the assumed default. The real question is whether we launch on it before Payload exists or wait — waiting costs us the direct-sales window.',
    verdict: '', owner: 'u-kennady', decideBy: '2026-08-22' },
  { id: 'pl-mailchimp', name: 'Mailchimp', cat: 'email', status: 'evaluating', cost: 26,
    pricing: 'Standard ~$26/mo at our list size; scales with contacts.',
    what: 'Email sends, the welcome sequence, and abandoned cart — which we decided is core, not a nice-to-have.',
    judge: 'Does abandoned cart work without a real backend? If it needs Payload anyway, this waits.',
    verdict: '', owner: 'u-jessie', decideBy: '2026-09-05' },
  { id: 'pl-meta', name: 'Meta Ads', cat: 'paid', status: 'evaluating', cost: 1500,
    pricing: 'Budget, not licence. $1.5k/mo is the tested-floor proposal.',
    what: 'The three-ad structure in the Feel It Work brief: cold prospecting reel, mid-funnel carousel, retargeting proof.',
    judge: 'Cost per order against a $29.95–$39.95 basket. If CPO exceeds margin at 4 weeks, stop.',
    verdict: '', owner: 'u-jessie', decideBy: '2026-09-12' },
  { id: 'pl-vercel', name: 'Vercel', cat: 'infra', status: 'evaluating', cost: 20,
    pricing: 'Pro $20/mo per seat.',
    what: 'Where Next.js + Payload lands when we stop being a static site.',
    judge: 'Only worth paying for once the port actually starts. GitHub Pages is free and currently sufficient.',
    verdict: '', owner: 'u-kennady', decideBy: '2026-10-31' },
  { id: 'pl-payload', name: 'Payload CMS', cat: 'infra', status: 'evaluating', cost: 0,
    pricing: 'Self-hosted, free. Cloud tier exists if we do not want to run Postgres.',
    what: 'The long-term CMS. Auth, roles, and the employee submission workflow, natively.',
    judge: 'HQ’s CMS is the blueprint for this. Build it here first, learn the workflow, then port the model.',
    verdict: 'Deferred on purpose — HQ proves the workflow before we commit to the stack.', owner: 'u-kennady', decideBy: '2026-11-30' },
  { id: 'pl-supabase', name: 'Supabase', cat: 'infra', status: 'trial', cost: 0,
    pricing: 'Free tier covers us today. Pro is $25/mo when we outgrow it.',
    what: 'Already running the Content Studio. Now also the CMS store and the shared HQ workspace.',
    judge: 'It is doing two real jobs already. The question is only whether Payload eventually replaces it.',
    verdict: 'Keeping it. Two projects in production already.', owner: 'u-kennady', decideBy: '' },
  { id: 'pl-marketplaces', name: 'Third-party marketplaces', cat: 'commerce', status: 'passed', cost: 0,
    pricing: 'Referral fees per order.',
    what: 'Reselling through channels we do not control.',
    judge: 'Weighed against owning the customer relationship and the margin on sportpharm.com.',
    verdict: 'De-prioritised in favour of direct. The full reasoning is deliberately not written down here — ask Brandon.', owner: 'u-brandon', decideBy: '' }
];

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
const SEED_IDEAS = [
  { id: 'i1', text: 'A "what does this ingredient actually do" explainer series — menthol, capsaicin, methyl salicylate, lidocaine', by: 'u-jessie', area: 'content', votes: 2, state: 'open' },
  { id: 'i2', text: 'Let athletic trainers request a kit audit directly from the Sideline Ready checklist page', by: 'u-brandon', area: 'pro', votes: 3, state: 'open' },
  { id: 'i3', text: 'Injury guide → product tie-in should be a real component, not a hand-placed card', by: 'u-kennady', area: 'site', votes: 1, state: 'open' },
  { id: 'i4', text: 'Bundle the three rubs as a "find your heat" quiz result instead of a static page', by: 'u-jessie', area: 'commerce', votes: 2, state: 'open' },
  { id: 'i5', text: 'Ask Brandon as a recurring short-form column in the CMS, not a one-off band on a page', by: 'u-jessie', area: 'content', votes: 1, state: 'open' },
  { id: 'i6', text: 'Meniscus, patellar tendinitis, achilles, plantar fasciitis — the next four injury guides', by: 'u-kennady', area: 'site', votes: 2, state: 'open' },
  { id: 'i7', text: 'A LidoRub teaser that does not announce LidoRub', by: 'u-brandon', area: 'marketing', votes: 0, state: 'parked' }
];
