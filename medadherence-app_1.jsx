import { useState, useEffect, useRef } from "react";
import {
  Home, MessageCircle, BookOpen, BarChart2, ChevronLeft,
  Check, Leaf, Sun, Moon, Clock, User, Stethoscope, Activity,
  Heart, Sparkles, ArrowRight, Calendar, TrendingUp, Send
} from "lucide-react";

const COMPANION_SYSTEM = `You are a close friend who happens to have deep knowledge of autoimmune conditions and rheumatology. You talk like a person, not a medical system. You are warm, curious, and proactive — you move conversations forward, offer real perspective, and help people feel capable of managing their condition.

Your knowledge (use it naturally, not like a textbook):
- Methotrexate nausea usually peaks in the first few months and improves. Taking it at night, always with Folic Acid, and staying well hydrated makes a real difference. It takes 6–12 weeks to work fully, so early side effects don't mean it's not worth taking.
- Hydroxychloroquine is one of the gentler DMARDs. Annual eye checks matter. It takes 3–6 months to show its full effect.
- Folic Acid is taken to counteract Methotrexate's side effects — especially nausea and mouth sores. Skipping it makes side effects worse.
- Consistency is everything with DMARDs. Missing doses regularly reduces their effectiveness in ways that aren't immediately obvious but matter a lot over time.
- Fatigue is one of the most under-discussed aspects of autoimmune disease — it's not laziness, it's the immune system working overtime.

How you respond:
- Lead with something real and specific — a useful fact, a gentle reframe, a practical tip. Not an emotional label.
- Be proactive: suggest something, offer a next step, ask a question that actually moves things forward
- When someone describes a symptom, ask a clarifying question before jumping to conclusions. "When does the nausea hit — the day you take it, or more spread through the week?" is more useful than "see your doctor"
- For something genuinely concerning (chest pain, difficulty breathing, sudden vision changes), be caring but clear: "That's worth getting checked today — not because it's definitely serious, but because it's better to know. Can you call your clinic?"
- When someone is hesitant about taking their medication, don't push — ask what's behind it, then offer a real reason to continue that's grounded in how the medication actually works
- Celebrate consistency naturally: "Twelve days in a row is actually meaningful — these medications work cumulatively"

Voice rules:
- Talk like a person. Warm, direct, occasionally a little dry.
- 2–4 sentences, then either a specific question or a suggested next step
- Never open with emotional validation labels
- Never use: "definitely", "certainly", "of course", "absolutely", "you're not alone", "it's completely normal", "that sounds tough", "I hear you", "that must be hard", "that's valid"
- Never be vague or generic — always say something specific
- No bullet points or lists in your responses
- Never start with "I"
- No emojis
- Never tell them to stop or change their dose — that's their doctor's call
- Self-harm or genuine emergency: respond with warmth, direct them to call their doctor or emergency services`;

// genAI and geminiModel will now be handled by the backend proxy
const GEMINI_PROXY_URL = "/api/gemini";

// ─── DESIGN TOKENS ────────────────────────────────────────────────
const C = {
  bg: "#FAF8F4",   // warm cream page background
  bgCard: "#FFFFFF",   // card/panel surfaces
  bgAI: "#FDF6EE",   // warm tinted surface
  sage: "#5A8B6E",   // sage green — primary
  sageLight: "#EEF4F0",   // sage 10% tint
  sageDark: "#4A7A5A",   // darker sage
  terra: "#C17B4A",   // terracotta accent
  terraLight: "#FDF0E8",   // terracotta 10% tint
  terraDark: "#A05A38",   // darker terra
  text: "#2C2A27",   // near-black warm
  textBody: "#4A4742",   // dark warm grey body
  muted: "#7A7470",   // muted warm grey
  light: "#9CA3AF",   // compat alias
  streak: "#5A8B6E",   // sage for streaks
  border: "#E8E3DC",   // warm border
  borderLight: "#F0EAE2",   // lighter border
  white: "#FFFFFF",
  dark: "#1A2B22",
  darkSurface: "#233828",
};

const F = {
  serif: "'Lora', Georgia, serif",
  sans: "'Raleway', system-ui, sans-serif",
};

// ─── SCREENS ──────────────────────────────────────────────────────
const S = {
  ONBOARD_WELCOME: "onboard_welcome",
  ONBOARD_NAME: "onboard_name",
  ONBOARD_CONDITION: "onboard_condition",
  ONBOARD_MEDS: "onboard_meds",
  HOME: "home",
  LOG_CONFIRM: "log_confirm",
  LOG_CELEBRATE: "log_celebrate",
  COMPANION: "companion",
  JOURNAL: "journal",
  INSIGHTS: "insights",
  CLINICIAN: "clinician",
  RECOVERY: "recovery",
};

// ─── DATA ─────────────────────────────────────────────────────────
const INITIAL_MEDS = [
  { id: 1, name: "Methotrexate", dose: "15mg", time: "8:00 AM", taken: false, skipped: false },
  { id: 2, name: "Folic Acid", dose: "5mg", time: "8:00 AM", taken: true, skipped: false },
  { id: 3, name: "Hydroxychloroquine", dose: "200mg", time: "2:00 PM", taken: false, skipped: false },
];

const CONDITIONS = [
  "Rheumatoid Arthritis",
  "Lupus (SLE)",
  "Crohn's Disease",
  "Multiple Sclerosis",
  "Psoriatic Arthritis",
  "Other autoimmune condition",
];

const AI_RESPONSES = {
  calm: [
    "There's a quietness in you today that I notice. Taking your medication now is a small, faithful act — one your future self will be grateful for.",
    "You're in a good place. That steadiness you feel right now? It's real. Let it carry you through this moment of care.",
  ],
  uneasy: [
    "It's okay to feel unsettled and still show up. You don't need to feel at peace to take care of yourself — sometimes the peace comes after.\n\nI'm here with you.",
    "Unease is familiar territory for many people living with autoimmune conditions. It doesn't have to stop you. You can feel it and still choose yourself.",
  ],
  anxious: [
    "I hear you. The anxiety around medication is real, and it's common — and it doesn't mean anything is wrong with you.\n\nLet's just be here for a moment. No rush.",
    "That weight you're carrying is real. And taking your medication isn't surrendering to it — it's the thing that gives you more of yourself back, slowly, over time.",
  ],
};

const FOLLOW_UPS = [
  "That makes complete sense. Many people feel exactly this way, and it doesn't make you any less capable of caring for yourself.",
  "Thank you for trusting me with that. You don't have to carry it alone.",
  "I understand. Showing up here today — even on a difficult day — says something meaningful about you.",
  "What you're feeling is valid. And you're still here. That matters more than you know.",
];

const JOURNAL_PROMPTS = [
  "What did your body ask of you today?",
  "What felt lighter than expected this week?",
  "Is there a moment from today worth holding onto?",
  "What would you tell yourself at the start of this day?",
];

const RECOVERY_STEPS = [
  {
    title: "It's okay.",
    body: "Missing a dose doesn't undo your progress. It makes you human — and every person managing a complex medication routine has been here.\n\nThis is one moment, not your whole story.",
    action: "I hear you",
  },
  {
    title: "Can you tell me what got in the way?",
    options: ["Anxiety about side effects", "Too busy or forgot", "An emotionally hard day", "I felt okay without it"],
  },
  {
    title: "Ready to come back?",
    body: "Coming back is what matters. Your body hasn't given up — and neither have you. Every return is its own kind of strength.",
    action: "Yes — I'm ready to continue",
    final: true,
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────
const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];

function adherenceColor(pct) {
  if (pct >= 80) return C.sage;
  if (pct >= 51) return "#C4973A";
  return C.terra;
}

const phoneWrap = {
  width: "100%",
  maxWidth: 390,
  minHeight: "100vh",
  background: C.bg,
  position: "relative",
  fontFamily: F.sans,
  overflow: "hidden",
};

const outerWrap = {
  minHeight: "100vh",
  background: "#FAF8F4",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  padding: "0 0 60px",
};

// ─── STREAK RING ──────────────────────────────────────────────────
function StreakRing({ streak, goal = 30 }) {
  const r = 72;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(streak / goal, 1);
  const offset = circ * (1 - pct);
  return (
    <svg
      width="176" height="176" viewBox="0 0 176 176"
      aria-label={`${streak} day streak`}
      style={{ "--ring-circ": circ, "--ring-offset": offset }}
    >
      <circle cx="88" cy="88" r={r} fill="none" stroke={C.borderLight} strokeWidth="12" />
      <circle
        cx="88" cy="88" r={r} fill="none"
        stroke={C.sage} strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 88 88)"
        className="streak-ring-arc"
        style={{ transition: "stroke-dashoffset 800ms cubic-bezier(0.16, 1, 0.3, 1)" }}
      />
      <text x="88" y="78" textAnchor="middle" fontFamily="Lora, Georgia, serif" fontSize="40" fill={C.text} fontWeight="600">{streak}</text>
      <text x="88" y="100" textAnchor="middle" fontFamily="Raleway, system-ui, sans-serif" fontSize="13" fill={C.muted}>day streak</text>
      <text x="88" y="118" textAnchor="middle" fontFamily="Raleway, system-ui, sans-serif" fontSize="11" fill={C.muted}>of {goal} goal</text>
    </svg>
  );
}

// ─── PROGRESS DOTS ────────────────────────────────────────────────
function ProgressDots({ step, total = 3 }) {
  return (
    <div
      style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}
      aria-label={`Step ${step} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => {
        const dotStep = i + 1;
        const isActive = dotStep === step;
        const isCompleted = dotStep < step;
        return (
          <div
            key={i}
            style={{
              width: isActive ? 24 : 8,
              height: 8,
              borderRadius: 9999,
              background: (isActive || isCompleted) ? C.sage : C.border,
              transition: "all 250ms cubic-bezier(0.16, 1, 0.3, 1)",
              flexShrink: 0,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────
function BottomNav({ current, onNavigate }) {
  const tabs = [
    { id: S.HOME, icon: Home, label: "Today" },
    { id: S.COMPANION, icon: MessageCircle, label: "Companion" },
    { id: S.JOURNAL, icon: BookOpen, label: "Journal" },
    { id: S.INSIGHTS, icon: BarChart2, label: "Insights" },
  ];
  const activeIdx = tabs.findIndex(t => t.id === current);
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 390,
      background: C.white,
      borderTop: `1px solid ${C.border}`,
      boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
      display: "flex",
      paddingBottom: 16,
      overflow: "hidden",
    }}>
      {/* Sliding active indicator */}
      <div style={{
        position: "absolute",
        top: 0,
        height: 2,
        background: C.sage,
        borderRadius: 9999,
        width: "25%",
        left: `${activeIdx * 25}%`,
        transition: "left 250ms cubic-bezier(0.16, 1, 0.3, 1)",
      }} />

      {tabs.map(tab => {
        const active = current === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className="tab-btn"
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, padding: "12px 0 0", background: "none", border: "none",
              cursor: "pointer",
              color: active ? C.sage : C.muted,
              minHeight: 44,
            }}
          >
            <Icon size={20} strokeWidth={active ? 2 : 1.5} />
            <span style={{
              fontFamily: F.sans, fontSize: 10, fontWeight: active ? 600 : 400,
              letterSpacing: "0.04em",
            }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ─── PILL ICON ────────────────────────────────────────────────────
function PillIcon({ color = C.sage, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <ellipse cx="10" cy="10" rx="7" ry="4.5" fill={color} opacity="0.9" />
      <line x1="10" y1="5.5" x2="10" y2="14.5" stroke="white" strokeWidth="1.2" opacity="0.5" />
    </svg>
  );
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Raleway:wght@300;400;500;600;700&display=swap');

    :root {
      --color-bg:           #FAF8F4;
      --color-surface:      #FFFFFF;
      --color-surface-warm: #FDF6EE;
      --color-primary:      #5A8B6E;
      --color-primary-light:#EEF4F0;
      --color-accent:       #C17B4A;
      --color-accent-light: #FDF0E8;
      --color-text-primary: #2C2A27;
      --color-text-body:    #4A4742;
      --color-text-muted:   #7A7470;
      --color-border:       #E8E3DC;
      --color-border-focus: #5A8B6E;
      --font-heading: 'Lora', Georgia, serif;
      --font-body:    'Raleway', system-ui, sans-serif;
      --text-xs:   0.75rem;
      --text-sm:   0.875rem;
      --text-base: 1rem;
      --text-lg:   1.125rem;
      --text-xl:   1.25rem;
      --text-2xl:  1.5rem;
      --text-3xl:  1.875rem;
      --text-4xl:  2.25rem;
      --space-1:  0.25rem;
      --space-2:  0.5rem;
      --space-3:  0.75rem;
      --space-4:  1rem;
      --space-5:  1.25rem;
      --space-6:  1.5rem;
      --space-8:  2rem;
      --space-10: 2.5rem;
      --space-12: 3rem;
      --radius-sm:   8px;
      --radius-md:   12px;
      --radius-lg:   16px;
      --radius-xl:   20px;
      --radius-full: 9999px;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
      --shadow-md: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
      --shadow-lg: 0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.04);
      --transition-fast: 150ms ease;
      --transition-base: 200ms ease;
      --transition-slow: 300ms ease;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes popIn {
      0%   { opacity: 0; transform: scale(0.5); }
      70%  { transform: scale(1.15); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% 0; }
      100% { background-position:  200% 0; }
    }
    @keyframes barGrow {
      from { transform: scaleX(0); }
      to   { transform: scaleX(1); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.92); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes celebPop {
      0%   { transform: scale(0.8); opacity: 0; }
      60%  { transform: scale(1.08); }
      100% { transform: scale(1); opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 0; }
    input, textarea, button { font-family: inherit; }
    textarea { resize: none; }

    *:focus { outline: none; }
    *:focus-visible {
      outline: 2px solid #5A8B6E;
      outline-offset: 3px;
      border-radius: 4px;
    }
    input:focus-visible, textarea:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px rgba(90, 139, 110, 0.20), inset 0 0 0 1px #5A8B6E;
    }

    /* Screen entrance */
    .screen-enter { animation: fadeUp 280ms cubic-bezier(0.16, 1, 0.3, 1) both; }

    /* Staggered card list */
    .card-list-item { animation: fadeUp 300ms cubic-bezier(0.16, 1, 0.3, 1) both; }
    .card-list-item:nth-child(1) { animation-delay: 0ms; }
    .card-list-item:nth-child(2) { animation-delay: 60ms; }
    .card-list-item:nth-child(3) { animation-delay: 120ms; }
    .card-list-item:nth-child(4) { animation-delay: 180ms; }
    .card-list-item:nth-child(5) { animation-delay: 240ms; }

    /* Interactive card hover choreography */
    .card-interactive {
      transition:
        transform      200ms cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow     200ms cubic-bezier(0.16, 1, 0.3, 1),
        border-color   200ms ease,
        background     200ms ease;
      cursor: pointer;
    }
    .card-interactive:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04) !important;
      border-color: rgba(90, 139, 110, 0.35) !important;
    }
    .card-interactive:active {
      transform: translateY(0px) scale(0.99);
      box-shadow: 0 1px 3px rgba(0,0,0,0.06) !important;
      transition-duration: 80ms;
    }

    /* Primary button press states */
    .btn-primary {
      transition:
        transform    150ms cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow   150ms ease,
        filter       150ms ease;
    }
    .btn-primary:hover {
      filter: brightness(1.06);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
      transform: translateY(-1px);
    }
    .btn-primary:active {
      transform: scale(0.97) translateY(0);
      filter: brightness(0.96);
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition-duration: 80ms;
    }

    /* Mood chip fill-sweep animation */
    .mood-chip {
      position: relative;
      overflow: hidden;
      transition: color 200ms ease, border-color 200ms ease;
      cursor: pointer;
    }
    .mood-chip::before {
      content: '';
      position: absolute;
      inset: 0;
      background: #5A8B6E;
      border-radius: inherit;
      transform: scale(0);
      transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 0;
    }
    .mood-chip.selected::before { transform: scale(1); }
    .mood-chip.selected { color: white !important; border-color: #5A8B6E !important; font-weight: 600; }
    .mood-chip span { position: relative; z-index: 1; }
    .mood-chip:hover { border-color: #5A8B6E !important; background: #EEF4F0; }
    .mood-chip.selected:hover { background: transparent; }

    /* Medication taken checkmark pop */
    .med-check-icon { animation: popIn 350ms cubic-bezier(0.16, 1, 0.3, 1) both; }

    /* Adherence bar grow on mount */
    .adherence-bar-fill {
      transform-origin: left center;
      animation: barGrow 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
      animation-delay: 300ms;
    }

    /* Condition cards */
    .condition-card {
      transition: background 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
      cursor: pointer;
    }
    .condition-card:hover {
      border-color: #5A8B6E !important;
      background: #EEF4F0 !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06) !important;
    }
    .condition-card.selected {
      background: #EEF4F0 !important;
      border: 2px solid #5A8B6E !important;
      font-weight: 600;
    }

    /* Back link */
    .back-link { transition: color 200ms ease; }
    .back-link:hover { color: #4A4742 !important; text-decoration: underline; }

    /* Tab button */
    .tab-btn { transition: color 200ms ease; }

    /* Clinician / companion prompt card hover */
    .clinician-card {
      transition: box-shadow 200ms ease, border-color 200ms ease;
    }
    .clinician-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
      border-color: rgba(90, 139, 110, 0.4) !important;
    }
    .clinician-card:hover .arrow-icon { color: #5A8B6E !important; }

    /* Desktop phone frame */
    @media (min-width: 480px) {
      .phone-frame {
        box-shadow: 0 8px 24px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.04);
        border-radius: 24px;
        overflow: hidden;
      }
    }

    /* General interactive transitions */
    button, [role="button"], input, textarea, select {
      transition:
        background-color var(--transition-base, 200ms ease),
        border-color     var(--transition-base, 200ms ease),
        box-shadow       var(--transition-base, 200ms ease),
        color            var(--transition-base, 200ms ease),
        opacity          var(--transition-base, 200ms ease);
    }

    /* Skip button hover (warning action) */
    .skip-btn { transition: border-color 200ms ease, color 200ms ease; }
    .skip-btn:hover { border-color: #C17B4A !important; color: #C17B4A !important; }

    /* Journal entry hover */
    .journal-entry {
      transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms ease, border-color 200ms ease;
    }
    .journal-entry:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important;
      border-color: rgba(90, 139, 110, 0.35) !important;
    }
  `}</style>
);

// ─── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState(S.ONBOARD_WELCOME);
  const [userName, setUserName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [condition, setCondition] = useState(null);
  const [meds, setMeds] = useState(INITIAL_MEDS);
  const [streak, setStreak] = useState(12);
  const [activeMed, setActiveMed] = useState(null);
  const [recoveryStep, setRecoveryStep] = useState(0);

  // Companion state
  const [companionMessages, setCompanionMessages] = useState([]);
  const [companionInput, setCompanionInput] = useState("");
  const [companionTyping, setCompanionTyping] = useState(false);
  const [mood, setMood] = useState(null);
  const companionEndRef = useRef(null);

  // Journal state
  const [journalText, setJournalText] = useState("");
  const [journalSaved, setJournalSaved] = useState(false);
  const [journalPrompt] = useState(pickRandom(JOURNAL_PROMPTS));

  const takenCount = meds.filter(m => m.taken).length;
  const totalMeds = meds.length;
  const adherencePct = Math.round((takenCount / totalMeds) * 100);
  const pendingMeds = meds.filter(m => !m.taken && !m.skipped);

  useEffect(() => {
    companionEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [companionMessages, companionTyping]);

  function navigate(id) { setScreen(id); }

  function openCompanion(med) {
    setActiveMed(med);
    const score = mood?.value || 2;
    const pool = score <= 2 ? AI_RESPONSES.calm : score <= 3 ? AI_RESPONSES.uneasy : AI_RESPONSES.anxious;
    setCompanionMessages([{ text: pickRandom(pool), isAI: true }]);
    setCompanionTyping(false);
    setScreen(S.COMPANION);
  }

  async function sendCompanionMessage() {
    if (!companionInput.trim()) return;
    const msg = companionInput.trim();
    setCompanionInput("");
    const updatedMessages = [...companionMessages, { text: msg, isAI: false }];
    setCompanionMessages(updatedMessages);
    setCompanionTyping(true);
    try {
      const response = await fetch(GEMINI_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          systemInstruction: COMPANION_SYSTEM,
        }),
      });

      if (!response.ok) {
        throw new Error(`Proxy error: ${response.statusText}`);
      }

      const data = await response.json();
      setCompanionMessages(prev => [...prev, { text: data.text, isAI: true }]);
    } catch (err) {
      console.error("Gemini Error:", err);
      setCompanionMessages(prev => [...prev, { text: `Error: ${err.message}`, isAI: true }]);
    } finally {
      setCompanionTyping(false);
    }
  }

  function confirmTaken() {
    setMeds(prev => prev.map(m => m.id === activeMed.id ? { ...m, taken: true } : m));
    setStreak(s => s + 1);
    setScreen(S.LOG_CELEBRATE);
  }

  function startRecovery(med) {
    setActiveMed(med);
    setMeds(prev => prev.map(m => m.id === med.id ? { ...m, skipped: true } : m));
    setRecoveryStep(0);
    setScreen(S.RECOVERY);
  }

  function completeRecovery() {
    setMeds(prev => prev.map(m => m.id === activeMed.id ? { ...m, skipped: false, taken: true } : m));
    setScreen(S.HOME);
  }

  // ── ONBOARDING: WELCOME ────────────────────────────────────────
  if (screen === S.ONBOARD_WELCOME) {
    return (
      <div style={outerWrap}>
        <GlobalStyles />
        <div className="phone-frame" style={{ ...phoneWrap, display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems: "center", padding: "0 32px 40px" }}>
          <div className="screen-enter" style={{ width: "100%", paddingTop: "3rem" }}>
            {/* Icon */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: C.sageLight,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(90,139,110,0.15)",
              }}>
                <Leaf size={28} color={C.sage} strokeWidth={1.5} />
              </div>
            </div>

            <h1 style={{ fontFamily: F.serif, fontSize: "2.25rem", color: C.text, fontWeight: 500, lineHeight: 1.2, marginBottom: 16 }}>
              You deserve care that doesn't feel clinical.
            </h1>
            <p style={{ fontFamily: F.sans, fontSize: "1rem", color: C.textBody, lineHeight: 1.6, marginBottom: 48 }}>
              A companion for the complex, quiet work of managing your health on your own terms.
            </p>
            <button
              className="btn-primary"
              onClick={() => setScreen(S.ONBOARD_NAME)}
              style={{
                width: "100%", minHeight: 52, padding: "0 24px",
                borderRadius: 9999,
                background: C.sage, border: "none",
                fontFamily: F.sans, fontSize: "1rem", fontWeight: 600,
                color: C.white, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              Begin <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ONBOARDING: NAME ──────────────────────────────────────────
  if (screen === S.ONBOARD_NAME) {
    return (
      <div style={outerWrap}>
        <GlobalStyles />
        <div className="phone-frame" style={{ ...phoneWrap, display: "flex", flexDirection: "column", padding: "56px 32px 40px" }}>
          {/* Back link */}
          <button
            className="back-link"
            onClick={() => setScreen(S.ONBOARD_WELCOME)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: F.sans, fontSize: "0.875rem", color: C.muted,
              padding: "10px 0", marginBottom: 8,
              display: "flex", alignItems: "center", gap: 6,
              minHeight: 44, alignSelf: "flex-start",
            }}
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="screen-enter" style={{ flex: 1 }}>
            <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              1 of 3
            </p>
            <ProgressDots step={1} />

            <h2 style={{ fontFamily: F.serif, fontSize: "1.5rem", color: C.text, fontWeight: 500, lineHeight: 1.35, marginBottom: 8 }}>
              What would you like to be called?
            </h2>
            <p style={{ fontFamily: F.sans, fontSize: "1rem", color: C.muted, marginBottom: 32, lineHeight: 1.6 }}>
              Your companion will use this when it speaks with you.
            </p>
            <input
              autoFocus
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && nameInput.trim() && (setUserName(nameInput.trim()), setScreen(S.ONBOARD_CONDITION))}
              placeholder="Your first name…"
              style={{
                width: "100%", padding: "16px 20px", borderRadius: 12,
                border: `1.5px solid ${nameInput ? C.sage : C.border}`,
                background: C.bgCard,
                fontFamily: F.sans, fontSize: "1rem", color: C.text,
                outline: "none",
                marginBottom: 24,
              }}
            />
            <button
              className="btn-primary"
              onClick={() => { if (nameInput.trim()) { setUserName(nameInput.trim()); setScreen(S.ONBOARD_CONDITION); } }}
              disabled={!nameInput.trim()}
              style={{
                width: "100%", minHeight: 52, padding: "0 24px",
                borderRadius: 9999,
                background: nameInput.trim() ? C.sage : C.border,
                border: "none", fontFamily: F.sans, fontSize: "1rem", fontWeight: 600,
                color: nameInput.trim() ? C.white : C.muted,
                cursor: nameInput.trim() ? "pointer" : "not-allowed",
                opacity: nameInput.trim() ? 1 : 0.7,
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ONBOARDING: CONDITION ─────────────────────────────────────
  if (screen === S.ONBOARD_CONDITION) {
    return (
      <div style={outerWrap}>
        <GlobalStyles />
        <div className="phone-frame" style={{ ...phoneWrap, display: "flex", flexDirection: "column", padding: "56px 32px 40px" }}>
          {/* Back link */}
          <button
            className="back-link"
            onClick={() => setScreen(S.ONBOARD_NAME)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: F.sans, fontSize: "0.875rem", color: C.muted,
              padding: "10px 0", marginBottom: 8,
              display: "flex", alignItems: "center", gap: 6,
              minHeight: 44, alignSelf: "flex-start",
            }}
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="screen-enter">
            <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>2 of 3</p>
            <ProgressDots step={2} />

            <h2 style={{ fontFamily: F.serif, fontSize: "1.5rem", color: C.text, fontWeight: 500, lineHeight: 1.35, marginBottom: 8 }}>
              What are you managing, {userName}?
            </h2>
            <p style={{ fontFamily: F.sans, fontSize: "1rem", color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
              This helps your companion speak to your specific experience.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {CONDITIONS.map((c, i) => (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  className={`condition-card${condition === c ? " selected" : ""}`}
                  style={{
                    padding: "14px 18px", borderRadius: 16, textAlign: "left",
                    background: condition === c ? C.sageLight : C.bgCard,
                    border: condition === c ? `2px solid ${C.sage}` : `1px solid ${C.border}`,
                    fontFamily: F.sans, fontSize: "1rem",
                    fontWeight: condition === c ? 600 : 400,
                    color: condition === c ? C.sageDark : C.text,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    boxShadow: condition === c ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  {c}
                  {condition === c && <Check size={16} color={C.sage} />}
                </button>
              ))}
            </div>
            <button
              className="btn-primary"
              onClick={() => condition && setScreen(S.ONBOARD_MEDS)}
              disabled={!condition}
              style={{
                width: "100%", minHeight: 52, padding: "0 24px",
                borderRadius: 9999,
                background: condition ? C.sage : C.border,
                border: "none", fontFamily: F.sans, fontSize: "1rem", fontWeight: 600,
                color: condition ? C.white : C.muted,
                cursor: condition ? "pointer" : "not-allowed",
                opacity: condition ? 1 : 0.7,
              }}
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ONBOARDING: MEDS ──────────────────────────────────────────
  if (screen === S.ONBOARD_MEDS) {
    return (
      <div style={outerWrap}>
        <GlobalStyles />
        <div className="phone-frame" style={{ ...phoneWrap, display: "flex", flexDirection: "column", padding: "56px 32px 40px" }}>
          {/* Back link */}
          <button
            className="back-link"
            onClick={() => setScreen(S.ONBOARD_CONDITION)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: F.sans, fontSize: "0.875rem", color: C.muted,
              padding: "10px 0", marginBottom: 8,
              display: "flex", alignItems: "center", gap: 6,
              minHeight: 44, alignSelf: "flex-start",
            }}
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="screen-enter">
            <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>3 of 3</p>
            <ProgressDots step={3} />

            <h2 style={{ fontFamily: F.serif, fontSize: "1.5rem", color: C.text, fontWeight: 500, lineHeight: 1.35, marginBottom: 8 }}>
              Here's what your care plan looks like.
            </h2>
            <p style={{ fontFamily: F.sans, fontSize: "1rem", color: C.textBody, marginBottom: 28, lineHeight: 1.6 }}>
              These have been added for you. You can always adjust later.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
              {INITIAL_MEDS.map((med, i) => (
                <div
                  key={med.id}
                  className="card-list-item"
                  style={{
                    background: C.bgCard, border: `1px solid ${C.border}`,
                    borderRadius: 16, padding: "16px",
                    display: "flex", alignItems: "center", gap: 14,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: C.sageLight,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <PillIcon color={C.sage} />
                  </div>
                  <div>
                    <p style={{ fontFamily: F.sans, fontWeight: 600, fontSize: "1rem", color: C.text }}>{med.name}</p>
                    <p style={{ fontFamily: F.sans, fontSize: "0.875rem", color: C.muted }}>{med.dose} · {med.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="btn-primary"
              onClick={() => setScreen(S.HOME)}
              style={{
                width: "100%", minHeight: 52, padding: "0 24px",
                borderRadius: 9999,
                background: C.sage, border: "none",
                fontFamily: F.sans, fontSize: "1rem", fontWeight: 600,
                color: C.white, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            >
              I'm ready <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── HOME ──────────────────────────────────────────────────────
  if (screen === S.HOME) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    const GreetIcon = hour < 12 ? Sun : hour < 18 ? Leaf : Moon;
    const displayName = userName || "Alex";
    const aColor = adherenceColor(adherencePct);

    return (
      <div style={outerWrap}>
        <GlobalStyles />
        <div className="phone-frame" style={{ ...phoneWrap, paddingBottom: 80 }}>

          {/* Header */}
          <div style={{ padding: "52px 24px 20px", background: C.bg }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <GreetIcon size={13} color={C.sage} /> {greeting}
                </p>
                <h1 style={{ fontFamily: F.serif, fontSize: "1.875rem", color: C.text, fontWeight: 500, lineHeight: 1.2 }}>
                  How are you feeling, <em>{displayName}?</em>
                </h1>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.sageLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Sparkles size={18} color={C.sage} strokeWidth={1.5} />
              </div>
            </div>
          </div>

          <div style={{ padding: "0 24px 24px" }}>

            {/* Streak Ring Card */}
            <div
              style={{
                background: C.bgCard, borderRadius: 20, padding: "24px",
                border: `1px solid ${C.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                display: "flex", flexDirection: "column", alignItems: "center",
                marginBottom: 20, animation: "fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) 0.1s both",
              }}
            >
              <StreakRing streak={streak} />
              <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted, marginTop: 8 }}>
                Keep going — halfway at day 15
              </p>
            </div>

            {/* Medications */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
                Today's medications
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {meds.map((med, i) => (
                  <div
                    key={med.id}
                    className="card-list-item"
                    style={{
                      background: med.taken ? C.sageLight : C.bgCard,
                      border: `1px solid ${med.taken ? "rgba(90,139,110,0.4)" : C.border}`,
                      borderRadius: 16, padding: "14px 16px",
                      display: "flex", alignItems: "center", gap: 14,
                      boxShadow: "0 1px 3px rgba(26,26,24,0.05)",
                      transition: "background 300ms ease, border-color 300ms ease",
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: med.taken ? "rgba(90,139,110,0.2)" : C.sageLight,
                      border: `1px solid ${med.taken ? "rgba(90,139,110,0.3)" : C.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <PillIcon color={med.taken ? C.sageDark : C.sage} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: F.sans, fontWeight: 600, fontSize: "1rem", color: med.taken ? C.sageDark : C.text, marginBottom: 2 }}>{med.name}</p>
                      <p style={{ fontFamily: F.sans, fontSize: "0.875rem", color: C.muted }}>{med.dose} · {med.time}</p>
                    </div>
                    {med.taken ? (
                      <div className="med-check-icon" style={{ width: 28, height: 28, borderRadius: "50%", background: C.sage, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Check size={14} color={C.white} strokeWidth={2.5} />
                      </div>
                    ) : med.skipped ? (
                      <button
                        onClick={() => { setActiveMed(med); setRecoveryStep(0); setScreen(S.RECOVERY); }}
                        style={{ background: C.terraLight, border: `1px solid ${C.terra}`, borderRadius: 9999, padding: "6px 14px", fontFamily: F.sans, fontSize: "0.75rem", color: C.terra, cursor: "pointer", fontWeight: 500 }}
                      >
                        Return
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <button
                          className="skip-btn"
                          onClick={() => startRecovery(med)}
                          style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 9999, padding: "7px 12px", fontFamily: F.sans, fontSize: "0.75rem", color: C.muted, cursor: "pointer", fontWeight: 500, minHeight: 36 }}
                        >
                          Skip
                        </button>
                        <button
                          className="btn-primary"
                          onClick={() => { setActiveMed(med); setScreen(S.LOG_CONFIRM); }}
                          style={{ background: C.sage, border: "none", borderRadius: 9999, padding: "7px 16px", fontFamily: F.sans, fontSize: "0.75rem", fontWeight: 600, color: C.white, cursor: "pointer", letterSpacing: "0.03em", minHeight: 36 }}
                        >
                          Take
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Adherence bar */}
            <div style={{ background: C.bgCard, borderRadius: 16, padding: "18px", border: `1px solid ${C.border}`, animation: "fadeUp 0.5s ease 0.5s both", boxShadow: "0 1px 3px rgba(26,26,24,0.05)", marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Today's adherence</p>
                <span style={{ fontFamily: F.serif, fontSize: "1.25rem", color: aColor, fontWeight: 600 }}>{adherencePct}%</span>
              </div>
              <div style={{ height: 7, borderRadius: 9999, background: C.borderLight, overflow: "hidden" }}>
                <div
                  className="adherence-bar-fill"
                  style={{ height: "100%", width: `${adherencePct}%`, borderRadius: 9999, background: aColor }}
                />
              </div>
              <p style={{ fontFamily: F.sans, fontSize: "0.875rem", color: C.muted, marginTop: 10 }}>{takenCount} of {totalMeds} medications taken today</p>
            </div>

            {/* Open companion */}
            {pendingMeds.length > 0 && (
              <button
                className="card-interactive"
                onClick={() => openCompanion(pendingMeds[0])}
                style={{
                  width: "100%", padding: "14px 18px",
                  background: C.terraLight, border: `1px solid rgba(193,123,74,0.25)`,
                  borderRadius: 16, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12,
                  animation: "fadeUp 0.5s ease 0.6s both",
                  textAlign: "left",
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(193,123,74,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MessageCircle size={18} color={C.terra} strokeWidth={1.5} />
                </div>
                <div>
                  <p style={{ fontFamily: F.serif, fontSize: "1rem", color: C.text, fontStyle: "italic" }}>
                    "Not feeling ready to take your medication?"
                  </p>
                  <p style={{ fontFamily: F.sans, fontSize: "0.875rem", color: C.muted, marginTop: 2 }}>Talk with your companion first</p>
                </div>
              </button>
            )}
          </div>

          <BottomNav current={S.HOME} onNavigate={navigate} />
        </div>
      </div>
    );
  }

  // ── LOG CONFIRM ───────────────────────────────────────────────
  if (screen === S.LOG_CONFIRM) {
    return (
      <div style={outerWrap}>
        <GlobalStyles />
        <div className="phone-frame" style={{ ...phoneWrap, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "56px 24px 20px", borderBottom: `1px solid ${C.border}` }}>
            <button
              className="back-link"
              onClick={() => setScreen(S.HOME)}
              style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontFamily: F.sans, fontSize: "0.875rem", padding: "10px 0", display: "flex", alignItems: "center", gap: 6, marginBottom: 16, minHeight: 44 }}
            >
              <ChevronLeft size={16} /> Back
            </button>
            <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Confirm dose</p>
            <h2 style={{ fontFamily: F.serif, fontSize: "1.5rem", color: C.text, fontWeight: 500 }}>
              Ready to take your<br /><em>{activeMed?.name}?</em>
            </h2>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
            <div style={{
              width: 140, height: 140, borderRadius: "50%",
              background: C.sageLight,
              border: `2px solid rgba(90,139,110,0.35)`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              marginBottom: 24, cursor: "pointer",
              animation: "scaleIn 0.4s ease both",
              boxShadow: "0 4px 24px rgba(90,139,110,0.2)",
            }} onClick={confirmTaken}>
              <PillIcon color={C.sage} size={40} />
              <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.sageDark, marginTop: 8, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Tap to confirm</p>
            </div>

            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <p style={{ fontFamily: F.serif, fontSize: "1.25rem", color: C.text, fontWeight: 400, marginBottom: 4 }}>{activeMed?.name}</p>
              <p style={{ fontFamily: F.sans, fontSize: "0.875rem", color: C.muted }}>{activeMed?.dose} · {activeMed?.time}</p>
            </div>

            <button
              className="btn-primary"
              onClick={confirmTaken}
              style={{
                width: "100%", minHeight: 52, padding: "0 24px", borderRadius: 9999,
                background: C.sage, border: "none",
                fontFamily: F.sans, fontSize: "1rem", fontWeight: 600,
                color: C.white, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              <Check size={18} /> I've taken this dose
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LOG CELEBRATE ─────────────────────────────────────────────
  if (screen === S.LOG_CELEBRATE) {
    return (
      <div style={outerWrap}>
        <GlobalStyles />
        <div className="phone-frame" style={{ ...phoneWrap, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", background: C.dark }}>
          <div style={{ textAlign: "center", animation: "celebPop 0.6s ease both" }}>
            <div style={{ marginBottom: 32 }}>
              <StreakRing streak={streak} />
            </div>
            <h2 style={{ fontFamily: F.serif, fontSize: "1.75rem", color: C.white, fontWeight: 400, marginBottom: 16, lineHeight: 1.3 }}>
              Day {streak}. <em>Well done.</em>
            </h2>
            <p style={{ fontFamily: F.sans, fontSize: "1rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 48 }}>
              You took your {activeMed?.name}. That took something. Be proud of yourself.
            </p>
            <button
              className="btn-primary"
              onClick={() => setScreen(S.HOME)}
              style={{
                width: "100%", minHeight: 52, padding: "0 24px", borderRadius: 9999,
                background: C.sage, border: "none",
                fontFamily: F.sans, fontSize: "1rem", fontWeight: 600,
                color: C.white, cursor: "pointer",
              }}
            >
              Back to today
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── COMPANION ─────────────────────────────────────────────────
  if (screen === S.COMPANION) {
    const medTaken = meds.find(m => m.id === activeMed?.id)?.taken;
    return (
      <div style={outerWrap}>
        <GlobalStyles />
        <div className="phone-frame" style={{ ...phoneWrap, paddingBottom: 80 }}>

          {/* Header */}
          <div style={{ padding: "52px 24px 20px", background: C.bg, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%",
                background: C.bgAI,
                border: `2px solid rgba(193,123,74,0.3)`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Sparkles size={22} color={C.terra} strokeWidth={1.5} />
              </div>
              <div>
                <p style={{ fontFamily: F.serif, fontSize: "1.25rem", fontWeight: 500, color: C.text }}>Your companion</p>
                <p style={{ fontFamily: F.sans, fontSize: "0.875rem", color: C.sage, fontStyle: "italic" }}>Here with you</p>
              </div>
              {activeMed && (
                <div style={{ marginLeft: "auto", background: C.sageLight, borderRadius: 9999, padding: "5px 14px" }}>
                  <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.sageDark, fontWeight: 500 }}>{activeMed.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Static conversation history */}
          <div style={{ padding: "20px 24px 0" }}>
            <div style={{ opacity: 0.65 }}>
              {/* Past companion message */}
              <div style={{
                background: C.bgAI, borderRadius: 16, padding: "18px 20px",
                border: `1px solid #E8D8C0`, marginBottom: 12,
              }}>
                <p style={{ fontFamily: F.serif, fontSize: "0.9375rem", lineHeight: 1.75, color: C.textBody, fontStyle: "italic" }}>
                  "It sounds like yesterday was heavy. Rest is part of the work too."
                </p>
                <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted, marginTop: 8 }}>Yesterday, 8:42 PM</p>
              </div>
              {/* User reply */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                <div style={{ background: C.sage, borderRadius: "14px 4px 14px 14px", padding: "10px 14px", maxWidth: "75%" }}>
                  <p style={{ fontFamily: F.sans, fontSize: "0.875rem", color: C.white, lineHeight: 1.55 }}>
                    Yeah, I ended up skipping Methotrexate.
                  </p>
                </div>
              </div>
              {/* Companion follow-up */}
              <div style={{
                background: C.bgAI, borderRadius: 16, padding: "16px 18px",
                border: `1px solid #E8D8C0`, marginBottom: 4,
              }}>
                <p style={{ fontFamily: F.serif, fontSize: "0.875rem", lineHeight: 1.7, color: C.textBody, fontStyle: "italic" }}>
                  "I noted that. How are you feeling about it now?"
                </p>
              </div>
            </div>
          </div>

          {/* Mood selector (if no mood set) */}
          {!mood && (
            <div style={{ padding: "20px 24px", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.borderLight}`, background: C.bgAI, marginTop: 16 }}>
              <p style={{ fontFamily: F.serif, fontSize: "1.125rem", color: C.text, fontStyle: "italic", marginBottom: 14 }}>How are you feeling right now?</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[
                  { label: "Calm", value: 1 },
                  { label: "Okay", value: 2 },
                  { label: "Uneasy", value: 3 },
                  { label: "Anxious", value: 4 },
                  { label: "Overwhelmed", value: 5 },
                ].map(m => (
                  <button
                    key={m.value}
                    onClick={() => {
                      setMood(m);
                      const pool = m.value <= 2 ? AI_RESPONSES.calm : m.value <= 3 ? AI_RESPONSES.uneasy : AI_RESPONSES.anxious;
                      setCompanionMessages([{ text: pickRandom(pool), isAI: true }]);
                    }}
                    className={`mood-chip${mood?.value === m.value ? " selected" : ""}`}
                    style={{
                      padding: "8px 16px", borderRadius: 9999,
                      background: C.bgCard, border: `1px solid ${C.border}`,
                      fontFamily: F.sans, fontSize: "0.875rem", color: C.textBody,
                    }}
                  >
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Letter-style messages */}
          <div style={{ padding: "24px 24px 0", overflowY: "auto", maxHeight: "calc(100vh - 220px)", paddingBottom: 160 }}>
            {companionMessages.map((msg, i) => (
              <div
                key={i}
                style={{ marginBottom: 20, animation: "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both" }}
              >
                {msg.isAI ? (
                  <div style={{
                    background: C.bgAI,
                    borderRadius: 16, padding: "24px",
                    border: `1px solid #E8D8C0`,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}>
                    <p style={{
                      fontFamily: F.serif,
                      fontStyle: "italic",
                      fontSize: "1.125rem", lineHeight: 1.7,
                      color: C.textBody,
                      whiteSpace: "pre-line",
                    }}>
                      {msg.text}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{
                      maxWidth: "78%",
                      background: C.sage, borderRadius: "14px 4px 14px 14px",
                      padding: "12px 16px",
                    }}>
                      <p style={{ fontFamily: F.sans, fontSize: "0.875rem", color: C.white, lineHeight: 1.55 }}>{msg.text}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {companionTyping && (
              <div style={{ background: C.bgAI, borderRadius: 16, padding: "20px 24px", marginBottom: 20, border: `1px solid #E8D8C0` }}>
                <p style={{ fontFamily: F.serif, fontSize: "1rem", color: C.muted, fontStyle: "italic" }}>Writing…</p>
              </div>
            )}
            <div ref={companionEndRef} />
          </div>

          {/* Bottom input */}
          <div style={{
            position: "fixed", bottom: 65, left: "50%", transform: "translateX(-50%)",
            width: "100%", maxWidth: 390,
            background: C.white, borderTop: `1px solid ${C.border}`,
            padding: "14px 20px 14px",
            zIndex: 10,
          }}>
            {activeMed && !medTaken && (
              <button
                className="btn-primary"
                onClick={() => setScreen(S.LOG_CONFIRM)}
                style={{
                  width: "100%", minHeight: 48, padding: "0 20px", borderRadius: 9999, marginBottom: 12,
                  background: C.sage, border: "none",
                  fontFamily: F.sans, fontSize: "0.9375rem", fontWeight: 600,
                  color: C.white, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Check size={16} /> I'm ready to take my {activeMed.name}
              </button>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={companionInput}
                onChange={e => setCompanionInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendCompanionMessage()}
                placeholder="Reply to your companion…"
                style={{
                  flex: 1, padding: "12px 18px", borderRadius: 9999,
                  border: `1px solid ${C.border}`, background: C.bg,
                  fontFamily: F.sans, fontSize: "1rem", color: C.text, outline: "none",
                }}
              />
              <button
                className="btn-primary"
                onClick={sendCompanionMessage}
                style={{
                  background: C.sage, border: "none",
                  borderRadius: 9999, width: 44, height: 44, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}
              >
                <Send size={16} color={C.white} />
              </button>
            </div>
          </div>

          <BottomNav current={S.COMPANION} onNavigate={navigate} />
        </div>
      </div>
    );
  }

  // ── JOURNAL ───────────────────────────────────────────────────
  if (screen === S.JOURNAL) {
    return (
      <div style={outerWrap}>
        <GlobalStyles />
        <div className="phone-frame" style={{ ...phoneWrap, paddingBottom: 80 }}>

          <div style={{ padding: "52px 24px 24px" }}>
            <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Start your journal</p>
            <h2 style={{ fontFamily: F.serif, fontSize: "1.5rem", color: C.text, fontWeight: 400, lineHeight: 1.35, marginBottom: 8 }}>
              <em>{journalPrompt}</em>
            </h2>
            <p style={{ fontFamily: F.sans, fontSize: "1rem", color: C.textBody, marginBottom: 24, lineHeight: 1.6 }}>
              No form to fill. Just say what's true today.
            </p>

            <div style={{ position: "relative", marginBottom: 20 }}>
              <textarea
                value={journalText}
                onChange={e => { setJournalText(e.target.value); setJournalSaved(false); }}
                placeholder="Write here…"
                rows={7}
                style={{
                  width: "100%", padding: "18px 20px",
                  borderRadius: 16,
                  border: `1.5px solid ${journalText ? "rgba(193,123,74,0.4)" : C.border}`,
                  background: journalText ? C.bgAI : C.bgCard,
                  fontFamily: F.sans, fontSize: "1rem", color: C.text,
                  lineHeight: 1.8, outline: "none",
                  transition: "all 0.25s ease",
                  boxShadow: journalText ? "0 2px 12px rgba(193,123,74,0.08)" : "none",
                  minHeight: 140,
                }}
              />
            </div>

            <button
              className="btn-primary"
              onClick={() => { if (journalText.trim()) setJournalSaved(true); }}
              disabled={!journalText.trim() || journalSaved}
              style={{
                width: "100%", minHeight: 52, padding: "0 24px", borderRadius: 9999,
                background: journalSaved ? C.sageLight : journalText.trim() ? C.sage : C.border,
                border: "none", fontFamily: F.sans, fontSize: "1rem", fontWeight: 600,
                color: journalSaved ? C.sageDark : journalText.trim() ? C.white : C.muted,
                cursor: journalText.trim() && !journalSaved ? "pointer" : "not-allowed",
                opacity: journalText.trim() || journalSaved ? 1 : 0.6,
                transition: "background 300ms ease, color 200ms ease, opacity 200ms ease",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {journalSaved ? (
                <><Check size={16} /> Planted — {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</>
              ) : "Plant this memory"}
            </button>

            {/* Past entries */}
            <div style={{ marginTop: 36 }}>
              <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Recent</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { date: "Mar 4", text: "Fatigue was high this morning but it lifted around noon. Grateful for that." },
                  { date: "Mar 2", text: "Joints felt stiff on waking but the walk helped. Took all three today." },
                  { date: "Feb 28", text: "Hard day. Didn't want to take anything. Wrote this instead. Tomorrow." },
                ].map((entry, i) => (
                  <div
                    key={i}
                    className="journal-entry card-list-item"
                    style={{
                      background: C.bgCard, border: `1px solid ${C.border}`,
                      borderRadius: 16, padding: "16px 18px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    }}
                  >
                    <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted, marginBottom: 6, fontWeight: 500 }}>{entry.date}</p>
                    <p style={{ fontFamily: F.serif, fontSize: "1rem", color: C.textBody, lineHeight: 1.65, fontStyle: "italic" }}>&ldquo;{entry.text}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <BottomNav current={S.JOURNAL} onNavigate={navigate} />
        </div>
      </div>
    );
  }

  // ── INSIGHTS ──────────────────────────────────────────────────
  if (screen === S.INSIGHTS) {
    const weekData = [
      { day: "Mon", pct: 100 },
      { day: "Tue", pct: 67 },
      { day: "Wed", pct: 100 },
      { day: "Thu", pct: 100 },
      { day: "Fri", pct: 33 },
      { day: "Sat", pct: 100 },
      { day: "Sun", pct: adherencePct },
    ];
    const weekAvg = Math.round(weekData.reduce((a, d) => a + d.pct, 0) / 7);

    return (
      <div style={outerWrap}>
        <GlobalStyles />
        <div className="phone-frame" style={{ ...phoneWrap, paddingBottom: 80 }}>

          <div style={{ padding: "52px 24px 24px" }}>
            <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Weekly Insights</p>
            <h2 style={{ fontFamily: F.serif, fontSize: "1.875rem", color: C.text, fontWeight: 400, fontStyle: "italic", lineHeight: 1.2, marginBottom: 4 }}>
              A good week, <em>{userName || "Alex"}.</em>
            </h2>
            <p style={{ fontFamily: F.sans, fontSize: "1rem", color: C.textBody, marginBottom: 24 }}>Here's what your care looked like.</p>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Streak", value: `${streak}d`, color: C.sage },
                { label: "This week", value: `${weekAvg}%`, color: adherenceColor(weekAvg) },
                { label: "This month", value: "84%", color: adherenceColor(84) },
              ].map((s, i) => (
                <div
                  key={i}
                  className="card-list-item"
                  style={{
                    flex: 1, background: C.bgCard,
                    borderRadius: 16, padding: "16px 10px",
                    border: `1px solid ${C.border}`, textAlign: "center",
                    boxShadow: "0 1px 3px rgba(26,26,24,0.05)",
                  }}
                >
                  <p style={{ fontFamily: F.sans, fontSize: "1.5rem", color: s.color, fontWeight: 700 }}>{s.value}</p>
                  <p style={{ fontFamily: F.sans, fontSize: "0.625rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Week bar chart */}
            <div style={{ background: C.bgCard, borderRadius: 16, padding: "20px", border: `1px solid ${C.border}`, marginBottom: 16, animation: "fadeUp 0.5s ease 0.3s both", boxShadow: "0 1px 3px rgba(26,26,24,0.05)" }}>
              <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Daily adherence</p>

              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                {/* Y-axis labels */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: 80, paddingBottom: 20, gap: 0 }}>
                  <span style={{ fontFamily: F.sans, fontSize: "0.625rem", color: C.muted, lineHeight: 1 }}>100%</span>
                  <span style={{ fontFamily: F.sans, fontSize: "0.625rem", color: C.muted, lineHeight: 1 }}>50%</span>
                  <span style={{ fontFamily: F.sans, fontSize: "0.625rem", color: C.muted, lineHeight: 1 }}>0%</span>
                </div>

                {/* Chart bars */}
                <div style={{ flex: 1 }}>
                  {/* 50% reference line */}
                  <div style={{ position: "relative" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80 }}>
                      {weekData.map((d, i) => {
                        const barColor = d.pct === 100 ? C.sage : d.pct > 0 ? C.terra : C.border;
                        return (
                          <div
                            key={i}
                            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
                            title={`${d.day}: ${d.pct}% adherence`}
                          >
                            <div style={{
                              width: "100%",
                              height: Math.max(d.pct * 0.56, 3),
                              borderRadius: "4px 4px 0 0",
                              background: barColor,
                              transition: "height 0.8s ease",
                              minHeight: 3,
                            }} />
                            <span style={{ fontFamily: F.sans, fontSize: "0.625rem", color: C.muted }}>{d.day}</span>
                          </div>
                        );
                      })}
                    </div>
                    {/* 50% dashed line */}
                    <div style={{
                      position: "absolute",
                      left: 0, right: 0,
                      bottom: 20 + (80 * 0.5 * 0.7),
                      height: 1,
                      background: C.borderLight,
                      pointerEvents: "none",
                    }} />
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.sage }} />
                  <span style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted }}>Taken</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.terra }} />
                  <span style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted }}>Missed</span>
                </div>
              </div>
            </div>

            {/* Companion quote card */}
            <div style={{ background: C.bgAI, borderRadius: 16, padding: "20px 22px", border: `1px solid rgba(193,123,74,0.2)`, marginBottom: 16, animation: "fadeUp 0.5s ease 0.4s both", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
              <p style={{ fontFamily: F.serif, fontSize: "1rem", color: C.textBody, lineHeight: 1.75, fontStyle: "italic" }}>
                "You've taken your medication on {weekAvg}% of days this week. That consistency is doing quiet, important work in your body — even on the days it doesn't feel like it."
              </p>
            </div>

            {/* Clinician link */}
            <button
              className="clinician-card"
              onClick={() => setScreen(S.CLINICIAN)}
              style={{
                width: "100%", padding: "14px 18px", borderRadius: 16,
                background: C.bgCard, border: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer", animation: "fadeUp 0.5s ease 0.5s both",
                boxShadow: "0 1px 3px rgba(26,26,24,0.05)",
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.sageLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Stethoscope size={18} color={C.sage} strokeWidth={1.5} />
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontFamily: F.sans, fontWeight: 600, fontSize: "1rem", color: C.text }}>Clinician summary</p>
                <p style={{ fontFamily: F.sans, fontSize: "0.875rem", color: C.muted }}>What your doctor sees at your next visit</p>
              </div>
              <ArrowRight size={16} color={C.muted} className="arrow-icon" style={{ marginLeft: "auto" }} />
            </button>
          </div>

          <BottomNav current={S.INSIGHTS} onNavigate={navigate} />
        </div>
      </div>
    );
  }

  // ── CLINICIAN SUMMARY ─────────────────────────────────────────
  if (screen === S.CLINICIAN) {
    return (
      <div style={outerWrap}>
        <GlobalStyles />
        <div className="phone-frame" style={{ ...phoneWrap, paddingBottom: 40 }}>

          <div style={{ padding: "56px 24px 20px", background: C.bg, borderBottom: `1px solid ${C.border}` }}>
            <button
              className="back-link"
              onClick={() => setScreen(S.INSIGHTS)}
              style={{
                background: "none", border: "none", color: C.sage, cursor: "pointer",
                fontFamily: F.sans, fontSize: "0.875rem", fontWeight: 500,
                padding: "10px 0", display: "flex", alignItems: "center", gap: 6,
                marginBottom: 20, minHeight: 44,
              }}
            >
              <ChevronLeft size={16} /> Insights
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.sageLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Stethoscope size={20} color={C.sage} strokeWidth={1.5} />
              </div>
              <div>
                <p style={{ fontFamily: F.serif, fontSize: "1.125rem", fontWeight: 500, color: C.text }}>Clinician View</p>
                <p style={{ fontFamily: F.sans, fontSize: "0.875rem", color: C.muted }}>What your doctor sees</p>
              </div>
            </div>
          </div>

          <div style={{ padding: "24px" }}>
            {/* Patient info */}
            <div style={{ background: C.bgCard, borderRadius: 20, padding: "20px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 3px rgba(26,26,24,0.05)", animation: "fadeUp 0.4s ease both" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <p style={{ fontFamily: F.serif, fontSize: "1.25rem", fontWeight: 600, color: C.text }}>{userName || "Alex"} — Patient</p>
                  <p style={{ fontFamily: F.sans, fontSize: "0.875rem", color: C.muted, marginTop: 2 }}>{condition || "Rheumatoid Arthritis"}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted }}>Report generated</p>
                  <p style={{ fontFamily: F.sans, fontSize: "0.875rem", color: C.muted }}>5 Mar 2026</p>
                </div>
              </div>
              <div style={{ height: 1, background: C.border, marginBottom: 14 }} />
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { label: "Streak", value: `${streak} days`, color: C.sage },
                  { label: "30-day avg", value: "87%", color: adherenceColor(87) },
                  { label: "Missed", value: "4 doses", color: C.terra },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center" }}>
                    <p style={{ fontFamily: F.sans, fontSize: "1.125rem", color: s.color, fontWeight: 700 }}>{s.value}</p>
                    <p style={{ fontFamily: F.sans, fontSize: "0.625rem", color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Medication log */}
            <div style={{ background: C.bgCard, borderRadius: 16, padding: "18px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 3px rgba(26,26,24,0.05)", animation: "fadeUp 0.4s ease 0.1s both" }}>
              <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Current regimen</p>
              {INITIAL_MEDS.map((med, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: i < INITIAL_MEDS.length - 1 ? 12 : 0, marginBottom: i < INITIAL_MEDS.length - 1 ? 12 : 0, borderBottom: i < INITIAL_MEDS.length - 1 ? `1px solid ${C.borderLight}` : "none" }}>
                  <div>
                    <p style={{ fontFamily: F.sans, fontWeight: 600, fontSize: "0.9375rem", color: C.text }}>{med.name}</p>
                    <p style={{ fontFamily: F.sans, fontSize: "0.875rem", color: C.muted }}>{med.dose} · {med.time}</p>
                  </div>
                  {/* Status pill */}
                  <div style={{
                    background: (i === 1 || meds[i].taken) ? C.sageLight : C.terraLight,
                    borderRadius: 9999, padding: "3px 12px",
                  }}>
                    <p style={{
                      fontFamily: F.sans, fontSize: "0.75rem",
                      color: (i === 1 || meds[i].taken) ? C.sage : C.terra,
                      fontWeight: 600,
                    }}>
                      {i === 1 || meds[i].taken ? "Taken today" : "Pending"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mood pattern */}
            <div style={{ background: C.bgCard, borderRadius: 16, padding: "18px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 3px rgba(26,26,24,0.05)", animation: "fadeUp 0.4s ease 0.2s both" }}>
              <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Emotional patterns (30 days)</p>
              {/* Legend */}
              <div style={{ display: "flex", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
                {[
                  { label: "Calm / Okay", color: C.sage },
                  { label: "Uneasy", color: "#C4973A" },
                  { label: "Anxious", color: C.terra },
                ].map((e, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: e.color }} />
                    <span style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted }}>{e.label}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { label: "Calm / Okay", pct: 58, color: C.sage },
                  { label: "Uneasy", pct: 28, color: "#C4973A" },
                  { label: "Anxious", pct: 14, color: C.terra },
                ].map((e, i) => (
                  <div key={i} style={{ flex: 1 }}>
                    <div style={{ height: 6, borderRadius: 4, background: C.borderLight, overflow: "hidden", marginBottom: 6 }}>
                      <div style={{ height: "100%", width: `${e.pct}%`, background: e.color, borderRadius: 4 }} />
                    </div>
                    <p style={{ fontFamily: F.sans, fontSize: "0.625rem", color: C.muted }}>{e.label}</p>
                    <p style={{ fontFamily: F.sans, fontSize: "0.9375rem", color: C.text, fontWeight: 600 }}>{e.pct}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Note */}
            <div style={{ background: C.bgAI, borderRadius: 16, padding: "20px", border: `1px solid ${C.border}`, animation: "fadeUp 0.4s ease 0.3s both" }}>
              <p style={{ fontFamily: F.sans, fontSize: "0.75rem", color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>App-generated note</p>
              <p style={{ fontFamily: F.serif, fontSize: "1rem", color: C.textBody, lineHeight: 1.75, fontStyle: "italic" }}>
                "Patient has maintained a {streak}-day adherence streak. Anxiety-related non-adherence patterns were flagged on 3 occasions — all resolved via companion check-in. Overall trend is positive."
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── RECOVERY ──────────────────────────────────────────────────
  if (screen === S.RECOVERY) {
    const step = RECOVERY_STEPS[recoveryStep];
    return (
      <div style={outerWrap}>
        <GlobalStyles />
        <div className="phone-frame" style={{ ...phoneWrap }}>
          <div style={{ padding: "56px 24px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.terraLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Heart size={16} color={C.terra} strokeWidth={1.5} />
              </div>
              <div>
                <p style={{ fontFamily: F.sans, fontWeight: 500, fontSize: "0.9375rem", color: C.terra }}>Coming back</p>
                <p style={{ fontFamily: F.sans, fontSize: "0.875rem", color: C.muted }}>{activeMed?.name} · {activeMed?.dose}</p>
              </div>
            </div>

            {/* Progress */}
            <div style={{ display: "flex", gap: 6, marginBottom: 36 }}>
              {RECOVERY_STEPS.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 9999, background: i <= recoveryStep ? C.terra : C.border, transition: "background 0.4s ease" }} />
              ))}
            </div>

            <h2 style={{ fontFamily: F.serif, fontSize: "1.625rem", color: C.text, fontWeight: 400, marginBottom: 16, lineHeight: 1.3, animation: "fadeUp 0.5s ease both" }}>
              {step.title}
            </h2>

            {step.body && (
              <p style={{ fontFamily: F.sans, fontSize: "1rem", color: C.textBody, lineHeight: 1.75, marginBottom: 32, whiteSpace: "pre-line", animation: "fadeUp 0.5s ease 0.1s both" }}>
                {step.body}
              </p>
            )}

            {step.options ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeUp 0.5s ease 0.2s both" }}>
                {step.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setRecoveryStep(s => s + 1)}
                    className="card-interactive"
                    style={{
                      background: C.bgCard, border: `1px solid ${C.border}`,
                      borderRadius: 16, padding: "14px 18px",
                      fontFamily: F.sans, fontSize: "1rem", color: C.text,
                      cursor: "pointer", textAlign: "left",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <button
                className="btn-primary"
                onClick={() => step.final ? completeRecovery() : setRecoveryStep(s => s + 1)}
                style={{
                  width: "100%", minHeight: 52, padding: "0 24px", borderRadius: 9999,
                  background: step.final ? C.sage : C.terra,
                  border: "none", fontFamily: F.sans, fontSize: "1rem", fontWeight: 600,
                  color: C.white, cursor: "pointer", animation: "fadeUp 0.5s ease 0.2s both",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {step.action}
                {step.final && <Check size={16} />}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
