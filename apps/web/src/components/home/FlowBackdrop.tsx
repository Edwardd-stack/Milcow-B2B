/**
 * Decorative background for a group of sections: a soft "milk flow" ribbon
 * running from the top-right corner down to the bottom-left. Pure SVG, no image request.
 * Parent must be `relative isolate`; this sits behind the content (-z-10).
 */
export function FlowBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <svg
        viewBox="0 0 1440 1000"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="flow-white" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="flow-blue" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2065ae" stopOpacity="0.09" />
            <stop offset="1" stopColor="#2065ae" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Wide white ribbon */}
        <path
          d="M1440 0V250C1180 320 1040 500 800 590 560 680 280 690 0 960V700C250 520 480 500 720 430 960 360 1110 170 1170 0Z"
          fill="url(#flow-white)"
        />
        {/* Thin blue band following it */}
        <path
          d="M1440 290V370C1200 450 1060 630 820 710 580 790 300 820 0 1000V960C280 700 560 680 800 590 1040 500 1180 340 1440 290Z"
          fill="url(#flow-blue)"
        />
        {/* Fine line on the upper edge */}
        <path
          d="M1110 0C1050 190 900 360 680 420 440 490 220 520 0 660"
          fill="none"
          stroke="#2065ae"
          strokeOpacity="0.14"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="6 8"
        />
      </svg>

      {/* Dot grids at the two ends of the flow */}
      <div className="absolute top-10 right-6 h-40 w-56 bg-[radial-gradient(#2065ae_1.5px,transparent_1.5px)] [background-size:18px_18px] opacity-20 [mask-image:radial-gradient(closest-side,#000,transparent)]" />
      <div className="absolute bottom-8 left-4 h-36 w-48 bg-[radial-gradient(#2065ae_1.5px,transparent_1.5px)] [background-size:18px_18px] opacity-15 [mask-image:radial-gradient(closest-side,#000,transparent)]" />
    </div>
  );
}
