/* =============================================================================
   SportPharm HQ — the nine articles currently live on sportpharm.com/news/

   Pulled 2026-07-28 and converted into blocks so they are editable in the CMS
   rather than trapped in WordPress. `sourceUrl` keeps the canonical original
   on every record.

   All nine are tagged to the `athlete-hub` series, which is what puts them on
   the hub's articles page — the site filters the published feed on it.

   NOTE ON IMAGES: five hero images point at sportpharm.com's own uploads and
   are stable. Four of the originals were hosted on LinkedIn's CDN with expiring
   signed URLs (or had no hero at all), so they are left blank rather than
   seeded with a link that will 404 in a few weeks — see the README.
============================================================================= */

const LIVE_ARTICLES = [

  /* ------------------------------------------------------------------ 22 Jul */
  { id: 'a-live-penthrox', title: 'Green Whistle: What Sports Medicine Teams Should Know About Penthrox',
    slug: 'green-whistle-penthrox', category: 'Medical', series: 'athlete-hub',
    tags: ['penthrox', 'methoxyflurane', 'sideline', 'clinic', 'medical'],
    author: 'Hayden K. Lee, MBA, SportPharm Pharmacy Intern',
    status: 'published', date: '2026-07-22', publishedAt: '2026-07-22T09:00:00.000Z', views: 0,
    image: 'https://i0.wp.com/sportpharm.com/wp-content/uploads/2026/07/green-whistle-fifa-2026.jpg',
    sourceUrl: 'https://sportpharm.com/green-whistle-what-sports-medicine-teams-should-know-about-penthrox/',
    excerpt: 'The bright green inhaler seen on the World Cup sideline is inhaled methoxyflurane — and it is quickly becoming one of the most talked-about tools in international sports medicine pain management.',
    checks: { otc: true, noleague: true, ftc: true, medical: true, sourced: true }, thread: [],
    blocks: [
      { id: 'bl-pw-1', type: 'text', text: 'If you watched the 2026 World Cup, you might have seen Canadian international Ismaël Koné suffer a serious broken tibia/fibula injury. As he was carted off the pitch, ending his tournament, you may have noticed a small, bright green device held to his mouth during sideline treatment. That device, known as the "green whistle", is inhaled methoxyflurane (brand name Penthrox™), and it is quickly becoming one of the most talked-about tools in international sports medicine pain management.\n\nFor athletic trainers, team physicians, and sports pharmacists, this is more than a viral moment. It\'s a window into how sideline acute pain management is evolving and why programs need to stay ahead of the curve.' },
      { id: 'bl-pw-2', type: 'heading', level: 2, text: 'What Is the Green Whistle?' },
      { id: 'bl-pw-3', type: 'text', text: 'Methoxyflurane is a halogenated ether originally developed as a volatile inhalational anesthetic. At low, sub-anesthetic doses, it acts as a potent non-opioid analgesic. The Penthrox™ inhaler is a handheld, whistle-shaped, disposable draw-over vaporizer. Each device contains 3 mL of methoxyflurane, and the athlete breathes through it to administer pain relief under supervision of trained medical personnel. It is manufactured by the Australian pharmaceutical and medical technology company Medical Developments International (MDI).\n\nIt has been used in Australia and New Zealand by paramedics, the military, and civilian first aid providers for over 30 years, and is approved in the UK and across Europe for the emergency relief of moderate-to-severe trauma pain in conscious adult patients. It is not currently FDA-approved in the United States.' },
      { id: 'bl-pw-4', type: 'heading', level: 2, text: 'What We Have Heard and Studied' },
      { id: 'bl-pw-5', type: 'text', text: 'What makes the green whistle stand out for sports medicine is a combination of speed, simplicity, and safety:' },
      { id: 'bl-pw-6', type: 'list', ordered: false, items: [
        'Rapid onset: according to the manufacturer, pain relief begins within 5 minutes of first inhalation, much quicker than IV morphine or intranasal fentanyl in head-to-head trials.',
        'Self-administered: the athlete controls the dose by breathing through the device. No needles, no IV access, no complex setup needed.',
        'Rapidly reversible: according to the manufacturer, the effects wear off quickly once the athlete stops inhaling, allowing a clearer neurological and musculoskeletal assessment shortly after.',
        'Non-opioid: methoxyflurane is not a narcotic. It does not carry the regulatory burden, abuse potential, or side effect profile of opioid analgesics.',
        'Portable and disposable: lightweight, no refrigeration, single-use — ideal for travel kits, sideline bags and tournament settings where it is legal to use.'
      ] },
      { id: 'bl-pw-7', type: 'heading', level: 2, text: 'What Does the Evidence Say?' },
      { id: 'bl-pw-8', type: 'list', ordered: false, items: [
        'The phase III STOP! trial showed methoxyflurane provided a median time to first pain relief of 5 minutes, compared to 20 minutes for placebo, with a highly significant treatment effect.',
        'A systematic review and meta-analysis of pooled RCT data showed methoxyflurane was superior to standard-of-care analgesics at every timepoint from 5 to 30 minutes after administration.',
        'The 2026 PreMeFen trial, published in The Lancet, was the first randomized phase 3 trial to directly compare methoxyflurane against IV morphine and intranasal fentanyl. Methoxyflurane was non-inferior to both at 10 minutes, with notably faster onset.',
        'A 2025 systematic review of six RCTs concluded that inhaled methoxyflurane provides rapid and effective pain relief for acute trauma, consistently outperforming placebo and standard treatments, with high satisfaction and a low incidence of adverse events.'
      ] },
      { id: 'bl-pw-9', type: 'heading', level: 2, text: 'Is It Safe?' },
      { id: 'bl-pw-10', type: 'text', text: 'According to the Australian manufacturer, at the low analgesic doses used in the Penthrox™ inhaler (maximum 6 mL/day, 15 mL/week), methoxyflurane has a strong safety profile. Although historically linked to dose-dependent nephrotoxicity at much higher anesthetic doses, the analgesic dose offers a safety margin at least 2.7- to 8-fold below the nephrotoxic threshold.\n\nA large post-authorization safety study published in BMC Emergency Medicine (2023) confirmed no increased risk of hepatotoxicity or nephrotoxicity compared with other common analgesics. Renal events were significantly less common in the methoxyflurane group.\n\nThe most common reported side effects are mild and transient: dizziness, headache, and somnolence. Contraindications include renal or hepatic impairment, personal or family history of malignant hyperthermia, and known hypersensitivity to fluorinated anesthetics.' },
      { id: 'bl-pw-11', type: 'heading', level: 2, text: 'The Sideline Advantage' },
      { id: 'bl-pw-12', type: 'text', text: 'Traditional sideline pain management often relies on oral NSAIDs, acetaminophen, or injectable analgesics requiring IV access, physician oversight, and careful monitoring. Each has limitations in the fast-paced, resource-limited environment of competitive sports.\n\nThe green whistle can address most of these gaps. It can be administered immediately at the point of injury, requires no IV access, can provide rapid and effective analgesia, and allows the medical team to proceed with assessment and stabilization without delay.' },
      { id: 'bl-pw-13', type: 'heading', level: 2, text: 'What Sports Medicine Programs Should Know' },
      { id: 'bl-pw-14', type: 'list', ordered: false, items: [
        'Regulatory status varies by country. Widely available in Australia, New Zealand, the UK and Europe. Not currently FDA-approved in the United States.',
        'Anti-doping: methoxyflurane is not currently on the WADA Prohibited List. Programs under WADA/USADA or NCAA jurisdiction should independently verify status through the applicable governing body and document clearance before administration in any competitive context.',
        'Storage and handling: per the manufacturer\'s package insert, the inhaler needs no refrigeration and has a long shelf life, making it practical for sideline kits and travel bags.',
        'Training: administration should be supervised by personnel trained in its use, with protocols for physician supervision, documentation, contraindication screening and post-use monitoring.'
      ] },
      { id: 'bl-pw-15', type: 'callout', tone: 'amber', title: 'Disclaimer',
        text: 'The information provided is for educational and informational purposes only. SportPharm does not endorse this product and has no affiliation, financial relationship, sponsorship, or commercial interest with the manufacturer. Any product mentioned is discussed solely for educational purposes.' },
      { id: 'bl-pw-16', type: 'heading', level: 2, text: 'The SportPharm Perspective' },
      { id: 'bl-pw-17', type: 'text', text: 'Moments like Ismaël Koné\'s injury shine a spotlight on what happens in the critical minutes after an athlete goes down. The green whistle is a reminder that international sideline medicine is evolving, and that the tools available to sports medicine teams are expanding beyond the traditional formulary.\n\nAt SportPharm, staying current with emerging analgesic options, understanding their evidence base, and ensuring compliant access for athletic programs is core to what we do. Reach out at info@sportpharm.com — we will let you know when Penthrox™ is available in the USA.' },
      { id: 'bl-pw-18', type: 'disclaimer' }
    ] },

  /* ------------------------------------------------------------------ 07 Jul */
  { id: 'a-live-trushield', title: 'SportPharm Partners With TruShield™ To Advance Clean Sport And Athlete Safety',
    slug: 'sportpharm-trushield-partnership', category: 'Clean Sport', series: 'athlete-hub',
    tags: ['TruShield', 'KetoRub', 'clean sport', 'banned substances'], author: 'SportPharm',
    status: 'published', date: '2026-07-07', publishedAt: '2026-07-07T09:00:00.000Z', views: 0,
    image: 'https://i0.wp.com/sportpharm.com/wp-content/uploads/2026/07/ketorub.png',
    sourceUrl: 'https://sportpharm.com/sportpharm-partners-with-trushield-to-advance-clean-sport-and-athlete-safety/',
    excerpt: 'KetoRub™ becomes the first prescription-only NSAID topical in the United States to achieve TruShield™ Certification for banned substance testing.',
    checks: { otc: true, noleague: true, ftc: true, medical: true, sourced: true }, thread: [],
    blocks: [
      { id: 'bl-ts-1', type: 'text', text: '*KetoRub™ by SportPharm™ becomes the first prescription-only NSAID topical in the United States to achieve TruShield™ Certification for banned substance testing.*' },
      { id: 'bl-ts-2', type: 'text', text: 'SportPharm™, a trusted pharmacy partner for athletes and sports medicine professionals, announces its partnership with TruShield™, a leading banned substance certification program dedicated to athlete protection and clean sport.\n\nThrough this partnership, KetoRub™, SportPharm\'s prescription-only ketoprofen topical cream, has earned TruShield™ Certification. It is the first prescription-only NSAID topical in the United States to undergo comprehensive third-party screening for over 480 banned substances.\n\nSportPharm\'s over-the-counter topical products, including WasabiRub™, WasabiRub™ Super-Hot, and IcetraRub™, have also achieved TruShield Certification. This provides athletes, trainers, sports medicine professionals, and healthcare providers with greater confidence in the products they recommend and use.' },
      { id: 'bl-ts-3', type: 'text', text: 'Banned substance contamination is a significant concern for athletes at all levels, from high school to professional sports. The TruShield Certification Program offers comprehensive screening for hundreds of banned substances, including anabolic agents, stimulants, SARMs, diuretics, and heavy metals.\n\nTruShield testing is conducted by a WADA-experienced, ISO 17025-accredited laboratory with over 20 years of anti-doping expertise.' },
      { id: 'bl-ts-4', type: 'quote', text: 'When evaluating third-party testing partners, we wanted the most trusted and comprehensive program available for athletes. After reviewing multiple organizations, TruShield stood out as the clear leader in banned substance testing. This partnership reflects our commitment to athlete safety and our mission to help keep clean sports clean.', cite: 'Dr. Brandon K. Welch, Clinical Sports Pharmacist and President of SportPharm' },
      { id: 'bl-ts-5', type: 'text', text: 'SportPharm takes pride in developing products that athletes and sports medicine professionals can trust. Recognizing the importance of banned substance awareness in today\'s competitive environment, the company is committed to supporting the standards established by WADA and USADA.\n\nThis achievement is especially significant for KetoRub™, now the only third-party tested NSAID topical manufactured in the United States.' },
      { id: 'bl-ts-6', type: 'quote', text: 'Athletes and healthcare professionals need confidence in every product they use, including prescription topicals. We are proud to certify KetoRub™ as the first prescription-only NSAID topical in the United States to achieve TruShield Certification through comprehensive screening for more than 480 banned substances.', cite: 'Lori Beservelt, PhD, Sr. VP of Certification Services at TruShield Certified' },
      { id: 'bl-ts-7', type: 'heading', level: 2, text: 'About SportPharm™' },
      { id: 'bl-ts-8', type: 'text', text: 'SportPharm™ is a trusted pharmacy partner for athletes and sports medicine professionals, offering innovative over-the-counter and prescription-only topical pain relief solutions to support recovery, performance, and movement. The company has served the athletic community for decades through its commitment to innovation, quality, and athlete-centered care.' },
      { id: 'bl-ts-9', type: 'heading', level: 2, text: 'About TruShield™' },
      { id: 'bl-ts-10', type: 'text', text: 'TruShield is a banned substance certification program focused on protecting finished products, athletes and brand reputation. The program screens products for more than 480 prohibited compounds, including anabolic agents, stimulants, SARMs, diuretics and heavy metals.' },
      { id: 'bl-ts-11', type: 'text', text: '**Media contact:** Jessie Tobin, Director of Marketing, SportPharm — jessiet@sportpharm.com' }
    ] },

  /* ------------------------------------------------------------------ 22 Jun */
  { id: 'a-live-recovery', title: 'Recovery Isn’t One-Size-Fits-All: Routine, Sleep, and Choosing the Right Supplements',
    slug: 'recovery-isnt-one-size-fits-all', category: 'Recovery', series: 'athlete-hub',
    tags: ['recovery', 'sleep', 'supplements', 'hydration'], author: 'SportPharm',
    status: 'published', date: '2026-06-22', publishedAt: '2026-06-22T09:00:00.000Z', views: 0,
    image: 'https://i0.wp.com/sportpharm.com/wp-content/uploads/2026/06/rolling-out.jpeg',
    sourceUrl: 'https://sportpharm.com/recovery-isnt-one-size-fits-all-routine-sleep-and-choosing-the-right-supplements/',
    excerpt: 'Recovery isn’t built on a supplement stack; it’s built on consistent habits. What sports medicine professionals actually look at first.',
    checks: { otc: true, noleague: true, ftc: true, medical: true, sourced: true }, thread: [],
    blocks: [
      { id: 'bl-rv-1', type: 'text', text: 'Scroll through social media for five minutes, and you\'ll probably come across dozens of recovery recommendations. Ice baths, supplements, hydration products, energy drinks, recovery powders, sleep hacks, the list goes on. While some of these tools can be helpful, recovery isn\'t about following every trend that pops up on your feed.\n\nSports medicine professionals take a different approach. Instead of chasing quick fixes, they focus on helping athletes recover safely, effectively, and with purpose.' },
      { id: 'bl-rv-2', type: 'heading', level: 2, text: 'Recovery Starts with the Basics' },
      { id: 'bl-rv-3', type: 'text', text: 'Before talking about supplements, sports medicine professionals usually focus on the basics. Good sleep, staying hydrated, eating well, managing training, and handling stress all have a big impact on how well an athlete recovers.\n\nNo supplement can make up for poor sleep, bad nutrition, or not drinking enough water. This is often one of the biggest misconceptions athletes have today. Recovery isn\'t built on a supplement stack; it\'s built on consistent habits.\n\nIn a 2024 study, *Sleep Patterns During Pre-Competition Training Phase: A Comparison Between Male and Female Collegiate Swimmers*, swimmers who extended their sleep to 10 hours showed significant performance improvements — faster reaction times off diving blocks, improved turn times, increased kick strokes, and faster 15-metre sprints, alongside improved mood and decreased daytime fatigue.' },
      { id: 'bl-rv-4', type: 'heading', level: 2, text: 'The Myth That More Supplements Mean Better Results' },
      { id: 'bl-rv-5', type: 'text', text: 'Many athletes assume that if one supplement helps, then taking several must be even better. Unfortunately, recovery doesn\'t work that way. Every product should serve a specific purpose and align with an athlete\'s individual goals. The focus should always be on identifying the goal first.' },
      { id: 'bl-rv-6', type: 'list', ordered: false, items: [
        'Is the athlete trying to improve hydration?',
        'Support recovery after training?',
        'Maintain muscle during a heavy training block?'
      ] },
      { id: 'bl-rv-7', type: 'heading', level: 2, text: 'What Does a Sports Pharmacist Actually Do?' },
      { id: 'bl-rv-8', type: 'text', text: 'When people think of pharmacists, they often picture someone dispensing prescriptions at a counter. Sports pharmacists play a much broader role in athlete health and performance — evaluating supplements, reviewing potential interactions between medications and recovery products, spotting ingredients that could impact performance, and providing education on evidence-based recovery strategies. They work alongside athletic trainers, dietitians, physicians, and strength coaches.' },
      { id: 'bl-rv-9', type: 'quote', text: 'Recovery isn’t about chasing the next trend; it’s about alignment. Your training, nutrition, medications, and supplements should all work together to support your performance goals.', cite: 'Dr. Brandon K. Welch, Clinical Sports Pharmacist' },
      { id: 'bl-rv-10', type: 'heading', level: 2, text: 'Staying Hydrated During Training and Competition' },
      { id: 'bl-rv-11', type: 'text', text: 'Staying hydrated means more than just drinking water. Electrolytes are minerals that help regulate hydration, support muscle function, and keep nerve signals firing properly. Because athletes lose significant amounts of these minerals through sweat, particularly sodium and chloride, replacing them during and after exercise is essential.' },
      { id: 'bl-rv-12', type: 'quote', text: 'To some extent, plain water is not always the best — drinking too much water can dilute electrolytes, as it does not replace electrolytes lost through sweat. The goal is to maintain balance.', cite: 'Gabrielle Judd, M.S., R.D., C.I.S.S.N., Johns Hopkins Bayview Medical Center' },
      { id: 'bl-rv-13', type: 'heading', level: 2, text: 'Supporting Energy and Fighting Fatigue' },
      { id: 'bl-rv-14', type: 'text', text: 'When athletes start feeling run down, sports medicine professionals don\'t immediately reach for an energy supplement. The first questions are usually about sleep quality, nutrition, hydration, recovery habits, and overall training load.' },
      { id: 'bl-rv-15', type: 'quote', text: 'It’s important for everyone to make sure they’re getting enough nutrition to meet their body’s basic needs. But it’s even more important for people who exercise or lead very active lives.', cite: 'Olivia Morgan, RD, Mass General Brigham' },
      { id: 'bl-rv-16', type: 'heading', level: 2, text: 'Why Athletes Shouldn’t Self-Experiment' },
      { id: 'bl-rv-17', type: 'text', text: 'Social media can be a great source of ideas, but it rarely provides individualized guidance. Athletes may combine multiple products, miss overlapping ingredients, or use supplements to compensate for poor recovery habits. Before adding a new product, athletes should ask themselves a few important questions:' },
      { id: 'bl-rv-18', type: 'list', ordered: false, items: [
        'What is my goal?',
        'Is this product evidence-based?',
        'Is it third-party tested?',
        'Could it interact with medications I’m taking?',
        'Have I discussed it with a healthcare professional?'
      ] },
      { id: 'bl-rv-19', type: 'heading', level: 2, text: 'Recovery Is a Team Effort' },
      { id: 'bl-rv-20', type: 'text', text: 'Recovery isn\'t about chasing every new trend. It\'s about building a strong foundation through sleep, hydration, nutrition, stress management, and smart training habits. Once those pieces are in place, evidence-based tools can help support specific goals.\n\nRecovery begins with having the right team and tools. Reach out to SportPharm to see how a sports pharmacist can help your recovery plan.' },
      { id: 'bl-rv-21', type: 'disclaimer' }
    ] },

  /* ------------------------------------------------------------------ 04 Jun */
  { id: 'a-live-lacerations', title: 'Why Athletic Trainers Need to Be Ready for Cuts and Lacerations',
    slug: 'ready-for-cuts-and-lacerations', category: 'Medical', series: 'athlete-hub',
    tags: ['lacerations', 'wound care', 'athletic trainers', 'Rammer\'s Cut Cream'], author: 'SportPharm',
    status: 'published', date: '2026-06-04', publishedAt: '2026-06-04T09:00:00.000Z', views: 0,
    image: '',
    sourceUrl: 'https://sportpharm.com/why-athletic-trainers-need-to-be-ready-for-cuts-and-lacerations/',
    excerpt: 'About 1 in 8 NBA players get a facial injury each season. Facial wounds bleed heavily — and quick wound care keeps athletes safe and in the game.',
    checks: { otc: true, noleague: true, ftc: true, medical: true, sourced: true }, thread: [],
    blocks: [
      { id: 'bl-lc-1', type: 'heading', level: 2, text: 'Key Takeaways' },
      { id: 'bl-lc-2', type: 'list', ordered: false, items: [
        'Cuts and facial lacerations are common injuries in high-contact sports such as basketball and hockey.',
        'About 1 in 8 NBA players get a facial injury each season, and facial cuts are still some of the most common injuries treated in the NHL.',
        'Facial wounds tend to bleed heavily because the face has many blood vessels, so they require prompt attention and care.',
        'Quick wound care keeps athletes safe, lowers the risk of infection, and helps them spend less time out of the game.',
        'Rammer’s Cut Cream uses phenylephrine, lidocaine, and bacitracin to help stop bleeding, ease pain, and prevent bacteria in minor cuts and lacerations.'
      ] },
      { id: 'bl-lc-3', type: 'heading', level: 2, text: 'A Hidden Challenge of Contact Sports' },
      { id: 'bl-lc-4', type: 'text', text: 'In fast-paced, physical sports like basketball and hockey, injuries are bound to happen.\n\nFacial lacerations and soft tissue injuries are quite common in the NBA, accounting for roughly one-third of all facial trauma sustained by players. One study reported that 1 in 8 NBA players experience some form of facial injury each season, with accidental contact from elbows, collisions, and rebounding battles among the leading causes.\n\nSimilarly, facial lacerations are one of the most common injuries in the NHL, occurring at a rate of approximately 4.1 to 5.0 per 1,000 player-games.' },
      { id: 'bl-lc-5', type: 'heading', level: 2, text: 'What is Rammer’s Cut Cream, and how do its ingredients work together?' },
      { id: 'bl-lc-6', type: 'list', ordered: false, items: [
        'Phenylephrine is a vasoconstrictor that narrows blood vessels at the injury site, reducing localized bleeding and improving visibility for wound assessment.',
        'Lidocaine is a local anesthetic that numbs the affected area, allowing the wound to be cleaned and treated with greater comfort for the athlete.',
        'Bacitracin is a topical antibiotic that protects the wound from bacterial contamination — important where sweat, equipment and close contact increase exposure.'
      ] },
      { id: 'bl-lc-7', type: 'callout', tone: 'red', title: 'Minor wounds only',
        text: 'Rammer’s Cut Cream is only for minor, shallow wounds. Do not use it on deep cuts, puncture wounds, or wounds that bleed a lot. People allergic to any of its ingredients should avoid it. If you are unsure about treatment or the wound does not get better, always check with a medical professional.' },
      { id: 'bl-lc-8', type: 'heading', level: 2, text: 'Why do facial cuts bleed so much?' },
      { id: 'bl-lc-9', type: 'text', text: 'The face has an exceptionally rich network of small blood vessels just beneath the skin\'s surface. Even a minor cut can result in surprisingly heavy bleeding compared to injuries elsewhere on the body, and the bleeding can quickly obscure vision.\n\nProfessional leagues maintain strict protocols regarding bleeding injuries: athletes with active bleeding or visible blood on their body, uniform, or equipment must leave the playing area until the bleeding is controlled and the wound is properly treated and covered.' },
      { id: 'bl-lc-10', type: 'heading', level: 2, text: 'When does a cut need stitches or more medical care?' },
      { id: 'bl-lc-11', type: 'text', text: 'A small, shallow cut that stops bleeding quickly and has wound edges that stay together can often be treated with a topical product. A player might need stitches or more medical help if the bleeding does not stop, the cut is deep, the wound is wide open, or you can see fat or muscle. Cuts near sensitive areas like the eye need extra care and should be checked by a doctor right away.' },
      { id: 'bl-lc-12', type: 'heading', level: 2, text: 'Be Ready Before the Injury Happens' },
      { id: 'bl-lc-13', type: 'text', text: 'For athletic trainers and sports medicine staff, being ready before an injury happens is just as important as treating it. SportPharm offers emergency medications and sports medicine products to help athletic trainers, team doctors, and sports medicine staff stay ready. Contact SportPharm at info@sportpharm.com.' },
      { id: 'bl-lc-14', type: 'disclaimer' }
    ] },

  /* ------------------------------------------------------------------ 21 May */
  { id: 'a-live-sideline', title: 'Sideline Ready: A Pharmacist’s Guide to Emergency Medication Preparedness in Sports Medicine',
    slug: 'sideline-ready-emergency-medication-preparedness', category: 'Medical', series: 'athlete-hub',
    tags: ['sideline ready', 'emergency medication', 'compliance', 'athletic trainers'], author: 'SportPharm',
    status: 'published', date: '2026-05-21', publishedAt: '2026-05-21T09:00:00.000Z', views: 0,
    image: '',
    sourceUrl: 'https://sportpharm.com/sideline-ready-a-pharmacists-guide-to-emergency-medication-preparedness-in-sports-medicine/',
    excerpt: 'Emergency medications are essential for athlete safety. Programs with immediate access and organized workflows respond faster — and stay compliant.',
    checks: { otc: true, noleague: true, ftc: true, medical: true, sourced: true }, thread: [],
    blocks: [
      { id: 'bl-sr-1', type: 'heading', level: 2, text: 'Key Takeaways' },
      { id: 'bl-sr-2', type: 'list', ordered: false, items: [
        'Emergency medications are essential for athlete safety and effective emergency preparedness.',
        'Programs with immediate access to medication and organized workflows can respond more quickly and effectively.',
        'Proper storage, labeling, documentation, and compliance reduce risks for athletes and staff.',
        'Standardized emergency medication systems increase efficiency during practices, games, tournaments, and travel.',
        'SportPharm provides integrated support including emergency medication supply, dispensing systems, compounded products, and clinical guidance.'
      ] },
      { id: 'bl-sr-3', type: 'heading', level: 2, text: 'Why it matters' },
      { id: 'bl-sr-4', type: 'text', text: 'Sports and recreational injuries account for 2.5 to 3 million emergency department visits annually in the United States. These injuries represent about 20% of all injury-related ER visits for children and adolescents, with sprains, strains, fractures, and concussions being most common.\n\nHaving consistent emergency protocols in place — whether for high school, college, professional, or club sports — helps ensure athletes receive the care they need quickly and effectively.' },
      { id: 'bl-sr-5', type: 'heading', level: 2, text: 'The Reality of Sports Medicine' },
      { id: 'bl-sr-6', type: 'text', text: 'Sports medicine differs from traditional clinical practice. It requires managing high-risk, time-sensitive emergencies in unpredictable settings with limited resources and no immediate access to a pharmacy.' },
      { id: 'bl-sr-7', type: 'list', ordered: false, items: [
        'Asthma attacks: exercise-induced bronchospasm affects an estimated 10–50% of elite athletes. Rescue inhalers must be current and accessible, not locked away.',
        'Anaphylaxis: severe allergic reactions can progress to cardiovascular collapse within minutes. Epinephrine auto-injectors must be immediately accessible.',
        'Heat illness and dehydration: exertional heat stroke is a leading cause of death among young athletes.',
        'Acute pain and inflammatory conditions: timely access to appropriate analgesics helps prevent unsafe self-medication.',
        'Cardiac emergencies: AED access, aspirin, epinephrine, and coordinated emergency response planning are essential.',
        'Diabetic emergencies: glucagon, oral glucose, and insulin must be accessible and properly stored.'
      ] },
      { id: 'bl-sr-8', type: 'heading', level: 2, text: 'Why Immediate Access Matters' },
      { id: 'bl-sr-9', type: 'text', text: 'Even brief delays in administering epinephrine during anaphylaxis increase mortality risk. Albuterol is most effective when administered at the onset of bronchospasm. Exertional heat stroke has a near-zero mortality rate when cooling begins within 30 minutes. In cardiac arrest, every minute without intervention drops survival by 7–10%.\n\nPharmacokinetics in athlete populations can also differ from the general population due to higher cardiac output, altered body composition and variable hydration status — all of which can affect drug performance.' },
      { id: 'bl-sr-10', type: 'heading', level: 2, text: 'Compliance & Proper Medication Management' },
      { id: 'bl-sr-11', type: 'list', ordered: false, items: [
        'Labeling and dispensing: every medication in a training room or travel kit must be properly labeled per state and federal pharmacy laws.',
        'Storage: temperature-sensitive medications require monitored storage. Excessive heat degrades effectiveness.',
        'Expiration tracking: expired epinephrine auto-injectors are frequently identified during sports medicine audits.',
        'Documentation: what, when, how much, by whom, under whose authority.',
        'State-specific regulations: what’s compliant in Texas may not be compliant in Ohio.',
        'Physician oversight: standing orders or collaborative practice agreements must be current, signed, and specific.'
      ] },
      { id: 'bl-sr-12', type: 'heading', level: 2, text: 'Travel & Away Game Challenges' },
      { id: 'bl-sr-13', type: 'text', text: 'Teams on the road may be hours from a pharmacy, in a different state with different regulations, or in a venue with zero medical infrastructure. A standing order valid in your home state may not be recognized elsewhere.\n\nOrganized, standardized travel medication kits are the solution — pre-built, inventoried, compliant, and tailored to the sport, the roster\'s medical needs, and the destination.' },
      { id: 'bl-sr-14', type: 'heading', level: 2, text: 'Building a Prepared Program' },
      { id: 'bl-sr-15', type: 'list', ordered: true, items: [
        'Conduct a medication and emergency readiness audit.',
        'Establish standardized emergency kits, built to a formulary and checked on a schedule.',
        'Implement compliant dispensing processes so every medication is documented, authorized and traceable.',
        'Partner with experienced sports medicine pharmacy providers.',
        'Review protocols and inventory regularly — preseason, midseason, postseason, and after any critical incident.'
      ] },
      { id: 'bl-sr-16', type: 'text', text: 'To learn more, visit sportpharm.com or reach out to info@sportpharm.com.' },
      { id: 'bl-sr-17', type: 'disclaimer' }
    ] },

  /* ------------------------------------------------------------------ 07 May */
  { id: 'a-live-summer', title: '5 Essential Summer Pain Management Tips',
    slug: '5-essential-summer-pain-management-tips', category: 'Pain Relief', series: 'athlete-hub',
    tags: ['summer', 'hydration', 'heat', 'IcetraRub', 'menthol'], author: 'SportPharm',
    status: 'published', date: '2026-05-07', publishedAt: '2026-05-07T09:00:00.000Z', views: 0,
    image: 'https://i0.wp.com/sportpharm.com/wp-content/uploads/2026/04/icetrarub.png',
    sourceUrl: 'https://sportpharm.com/5-essential-summer-pain-management-tips/',
    excerpt: 'Heat, dehydration and repetitive movement all add stress. Five strategies to manage pain, support recovery and stay consistent through the season.',
    checks: { otc: true, noleague: true, ftc: true, medical: true, sourced: true }, thread: [],
    blocks: [
      { id: 'bl-su-1', type: 'text', text: 'Summer brings increased activity, longer days, and more time outdoors, but also adds stress to the body. Heat, dehydration, and repetitive movement cause muscle soreness, joint discomfort, and inflammation.\n\nAdjusting your recovery routine for summer can make a meaningful difference in how you feel each day. Below are five essential strategies.' },
      { id: 'bl-su-2', type: 'heading', level: 2, text: '1. Prioritize Hydration' },
      { id: 'bl-su-3', type: 'text', text: 'Hydration plays a critical role in muscle function, recovery, and performance. A general guideline is 9–13 cups of water per day, though activity, heat exposure, body weight, and sweat level may require more.\n\nSwimmers, for example, typically sweat between 300ml and over 1 litre per hour — often losing roughly 500–700ml in a standard one-hour session. Common signs of dehydration:' },
      { id: 'bl-su-4', type: 'list', ordered: false, items: ['Dry mouth', 'Fatigue', 'Dizziness', 'Dark-coloured urine'] },
      { id: 'bl-su-5', type: 'heading', level: 2, text: '2. Adjust Activity for Heat and Intensity' },
      { id: 'bl-su-6', type: 'list', ordered: false, items: [
        'Training in the early morning or evening',
        'Incorporating lower-impact activities such as swimming or walking',
        'Allowing flexibility in intensity on particularly hot days',
        'Working out inside a few days a week'
      ] },
      { id: 'bl-su-7', type: 'callout', tone: 'red', title: 'Heat stroke',
        text: 'Heat stroke occurs when core body temperature reaches 104°F+ (40°C) and can cause organ failure or death. Coaches and athletic trainers should avoid overworking athletes in extreme heat.' },
      { id: 'bl-su-8', type: 'heading', level: 2, text: '3. Incorporate Cooling Strategies' },
      { id: 'bl-su-9', type: 'text', text: 'In summer, recovery often benefits from a cooling approach rather than heat. Topical menthol provides a cooling sensation by altering blood flow to the skin, and can reduce sweat rates in athletes. In one study, this effect increased running performance in hot and humid climates by up to 6%.\n\nResearchers in Scotland compared a topical menthol gel, a placebo gel, and ice across 20 healthy men. The menthol gel increased blood flow near the skin while lowering both skin and muscle temperature, and created a cooling sensation lasting up to 80 minutes — longer than either ice or the placebo.' },
      { id: 'bl-su-10', type: 'product', productId: 'icetrarub', note: 'SportPharm’s 16% menthol rub — a strong cooling sensation for targeted areas after activity, and a practical option in warmer conditions.' },
      { id: 'bl-su-11', type: 'heading', level: 2, text: '4. Maintain a Cool Environment' },
      { id: 'bl-su-12', type: 'list', ordered: false, items: [
        'Using air conditioning or fans',
        'Taking breaks indoors after prolonged outdoor activity',
        'Allowing the body to cool down before resuming activity',
        'Wearing lightweight, breathable clothing',
        'Using cooling towels, cold showers, or ice packs after training',
        'Keeping bedrooms cool at night to support better sleep and recovery'
      ] },
      { id: 'bl-su-13', type: 'heading', level: 2, text: '5. Build Recovery into Your Routine' },
      { id: 'bl-su-14', type: 'text', text: 'Consistent recovery is essential for long-term performance and injury prevention. For most people, scheduling at least one rest day per week is a simple and effective way to reduce overuse. Incorporating lower-intensity practices like stretching, walking, or yoga supports both physical and mental recovery.' },
      { id: 'bl-su-15', type: 'heading', level: 2, text: 'Ice and Heat Therapy: A Practical Approach' },
      { id: 'bl-su-16', type: 'text', text: '**Cold therapy**, including ice and cooling topicals, is most effective when applied immediately post-workout to reduce inflammation and discomfort, or later in the day if soreness or swelling develops.\n\n**Heat therapy** may be beneficial for general muscle relaxation. Heat usually fits better when the area feels tight, stiff, achy or restricted, but not visibly swollen.\n\nAs a rule of thumb: cold after activity or injury to reduce swelling and discomfort, heat for stiffness or muscle relaxation.' },
      { id: 'bl-su-17', type: 'disclaimer' }
    ] },

  /* ------------------------------------------------------------------ 31 Mar */
  { id: 'a-live-nba', title: 'From Injury to Game-Ready: NBA Recovery Strategies and the Power of Compounded Topicals',
    slug: 'nba-recovery-strategies-compounded-topicals', category: 'Pain Relief', series: 'athlete-hub',
    tags: ['NBA', 'compounded topicals', 'ketoprofen', 'recovery'],
    author: 'Reviewed and approved by Brandon K. Welch, PharmD, President of SportPharm',
    status: 'published', date: '2026-03-31', publishedAt: '2026-03-31T09:00:00.000Z', views: 0,
    image: 'https://i0.wp.com/sportpharm.com/wp-content/uploads/2026/03/image-1.png',
    sourceUrl: 'https://sportpharm.com/nba-recovery-strategies-and-the-power-of-compounded-topicals/',
    excerpt: 'The NBA has between 1,500 and almost 1,900 reported injuries each year. How sports medicine teams are managing three of the league’s highest-profile cases.',
    checks: { otc: true, noleague: true, ftc: true, medical: true, sourced: true }, thread: [],
    blocks: [
      { id: 'bl-nb-1', type: 'text', text: 'The NBA has been swept up in its own kind of March Madness.\n\nAs of late March 2026, several major NBA players are dealing with significant injuries, with some ruled out for the rest of the 2025-26 season. Key injuries include Lakers star LeBron James (elbow contusion and left foot arthritis), Memphis\'s Ja Morant (UCL sprain in the left elbow), and Philadelphia\'s Joel Embiid, who has missed extensive time with an oblique injury.\n\nAccording to a study from the National Library of Medicine, the NBA has between 1,500 and almost 1,900 reported injuries each year, and injury rates are often higher than 19 for every 1,000 times a player is on the court.' },
      { id: 'bl-nb-2', type: 'heading', level: 2, text: 'Lakers — LeBron James' },
      { id: 'bl-nb-3', type: 'text', text: 'During a March 18th game against the Houston Rockets, the 41-year-old charged down the court in the final quarter for a layup. Moments later, Rockets standout Jabari Smith Jr. tangled arms with LeBron, toppling him to the floor, where he grabbed his elbow in visible pain.' },
      { id: 'bl-nb-4', type: 'list', ordered: false, items: [
        'Left elbow injury: sustained against the Nuggets in early March, requiring in-game treatment and ongoing icing.',
        'Left foot arthritis: a persistent issue since January. Common treatments include supportive footwear with stiff soles, custom orthotics, low-impact exercise, and NSAIDs.',
        'Right sciatica/hip: severe nerve pain and later a hip contusion, typically managed with rest, anti-inflammatory medications, and physical therapy.'
      ] },
      { id: 'bl-nb-5', type: 'text', text: 'For acute inflammatory injuries such as an elbow sprain or hip contusion, topical NSAIDs (e.g. ketoprofen-based formulations) can deliver anti-inflammatory effects directly to the affected tissue. In the case of a hip contusion, topical anesthetics such as lidocaine may also provide short-term pain relief by reducing local nerve signaling.' },
      { id: 'bl-nb-6', type: 'heading', level: 2, text: 'Grizzlies — Ja Morant' },
      { id: 'bl-nb-7', type: 'text', text: 'During a close game against the Boston Celtics on March 20th, Ja Morant drove into the lane for a tough shot. When he landed, he bumped into Jayson Tatum, twisting his left arm awkwardly.\n\nOn March 24, 2026, the Grizzlies announced Morant would miss the rest of the season. Imaging showed a partial UCL sprain requiring a platelet-rich plasma (PRP) injection.\n\nIn acute inflammatory phases, topical NSAID formulations — particularly ketoprofen — can be advantageous due to their strong anti-inflammatory effects and favourable tissue penetration, allowing higher local concentrations at the site of injury.' },
      { id: 'bl-nb-8', type: 'heading', level: 2, text: 'Philadelphia — Joel Embiid' },
      { id: 'bl-nb-9', type: 'text', text: 'After missing 13 games, Joel Embiid returned following recovery from a right oblique injury. In February, doctors initially thought he would miss only three games; his absence stretched much longer.' },
      { id: 'bl-nb-10', type: 'quote', text: 'My knees haven’t been an issue for a long time. That’s past me. The oblique was very tricky, and it still is tricky. Really, nothing you can do about it, gotta let it ride and hope it doesn’t get worse.', cite: 'Joel Embiid' },
      { id: 'bl-nb-11', type: 'text', text: 'Compounded topicals formulated with a Lipoderm base may provide added value by enhancing the penetration of active ingredients into deeper periarticular structures — particularly important in larger joints like the knee, where tissue depth can limit the effectiveness of standard topicals.' },
      { id: 'bl-nb-12', type: 'heading', level: 2, text: 'Take-Aways' },
      { id: 'bl-nb-13', type: 'text', text: 'Across the league, injuries like these highlight how critical sports medicine teams are in keeping athletes performing at the highest level. Recovery is not only about returning players to the court but also ensuring it is done safely, efficiently, and sustainably.\n\nSportPharm specializes in custom-compounded topical therapies designed for the unique needs of athletes and active individuals. Reach out at info@sportpharm.com.' },
      { id: 'bl-nb-14', type: 'disclaimer' }
    ] },

  /* ------------------------------------------------------------------ 26 Feb */
  { id: 'a-live-antiinflam', title: 'A More Targeted Approach to Anti-Inflammatory Care',
    slug: 'targeted-approach-anti-inflammatory-care', category: 'Pain Relief', series: 'athlete-hub',
    tags: ['inflammation', 'NSAIDs', 'ketoprofen', 'transdermal', 'compounding'], author: 'SportPharm',
    status: 'published', date: '2026-02-26', publishedAt: '2026-02-26T09:00:00.000Z', views: 0,
    image: '',
    sourceUrl: 'https://sportpharm.com/a-more-targeted-approach-to-anti-inflammatory-care/',
    excerpt: 'Inflammation is not the enemy; it is a natural signal. Anti-inflammatory compounds should no longer be viewed as blunt tools.',
    checks: { otc: true, noleague: true, ftc: true, medical: true, sourced: true }, thread: [],
    blocks: [
      { id: 'bl-ai-1', type: 'text', text: 'Inflammation is not the enemy; it is a natural signal. It initiates tissue repair, adaptation, and recovery. But when inflammation becomes excessive, prolonged, or dysregulated, it contributes to pain, functional limitation, and delayed return to play.\n\nTo implement this effectively, it is necessary to evaluate not only the properties of each anti-inflammatory compound but also the context in which it is used.' },
      { id: 'bl-ai-2', type: 'heading', level: 2, text: 'The Inflammatory Cascade in Musculoskeletal Injury' },
      { id: 'bl-ai-3', type: 'text', text: 'After tissue damage, the body releases inflammatory mediators such as histamine, bradykinin, and prostaglandins, which cause redness, heat, pain, and swelling by vasodilating blood vessels and increasing vascular permeability.' },
      { id: 'bl-ai-4', type: 'list', ordered: false, items: [
        '**Histamine** — stimulates vasodilation and increases blood vessel permeability.',
        '**Prostaglandins** — cause pain and increase vascular permeability.',
        '**Bradykinin** — causes pain and stimulates inflammation.'
      ] },
      { id: 'bl-ai-5', type: 'text', text: 'These mediators boost vascular permeability and recruit immune cells. While helpful acutely, persistent elevation leads to chronic pain and impaired healing. The goal is a precise, pathway-specific intervention.' },
      { id: 'bl-ai-6', type: 'heading', level: 2, text: 'Anti-Inflammatory Compounds' },
      { id: 'bl-ai-7', type: 'text', text: 'NSAIDs are a widely used class of medications, including aspirin, ibuprofen and naproxen, that reduce pain, fever, and inflammation by inhibiting COX enzymes. Systemic NSAIDs are effective for short-term pain management but carry known risks:' },
      { id: 'bl-ai-8', type: 'list', ordered: false, items: [
        'Gastrointestinal irritation and bleeding',
        'Renal stress, especially in dehydrated athletes',
        'Cardiovascular risk',
        'Potential impairment of tissue healing with prolonged use'
      ] },
      { id: 'bl-ai-9', type: 'text', text: 'Topical and transdermal NSAIDs offer a more targeted approach. Transdermal ketoprofen provides potent COX inhibition with favourable tissue penetration when applied locally. For clinicians managing tendinopathies, overuse injuries, and localized joint inflammation, this delivery method allows site-specific anti-inflammatory effects while minimizing systemic exposure.' },
      { id: 'bl-ai-10', type: 'heading', level: 2, text: 'Choosing the Right Base for Topical Compounds' },
      { id: 'bl-ai-11', type: 'text', text: 'The base selected in a topical formulation does more than simply "hold" the active ingredient; it fundamentally influences how well the drug penetrates the skin, reaches underlying tissues, and ultimately achieves a therapeutic effect at the site of injury.\n\nIn comparative permeation studies using human skin models, ketoprofen formulated in a phospholipid-based vehicle like Lipoderm demonstrated greater overall absorption and a faster rate of penetration than when compounded in more basic vehicles such as pluronic lecithin organogel (PLO).' },
      { id: 'bl-ai-12', type: 'heading', level: 2, text: 'The Modern Sports Pharmacy Perspective' },
      { id: 'bl-ai-13', type: 'text', text: 'Athlete care entails balancing pain control, tissue healing, adaptation, regulatory compliance, and long-term safety. Anti-inflammatory compounds should no longer be viewed as blunt tools. When applied with an understanding of mechanism, timing, and delivery system, they become instruments of targeted modulation that support recovery without compromising adaptation.\n\nAt SportPharm, our approach centers on evidence-driven formulation, responsible medication use, and delivery strategies that align with both athlete safety and performance goals.' },
      { id: 'bl-ai-14', type: 'disclaimer' }
    ] },

  /* ------------------------------------------------------------------ 05 Feb */
  { id: 'a-live-dispensing', title: 'The In-House Pharmacy Dispensing Playbook: Best Practices for Compliant, Cost-Effective Medication Management',
    slug: 'in-house-pharmacy-dispensing-playbook', category: 'Sports Pharmacy', series: 'athlete-hub',
    tags: ['dispensing', 'compliance', 'labeling', 'storage'], author: 'SportPharm',
    status: 'published', date: '2026-02-05', publishedAt: '2026-02-05T09:00:00.000Z', views: 0,
    image: '',
    sourceUrl: 'https://sportpharm.com/the-in-house-pharmacy-dispensing-playbook-best-practices-for-compliant-cost-effective-medication-management/',
    excerpt: 'Medication storage may seem straightforward in the athletic training medical office, yet it remains one of the most common areas where compliance issues arise.',
    checks: { otc: true, noleague: true, ftc: true, medical: true, sourced: true }, thread: [],
    blocks: [
      { id: 'bl-dp-1', type: 'text', text: 'Medication storage and management may seem straightforward in the athletic training medical office, yet it remains one of the most common areas where compliance issues could arise.' },
      { id: 'bl-dp-2', type: 'heading', level: 2, text: 'Essential Best Practices for Medication Storage and Labeling' },
      { id: 'bl-dp-3', type: 'list', ordered: false, items: [
        '**Original containers only** — keep medications in their original containers, as provided by the manufacturer or repackager. These should not come in vials.',
        '**Tamper-evident, sealed packaging** — medications must be received and maintained in tamper-evident, sealed packaging to ensure product integrity.',
        '**Labeling requirements** — each container must clearly display the drug name, strength, lot number, and expiration date. When dispensing to a patient, a pharmacy-generated label should include the patient’s name, NDC, prescribing physician, prescription number, directions for use, and quantity dispensed.',
        '**No team-specific labeling** — medications should not display a team name or organization. Labels must follow pharmacy standards.',
        '**Segregation and expiration** — expired or recalled medications should be immediately removed from active inventory and stored separately.'
      ] },
      { id: 'bl-dp-4', type: 'heading', level: 2, text: 'High-Risk Indicators When Working With a Pharmacy Partner' },
      { id: 'bl-dp-5', type: 'callout', tone: 'amber', title: 'Be cautious if any of the following apply',
        text: 'Medications arrive in vials with team- or organization-specific labeling rather than tamper-evident, vacuum-sealed, unit-of-use repackaging. You are not provided with a label printer and dispensing software to generate pharmacy-regulated, patient-specific labels. Medications arrive without vacuum-sealed or tamper-evident packaging, increasing the risk of product adulteration or inventory discrepancies.' },
      { id: 'bl-dp-6', type: 'heading', level: 2, text: 'Injury Patterns & Localized Treatment in Soccer' },
      { id: 'bl-dp-7', type: 'text', text: 'Soccer presents a distinct injury profile driven by high training volume, repetitive sprinting, cutting, and frequent contact. As a ground-based sport, the majority of injuries involve the lower extremities.\n\nMuscle cramps and persistent tightness, particularly in the calves and hamstrings, are common during congested match schedules and travel. Hamstring and ankle strains remain among the most frequent causes of missed time, often requiring ongoing localized management rather than one-time intervention.\n\nBecause many of these conditions are managed over time, localized treatment options play an important role in daily care plans. For in-house medical rooms, ensuring these therapies are sourced, stored, and dispensed through compliant pharmacy channels helps maintain consistency, documentation, and regulatory alignment.' },
      { id: 'bl-dp-8', type: 'heading', level: 2, text: 'Pricing Transparency' },
      { id: 'bl-dp-9', type: 'text', text: 'As part of our commitment to compliance and responsible medication management, we shop multiple wholesalers to efficiently and responsibly source medications. This approach allows us to offer competitive pricing while maintaining pharmacy oversight and regulatory standards.' },
      { id: 'bl-dp-10', type: 'text', text: 'For pricing and onboarding: Julia Mollick, National Sales Director — juliam@sportpharm.com\n\nFor compliance questions: Brandon Welch, President and Pharmacist — brandonw@sportpharm.com' },
      { id: 'bl-dp-11', type: 'disclaimer' }
    ] }
];
