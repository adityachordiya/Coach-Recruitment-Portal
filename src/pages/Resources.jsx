import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../lib/AuthContext';

const SECTIONS = [
  { id: 'about',      label: 'About Ascend' },
  { id: 'programs',   label: 'Every Camp Counts' },
  { id: 'different',  label: 'What Makes Us Different' },
  { id: 'strategy',   label: 'Recruiting Strategy' },
  { id: 'scripts',    label: 'Sample Scripts' },
  { id: 'objections', label: 'Handling Objections' },
  { id: 'messages',   label: 'Core Messages' },
  { id: 'pricing',    label: 'Pricing' },
  { id: 'financial',  label: 'Financial Aid' },
  { id: 'safety',     label: 'Safety' },
  { id: 'logistics',  label: 'Logistics & Policies' },
  { id: 'faq',        label: 'FAQ' },
];

const CALENDLY = 'https://calendly.com/ascend-info/info-call';

// What coaches hear most, and an honest answer to each. Facts from
// ascendspeech.org (2027 season); no aid amounts, those are Ascend's to quote.
const OBJECTIONS = [
  { heard: 'It\'s too expensive.', say: 'Lead with the $50 your code saves, then the cheaper ways in: the 1-week commuter is $1,999.99 and Ascend Online starts at $699.99. The two-summer package works out to about $3,250 a summer. If cost is a real barrier, financial aid is available and nobody with genuine need has been turned away; send the family to info@ascendspeech.org. Never quote an aid amount yourself.' },
  { heard: 'I\'m new. I\'m not good enough yet.', say: 'Ascend places every student in one of four labs by level, from first speech to national circuit, and every student works with every coach. There is a Novice track at both California and Florida. Many of the most improved campers started with little experience.' },
  { heard: 'California is too far.', say: 'Over 60% of Ascend California students come from outside California. Sacramento (SMF) has direct flights from dozens of cities, and a $60 shuttle runs from the airport on arrival day. East Coast families can do Ascend Florida at Lynn University, June 25 – July 9, and anyone can do Ascend Online.' },
  { heard: 'Is it safe? Who watches the kids?', say: 'Students are supervised around the clock with nightly room checks, have 24/7 access to a medical authority alongside the university\'s public safety department, and all staff are background checked. Offer the parent a call with Ascend for anything more specific.' },
  { heard: 'We have a conflict this summer.', say: 'The 1-week options run July 11–18, so half the summer stays free. If plans change after registering, families can defer to the next summer by May 31 (there are no refunds), which takes the risk out of registering early.' },
  { heard: 'My parents need to be convinced.', say: 'Send the parent message from Sample Scripts, or have the family book a short call with the Ascend team (https://calendly.com/ascend-info/info-call). Parents decide, and a call answers their questions better than a forwarded text.' },
];

export default function Resources() {
  const { user } = useAuth();
  const code = user?.referral_code || 'YOURNAME50';
  const [active, setActive] = useState('about');

  function scrollTo(id) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <Layout>
      <div className="mb-6">
        <p className="eyebrow text-crimson">Playbook</p>
        <h1 className="font-display text-3xl font-semibold text-ink tracking-tight mt-1">Recruiting playbook</h1>
        <p className="text-ink-muted text-sm mt-1">Ascend California 2027 · Everything you need to recruit successfully.</p>
      </div>

      {/* Referral Code Banner */}
      <div className="relative overflow-hidden bg-ink rounded-2xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 shadow-lift">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(90% 120% at 100% 0%, rgba(189,31,46,0.55) 0%, rgba(189,31,46,0) 60%)' }} />
        <div>
          <div className="relative">
          <p className="text-white/50 text-[11px] font-semibold uppercase tracking-[0.1em] mb-1">Your referral code</p>
          <p className="text-white text-3xl font-bold font-mono tracking-[0.14em]">{code}</p>
          <p className="text-white/65 text-sm mt-1">Share this with every student you recruit. They get $50 off, you get full credit.</p>
          </div>
        </div>
        <div className="relative flex flex-col gap-1.5 text-sm text-white/80 shrink-0">
          <span>✓ Students save $50 at registration</span>
          <span>✓ You get credit even if leadership closes</span>
          <span>✓ No code = no credit — always share it</span>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        {/* Sticky sidebar nav */}
        <aside className="hidden lg:block w-48 shrink-0 sticky top-20">
          <nav className="flex flex-col gap-0.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  active === s.id
                    ? 'bg-white text-ink font-semibold shadow-card border-l-2 border-crimson rounded-l-none'
                    : 'text-ink-muted hover:text-ink hover:bg-white/70'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-10">

          {/* About */}
          <Section id="about" title="About Ascend California">
            <p className="text-gray-600 leading-relaxed">
              Ascend California is the premier Congressional Debate summer camp in the country. Every single winner
              of the Tournament of Champions in Congressional Debate this decade has been part of Team Ascend.
              No other camp comes close to this level of success — and that track record is your single most
              powerful recruiting tool.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              As a coach, your reputation is tied to the quality of training you point your students toward. Ascend
              is the place where you can be confident that students come back transformed: better speakers, sharper
              thinkers, and better competitors.
            </p>
            <p className="text-gray-600 leading-relaxed mt-3">
              Beyond camp, Ascend offers two school-year coaching programs: <strong>Ascend Academy</strong> (free year-round
              group coaching) and <strong>Sandel Academy</strong> (private one-on-one coaching with the best coaches in the
              country). Ascend Academy runs September through June, so student growth continues long after camp ends.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: '📍', label: 'Location', value: 'University of the Pacific, Stockton, CA' },
                { icon: '📅', label: 'Dates', value: 'July 11–25, 2027 (1-week options July 11–18)' },
                { icon: '✈️', label: 'Nearest Airport', value: 'Sacramento International (SMF) — campus transport available' },
                { icon: '🎓', label: 'Target Grade', value: 'Entering 6th–12th grade in fall 2027' },
                { icon: '📚', label: 'Post-Camp', value: 'Free Ascend Academy group coaching September–June, every year until high school graduation' },
                { icon: '💰', label: 'Financial Aid', value: 'Available for students with demonstrated need — no one turned away' },
              ].map((item) => (
                <div key={item.label} className="bg-white border border-black/[0.07] rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm text-gray-700 mt-0.5">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Every camp counts */}
          <Section id="programs" title="Every Camp Counts">
            <p className="text-gray-600 mb-5">
              Your code works on every Ascend summer program, and you get credit for each one. Last season, coach codes brought in
              students for California, Florida and Online. If a student can't make California, point them to the camp that fits.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { name: 'Ascend California', tag: 'Flagship', when: 'July 11–25, 2027', where: 'University of the Pacific, Stockton CA', price: 'From $1,999.99', note: 'The most Congress coaches of any camp. 1- and 2-week, residential or commuter, plus a Novice track.' },
                { name: 'Ascend Florida', tag: 'East Coast', when: 'June 25 – July 9, 2027', where: 'Lynn University, South Florida', price: 'Same packages as California', note: 'The same curriculum and coaching, closer to home for East Coast families. Novice track too.' },
                { name: 'Ascend Online', tag: 'From anywhere', when: 'June 26 – July 10, 2027', where: 'Online', price: '1 week $699.99 · 2 weeks $999.99', note: 'For students who can\'t travel. In person is still the stronger experience when it\'s possible.' },
              ].map((c) => (
                <div key={c.name} className="card p-4 flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-lg font-semibold text-ink">{c.name}</p>
                    <span className="badge bg-navy-50 text-navy ring-navy-100">{c.tag}</span>
                  </div>
                  <p className="text-sm font-semibold text-ink mt-2">{c.when}</p>
                  <p className="text-xs text-ink-muted">{c.where}</p>
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed flex-1">{c.note}</p>
                  <p className="text-sm font-semibold text-crimson mt-3">{c.price}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Dates and prices from ascendspeech.org. Families register at ascendspeech.org/ascend-store with your code.</p>
          </Section>

          {/* What Makes Us Different */}
          <Section id="different" title="What Makes Ascend Different">
            <p className="text-gray-600 mb-5">When you're recruiting, you need to answer the question: <em>why Ascend?</em></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: '🏆', title: 'Unmatched Track Record', desc: 'Every TOC Congress champion this decade has been part of Team Ascend: Rohit Jhawar (2020), Andrew Sun (2021), Anish Beeram (2022), Tyler Luu (2023), Fadhil Lawal (2024), Swathi Bodduluri (2025) and Serena Guo (2026).' },
                { icon: '🧑‍🏫', title: 'Top-Tier Coaches', desc: 'Champions and coaches of champions from across the country — diverse perspectives for every level of student.' },
                { icon: '🎬', title: 'Daily Mock Rounds', desc: 'At least one (sometimes two) mock rounds daily in a tournament-like setting, with feedback tied directly to what\'s being taught.' },
                { icon: '📚', title: 'Year-Round Learning', desc: 'Free Ascend Academy group coaching runs September through June, every year until high school graduation. Sandel Academy (by application) offers private coaching during the school year.' },
                { icon: '🤝', title: 'Individualized Coaching', desc: 'Coaches take a personalized approach to each student\'s growth through the Quest 4 Success curriculum, and the 1-on-1 package adds dedicated private sessions (limited to 10 students).' },
                { icon: '🗺️', title: 'Regional Specialization', desc: 'Coaches from across the country ensure success on both the national circuit and in local leagues, wherever a student competes.' },
                { icon: '🛡️', title: 'Safety First', desc: 'Constant supervision, nightly room checks, 24/7 access to a medical authority and background-checked staff.' },
                { icon: '📋', title: 'Tailored Curriculum', desc: 'Curriculum is tailored to each student based on their lab placement, so every student works on what matters most for their development.' },
                { icon: '🌎', title: 'National Community', desc: 'Ascend is the largest Congressional Debate community in the country, with students competing together all year long.' },
              ].map((item) => (
                <div key={item.title} className="card p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{item.title}</p>
                      <p className="text-gray-500 text-sm mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Recruiting Strategy */}
          <Section id="strategy" title="Your Three-Track Recruiting Strategy">
            <p className="text-gray-600 mb-6">Recruiting works best when you start with your warmest relationships and expand outward. Think of it as three concentric circles.</p>
            <div className="space-y-5">

              <TrackCard
                number="1"
                title="Your School Team"
                subtitle="Warmest leads — highest conversion rate"
                color="bg-white border-black/[0.07] shadow-card"
                numberColor="bg-crimson"
                why={[
                  'Younger and newer teammates see you as a mentor — your recommendation carries more weight than any advertisement.',
                  'Peers respect your judgment and experience on the circuit — a genuine nudge from you lands differently than a flyer.',
                  'You can speak honestly about what Ascend is like and why you\'re going back — that authenticity converts.',
                ]}
                how={[
                  'Have individual conversations — a personal invitation means far more than a group message.',
                  'For younger or newer debaters, frame it as mentorship: you want to see them grow, and this is the best place for that.',
                  'Emphasize what they learn at camp carries into the entire fall season — and free Ascend Academy keeps momentum going all year.',
                  `Remind them to use your referral code (${code}) at registration — they'll get $50 off.`,
                  'If cost comes up, let them know financial aid is available — they can reach out to Ascend directly.',
                ]}
              />

              <TrackCard
                number="2"
                title="National Circuit Network"
                subtitle="Warm leads — reach debaters you already know"
                color="bg-white border-black/[0.07] shadow-card"
                numberColor="bg-navy"
                why={[
                  'Students trust recommendations from other debaters more than any advertisement or sales pitch.',
                  'You\'ve competed against these people — they know you\'re the real deal.',
                  'Word-of-mouth on the circuit is fast — one conversation can ripple into multiple sign-ups.',
                ]}
                how={[
                  'Text or DM debaters you know personally — keep it casual and genuine, not scripted.',
                  'Focus on students who are clearly serious: they compete as much as they can, they care about breaking, they have goals.',
                  'Share what you actually think of Ascend and what you\'re excited about — authenticity is your biggest asset.',
                  `Always share your referral code (${code}) — it gets them $50 off and makes sure you get credit.`,
                  'Follow up once if you don\'t hear back. A quick "hey, did you get a chance to look?" goes a long way.',
                ]}
              />

              <TrackCard
                number="3"
                title="Community Events & Workshops"
                subtitle="Cold leads — build pipeline and trust"
                color="bg-white border-black/[0.07] shadow-card"
                numberColor="bg-ink"
                why={[
                  'Introduces students to what\'s possible before they have any reason to say no.',
                  'Builds trust before you ever mention camp — serve first, recruit second.',
                  'Reaches students who would never find Ascend on their own.',
                ]}
                how={[
                  'Run a free workshop on Congressional Debate at your school or a nearby school with a smaller debate program.',
                  'Keep sessions practical and immediately useful — students should leave with something they can apply at their next tournament.',
                  'At the end, mention that you\'ll be on staff at Ascend California this summer — the natural next step for anyone who wants to keep improving.',
                ]}
                workshopIdeas={[
                  'How to Write Debate Cases — structure, legislation, and authorship speeches',
                  'Structuring an Argument with the Block Format — the foundation of competitive Congress',
                  'Refutation and Weighing — how to engage opponents and win the flow',
                  'How to Speak Passionately — delivery, presence, and connecting with the room',
                ]}
              />
            </div>
          </Section>

          {/* Sample Scripts */}
          <Section id="scripts" title="Sample Scripts">
            <p className="text-gray-600 mb-5">Use these as starting points — adapt them to fit your voice and relationship with the student.</p>
            <div className="space-y-4">
              <ScriptCard
                label="School Team"
                labelColor="bg-green-100 text-green-800"
                script={`"Hey [name] — I know you've been working really hard this year and I genuinely think you're at a point where the right summer experience could help you get to the next level. I'm going to be on staff at Ascend California this summer. It's the biggest Congress camp in the country with the strongest track record on the national circuit. I'd love to have you there. It doesn't stop at camp either — you'll get free coaching through Ascend Academy all year after. Use my code ${code} when you sign up and you'll get $50 off. Happy to talk more about it anytime."`}
              />
              <ScriptCard
                label="National Circuit"
                labelColor="bg-blue-100 text-blue-800"
                script={`"Hey [name], hope you're doing well! I'm going to be coaching at Ascend this summer and I'd love to see you there. It's the best camp in the country for Congress and I think it would be a great experience for you to really take the next step with your Congress career by working with some great coaches. If you're interested or have any questions, let me know and I'd be happy to share more! My referral code is ${code} — use it at registration for $50 off."`}
              />
              <ScriptCard
                label="To a Parent"
                labelColor="bg-navy-50 text-navy"
                script={`"Hi [parent name], this is [your name]. I coach Congressional Debate at Ascend Speech & Debate, and I've seen how hard [student] works. I think our summer camp would be a great fit: it's the largest Congress camp in the country, and every TOC Congress champion this decade has trained with us. If you'd like to talk it through, you can book a short call with the Ascend team here: ${CALENDLY}. And if you register, my code ${code} saves your family $50."`}
              />
              <ScriptCard
                label="Follow-Up (no reply yet)"
                labelColor="bg-amber-50 text-amber-800"
                script={`"Hey [name], just circling back on Ascend. No pressure at all, I just didn't want it to get lost. Happy to answer anything, or I can connect your family with the Ascend team. My code ${code} is still good for $50 off whenever you're ready."`}
              />
              <ScriptCard
                label="Hand-Off to Ascend (they're interested)"
                labelColor="bg-violet-50 text-violet-800"
                script={`"So glad you're interested! The easiest next step is a quick call with the Ascend team. They can answer questions about labs, travel, financial aid, anything. Pick a time here: ${CALENDLY}. When you register, use my code ${code} for $50 off."`}
              />
              <p className="text-xs text-gray-400">After the hand-off, log the prospect as <span className="font-semibold text-gray-500">Connected with Ascend Admin</span> on your dashboard.</p>
            </div>
          </Section>

          {/* Handling objections */}
          <Section id="objections" title="Handling Objections">
            <p className="text-gray-600 mb-5">Most "no"s are really "not yet" or "I have a question." Here's what to say to the ones you'll hear most.</p>
            <div className="space-y-3">
              {OBJECTIONS.map((o) => (
                <div key={o.heard} className="card p-4">
                  <p className="font-semibold text-ink text-sm">"{o.heard}"</p>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{o.say}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Core Messages */}
          <Section id="messages" title="Core Messages to Drive Home">
            <p className="text-gray-600 mb-5">Whatever track you're using, these are the messages that move students from curious to enrolled. Know them cold.</p>
            <div className="space-y-3">
              {[
                'Ascend is the largest Congress camp in the country, with the strongest track record on the national circuit and the most success at the TOC.',
                'Every student gets a tailored curriculum built around their specific needs — Ascend meets students where they are and builds a plan to take them further.',
                'Every TOC Congress champion this decade, 2020 through 2026, has been part of Team Ascend. Name them: it lands harder than any adjective.',
                'Growth doesn\'t stop at camp. Free Ascend Academy group coaching runs September through June, every year until graduation.',
                'Ascend has the best coaching staff in the country and there isn\'t a close second.',
                `Share your referral code (${code}) — students get $50 off and you get full credit for the referral.`,
                'Financial aid is available for students with genuine need — no deserving student has ever been turned away.',
              ].map((msg, i) => (
                <div key={i} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4">
                  <span className="w-6 h-6 rounded-full bg-crimson text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <p className="text-gray-700 text-sm leading-relaxed">{msg}</p>
                </div>
              ))}
            </div>
          </Section>

          {/* Pricing */}
          <Section id="pricing" title="Program Options & Pricing">
            <p className="text-gray-600 mb-5">Registration is open for Summer 2027. These are early registration prices; the bigger packages go up to full price later, so encourage students to register early.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-700 rounded-tl-xl">Package</th>
                    <th className="px-4 py-3 font-semibold text-gray-700">Price</th>
                    <th className="px-4 py-3 font-semibold text-gray-700 rounded-tr-xl">Dates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { name: '2 Week – Residential', price: '$3,249.99', full: '$3,749.99', dates: 'July 11–25, 2027', highlight: true },
                    { name: '2 Week – Residential with 1-on-1 Package (Limited to 10 students)', price: '$4,249.99', full: '$4,749.99', dates: 'July 11–25, 2027' },
                    { name: '2 Week – Residential for Summer \'27 & \'28 (~$3,250 per summer)', price: '$6,499.99', dates: 'July 11–25, 2027 + Summer 2028' },
                    { name: '1 Week – Residential', price: '$2,599.99', dates: 'July 11–18, 2027' },
                    { name: '2 Week – Commuter', price: '$2,599.99', dates: 'July 11–25, 2027' },
                    { name: '1 Week – Commuter', price: '$1,999.99', dates: 'July 11–18, 2027' },
                  ].map((row) => (
                    <tr key={row.name} className={row.highlight ? 'bg-crimson-50' : 'bg-white'}>
                      <td className="px-4 py-3 text-gray-800 font-medium">
                        {row.name}
                        {row.highlight && <span className="ml-2 text-xs bg-crimson text-white px-2 py-0.5 rounded-full">Most Popular</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-crimson">{row.price}</span>
                        {row.full && <span className="block text-xs text-gray-400"><span className="line-through">{row.full}</span> full price</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{row.dates}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">Prices from the Ascend store, ascendspeech.org/ascend-store. Financial aid is available for students with demonstrated need: families can email info@ascendspeech.org.</p>
          </Section>

          {/* Financial Aid */}
          <Section id="financial" title="Financial Aid">
            <p className="text-gray-600 leading-relaxed">
              Ascend is committed to making sure that financial need is never the reason a deserving student misses out on camp.
              Over the years, Ascend has provided over <strong>$125,000 in financial aid</strong> — and no student with genuine need has ever been turned away.
            </p>
            <div className="mt-5 bg-navy-50 border border-navy-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-navy mb-1">What to say when cost comes up:</p>
              <p className="text-sm text-ink-soft italic leading-relaxed">
                "If cost is genuinely a concern for your family, please reach out — Ascend has financial aid available and no student with real need has ever been turned away."
              </p>
            </div>
            <div className="mt-5 space-y-2">
              {[
                'Raise it when a student or family signals that cost is a concern.',
                'Be straightforward: Ascend has helped students with genuine financial need over the years.',
                'Direct families to contact Ascend leadership directly — do not quote specific dollar amounts or aid levels yourself.',
                'Encourage early registration regardless — pricing increases over time.',
                'Financial aid is a private matter — please ask students receiving aid not to disclose this to others.',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-gold mt-0.5">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Safety */}
          <Section id="safety" title="Student Safety">
            <p className="text-gray-600 leading-relaxed mb-5">
              Student safety is non-negotiable at Ascend, and it's one of the most common topics parents raise.
              Being ready to speak to this confidently will go a long way in your recruiting conversations.
            </p>
            <div className="space-y-2">
              {[
                'Students are constantly supervised throughout the program, day and night.',
                'Nightly room checks are conducted by staff members.',
                'A medical authority is available 24/7, alongside the university\'s 24/7 public safety department.',
                'Ascend maintains and enforces a clear Code of Conduct to ensure a respectful, inclusive environment.',
                'All staff are background checked per California State Law.',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-4 py-3">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-4">
              If a parent raises safety questions, share the above and direct them to{' '}
              <a href="mailto:aditya.chordiya@ascendspeech.org" className="text-crimson hover:underline">aditya.chordiya@ascendspeech.org</a>
              {' '}or 510-361-9408.
            </p>
          </Section>

          {/* Logistics */}
          <Section id="logistics" title="Logistics & Policies">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Who can attend', value: 'Students entering 6th–12th grade in fall 2027.' },
                { label: 'Getting there (California)', value: 'Fly into Sacramento (SMF). Arrive July 11 between 9am and 3pm; a shuttle runs that day for $60 each way.' },
                { label: 'Going home', value: '1-week campers leave July 18 (no shuttle). 2-week campers leave July 25, with a shuttle for flights after 10am.' },
                { label: 'Refunds and deferrals', value: 'No refunds, but a family can defer to the next summer by May 31 if a conflict comes up.' },
                { label: 'Families with questions', value: 'Email info@ascendspeech.org or book a call with the Ascend team.' },
                { label: 'How you get credit', value: 'The family enters your code at checkout. No code, no credit, so always share it. Your dashboard shows each enrollment and what you\'re owed.' },
              ].map((item) => (
                <div key={item.label} className="bg-white border border-black/[0.07] rounded-xl p-4">
                  <p className="eyebrow">{item.label}</p>
                  <p className="text-sm text-gray-700 mt-1 leading-relaxed">{item.value}</p>
                </div>
              ))}
            </div>
            <a href={CALENDLY} target="_blank" rel="noreferrer" className="btn-outline text-sm px-4 py-2 mt-4">Ascend's call-booking page (share with families)</a>
          </Section>

          {/* FAQ */}
          <Section id="faq" title="Frequently Asked Questions">
            <p className="text-gray-600 mb-5">These are the questions prospective students and families most often ask. Know these answers — or direct them to Ascend leadership if you're unsure.</p>
            <div className="space-y-3">
              {[
                {
                  q: 'How does Ascend approach teaching students at different levels?',
                  a: 'Ascend offers four labs that vary by complexity. Before camp, each student submits a recording of themselves giving a Congress speech and an evaluation form. A panel of coaches reviews these to assess each student\'s strengths, weaknesses, and needs, then assigns them to a lab tailored to their skill level. During the first two days, coaches may also recommend a lab adjustment if a better fit is identified. Every student is guaranteed an opportunity to work with every Ascend coach regardless of lab placement.',
                },
                {
                  q: 'I\'m new to Congressional Debate — is Ascend the right program for me?',
                  a: 'Absolutely. Ascend has labs tailored to every level of experience, from students who have never given a Congress speech to those competing regularly on the national circuit. The camp experience is designed to meet students exactly where they are — your lab placement is based on your current skill level, not a minimum bar you have to clear. Many of Ascend\'s most improved students came in with little to no experience.',
                },
                {
                  q: 'Should my student do Ascend California, Ascend Florida, or Ascend Online?',
                  a: 'Ascend California is the flagship summer experience and has the most Congressional Debate coaches of any camp in the country. If a student is able to attend either in-person camp, Ascend strongly recommends doing so. The in-person experience — daily mock rounds, one-on-one sessions, community, and full immersion — is significantly more impactful than an online format. Ascend Florida (June 25 – July 9, 2027, Lynn University) brings the same program to the East Coast, and Ascend Online (June 26 – July 10, from $699.99) is a great option for students who cannot travel, but in-person is the gold standard.',
                },
              ].map((item) => (
                <FAQItem key={item.q} question={item.q} answer={item.a} />
              ))}
            </div>
          </Section>

          {/* Contact */}
          <div className="bg-ink rounded-2xl p-6 text-white shadow-lift">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Questions? Contact Ascend Leadership</p>
            <p className="font-semibold text-lg">Aditya Chordiya</p>
            <p className="text-gray-400 text-sm">Chief Operating Officer, Ascend Speech & Debate</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <a
                href="mailto:aditya.chordiya@ascendspeech.org"
                onClick={(e) => { e.stopPropagation(); window.location.href = 'mailto:aditya.chordiya@ascendspeech.org'; }}
                className="flex items-center gap-2 text-sm text-white bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-lg transition cursor-pointer"
              >
                📧 aditya.chordiya@ascendspeech.org
              </a>
              <a
                href="tel:5103619408"
                onClick={(e) => { e.stopPropagation(); window.location.href = 'tel:5103619408'; }}
                className="flex items-center gap-2 text-sm text-white bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-lg transition cursor-pointer"
              >
                📱 510-361-9408
              </a>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-[22px] font-semibold text-ink tracking-tight mb-4 pb-3 border-b border-black/[0.08]">{title}</h2>
      {children}
    </section>
  );
}

function TrackCard({ number, title, subtitle, color, numberColor, why, how, workshopIdeas }) {
  return (
    <div className={`border rounded-2xl p-5 ${color}`}>
      <div className="flex items-start gap-3 mb-4">
        <span className={`w-8 h-8 rounded-full text-white text-sm font-bold flex items-center justify-center shrink-0 ${numberColor}`}>
          {number}
        </span>
        <div>
          <p className="font-semibold text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Why it works</p>
          <ul className="space-y-1.5">
            {why.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-1 shrink-0">•</span><span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">How to approach it</p>
          <ul className="space-y-1.5">
            {how.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-1 shrink-0">→</span><span>{item}</span>
              </li>
            ))}
          </ul>
          {workshopIdeas && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Workshop Ideas</p>
              <ul className="space-y-1.5">
                {workshopIdeas.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="mt-1 shrink-0">•</span><span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScriptCard({ label, labelColor, script }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${labelColor}`}>{label}</span>
        <button
          onClick={copy}
          className="text-xs text-gray-400 hover:text-crimson transition flex items-center gap-1"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed italic">{script}</p>
    </div>
  );
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-5 py-4 flex items-start justify-between gap-3 hover:bg-gray-50 transition"
      >
        <span className="font-medium text-gray-900 text-sm">{question}</span>
        <span className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}
