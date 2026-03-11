import { useState, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Shot {
  number: number;
  name: string;
  scene: string;
  why: string;
  mood: string;
  prompt: string;
}

interface MoodStyle {
  bg: string;
  border: string;
  text: string;
}

interface ShotCardProps {
  shot: Shot;
  index: number;
  onUsePrompt: (shot: Shot) => void;
}

// ─── Prompt ──────────────────────────────────────────────────────────────────
const buildShotListPrompt = (description: string): string => `
You are a personal brand photography strategist with 20 years of experience helping entrepreneurs, small business owners, and professionals build powerful visual brands.

A customer has described their work as follows:
"${description}"

Generate a personalized brand photography shot list of exactly 10 images tailored specifically to their business and audience. Each shot should feel distinct, purposeful, and immediately usable in their marketing.

Respond ONLY with a valid JSON array. No markdown, no backticks, no explanation — just the raw JSON array.

Format:
[
  {
    "number": 1,
    "name": "Shot name (3-5 words)",
    "scene": "One sentence describing the visual scene",
    "why": "One sentence explaining why this shot builds their specific brand",
    "mood": "One of: Confident | Approachable | Expert | Behind-the-Scenes | Lifestyle | Action | Story",
    "prompt": "A ready-to-use generation prompt for this shot (2-3 sentences, specific and visual)"
  }
]

Make every shot feel specific to their line of work. Avoid generic suggestions like 'headshot' or 'working at desk' without meaningful context. Think about their specific clients, their credibility signals, their environment, and what makes them trustworthy in their field.
`.trim();

// ─── Mood colors ─────────────────────────────────────────────────────────────
const MOOD_STYLES: Record<string, MoodStyle> = {
  Confident:           { bg: "rgba(99,102,241,0.15)",  border: "rgba(99,102,241,0.4)",  text: "#a5b4fc" },
  Approachable:        { bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.4)",   text: "#86efac" },
  Expert:              { bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.4)",  text: "#fcd34d" },
  "Behind-the-Scenes": { bg: "rgba(168,85,247,0.12)",  border: "rgba(168,85,247,0.4)",  text: "#d8b4fe" },
  Lifestyle:           { bg: "rgba(20,184,166,0.12)",  border: "rgba(20,184,166,0.4)",  text: "#5eead4" },
  Action:              { bg: "rgba(239,68,68,0.12)",   border: "rgba(239,68,68,0.4)",   text: "#fca5a5" },
  Story:               { bg: "rgba(236,72,153,0.12)",  border: "rgba(236,72,153,0.4)",  text: "#f9a8d4" },
};

// ─── Animated dots ────────────────────────────────────────────────────────────
const LoadingDots = () => (
  <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
    {[0,1,2].map(i => (
      <span key={i} style={{
        width: 6, height: 6, borderRadius: "50%",
        background: "#818cf8",
        animation: "pulse 1.2s ease-in-out infinite",
        animationDelay: `${i * 0.2}s`,
      }} />
    ))}
  </span>
);

// ─── Shot card ────────────────────────────────────────────────────────────────
const ShotCard = ({ shot, index, onUsePrompt }: ShotCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const mood: MoodStyle = MOOD_STYLES[shot.mood] || MOOD_STYLES["Expert"];

  return (
    <div
      style={{
        background: "rgba(15,15,30,0.7)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, overflow: "hidden",
        transition: "border-color 0.2s, transform 0.2s",
        animation: `slideUp 0.4s ease both`,
        animationDelay: `${index * 0.07}s`,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(129,140,248,0.35)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%", display: "flex", alignItems: "flex-start",
          gap: 16, padding: "18px 20px", background: "none",
          border: "none", cursor: "pointer", textAlign: "left",
        }}
      >
        <div style={{
          minWidth: 36, height: 36, borderRadius: "50%",
          background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700, color: "#a5b4fc", flexShrink: 0,
        }}>
          {shot.number}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif" }}>
              {shot.name}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", padding: "2px 8px", borderRadius: 20,
              background: mood.bg, border: `1px solid ${mood.border}`, color: mood.text,
            }}>
              {shot.mood}
            </span>
          </div>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>{shot.scene}</p>
        </div>
        <span style={{
          color: "#475569", fontSize: 18,
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s", flexShrink: 0, marginTop: 4,
        }}>▾</span>
      </button>

      {expanded && (
        <div style={{ padding: "0 20px 20px 20px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}>
          <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px 0" }}>Why this shot</p>
            <p style={{ fontSize: 13, color: "#cbd5e1", margin: 0, lineHeight: 1.6 }}>{shot.why}</p>
          </div>
          <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px 0" }}>Generation prompt</p>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, lineHeight: 1.7, fontFamily: "monospace" }}>{shot.prompt}</p>
          </div>
          <button
            onClick={() => onUsePrompt(shot)}
            style={{
              width: "100%", padding: "11px 16px",
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              border: "none", borderRadius: 10, cursor: "pointer",
              fontSize: 13, fontWeight: 700, color: "#fff",
              fontFamily: "'DM Sans', sans-serif", transition: "opacity 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = "1"}
          >
            ✦ Generate This Shot
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
interface ShotListGeneratorProps {
  initialDescription?: string;
  onDescriptionChange?: (val: string) => void;
}

export default function ShotListGenerator({ initialDescription = '', onDescriptionChange }: ShotListGeneratorProps) {
  const DESCRIPTION_KEY = "vl_shotlist_description";
  const [description, setDescription] = useState<string>(() => {
    if (initialDescription) return initialDescription;
    try { return localStorage.getItem(DESCRIPTION_KEY) || ""; } catch { return ""; }
  });
  const [shots, setShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedFor, setGeneratedFor] = useState<string>("");
  const [copiedPrompt, setCopiedPrompt] = useState<number | null>(null);
  const [showTemplate, setShowTemplate] = useState<boolean>(false);
  const [templateFields, setTemplateFields] = useState({
    industry: "",
    clients: "",
    outcome: "",
    style: "",
    unique: "",
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const buildFromTemplate = useCallback(() => {
    const { industry, clients, outcome, style, unique } = templateFields;
    const parts: string[] = [];
    if (industry) parts.push(`I work in ${industry}`);
    if (clients) parts.push(`and work with ${clients}`);
    if (outcome) parts.push(`to help them ${outcome}`);
    if (style) parts.push(`My personal style is ${style}`);
    if (unique) parts.push(`What makes my brand unique: ${unique}`);
    const built = parts.join(". ").replace(/\.\s*\./g, ".") + (parts.length ? "." : "");
    setDescription(built);
    try { localStorage.setItem(DESCRIPTION_KEY, built); } catch {}
    onDescriptionChange?.(built);
    setShowTemplate(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [templateFields]);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDescription(val);
    try { localStorage.setItem(DESCRIPTION_KEY, val); } catch {}
    onDescriptionChange?.(val);
  };

  const generate = async () => {
    const trimmed = description.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setShots([]);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{ role: "user", content: buildShotListPrompt(trimmed) }],
        }),
      });
      const data = await response.json();
      const raw: string = data.content?.find((b: { type: string }) => b.type === "text")?.text || "";
      const cleaned = raw.replace(/```json|```/g, "").trim();
      const parsed: Shot[] = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) throw new Error("Unexpected response format");
      setShots(parsed);
      setGeneratedFor(trimmed);
    } catch (err) {
      setError("Something went wrong generating your shot list. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUsePrompt = (shot: Shot) => {
    navigator.clipboard.writeText(shot.prompt).then(() => {
      setCopiedPrompt(shot.number);
      setTimeout(() => setCopiedPrompt(null), 2000);
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 2px; }
        textarea:focus { outline: none; }
        textarea::placeholder { color: #334155; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(79,70,229,0.18) 0%, transparent 60%), #080812", fontFamily: "'DM Sans', sans-serif", color: "#f1f5f9", padding: "48px 20px 80px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>

          <div style={{ textAlign: "center", marginBottom: 48, animation: "fadeIn 0.6s ease both" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 20, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#818cf8", marginBottom: 20 }}>
              ✦ VeraLooks Personal Brand
            </div>
            <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, margin: "0 0 14px 0", lineHeight: 1.15, background: "linear-gradient(135deg, #f1f5f9 30%, #a5b4fc 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.02em" }}>
              Your Personal Brand<br />Shot List
            </h1>
            <p style={{ fontSize: 16, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
              Tell us what you do. We'll build a tailored photography plan<br />for your business — 10 specific images, ready to generate.
            </p>
          </div>

          <div style={{ background: "rgba(15,15,35,0.8)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 20, padding: 28, marginBottom: 32, animation: "fadeIn 0.6s ease 0.1s both", backdropFilter: "blur(12px)" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#818cf8", marginBottom: 8 }}>
              Describe your work
            </label>
            <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: "0 0 10px 0" }}>
              The more specific you are, the better your shot list. Include your industry, who you serve, your personal style, and anything that makes your brand unique.
            </p>

            {/* Fill-in-the-blank template */}
            {!showTemplate ? (
              <button
                onClick={() => setShowTemplate(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6366f1", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", marginBottom: 12, fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s" }}
              >
                ✦ Use guided template
              </button>
            ) : (
              <div style={{ marginBottom: 14, padding: "16px 18px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Fill in what applies — skip anything that doesn't fit</p>
                {[
                  { key: "industry", label: "I work in…", placeholder: "e.g. health coaching, real estate, executive consulting" },
                  { key: "clients", label: "and work with…", placeholder: "e.g. busy moms, small business owners, C-suite leaders" },
                  { key: "outcome", label: "to help them…", placeholder: "e.g. lose weight sustainably, sell their home faster, lead with confidence" },
                  { key: "style", label: "My personal style is…", placeholder: "e.g. polished but approachable, bold and colorful, minimal and modern" },
                  { key: "unique", label: "What makes my brand unique…", placeholder: "e.g. I'm a former chef turned nutritionist, I work exclusively with women over 50" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} style={{ marginBottom: 10 }}>
                    <label style={{ display: "block", fontSize: 11, color: "#6366f1", fontWeight: 600, marginBottom: 4 }}>{label}</label>
                    <input
                      type="text"
                      value={templateFields[key as keyof typeof templateFields]}
                      onChange={e => setTemplateFields(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "#e2e8f0", fontFamily: "'DM Sans', sans-serif", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button
                    onClick={buildFromTemplate}
                    disabled={!Object.values(templateFields).some(v => v.trim())}
                    style={{ flex: 1, padding: "10px 16px", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Build my description →
                  </button>
                  <button
                    onClick={() => setShowTemplate(false)}
                    style={{ padding: "10px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={description}
              onChange={handleDescriptionChange}
              onKeyDown={handleKeyDown}
              placeholder="e.g. I'm a business coach in Atlanta who helps first-generation entrepreneurs scale past six figures. My clients are mostly women of color in the wellness and beauty space..."
              rows={4}
              style={{ width: "100%", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", fontSize: 14, color: "#e2e8f0", resize: "none", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.2s" }}
              onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = "rgba(99,102,241,0.5)"}
              onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = "rgba(255,255,255,0.06)"}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
              <span style={{ fontSize: 11, color: "#334155" }}>⌘ + Enter to generate</span>
              <button
                onClick={generate}
                disabled={!description.trim() || loading}
                style={{
                  padding: "12px 28px",
                  background: loading || !description.trim() ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #4f46e5, #7c3aed)",
                  border: "none", borderRadius: 12, cursor: loading || !description.trim() ? "not-allowed" : "pointer",
                  fontSize: 14, fontWeight: 700, color: loading || !description.trim() ? "#475569" : "#fff",
                  fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 10, transition: "opacity 0.15s",
                }}
              >
                {loading ? <><LoadingDots /> Building your shot list…</> : <>✦ Generate Shot List</>}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "14px 18px", marginBottom: 24, fontSize: 13, color: "#fca5a5" }}>
              {error}
            </div>
          )}

          {copiedPrompt !== null && (
            <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 600, color: "#86efac", animation: "fadeIn 0.2s ease", zIndex: 100, backdropFilter: "blur(12px)" }}>
              ✓ Prompt copied to clipboard
            </div>
          )}

          {shots.length > 0 && (
            <div style={{ animation: "fadeIn 0.4s ease both" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div>
                  <p style={{ fontSize: 12, color: "#475569", margin: "0 0 2px 0", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Shot list generated for</p>
                  <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>"{generatedFor.length > 80 ? generatedFor.slice(0, 80) + "…" : generatedFor}"</p>
                </div>
                <div style={{ padding: "5px 14px", borderRadius: 20, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", fontSize: 12, fontWeight: 700, color: "#818cf8" }}>
                  {shots.length} shots
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24, padding: "12px 16px", background: "rgba(15,15,30,0.5)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize: 11, color: "#334155", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginRight: 4, alignSelf: "center" }}>Moods:</span>
                {[...new Set(shots.map((s: Shot) => s.mood))].map((mood: string) => {
                  const ms: MoodStyle = MOOD_STYLES[mood] || MOOD_STYLES["Expert"];
                  return (
                    <span key={mood} style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 20, background: ms.bg, border: `1px solid ${ms.border}`, color: ms.text }}>
                      {mood}
                    </span>
                  );
                })}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {shots.map((shot: Shot, i: number) => (
                  <ShotCard key={shot.number} shot={shot} index={i} onUsePrompt={handleUsePrompt} />
                ))}
              </div>

              <div style={{ marginTop: 32, textAlign: "center", padding: "28px 24px", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 20 }}>
                <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 6px 0" }}>Ready to build your brand?</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#a5b4fc", margin: 0 }}>Open each shot, copy the prompt, and generate it in VeraLooks.</p>
              </div>
            </div>
          )}

          {!loading && shots.length === 0 && !error && (
            <div style={{ textAlign: "center", padding: "40px 0", animation: "fadeIn 0.6s ease 0.2s both" }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>📸</div>
              <p style={{ fontSize: 13, color: "#334155", margin: 0 }}>Your personalized shot list will appear here</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
