import AppLogo from '@/components/ui/app-logo';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const animations = `
@keyframes oasmFade {
  0%, 18% { opacity: 1 }
  25%, 100% { opacity: 0 }
}
.oasm-bg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; opacity: 0;
  animation: oasmFade 25s ease-in-out infinite;
}
.oasm-bg:nth-child(1) { animation-delay: 0s }
.oasm-bg:nth-child(2) { animation-delay: 5s }
.oasm-bg:nth-child(3) { animation-delay: 10s }
.oasm-bg:nth-child(4) { animation-delay: 15s }
.oasm-bg:nth-child(5) { animation-delay: 20s }
@keyframes oasmLine {
  0%   { opacity: 0; transform: translateX(-22px) }
  3%   { opacity: 1; transform: translateX(0) }
  14%  { opacity: 1; transform: translateX(0) }
  17%  { opacity: 0; transform: translateX(0) }
  100% { opacity: 0; transform: translateX(0) }
}
.oasm-tg {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: flex-start; justify-content: center;
  padding-left: 40px;
}
.oasm-tg div { opacity: 0; animation: oasmLine 25s ease-out infinite; animation-fill-mode: both }
.oasm-tg:nth-child(1) div:nth-child(1) { animation-delay: 0.0s }
.oasm-tg:nth-child(1) div:nth-child(2) { animation-delay: 0.45s }
.oasm-tg:nth-child(1) div:nth-child(3) { animation-delay: 0.9s }
.oasm-tg:nth-child(2) div:nth-child(1) { animation-delay: 5.0s }
.oasm-tg:nth-child(2) div:nth-child(2) { animation-delay: 5.45s }
.oasm-tg:nth-child(2) div:nth-child(3) { animation-delay: 5.9s }
.oasm-tg:nth-child(3) div:nth-child(1) { animation-delay: 10.0s }
.oasm-tg:nth-child(3) div:nth-child(2) { animation-delay: 10.45s }
.oasm-tg:nth-child(3) div:nth-child(3) { animation-delay: 10.9s }
.oasm-tg:nth-child(4) div:nth-child(1) { animation-delay: 15.0s }
.oasm-tg:nth-child(4) div:nth-child(2) { animation-delay: 15.45s }
.oasm-tg:nth-child(4) div:nth-child(3) { animation-delay: 15.9s }
.oasm-tg:nth-child(5) div:nth-child(1) { animation-delay: 20.0s }
.oasm-tg:nth-child(5) div:nth-child(2) { animation-delay: 20.45s }
.oasm-tg:nth-child(5) div:nth-child(3) { animation-delay: 20.9s }
.oasm-l1 { font-size: clamp(38px,5vw,68px); font-weight: 900; line-height: 1.1; color: #fff; letter-spacing: -0.04em }
.oasm-l2 { font-size: clamp(38px,5vw,68px); font-weight: 900; line-height: 1.1; color: #5b9cf8; letter-spacing: -0.04em }
.oasm-l3 { font-size: clamp(38px,5vw,68px); font-weight: 900; line-height: 1.1; color: #ef4444; letter-spacing: -0.04em }
@keyframes oasmDotA {
  0%, 18%  { width: 22px; opacity: 1 }
  25%, 100% { width: 6px; opacity: .35 }
}
.oasm-dot {
  height: 5px; border-radius: 9999px; background: white;
  width: 6px; opacity: .35;
  animation: oasmDotA 25s ease-in-out infinite; animation-fill-mode: both;
}
.oasm-dot:nth-child(1) { animation-delay: 0s }
.oasm-dot:nth-child(2) { animation-delay: 5s }
.oasm-dot:nth-child(3) { animation-delay: 10s }
.oasm-dot:nth-child(4) { animation-delay: 15s }
.oasm-dot:nth-child(5) { animation-delay: 20s }
#oasm-logo-wrap a { flex-direction: column !important; height: auto !important; align-items: center !important; justify-content: center !important; gap: 12px !important; text-decoration: none !important }
#oasm-logo-wrap img, #oasm-logo-wrap svg { width: 80px !important; height: 80px !important }
#oasm-logo-wrap span { font-size: 24px !important; font-weight: 700 !important; color: #fff !important; letter-spacing: -0.02em !important }
#oasm-r { background: #080d16 }
#oasm-r > div { width: 100% !important; background: #080d16 !important; padding-top: 0 !important; padding-bottom: 0 !important }
#oasm-r > div > div { padding-top: 0 !important }
#oasm-r h1, #oasm-r h1 + p { display: none !important }
#oasm-r input { background: rgba(255,255,255,.04) !important; border: 1px solid rgba(255,255,255,.1) !important; color: #fff !important; border-radius: 10px !important; font-size: 14px !important }
#oasm-r input:focus { border-color: rgba(56,189,248,.6) !important; box-shadow: 0 0 0 3px rgba(56,189,248,.08) !important; outline: none !important }
#oasm-r input::placeholder { color: rgba(255,255,255,.2) !important }
#oasm-r input:-webkit-autofill, #oasm-r input:-webkit-autofill:focus { -webkit-box-shadow: 0 0 0 999px #0e1523 inset !important; -webkit-text-fill-color: #fff !important }
#oasm-r label { color: rgba(255,255,255,.45) !important; font-size: 11px !important; font-weight: 600 !important; letter-spacing: .07em !important; text-transform: uppercase !important }
#oasm-r button[type=submit] { background: linear-gradient(135deg,rgba(56,189,248,.14),rgba(99,102,241,.11)) !important; border: 1px solid rgba(56,189,248,.3) !important; color: #fff !important; border-radius: 10px !important; padding: 13px 20px !important; font-size: 14px !important; font-weight: 600 !important; cursor: pointer !important; transition: all .15s !important; width: 100% !important }
#oasm-r button[type=submit]:hover:not(:disabled) { border-color: rgba(56,189,248,.6) !important; box-shadow: 0 0 20px rgba(56,189,248,.14) !important; background: linear-gradient(135deg,rgba(56,189,248,.22),rgba(99,102,241,.18)) !important }
#oasm-r button[type=submit]:disabled { opacity: .45 !important; cursor: not-allowed !important }
#oasm-r button:not([type=submit]) { background: rgba(255,255,255,.04) !important; border: 1px solid rgba(255,255,255,.1) !important; color: rgba(255,255,255,.65) !important; border-radius: 10px !important }
#oasm-r [role=alert] { background: rgba(239,68,68,.07) !important; border: 1px solid rgba(239,68,68,.2) !important; border-radius: 8px !important }
#oasm-r [role=alert] * { color: #f87171 !important }
#oasm-r a:not(#oasm-logo-wrap a) { color: #38bdf8 !important }
#oasm-r .text-muted-foreground { color: rgba(255,255,255,.38) !important }
#oasm-r p { color: rgba(255,255,255,.38) !important }
#oasm-r svg { color: rgba(255,255,255,.35) !important }
`;

const slides = [
  { l1: 'Every threat.', l2: 'becomes.', l3: 'visible.' },
  { l1: 'The dark web.', l2: 'is under.', l3: 'our watch.' },
  { l1: 'Attacks.', l2: 'detected.', l3: 'before they strike.' },
  { l1: 'Your data.', l2: 'protected.', l3: 'at all times.' },
  { l1: 'Intelligence.', l2: 'never.', l3: 'stops.' },
];

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100svh', width: '100%', background: '#080d16' }}>
      <style dangerouslySetInnerHTML={{ __html: animations }} />
      <div className="hidden lg:flex lg:w-1/2" style={{ position: 'relative', overflow: 'hidden' }}>
        <img src="/bg1.jpg" className="oasm-bg" alt="" />
        <img src="/bg2.jpg" className="oasm-bg" alt="" />
        <img src="/bg3.jpg" className="oasm-bg" alt="" />
        <img src="/bg4.jpg" className="oasm-bg" alt="" />
        <img src="/bg5.jpg" className="oasm-bg" alt="" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(3,7,18,.5) 0%,rgba(3,7,18,.2) 45%,rgba(3,7,18,.82) 100%)', zIndex: 1 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,transparent 60%,#080d16 100%)', zIndex: 2 }} />
        <img src="/eliphron-logo-transparent.png" alt="elIPHRON" style={{ position: 'absolute', top: 28, left: 36, width: 240, objectFit: 'contain' as const, zIndex: 20 }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
          {slides.map((s, i) => (
            <div key={i} className="oasm-tg">
              <div className="oasm-l1">{s.l1}</div>
              <div className="oasm-l2">{s.l2}</div>
              <div className="oasm-l3">{s.l3}</div>
            </div>
          ))}
          <div style={{ position: 'absolute', bottom: 28, left: 36, display: 'flex', gap: 7, zIndex: 10 }}>
            {slides.map((_, i) => <div key={i} className="oasm-dot" />)}
          </div>
        </div>
      </div>
      <div id="oasm-r" className="w-full lg:w-1/2" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: '-5%', right: '-5%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,189,248,.07) 0%,transparent 65%)', zIndex: 0, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-5%', left: '10%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,.05) 0%,transparent 65%)', zIndex: 0, pointerEvents: 'none' }} />
        <div id="oasm-logo-wrap" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, position: 'relative', zIndex: 1 }}>
          <AppLogo type="large" />
        </div>
        {children}
      </div>
    </div>
  );
}
