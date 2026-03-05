import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  Home, MessageCircle, BookOpen, BarChart2, ChevronLeft,
  Check, Leaf, Sun, Moon, Clock, User, Stethoscope, Activity,
  Heart, Sparkles, ArrowRight, Calendar, TrendingUp
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

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: COMPANION_SYSTEM,
});

// ─── DESIGN TOKENS ────────────────────────────────────────────────
const C = {
  bg:           "#F7F3EE",
  bgCard:       "#FFFFFF",
  bgAI:         "#FDF0E0",
  sage:         "#6B9E7A",
  sageLight:    "#E5EFE7",
  sageDark:     "#4A7A5A",
  terra:        "#C4835A",
  terraLight:   "#F5E6DB",
  terraDark:    "#A05A38",
  text:         "#1A1A18",
  muted:        "#6B7280",
  light:        "#9CA3AF",
  streak:       "#10B981",
  border:       "#E8E0D5",
  borderLight:  "#F0EAE2",
  dark:         "#1A2B22",
  darkSurface:  "#233828",
  white:        "#FFFFFF",
};

const F = {
  serif: "'Lora', Georgia, serif",
  sans:  "'DM Sans', system-ui, sans-serif",
};

// ─── SCREENS ──────────────────────────────────────────────────────
const S = {
  ONBOARD_WELCOME:   "onboard_welcome",
  ONBOARD_NAME:      "onboard_name",
  ONBOARD_CONDITION: "onboard_condition",
  ONBOARD_MEDS:      "onboard_meds",
  HOME:              "home",
  LOG_CONFIRM:       "log_confirm",
  LOG_CELEBRATE:     "log_celebrate",
  COMPANION:         "companion",
  JOURNAL:           "journal",
  INSIGHTS:          "insights",
  CLINICIAN:         "clinician",
  RECOVERY:          "recovery",
};

// ─── DATA ─────────────────────────────────────────────────────────
const INITIAL_MEDS = [
  { id: 1, name: "Methotrexate",      dose: "15mg",  time: "8:00 AM",  taken: false, skipped: false },
  { id: 2, name: "Folic Acid",        dose: "5mg",   time: "8:00 AM",  taken: true,  skipped: false },
  { id: 3, name: "Hydroxychloroquine",dose: "200mg", time: "2:00 PM",  taken: false, skipped: false },
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
  background: "#EDE8E2",
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
    <svg width="176" height="176" viewBox="0 0 176 176" aria-label={`${streak} day streak`}>
      <circle cx="88" cy="88" r={r} fill="none" stroke={C.borderLight} strokeWidth="10" />
      <circle
        cx="88" cy="88" r={r} fill="none"
        stroke={C.streak} strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 88 88)"
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
      />
      <text x="88" y="78" textAnchor="middle" fontFamily="Lora, Georgia, serif" fontSize="40" fill={C.text} fontWeight="600">{streak}</text>
      <text x="88" y="100" textAnchor="middle" fontFamily="DM Sans, system-ui, sans-serif" fontSize="12" fill={C.muted}>day streak</text>
      <text x="88" y="116" textAnchor="middle" fontFamily="DM Sans, system-ui, sans-serif" fontSize="11" fill={C.light}>of {goal} goal</text>
    </svg>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────
function BottomNav({ current, onNavigate }) {
  const tabs = [
    { id: S.HOME,       icon: Home,          label: "Today" },
    { id: S.COMPANION,  icon: MessageCircle, label: "Companion" },
    { id: S.JOURNAL,    icon: BookOpen,      label: "Journal" },
    { id: S.INSIGHTS,   icon: BarChart2,     label: "Insights" },
  ];
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 390,
      background: C.white,
      borderTop: `1px solid ${C.border}`,
      display: "flex",
      paddingBottom: 16,
    }}>
      {tabs.map(tab => {
        const active = current === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              gap: 4, padding: "12px 0 0", background: "none", border: "none",
              cursor: "pointer",
              color: active ? C.sage : C.light,
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
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:wght@300;400;500;600&display=swap');
    @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    @keyframes scaleIn { from { opacity:0; transform:scale(0.92) } to { opacity:1; transform:scale(1) } }
    @keyframes ripple { 0%{transform:scale(0);opacity:0.4} 100%{transform:scale(4);opacity:0} }
    @keyframes celebPop { 0%{transform:scale(0.8);opacity:0} 60%{transform:scale(1.08)} 100%{transform:scale(1);opacity:1} }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 0; }
    input, textarea, button { font-family: inherit; }
    textarea { resize: none; }
  `}</style>
);

// ─── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]           = useState(S.ONBOARD_WELCOME);
  const [userName, setUserName]       = useState("");
  const [nameInput, setNameInput]     = useState("");
  const [condition, setCondition]     = useState(null);
  const [meds, setMeds]               = useState(INITIAL_MEDS);
  const [streak, setStreak]           = useState(12);
  const [activeMed, setActiveMed]     = useState(null);
  const [recoveryStep, setRecoveryStep] = useState(0);

  // Companion state
  const [companionMessages, setCompanionMessages] = useState([]);
  const [companionInput, setCompanionInput]       = useState("");
  const [companionTyping, setCompanionTyping]     = useState(false);
  const [mood, setMood]               = useState(null);
  const companionEndRef               = useRef(null);

  // Journal state
  const [journalText, setJournalText] = useState("");
  const [journalSaved, setJournalSaved] = useState(false);
  const [journalPrompt]               = useState(pickRandom(JOURNAL_PROMPTS));

  const takenCount    = meds.filter(m => m.taken).length;
  const totalMeds     = meds.length;
  const adherencePct  = Math.round((takenCount / totalMeds) * 100);
  const pendingMeds   = meds.filter(m => !m.taken && !m.skipped);

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
      const prior = updatedMessages.slice(0, -1);
      const firstUserIdx = prior.findIndex(m => !m.isAI);
      const history = firstUserIdx >= 0
        ? prior.slice(firstUserIdx).map(m => ({
            role: m.isAI ? "model" : "user",
            parts: [{ text: m.text }],
          }))
        : [];
      const chat = geminiModel.startChat({ history });
      const result = await chat.sendMessage(msg);
      const reply = result.response.text();
      setCompanionMessages(prev => [...prev, { text: reply, isAI: true }]);
    } catch (err) {
      console.error("Gemini error:", err);
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
        <div style={{ ...phoneWrap, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 32px" }}>
          <div style={{ animation: "fadeUp 0.7s ease both" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: C.sageLight,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 32,
            }}>
              <Leaf size={24} color={C.sage} strokeWidth={1.5} />
            </div>
            <h1 style={{ fontFamily: F.serif, fontSize: 30, color: C.text, fontWeight: 400, lineHeight: 1.3, marginBottom: 16 }}>
              You deserve care that doesn't feel clinical.
            </h1>
            <p style={{ fontFamily: F.sans, fontSize: 15, color: C.muted, lineHeight: 1.7, marginBottom: 48 }}>
              A companion for the complex, quiet work of managing your health on your own terms.
            </p>
            <button
              onClick={() => setScreen(S.ONBOARD_NAME)}
              style={{
                width: "100%", padding: "16px", borderRadius: 14,
                background: C.sage, border: "none",
                fontFamily: F.sans, fontSize: 15, fontWeight: 600,
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
        <div style={{ ...phoneWrap, display: "flex", flexDirection: "column", padding: "80px 32px 40px" }}>
          <div style={{ flex: 1, animation: "fadeUp 0.6s ease both" }}>
            <p style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
              1 of 3
            </p>
            <h2 style={{ fontFamily: F.serif, fontSize: 26, color: C.text, fontWeight: 400, lineHeight: 1.35, marginBottom: 8 }}>
              What would you like to be called?
            </h2>
            <p style={{ fontFamily: F.sans, fontSize: 14, color: C.muted, marginBottom: 36, lineHeight: 1.6 }}>
              Your companion will use this when it speaks with you.
            </p>
            <input
              autoFocus
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && nameInput.trim() && (setUserName(nameInput.trim()), setScreen(S.ONBOARD_CONDITION))}
              placeholder="Your first name…"
              style={{
                width: "100%", padding: "14px 18px", borderRadius: 12,
                border: `1.5px solid ${nameInput ? C.sage : C.border}`,
                background: C.bgCard,
                fontFamily: F.serif, fontSize: 18, color: C.text,
                outline: "none", transition: "border-color 0.2s ease",
                marginBottom: 24,
              }}
            />
            <button
              onClick={() => { if (nameInput.trim()) { setUserName(nameInput.trim()); setScreen(S.ONBOARD_CONDITION); } }}
              disabled={!nameInput.trim()}
              style={{
                width: "100%", padding: "15px", borderRadius: 14,
                background: nameInput.trim() ? C.sage : C.border,
                border: "none", fontFamily: F.sans, fontSize: 15, fontWeight: 600,
                color: nameInput.trim() ? C.white : C.light, cursor: nameInput.trim() ? "pointer" : "not-allowed",
                transition: "all 0.25s ease",
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
        <div style={{ ...phoneWrap, display: "flex", flexDirection: "column", padding: "80px 32px 40px" }}>
          <div style={{ animation: "fadeUp 0.6s ease both" }}>
            <p style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>2 of 3</p>
            <h2 style={{ fontFamily: F.serif, fontSize: 26, color: C.text, fontWeight: 400, lineHeight: 1.35, marginBottom: 8 }}>
              What are you managing, {userName}?
            </h2>
            <p style={{ fontFamily: F.sans, fontSize: 14, color: C.muted, marginBottom: 32, lineHeight: 1.6 }}>
              This helps your companion speak to your specific experience.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
              {CONDITIONS.map((c, i) => (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  style={{
                    padding: "14px 18px", borderRadius: 12, textAlign: "left",
                    background: condition === c ? C.sageLight : C.bgCard,
                    border: `1.5px solid ${condition === c ? C.sage : C.border}`,
                    fontFamily: F.sans, fontSize: 14,
                    color: condition === c ? C.sageDark : C.text,
                    cursor: "pointer", transition: "all 0.2s ease",
                    animation: `fadeUp 0.4s ease ${i * 0.06}s both`,
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  {c}
                  {condition === c && <Check size={16} color={C.sage} />}
                </button>
              ))}
            </div>
            <button
              onClick={() => condition && setScreen(S.ONBOARD_MEDS)}
              disabled={!condition}
              style={{
                width: "100%", padding: "15px", borderRadius: 14,
                background: condition ? C.sage : C.border,
                border: "none", fontFamily: F.sans, fontSize: 15, fontWeight: 600,
                color: condition ? C.white : C.light, cursor: condition ? "pointer" : "not-allowed",
                transition: "all 0.25s ease",
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
        <div style={{ ...phoneWrap, display: "flex", flexDirection: "column", padding: "80px 32px 40px" }}>
          <div style={{ animation: "fadeUp 0.6s ease both" }}>
            <p style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>3 of 3</p>
            <h2 style={{ fontFamily: F.serif, fontSize: 26, color: C.text, fontWeight: 400, lineHeight: 1.35, marginBottom: 8 }}>
              Here's what your care plan looks like.
            </h2>
            <p style={{ fontFamily: F.sans, fontSize: 14, color: C.muted, marginBottom: 32, lineHeight: 1.6 }}>
              These have been added for you. You can always adjust later.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36 }}>
              {INITIAL_MEDS.map((med, i) => (
                <div
                  key={med.id}
                  style={{
                    background: C.bgCard, border: `1px solid ${C.border}`,
                    borderRadius: 14, padding: "16px",
                    display: "flex", alignItems: "center", gap: 14,
                    animation: `fadeUp 0.4s ease ${i * 0.1}s both`,
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: C.sageLight,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <PillIcon color={C.sage} />
                  </div>
                  <div>
                    <p style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 14, color: C.text }}>{med.name}</p>
                    <p style={{ fontFamily: F.sans, fontSize: 12, color: C.muted }}>{med.dose} · {med.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setScreen(S.HOME)}
              style={{
                width: "100%", padding: "15px", borderRadius: 14,
                background: C.sage, border: "none",
                fontFamily: F.sans, fontSize: 15, fontWeight: 600,
                color: C.white, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
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

    return (
      <div style={outerWrap}>
        <GlobalStyles />
        <div style={{ ...phoneWrap, paddingBottom: 80 }}>

          {/* Header */}
          <div style={{ padding: "52px 24px 20px", background: C.bg }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, letterSpacing: "0.08em", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <GreetIcon size={13} color={C.sage} /> {greeting}
                </p>
                <h1 style={{ fontFamily: F.serif, fontSize: 24, color: C.text, fontWeight: 400, lineHeight: 1.25 }}>
                  How are you feeling, <em>{displayName}?</em>
                </h1>
              </div>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: C.sageLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Sparkles size={18} color={C.sage} strokeWidth={1.5} />
              </div>
            </div>
          </div>

          <div style={{ padding: "0 24px 24px" }}>

            {/* Streak Ring */}
            <div style={{ display: "flex", justifyContent: "center", padding: "16px 0 24px", animation: "fadeUp 0.5s ease 0.1s both" }}>
              <StreakRing streak={streak} />
            </div>

            {/* Medications */}
            <div style={{ marginBottom: 20, animation: "fadeUp 0.5s ease 0.2s both" }}>
              <p style={{ fontFamily: F.sans, fontSize: 11, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
                Today's medications
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {meds.map((med, i) => (
                  <div
                    key={med.id}
                    style={{
                      background: med.taken ? C.sageLight : C.bgCard,
                      border: `1px solid ${med.taken ? "#C5DEC9" : C.border}`,
                      borderRadius: 16, padding: "14px 16px",
                      display: "flex", alignItems: "center", gap: 14,
                      animation: `fadeUp 0.4s ease ${0.25 + i * 0.08}s both`,
                      boxShadow: "0 1px 4px rgba(26,26,24,0.05)",
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: med.taken ? "#C5DEC9" : C.bgCard,
                      border: `1px solid ${med.taken ? "#A8CEB0" : C.border}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <PillIcon color={med.taken ? C.sageDark : C.sage} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 14, color: med.taken ? C.sageDark : C.text, marginBottom: 2 }}>{med.name}</p>
                      <p style={{ fontFamily: F.sans, fontSize: 12, color: C.muted }}>{med.dose} · {med.time}</p>
                    </div>
                    {med.taken ? (
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.sage, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={14} color={C.white} strokeWidth={2.5} />
                      </div>
                    ) : med.skipped ? (
                      <button
                        onClick={() => { setActiveMed(med); setRecoveryStep(0); setScreen(S.RECOVERY); }}
                        style={{ background: C.terraLight, border: `1px solid ${C.terra}`, borderRadius: 8, padding: "6px 12px", fontFamily: F.sans, fontSize: 11, color: C.terra, cursor: "pointer", fontWeight: 500 }}
                      >
                        Return
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => startRecovery(med)}
                          style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", fontFamily: F.sans, fontSize: 11, color: C.muted, cursor: "pointer" }}
                        >
                          Skip
                        </button>
                        <button
                          onClick={() => { setActiveMed(med); setScreen(S.LOG_CONFIRM); }}
                          style={{ background: C.sage, border: "none", borderRadius: 8, padding: "6px 14px", fontFamily: F.sans, fontSize: 11, fontWeight: 600, color: C.white, cursor: "pointer", letterSpacing: "0.03em" }}
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
            <div style={{ background: C.bgCard, borderRadius: 16, padding: "18px", border: `1px solid ${C.border}`, animation: "fadeUp 0.5s ease 0.5s both", boxShadow: "0 1px 4px rgba(26,26,24,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <p style={{ fontFamily: F.sans, fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Today's adherence</p>
                <span style={{ fontFamily: F.serif, fontSize: 20, color: adherencePct >= 67 ? C.streak : C.terra, fontWeight: 600 }}>{adherencePct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: C.borderLight, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${adherencePct}%`, borderRadius: 99, background: adherencePct >= 67 ? C.streak : C.terra, transition: "width 1s ease" }} />
              </div>
              <p style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, marginTop: 10 }}>{takenCount} of {totalMeds} medications taken today</p>
            </div>

            {/* Open companion */}
            {pendingMeds.length > 0 && (
              <button
                onClick={() => openCompanion(pendingMeds[0])}
                style={{
                  width: "100%", marginTop: 14, padding: "14px 18px",
                  background: C.bgAI, border: `1px solid #E8D8C0`,
                  borderRadius: 16, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12,
                  animation: "fadeUp 0.5s ease 0.6s both",
                  boxShadow: "0 1px 4px rgba(26,26,24,0.06)",
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#EDD9C0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MessageCircle size={18} color={C.terra} strokeWidth={1.5} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontFamily: F.serif, fontSize: 14, color: C.text, fontStyle: "italic" }}>
                    "Not feeling ready to take your medication?"
                  </p>
                  <p style={{ fontFamily: F.sans, fontSize: 11, color: C.muted, marginTop: 2 }}>Talk with your companion first</p>
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
        <div style={{ ...phoneWrap, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "56px 24px 20px", borderBottom: `1px solid ${C.border}` }}>
            <button onClick={() => setScreen(S.HOME)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontFamily: F.sans, fontSize: 13, padding: 0, display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
              <ChevronLeft size={16} /> Back
            </button>
            <p style={{ fontFamily: F.sans, fontSize: 11, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Confirm dose</p>
            <h2 style={{ fontFamily: F.serif, fontSize: 24, color: C.text, fontWeight: 400 }}>
              Ready to take your<br /><em>{activeMed?.name}?</em>
            </h2>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
            {/* Big pill confirmation target */}
            <div style={{
              width: 140, height: 140, borderRadius: "50%",
              background: C.sageLight,
              border: `2px solid #C5DEC9`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              marginBottom: 24, cursor: "pointer",
              animation: "scaleIn 0.4s ease both",
              boxShadow: "0 4px 24px rgba(107,158,122,0.2)",
            }} onClick={confirmTaken}>
              <PillIcon color={C.sage} size={40} />
              <p style={{ fontFamily: F.sans, fontSize: 11, color: C.sageDark, marginTop: 8, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Tap to confirm</p>
            </div>

            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <p style={{ fontFamily: F.serif, fontSize: 20, color: C.text, fontWeight: 400, marginBottom: 4 }}>{activeMed?.name}</p>
              <p style={{ fontFamily: F.sans, fontSize: 13, color: C.muted }}>{activeMed?.dose} · {activeMed?.time}</p>
            </div>

            <button
              onClick={confirmTaken}
              style={{
                width: "100%", padding: "16px", borderRadius: 14,
                background: C.sage, border: "none",
                fontFamily: F.sans, fontSize: 15, fontWeight: 600,
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
        <div style={{ ...phoneWrap, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 32px", background: C.dark }}>
          <div style={{ textAlign: "center", animation: "celebPop 0.6s ease both" }}>
            <div style={{ marginBottom: 32 }}>
              <StreakRing streak={streak} />
            </div>
            <h2 style={{ fontFamily: F.serif, fontSize: 28, color: C.white, fontWeight: 400, marginBottom: 16, lineHeight: 1.3 }}>
              Day {streak}. <em>Well done.</em>
            </h2>
            <p style={{ fontFamily: F.sans, fontSize: 15, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 48 }}>
              You took your {activeMed?.name}. That took something. Be proud of yourself.
            </p>
            <button
              onClick={() => setScreen(S.HOME)}
              style={{
                width: "100%", padding: "16px", borderRadius: 14,
                background: C.sage, border: "none",
                fontFamily: F.sans, fontSize: 15, fontWeight: 600,
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
        <div style={{ ...phoneWrap, paddingBottom: 80 }}>

          {/* Header */}
          <div style={{ padding: "52px 24px 20px", background: C.bg, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#EDD9C0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Sparkles size={18} color={C.terra} strokeWidth={1.5} />
              </div>
              <div>
                <p style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 14, color: C.text }}>Your companion</p>
                <p style={{ fontFamily: F.sans, fontSize: 11, color: C.streak }}>Here with you</p>
              </div>
              {activeMed && (
                <div style={{ marginLeft: "auto", background: C.sageLight, borderRadius: 20, padding: "5px 12px" }}>
                  <p style={{ fontFamily: F.sans, fontSize: 11, color: C.sageDark }}>{activeMed.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Mood selector (if no mood set) */}
          {!mood && (
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.borderLight}`, background: C.bgAI }}>
              <p style={{ fontFamily: F.serif, fontSize: 14, color: C.muted, fontStyle: "italic", marginBottom: 14 }}>How are you feeling right now?</p>
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
                    style={{
                      padding: "7px 14px", borderRadius: 20,
                      background: C.bgCard, border: `1px solid ${C.border}`,
                      fontFamily: F.sans, fontSize: 12, color: C.text, cursor: "pointer",
                    }}
                  >
                    {m.label}
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
                style={{
                  marginBottom: 20,
                  animation: "fadeUp 0.4s ease both",
                }}
              >
                {msg.isAI ? (
                  <div style={{
                    background: C.bgAI,
                    borderRadius: 16, padding: "24px 24px",
                    border: `1px solid #E8D8C0`,
                    boxShadow: "0 2px 12px rgba(196,131,90,0.08)",
                  }}>
                    <p style={{
                      fontFamily: F.serif,
                      fontSize: 16, lineHeight: 1.85,
                      color: C.text,
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
                      <p style={{ fontFamily: F.sans, fontSize: 14, color: C.white, lineHeight: 1.55 }}>{msg.text}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {companionTyping && (
              <div style={{ background: C.bgAI, borderRadius: 16, padding: "20px 24px", marginBottom: 20, border: `1px solid #E8D8C0` }}>
                <p style={{ fontFamily: F.serif, fontSize: 15, color: C.muted, fontStyle: "italic" }}>Writing…</p>
              </div>
            )}
            <div ref={companionEndRef} />
          </div>

          {/* Bottom input */}
          <div style={{
            position: "fixed", bottom: 65, left: "50%", transform: "translateX(-50%)",
            width: "100%", maxWidth: 390,
            background: C.white, borderTop: `1px solid ${C.border}`,
            borderBottom: `1px solid ${C.border}`,
            padding: "14px 20px 14px",
            zIndex: 10,
          }}>
            {activeMed && !medTaken && (
              <button
                onClick={() => setScreen(S.LOG_CONFIRM)}
                style={{
                  width: "100%", padding: "13px", borderRadius: 12, marginBottom: 12,
                  background: C.sage, border: "none",
                  fontFamily: F.sans, fontSize: 14, fontWeight: 600,
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
                  flex: 1, padding: "10px 14px", borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.bg,
                  fontFamily: F.sans, fontSize: 13, color: C.text, outline: "none",
                }}
              />
              <button
                onClick={sendCompanionMessage}
                style={{
                  background: C.sage, border: "none",
                  borderRadius: 10, width: 42, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <ArrowRight size={16} color={C.white} />
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
        <div style={{ ...phoneWrap, paddingBottom: 80 }}>

          <div style={{ padding: "52px 24px 24px" }}>
            <p style={{ fontFamily: F.sans, fontSize: 11, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Symptom Journal</p>
            <h2 style={{ fontFamily: F.serif, fontSize: 26, color: C.text, fontWeight: 400, lineHeight: 1.35, marginBottom: 8 }}>
              <em>{journalPrompt}</em>
            </h2>
            <p style={{ fontFamily: F.sans, fontSize: 13, color: C.light, marginBottom: 28 }}>
              No form to fill. Just say what's true today.
            </p>

            <div style={{ position: "relative", marginBottom: 20 }}>
              <textarea
                value={journalText}
                onChange={e => { setJournalText(e.target.value); setJournalSaved(false); }}
                placeholder="Write here…"
                rows={7}
                style={{
                  width: "100%", padding: "18px",
                  borderRadius: 16,
                  border: `1.5px solid ${journalText ? "#E8D8C0" : C.border}`,
                  background: journalText ? C.bgAI : C.bgCard,
                  fontFamily: F.serif, fontSize: 16, color: C.text,
                  lineHeight: 1.8, outline: "none",
                  transition: "all 0.25s ease",
                  boxShadow: journalText ? "0 2px 12px rgba(196,131,90,0.08)" : "none",
                }}
              />
            </div>

            <button
              onClick={() => { if (journalText.trim()) setJournalSaved(true); }}
              disabled={!journalText.trim() || journalSaved}
              style={{
                width: "100%", padding: "15px", borderRadius: 14,
                background: journalSaved ? C.sageLight : journalText.trim() ? C.terra : C.border,
                border: "none", fontFamily: F.sans, fontSize: 14, fontWeight: 600,
                color: journalSaved ? C.sageDark : journalText.trim() ? C.white : C.light,
                cursor: journalText.trim() && !journalSaved ? "pointer" : "default",
                transition: "all 0.3s ease",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {journalSaved ? (
                <><Check size={16} /> Planted — {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</>
              ) : "Plant this memory"}
            </button>

            {/* Past entries */}
            <div style={{ marginTop: 36 }}>
              <p style={{ fontFamily: F.sans, fontSize: 11, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Recent</p>
              {[
                { date: "Mar 4", text: "Fatigue was high this morning but it lifted around noon. Grateful for that." },
                { date: "Mar 2", text: "Joints felt stiff on waking but the walk helped. Took all three today." },
                { date: "Feb 28", text: "Hard day. Didn't want to take anything. Wrote this instead. Tomorrow." },
              ].map((entry, i) => (
                <div
                  key={i}
                  style={{
                    background: C.bgCard, border: `1px solid ${C.border}`,
                    borderRadius: 14, padding: "16px", marginBottom: 10,
                    animation: `fadeUp 0.4s ease ${i * 0.08}s both`,
                  }}
                >
                  <p style={{ fontFamily: F.sans, fontSize: 11, color: C.light, marginBottom: 6 }}>{entry.date}</p>
                  <p style={{ fontFamily: F.serif, fontSize: 14, color: C.muted, lineHeight: 1.65, fontStyle: "italic" }}>&ldquo;{entry.text}&rdquo;</p>
                </div>
              ))}
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
        <div style={{ ...phoneWrap, paddingBottom: 80 }}>

          <div style={{ padding: "52px 24px 24px" }}>
            <p style={{ fontFamily: F.sans, fontSize: 11, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Weekly Insights</p>
            <h2 style={{ fontFamily: F.serif, fontSize: 26, color: C.text, fontWeight: 400, lineHeight: 1.3, marginBottom: 4 }}>
              A good week, <em>{userName || "Alex"}.</em>
            </h2>
            <p style={{ fontFamily: F.sans, fontSize: 13, color: C.muted, marginBottom: 28 }}>Here's what your care looked like.</p>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {[
                { label: "Streak",     value: `${streak}d`,  color: C.streak },
                { label: "This week",  value: `${weekAvg}%`, color: C.sage },
                { label: "This month", value: "84%",         color: C.terra },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1, background: C.bgCard,
                    borderRadius: 14, padding: "16px 10px",
                    border: `1px solid ${C.border}`, textAlign: "center",
                    animation: `fadeUp 0.4s ease ${i * 0.1}s both`,
                    boxShadow: "0 1px 4px rgba(26,26,24,0.05)",
                  }}
                >
                  <p style={{ fontFamily: F.serif, fontSize: 22, color: s.color, fontWeight: 600 }}>{s.value}</p>
                  <p style={{ fontFamily: F.sans, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 4 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Week bar chart */}
            <div style={{ background: C.bgCard, borderRadius: 16, padding: "20px", border: `1px solid ${C.border}`, marginBottom: 16, animation: "fadeUp 0.5s ease 0.3s both", boxShadow: "0 1px 4px rgba(26,26,24,0.05)" }}>
              <p style={{ fontFamily: F.sans, fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Daily adherence</p>
              <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80 }}>
                {weekData.map((d, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: "100%", height: d.pct * 0.7,
                      borderRadius: "4px 4px 0 0",
                      background: d.pct === 100 ? C.streak : d.pct >= 67 ? C.sage : d.pct > 0 ? C.terra : C.borderLight,
                      transition: "height 0.8s ease",
                      minHeight: 4,
                    }} />
                    <span style={{ fontFamily: F.sans, fontSize: 10, color: C.light }}>{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivating message */}
            <div style={{ background: C.bgAI, borderRadius: 16, padding: "20px 22px", border: `1px solid #E8D8C0`, marginBottom: 16, animation: "fadeUp 0.5s ease 0.4s both" }}>
              <p style={{ fontFamily: F.serif, fontSize: 15, color: C.text, lineHeight: 1.75, fontStyle: "italic" }}>
                "You've taken your medication on {weekAvg}% of days this week. That consistency is doing quiet, important work in your body — even on the days it doesn't feel like it."
              </p>
            </div>

            {/* Clinician link */}
            <button
              onClick={() => setScreen(S.CLINICIAN)}
              style={{
                width: "100%", padding: "14px 18px", borderRadius: 14,
                background: C.bgCard, border: `1px solid ${C.border}`,
                display: "flex", alignItems: "center", gap: 12,
                cursor: "pointer", animation: "fadeUp 0.5s ease 0.5s both",
                boxShadow: "0 1px 4px rgba(26,26,24,0.05)",
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.sageLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Stethoscope size={18} color={C.sage} strokeWidth={1.5} />
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 13, color: C.text }}>Clinician summary</p>
                <p style={{ fontFamily: F.sans, fontSize: 11, color: C.muted }}>What your doctor sees at your next visit</p>
              </div>
              <ArrowRight size={16} color={C.light} style={{ marginLeft: "auto" }} />
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
        <div style={{ ...phoneWrap, paddingBottom: 40 }}>

          <div style={{ padding: "56px 24px 20px", background: C.bg, borderBottom: `1px solid ${C.border}` }}>
            <button onClick={() => setScreen(S.INSIGHTS)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontFamily: F.sans, fontSize: 13, padding: 0, display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
              <ChevronLeft size={16} /> Insights
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.sageLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Stethoscope size={18} color={C.sage} strokeWidth={1.5} />
              </div>
              <div>
                <p style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 15, color: C.text }}>Clinician View</p>
                <p style={{ fontFamily: F.sans, fontSize: 12, color: C.muted }}>What your doctor sees</p>
              </div>
            </div>
          </div>

          <div style={{ padding: "24px" }}>
            {/* Patient info */}
            <div style={{ background: C.bgCard, borderRadius: 16, padding: "18px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 4px rgba(26,26,24,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <p style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 15, color: C.text }}>{userName || "Alex"} — Patient</p>
                  <p style={{ fontFamily: F.sans, fontSize: 12, color: C.muted, marginTop: 2 }}>{condition || "Rheumatoid Arthritis"}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontFamily: F.sans, fontSize: 11, color: C.light }}>Report generated</p>
                  <p style={{ fontFamily: F.sans, fontSize: 12, color: C.muted }}>5 Mar 2026</p>
                </div>
              </div>
              <div style={{ height: 1, background: C.border, marginBottom: 14 }} />
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { label: "Streak",     value: `${streak} days`, color: C.streak },
                  { label: "30-day avg", value: "87%",            color: C.sage },
                  { label: "Missed",     value: "4 doses",        color: C.terra },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center" }}>
                    <p style={{ fontFamily: F.serif, fontSize: 18, color: s.color, fontWeight: 600 }}>{s.value}</p>
                    <p style={{ fontFamily: F.sans, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Medication log */}
            <div style={{ background: C.bgCard, borderRadius: 16, padding: "18px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 4px rgba(26,26,24,0.05)" }}>
              <p style={{ fontFamily: F.sans, fontSize: 11, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Current regimen</p>
              {INITIAL_MEDS.map((med, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: i < INITIAL_MEDS.length - 1 ? 12 : 0, marginBottom: i < INITIAL_MEDS.length - 1 ? 12 : 0, borderBottom: i < INITIAL_MEDS.length - 1 ? `1px solid ${C.borderLight}` : "none" }}>
                  <div>
                    <p style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 13, color: C.text }}>{med.name}</p>
                    <p style={{ fontFamily: F.sans, fontSize: 11, color: C.muted }}>{med.dose} · {med.time}</p>
                  </div>
                  <div style={{ background: i === 1 || meds[i].taken ? C.sageLight : C.terraLight, borderRadius: 20, padding: "4px 12px" }}>
                    <p style={{ fontFamily: F.sans, fontSize: 11, color: i === 1 || meds[i].taken ? C.sageDark : C.terraDark, fontWeight: 500 }}>
                      {i === 1 || meds[i].taken ? "Taken today" : "Pending"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mood pattern */}
            <div style={{ background: C.bgCard, borderRadius: 16, padding: "18px", border: `1px solid ${C.border}`, marginBottom: 14, boxShadow: "0 1px 4px rgba(26,26,24,0.05)" }}>
              <p style={{ fontFamily: F.sans, fontSize: 11, color: C.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Emotional patterns (30 days)</p>
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { label: "Calm / Okay", pct: 58, color: C.sage },
                  { label: "Uneasy",      pct: 28, color: C.terra },
                  { label: "Anxious",     pct: 14, color: "#B85A3A" },
                ].map((e, i) => (
                  <div key={i} style={{ flex: 1 }}>
                    <div style={{ height: 6, borderRadius: 99, background: C.borderLight, overflow: "hidden", marginBottom: 6 }}>
                      <div style={{ height: "100%", width: `${e.pct}%`, background: e.color, borderRadius: 99 }} />
                    </div>
                    <p style={{ fontFamily: F.sans, fontSize: 10, color: C.muted }}>{e.label}</p>
                    <p style={{ fontFamily: F.sans, fontSize: 12, color: C.text, fontWeight: 600 }}>{e.pct}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Note */}
            <div style={{ background: C.bgAI, borderRadius: 16, padding: "18px", border: `1px solid #E8D8C0` }}>
              <p style={{ fontFamily: F.sans, fontSize: 11, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>App-generated note</p>
              <p style={{ fontFamily: F.serif, fontSize: 14, color: C.text, lineHeight: 1.75, fontStyle: "italic" }}>
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
        <div style={{ ...phoneWrap }}>
          <div style={{ padding: "56px 24px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.terraLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Heart size={16} color={C.terra} strokeWidth={1.5} />
              </div>
              <div>
                <p style={{ fontFamily: F.sans, fontWeight: 500, fontSize: 13, color: C.terra }}>Coming back</p>
                <p style={{ fontFamily: F.sans, fontSize: 11, color: C.muted }}>{activeMed?.name} · {activeMed?.dose}</p>
              </div>
            </div>

            {/* Progress */}
            <div style={{ display: "flex", gap: 6, marginBottom: 36 }}>
              {RECOVERY_STEPS.map((_, i) => (
                <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= recoveryStep ? C.terra : C.border, transition: "background 0.4s ease" }} />
              ))}
            </div>

            <h2 style={{ fontFamily: F.serif, fontSize: 26, color: C.text, fontWeight: 400, marginBottom: 16, lineHeight: 1.3, animation: "fadeUp 0.5s ease both" }}>
              {step.title}
            </h2>

            {step.body && (
              <p style={{ fontFamily: F.sans, fontSize: 15, color: C.muted, lineHeight: 1.75, marginBottom: 32, whiteSpace: "pre-line", animation: "fadeUp 0.5s ease 0.1s both" }}>
                {step.body}
              </p>
            )}

            {step.options ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeUp 0.5s ease 0.2s both" }}>
                {step.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setRecoveryStep(s => s + 1)}
                    style={{
                      background: C.bgCard, border: `1px solid ${C.border}`,
                      borderRadius: 14, padding: "14px 18px",
                      fontFamily: F.sans, fontSize: 14, color: C.text,
                      cursor: "pointer", textAlign: "left", transition: "all 0.2s ease",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={() => step.final ? completeRecovery() : setRecoveryStep(s => s + 1)}
                style={{
                  width: "100%", padding: "16px", borderRadius: 14,
                  background: step.final ? C.sage : C.terra,
                  border: "none", fontFamily: F.sans, fontSize: 15, fontWeight: 600,
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
