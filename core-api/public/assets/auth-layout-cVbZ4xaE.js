import{t as e}from"./jsx-runtime-DRRqQ-cy.js";import{t}from"./app-logo-DrIrgJZK.js";var n=e(),r=`
@keyframes mithrilFade {
  0%, 18% { opacity: 1 }
  25%, 100% { opacity: 0 }
}
.mithril-bg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; opacity: 0;
  animation: mithrilFade 25s ease-in-out infinite;
}
.mithril-bg:nth-child(1) { animation-delay: 0s }
.mithril-bg:nth-child(2) { animation-delay: 5s }
.mithril-bg:nth-child(3) { animation-delay: 10s }
.mithril-bg:nth-child(4) { animation-delay: 15s }
.mithril-bg:nth-child(5) { animation-delay: 20s }
@keyframes mithrilLine {
  0%   { opacity: 0; transform: translateX(-22px) }
  3%   { opacity: 1; transform: translateX(0) }
  14%  { opacity: 1; transform: translateX(0) }
  17%  { opacity: 0; transform: translateX(0) }
  100% { opacity: 0; transform: translateX(0) }
}
.mithril-tg {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: flex-start; justify-content: center;
  padding-left: 40px;
}
.mithril-tg div { opacity: 0; animation: mithrilLine 25s ease-out infinite; animation-fill-mode: both }
.mithril-tg:nth-child(1) div:nth-child(1) { animation-delay: 0.0s }
.mithril-tg:nth-child(1) div:nth-child(2) { animation-delay: 0.45s }
.mithril-tg:nth-child(1) div:nth-child(3) { animation-delay: 0.9s }
.mithril-tg:nth-child(2) div:nth-child(1) { animation-delay: 5.0s }
.mithril-tg:nth-child(2) div:nth-child(2) { animation-delay: 5.45s }
.mithril-tg:nth-child(2) div:nth-child(3) { animation-delay: 5.9s }
.mithril-tg:nth-child(3) div:nth-child(1) { animation-delay: 10.0s }
.mithril-tg:nth-child(3) div:nth-child(2) { animation-delay: 10.45s }
.mithril-tg:nth-child(3) div:nth-child(3) { animation-delay: 10.9s }
.mithril-tg:nth-child(4) div:nth-child(1) { animation-delay: 15.0s }
.mithril-tg:nth-child(4) div:nth-child(2) { animation-delay: 15.45s }
.mithril-tg:nth-child(4) div:nth-child(3) { animation-delay: 15.9s }
.mithril-tg:nth-child(5) div:nth-child(1) { animation-delay: 20.0s }
.mithril-tg:nth-child(5) div:nth-child(2) { animation-delay: 20.45s }
.mithril-tg:nth-child(5) div:nth-child(3) { animation-delay: 20.9s }
.mithril-l1 { font-size: clamp(38px,5vw,68px); font-weight: 900; line-height: 1.1; color: #fff; letter-spacing: -0.04em }
.mithril-l2 { font-size: clamp(38px,5vw,68px); font-weight: 900; line-height: 1.1; color: #5b9cf8; letter-spacing: -0.04em }
.mithril-l3 { font-size: clamp(38px,5vw,68px); font-weight: 900; line-height: 1.1; color: #ef4444; letter-spacing: -0.04em }
@keyframes mithrilDotA {
  0%, 18%  { width: 22px; opacity: 1 }
  25%, 100% { width: 6px; opacity: .35 }
}
.mithril-dot {
  height: 5px; border-radius: 9999px; background: white;
  width: 6px; opacity: .35;
  animation: mithrilDotA 25s ease-in-out infinite; animation-fill-mode: both;
}
.mithril-dot:nth-child(1) { animation-delay: 0s }
.mithril-dot:nth-child(2) { animation-delay: 5s }
.mithril-dot:nth-child(3) { animation-delay: 10s }
.mithril-dot:nth-child(4) { animation-delay: 15s }
.mithril-dot:nth-child(5) { animation-delay: 20s }
#mithril-logo-wrap a { flex-direction: column !important; height: auto !important; align-items: center !important; justify-content: center !important; gap: 12px !important; text-decoration: none !important }
#mithril-logo-wrap img, #mithril-logo-wrap svg { width: 80px !important; height: 80px !important }
#mithril-logo-wrap span { font-size: 24px !important; font-weight: 700 !important; color: #fff !important; letter-spacing: -0.02em !important }
#mithril-r { background: #080d16 }
#mithril-r > div { width: 100% !important; background: #080d16 !important; padding-top: 0 !important; padding-bottom: 0 !important }
#mithril-r > div > div { padding-top: 0 !important }
#mithril-r h1, #mithril-r h1 + p { display: none !important }
#mithril-r input { background: rgba(255,255,255,.04) !important; border: 1px solid rgba(255,255,255,.1) !important; color: #fff !important; border-radius: 10px !important; font-size: 14px !important }
#mithril-r input:focus { border-color: rgba(56,189,248,.6) !important; box-shadow: 0 0 0 3px rgba(56,189,248,.08) !important; outline: none !important }
#mithril-r input::placeholder { color: rgba(255,255,255,.2) !important }
#mithril-r input:-webkit-autofill, #mithril-r input:-webkit-autofill:focus { -webkit-box-shadow: 0 0 0 999px #0e1523 inset !important; -webkit-text-fill-color: #fff !important }
#mithril-r label { color: rgba(255,255,255,.45) !important; font-size: 11px !important; font-weight: 600 !important; letter-spacing: .07em !important; text-transform: uppercase !important }
#mithril-r button[type=submit] { background: linear-gradient(135deg,rgba(56,189,248,.14),rgba(99,102,241,.11)) !important; border: 1px solid rgba(56,189,248,.3) !important; color: #fff !important; border-radius: 10px !important; padding: 13px 20px !important; font-size: 14px !important; font-weight: 600 !important; cursor: pointer !important; transition: all .15s !important; width: 100% !important }
#mithril-r button[type=submit]:hover:not(:disabled) { border-color: rgba(56,189,248,.6) !important; box-shadow: 0 0 20px rgba(56,189,248,.14) !important; background: linear-gradient(135deg,rgba(56,189,248,.22),rgba(99,102,241,.18)) !important }
#mithril-r button[type=submit]:disabled { opacity: .45 !important; cursor: not-allowed !important }
#mithril-r button:not([type=submit]) { background: rgba(255,255,255,.04) !important; border: 1px solid rgba(255,255,255,.1) !important; color: rgba(255,255,255,.65) !important; border-radius: 10px !important }
#mithril-r [role=alert] { background: rgba(239,68,68,.07) !important; border: 1px solid rgba(239,68,68,.2) !important; border-radius: 8px !important }
#mithril-r [role=alert] * { color: #f87171 !important }
#mithril-r a:not(#mithril-logo-wrap a) { color: #38bdf8 !important }
#mithril-r .text-muted-foreground { color: rgba(255,255,255,.38) !important }
#mithril-r p { color: rgba(255,255,255,.38) !important }
#mithril-r svg { color: rgba(255,255,255,.35) !important }
`,i=[{l1:`Every threat.`,l2:`becomes.`,l3:`visible.`},{l1:`The dark web.`,l2:`is under.`,l3:`our watch.`},{l1:`Attacks.`,l2:`detected.`,l3:`before they strike.`},{l1:`Your data.`,l2:`protected.`,l3:`at all times.`},{l1:`Intelligence.`,l2:`never.`,l3:`stops.`}];function a({children:e}){return(0,n.jsxs)(`div`,{style:{display:`flex`,minHeight:`100svh`,width:`100%`,background:`#080d16`},children:[(0,n.jsx)(`style`,{dangerouslySetInnerHTML:{__html:r}}),(0,n.jsxs)(`div`,{className:`hidden lg:flex lg:w-1/2`,style:{position:`relative`,overflow:`hidden`},children:[(0,n.jsx)(`img`,{src:`/bg1.jpg`,className:`mithril-bg`,alt:``}),(0,n.jsx)(`img`,{src:`/bg2.jpg`,className:`mithril-bg`,alt:``}),(0,n.jsx)(`img`,{src:`/bg3.jpg`,className:`mithril-bg`,alt:``}),(0,n.jsx)(`img`,{src:`/bg4.jpg`,className:`mithril-bg`,alt:``}),(0,n.jsx)(`img`,{src:`/bg5.jpg`,className:`mithril-bg`,alt:``}),(0,n.jsx)(`div`,{style:{position:`absolute`,inset:0,background:`linear-gradient(180deg,rgba(3,7,18,.5) 0%,rgba(3,7,18,.2) 45%,rgba(3,7,18,.82) 100%)`,zIndex:1}}),(0,n.jsx)(`div`,{style:{position:`absolute`,inset:0,background:`linear-gradient(90deg,transparent 60%,#080d16 100%)`,zIndex:2}}),(0,n.jsx)(`img`,{src:`/eliphron-logo-transparent.png`,alt:`elIPHRON`,style:{position:`absolute`,top:28,left:36,width:240,objectFit:`contain`,zIndex:20}}),(0,n.jsxs)(`div`,{style:{position:`absolute`,inset:0,zIndex:10},children:[i.map((e,t)=>(0,n.jsxs)(`div`,{className:`mithril-tg`,children:[(0,n.jsx)(`div`,{className:`mithril-l1`,children:e.l1}),(0,n.jsx)(`div`,{className:`mithril-l2`,children:e.l2}),(0,n.jsx)(`div`,{className:`mithril-l3`,children:e.l3})]},t)),(0,n.jsx)(`div`,{style:{position:`absolute`,bottom:28,left:36,display:`flex`,gap:7,zIndex:10},children:i.map((e,t)=>(0,n.jsx)(`div`,{className:`mithril-dot`},t))})]})]}),(0,n.jsxs)(`div`,{id:`mithril-r`,className:`w-full lg:w-1/2`,style:{position:`relative`,display:`flex`,flexDirection:`column`,alignItems:`center`,justifyContent:`center`},children:[(0,n.jsx)(`div`,{style:{position:`absolute`,top:`-5%`,right:`-5%`,width:260,height:260,borderRadius:`50%`,background:`radial-gradient(circle,rgba(56,189,248,.07) 0%,transparent 65%)`,zIndex:0,pointerEvents:`none`}}),(0,n.jsx)(`div`,{style:{position:`absolute`,bottom:`-5%`,left:`10%`,width:260,height:260,borderRadius:`50%`,background:`radial-gradient(circle,rgba(99,102,241,.05) 0%,transparent 65%)`,zIndex:0,pointerEvents:`none`}}),(0,n.jsx)(`div`,{id:`mithril-logo-wrap`,style:{display:`flex`,justifyContent:`center`,marginBottom:12,position:`relative`,zIndex:1},children:(0,n.jsx)(t,{type:`large`})}),e]})]})}export{a as t};