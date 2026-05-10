import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../lib/AuthContext';

const SECTIONS = [
  { id: 'about',     label: 'About Ascend' },
  { id: 'different', label: 'What Makes Us Different' },
  { id: 'strategy',  label: 'Recruiting Strategy' },
  { id: 'scripts',   label: 'Sample Scripts' },
  { id: 'messages',  label: 'Core Messages' },
  { id: 'pricing',   label: 'Pricing' },
  { id: 'financial', label: 'Financial Aid' },
  { id: 'safety',    label: 'Safety' },
  { id: 'faq',       label: 'FAQ' },
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
        <h1 className="text-2xl font-bold text-gray-900">Recruiting Playbook</h1>
        <p className="text-gray-500 text-sm mt-0.5">Ascend California 2026 · Everything you need to recruit successfully.</p>
      </div>

      {/* Referral Code Banner */}
      <div className="bg-crimson rounded-2xl p-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-crimson-100 text-xs font-semibold uppercase tracking-wide mb-1">Your Referral Code</p>
          <p className="text-white text-3xl font-bold font-mono tracking-widest">{code}</p>
          <p className="text-crimson-100 text-sm mt-1">Share this with every student you recruit — they get $50 off, you get full credit.</p>
        </div>
        <div className="flex flex-col gap-1.5 text-sm text-white/80 shrink-0">
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
                    ? 'bg-crimson-50 text-crimson font-medium'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
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
              country). Both run August through June, so student growth continues long after camp ends.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: '📍', label: 'Location', value: 'University of the Pacific, Stockton, CA' },
                { icon: '📅', label: 'Dates', value: 'July 12–26, 2026' },
                { icon: '✈️', label: 'Nearest Airport', value: 'Sacramento International (SMF) — campus transport available' },
                { icon: '🎓', label: 'Target Grade', value: '6th–12th grade in the current \'25–\'26 school year' },
                { icon: '📚', label: 'Post-Camp', value: 'Free Ascend Academy + Sandel Academy coaching Aug–June every year' },
                { icon: '💰', label: 'Financial Aid', value: 'Available for students with demonstrated need — no one turned away' },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-4">
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

          {/* What Makes Us Different */}
          <Section id="different" title="What Makes Ascend Different">
            <p className="text-gray-600 mb-5">When you're recruiting, you need to answer the question: <em>why Ascend?</em></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: '🏆', title: 'Unmatched Track Record', desc: 'The largest Congress camp in the country with the most success on the national circuit — no other camp matches our results.' },
                { icon: '🧑‍🏫', title: 'Top-Tier Coaches', desc: 'Champions and coaches of champions from across the country — diverse perspectives for every level of student.' },
                { icon: '🎬', title: 'Daily Mock Rounds', desc: 'At least one (sometimes two) mock rounds daily in a tournament-like setting, with feedback tied directly to what\'s being taught.' },
                { icon: '📚', title: 'Year-Round Learning', desc: 'Ascend Academy and Sandel Academy coaching run August through June every year — so growth never stops.' },
                { icon: '🤝', title: 'Individualized Coaching', desc: 'Students get dedicated one-on-one coaching during camp — and Ascend is increasing it more this year than any previous year.' },
                { icon: '🗺️', title: 'Regional Specialization', desc: 'Coaches from across the country ensure success on both the national circuit and in local leagues, wherever a student competes.' },
                { icon: '🛡️', title: 'Dedicated Safety Team', desc: 'A dedicated administrative team focused entirely on student safety — they don\'t coach, their only job is student care.' },
                { icon: '📋', title: 'Tailored Curriculum', desc: 'Curriculum is tailored to each student based on their lab placement, so every student works on what matters most for their development.' },
                { icon: '🌎', title: 'National Community', desc: 'Ascend is the largest Congressional Debate community in the country, with students competing together all year long.' },
              ].map((item) => (
                <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-4">
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
                color="bg-green-50 border-green-200"
                numberColor="bg-green-600"
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
                color="bg-blue-50 border-blue-200"
                numberColor="bg-blue-600"
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
                color="bg-gold-50 border-yellow-200"
                numberColor="bg-gold"
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
            </div>
          </Section>

          {/* Core Messages */}
          <Section id="messages" title="Core Messages to Drive Home">
            <p className="text-gray-600 mb-5">Whatever track you're using, these are the messages that move students from curious to enrolled. Know them cold.</p>
            <div className="space-y-3">
              {[
                'Ascend is the largest Congress camp in the country, with the strongest track record on the national circuit and the most success at the TOC.',
                'Every student gets a tailored curriculum built around their specific needs — Ascend meets students where they are and builds a plan to take them further.',
                'Students get dedicated one-on-one coaching during camp — and Ascend will be increasing it more this year than any other previous year.',
                'Growth doesn\'t stop at camp. Ascend Academy and Sandel Academy coaching runs August through June every year, keeping students improving all season.',
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
            <p className="text-gray-600 mb-5">Registration is open for Summer 2026. Prices increase over time — encourage students to register early.</p>
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
                    { name: '2 Week – Residential (Most Popular)', price: '$3,599.99', dates: 'July 12–26, 2026', highlight: true },
                    { name: '2 Week – Residential with 1-on-1 Package (Limited to first 10 students)', price: '$4,599.99', dates: 'July 12–26, 2026' },
                    { name: '2 Week – Residential for Summer \'26 & \'27 (~$3,250 per summer)', price: '$6,500', dates: 'July 12–26 + July 11–25, 2027' },
                    { name: '1 Week – Residential', price: '$2,599.99', dates: 'July 12–19, 2026' },
                    { name: '2 Week – Commuter', price: '$2,599.99', dates: 'July 12–26, 2026' },
                    { name: '1 Week – Commuter', price: '$1,999.99', dates: 'July 12–19, 2026' },
                  ].map((row) => (
                    <tr key={row.name} className={row.highlight ? 'bg-crimson-50' : 'bg-white'}>
                      <td className="px-4 py-3 text-gray-800 font-medium">
                        {row.name}
                        {row.highlight && <span className="ml-2 text-xs bg-crimson text-white px-2 py-0.5 rounded-full">Most Popular</span>}
                      </td>
                      <td className="px-4 py-3 font-bold text-crimson">{row.price}</td>
                      <td className="px-4 py-3 text-gray-500">{row.dates}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">Financial aid is available for students with demonstrated need. Encourage eligible students to reach out to Ascend directly.</p>
          </Section>

          {/* Financial Aid */}
          <Section id="financial" title="Financial Aid">
            <p className="text-gray-600 leading-relaxed">
              Ascend is committed to making sure that financial need is never the reason a deserving student misses out on camp.
              Over the years, Ascend has provided over <strong>$125,000 in financial aid</strong> — and no student with genuine need has ever been turned away.
            </p>
            <div className="mt-5 bg-gold-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-yellow-800 mb-1">What to say when cost comes up:</p>
              <p className="text-sm text-yellow-900 italic leading-relaxed">
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
                'Students are supervised at all times throughout the program — day and night.',
                'Nightly room checks are conducted by staff members.',
                'A dedicated nurse is available throughout camp to address any health needs.',
                'Parents can reach Ascend leadership at any time through a dedicated 24/7 contact line.',
                'Ascend maintains and enforces a clear Code of Conduct to ensure a respectful, inclusive environment.',
                'All Ascend staff are vetted and trained on student safety protocols before camp begins.',
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

          {/* FAQ */}
          <Section id="faq" title="Frequently Asked Questions">
            <p className="text-gray-600 mb-5">These are the questions prospective students and families most often ask. Know these answers — or direct them to Ascend leadership if you're unsure.</p>
            <div className="space-y-3">
              {[
                {
                  q: 'How does Ascend approach teaching students at different levels?',
                  a: 'Ascend offers six different labs that vary by complexity. Before camp, each student submits a recording of themselves giving a Congress speech and an evaluation form. A panel of coaches reviews these to assess each student\'s strengths, weaknesses, and needs, then assigns them to a lab tailored to their skill level. During the first two days, coaches may also recommend a lab adjustment if a better fit is identified. Every student is guaranteed an opportunity to work with every Ascend coach regardless of lab placement.',
                },
                {
                  q: 'I\'m new to Congressional Debate — is Ascend the right program for me?',
                  a: 'Absolutely. Ascend has labs tailored to every level of experience, from students who have never given a Congress speech to those competing regularly on the national circuit. The camp experience is designed to meet students exactly where they are — your lab placement is based on your current skill level, not a minimum bar you have to clear. Many of Ascend\'s most improved students came in with little to no experience.',
                },
                {
                  q: 'Should my student do Ascend California, Ascend Florida, or Ascend Online?',
                  a: 'Ascend California is the flagship summer experience and has the most Congressional Debate coaches of any camp in the country. If a student is able to attend either in-person camp, Ascend strongly recommends doing so. The in-person experience — daily mock rounds, one-on-one sessions, community, and full immersion — is significantly more impactful than an online format. Ascend Online is a great option for students who cannot travel, but in-person is the gold standard.',
                },
              ].map((item) => (
                <FAQItem key={item.q} question={item.q} answer={item.a} />
              ))}
            </div>
          </Section>

          {/* Contact */}
          <div className="bg-gray-900 rounded-2xl p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Questions? Contact Ascend Leadership</p>
            <p className="font-semibold text-lg">Aditya Chordiya</p>
            <p className="text-gray-400 text-sm">Chief Operating Officer, Ascend Speech & Debate</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <a href="mailto:aditya.chordiya@ascendspeech.org" className="flex items-center gap-2 text-sm text-white bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-lg transition">
                📧 aditya.chordiya@ascendspeech.org
              </a>
              <a href="tel:5103619408" className="flex items-center gap-2 text-sm text-white bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-lg transition">
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
      <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">{title}</h2>
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
