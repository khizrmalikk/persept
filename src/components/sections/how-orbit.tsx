// The "How it works" orbit: a hand-drawn (feTurbulence wobble) diagram with the
// Persept mark at the centre labelled "Your approvals", six agent tiles around
// it, dashed spokes, and scribbled dots travelling inwards (SMIL animateMotion).
// Two double-stroke marker arcs circle the rings. Ported from the design handoff,
// pure static markup. Respects reduced motion via CSS (see landing.css).

const DOT =
  "M-7 1 C-7 -5 -2 -8 2 -7 C7 -6 8 -1 7 3 C6 7 0 8 -3 7 C-6 6 -8 2 -6 -2";
const TICK = "M-2 -1 L2 1 M-1 2 L2 -2";

type Spoke = { h: number; path: string; begin: string };
const SPOKES: Spoke[] = [
  { h: 20, path: "M500 172 L500 450", begin: "0s" },
  { h: 150, path: "M740.8 311 L500 450", begin: "-2.8s" },
  { h: 290, path: "M740.8 589 L500 450", begin: "-2.2s" },
  { h: 220, path: "M500 728 L500 450", begin: "-1.6s" },
  { h: 110, path: "M259.2 589 L500 450", begin: "-1s" },
  { h: 70, path: "M259.2 311 L500 450", begin: "-0.4s" },
];

type Label = {
  name: string;
  step: string;
  style: React.CSSProperties;
};
const LABELS: Label[] = [
  {
    name: "Lead Scout",
    step: "01 · Spot",
    style: { left: "50%", top: "1%", transform: "translate(-50%,-100%)" },
  },
  {
    name: "Outreach",
    step: "02 · Reach",
    style: { left: "85%", top: "31.7%", transform: "translateY(-50%)" },
  },
  {
    name: "Brief Intake",
    step: "03 · Brief",
    style: { left: "85%", top: "68.3%", transform: "translateY(-50%)" },
  },
  {
    name: "Proposals",
    step: "04 · Propose",
    style: {
      left: "50%",
      top: "93.5%",
      transform: "translateX(-50%)",
      textAlign: "center",
    },
  },
  {
    name: "Project Tracker",
    step: "05 · Deliver",
    style: {
      right: "85%",
      top: "68.3%",
      transform: "translateY(-50%)",
      textAlign: "right",
    },
  },
  {
    name: "Renewals",
    step: "06 · Renew",
    style: {
      right: "85%",
      top: "31.7%",
      transform: "translateY(-50%)",
      textAlign: "right",
    },
  },
];

export function HowOrbit() {
  return (
    <div className="pl-orbit">
      <svg
        viewBox="0 0 1000 900"
        className="pl-orbit-svg"
        aria-hidden="true"
        fill="none"
        stroke="#f4f1ec"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <filter id="wob2">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.022"
              numOctaves={2}
              seed={7}
            />
            <feDisplacementMap in="SourceGraphic" scale={4} />
          </filter>
          <radialGradient id="orbGlow" cx="0.5" cy="0.5" r="0.5">
            <stop
              offset="0"
              stopColor="oklch(0.62 0.14 60)"
              stopOpacity="0.42"
            />
            <stop
              offset="0.45"
              stopColor="oklch(0.55 0.12 60)"
              stopOpacity="0.14"
            />
            <stop offset="1" stopColor="oklch(0.55 0.12 60)" stopOpacity="0" />
          </radialGradient>
          <filter id="wob3" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.014"
              numOctaves={2}
              seed={11}
            />
            <feDisplacementMap in="SourceGraphic" scale={7} />
          </filter>
        </defs>
        <circle cx="500" cy="450" r="430" fill="url(#orbGlow)" stroke="none" />
        <g filter="url(#wob3)" strokeWidth={1.5}>
          <path
            d="M168 456 C166 268 318 118 506 120 C690 122 834 270 830 452 C826 636 680 784 494 780 C312 776 170 632 172 432"
            opacity="0.42"
          />
          <path
            d="M176 440 C182 262 330 126 512 128 C688 134 824 280 822 460 C818 640 670 772 488 772 C316 766 178 640 174 470"
            opacity="0.2"
          />
          <path
            d="M330 452 C328 356 404 280 502 280 C596 282 672 358 670 452 C668 546 592 622 498 620 C404 618 330 540 334 436"
            opacity="0.38"
          />
          <path
            d="M338 444 C342 362 414 288 506 288 C590 292 662 368 662 456 C660 540 588 612 494 612 C410 608 338 534 340 462"
            opacity="0.18"
          />
          <path
            d="M500 360 L501 174 M577 405 L740 313 M577 495 L739 588 M500 540 L499 726 M423 495 L260 588 M423 405 L261 312"
            opacity="0.3"
            strokeDasharray="14 10"
          />
        </g>
        <g className="pl-orbit-dots" filter="url(#wob3)" strokeLinecap="round">
          {SPOKES.map((s) => (
            <g key={s.h}>
              <path
                d={DOT}
                stroke={`oklch(0.78 0.12 ${s.h})`}
                strokeWidth={2.6}
              />
              <path
                d={TICK}
                stroke={`oklch(0.78 0.12 ${s.h})`}
                strokeWidth={2}
              />
              <animateMotion
                dur="3.4s"
                begin={s.begin}
                repeatCount="indefinite"
                path={s.path}
              />
            </g>
          ))}
        </g>
        <g className="pl-orbit-arcs" filter="url(#wob3)" strokeLinecap="round">
          <g>
            <path
              d="M500 116 C528 116 556 120 582 128"
              stroke="oklch(0.8 0.14 70)"
              strokeWidth={4}
            />
            <path
              d="M506 123 C530 123 552 127 574 134"
              stroke="oklch(0.8 0.14 70)"
              strokeWidth={2}
              opacity="0.6"
            />
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 500 450"
              to="360 500 450"
              dur="26s"
              repeatCount="indefinite"
            />
          </g>
          <g>
            <path
              d="M498 276 C514 276 530 279 544 284"
              stroke="oklch(0.78 0.12 220)"
              strokeWidth={4}
            />
            <path
              d="M502 283 C516 283 528 285 540 290"
              stroke="oklch(0.78 0.12 220)"
              strokeWidth={2}
              opacity="0.6"
            />
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="200 500 450"
              to="-160 500 450"
              dur="17s"
              repeatCount="indefinite"
            />
          </g>
        </g>
        <g filter="url(#wob2)">
          <rect
            x="410"
            y="360"
            width="180"
            height="180"
            rx="34"
            fill="#161412"
          />
          <g transform="translate(445.4 399.8) scale(0.8)" stroke="none">
            <path
              d="M27.37,119.56L96.19,1.970c.71-1.22,2.02-1.97,3.44-1.97h32.97c3.08,0,5,3.35,3.44,6l-69.05,117.59c-.72,1.22-2.02,1.970-3.44,1.97H30.81c-3.08,0-4.99-3.34-3.44-6Z"
              fill="oklch(0.8 0.14 70)"
            />
            <path
              d="M95.24,0H3.94C.67,0-1.17,3.76.83,6.34l19.74,25.490c.75.96,1.89,1.53,3.11,1.53h52.04"
              fill="#f4f1ec"
            />
          </g>
          <rect
            x="448"
            y="68"
            width="104"
            height="104"
            rx="24"
            fill="#161412"
          />
          <path d="M478 114 a16 16 0 1 0 32 0 a16 16 0 1 0 -32 0" />
          <path
            d="M506 126 L520 140"
            stroke="oklch(0.78 0.12 20)"
            strokeWidth={3}
          />
          <path
            d="M488 110 Q492 104 498 104"
            stroke="oklch(0.78 0.12 20)"
            strokeWidth={3}
          />
          <rect
            x="733.8"
            y="233"
            width="104"
            height="104"
            rx="24"
            fill="#161412"
          />
          <path d="M760 287 L812 262 L792 312 L784 292 Z M784 292 L812 262" />
          <path
            d="M756 304 L766 300 M762 314 L774 308"
            stroke="oklch(0.78 0.12 150)"
            strokeWidth={3}
          />
          <rect
            x="733.8"
            y="563"
            width="104"
            height="104"
            rx="24"
            fill="#161412"
          />
          <path d="M765 594 L807 594 L807 644 L765 644 Z M777 588 L795 588 L795 599 L777 599 Z" />
          <path
            d="M774 613 L798 613 M774 623 L798 623 M774 633 L787 633"
            stroke="oklch(0.78 0.12 290)"
            strokeWidth={3}
          />
          <rect
            x="448"
            y="728"
            width="104"
            height="104"
            rx="24"
            fill="#161412"
          />
          <path d="M482 754 L510 754 L520 764 L520 806 L482 806 Z M510 754 L510 764 L520 764" />
          <path
            d="M490 778 L512 778 M490 788 L504 788 M490 798 L498 798"
            stroke="oklch(0.78 0.12 220)"
            strokeWidth={3}
          />
          <rect
            x="162.2"
            y="563"
            width="104"
            height="104"
            rx="24"
            fill="#161412"
          />
          <path d="M189 597 L240 597 L240 640 L189 640 Z M189 610 L240 610 M201 589 L201 603 M228 589 L228 603" />
          <path
            d="M209 625 L214 630 L223 619"
            stroke="oklch(0.78 0.12 110)"
            strokeWidth={3}
          />
          <rect
            x="162.2"
            y="233"
            width="104"
            height="104"
            rx="24"
            fill="#161412"
          />
          <path d="M190.2 285 A24 24 0 1 1 214.2 309 M190.2 285 L184 275 M190.2 285 L200 279" />
          <path
            d="M214.2 285 L214.2 273 M214.2 285 L223 290"
            stroke="oklch(0.78 0.12 70)"
            strokeWidth={3}
          />
        </g>
      </svg>
      <div className="pl-orbit-centre">Your approvals</div>
      {LABELS.map((l) => (
        <div className="pl-orbit-label" style={l.style} key={l.name}>
          <div className="pl-orbit-name">{l.name}</div>
          <div className="pl-orbit-step">{l.step}</div>
        </div>
      ))}
    </div>
  );
}
