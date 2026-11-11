import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import { RotateCcw } from 'lucide-react';
import {
  IGP_CORRIDOR_NODES,
  CorridorNodeId,
  PerturbationState,
  NodeLiveTelemetry,
  ReactivePhysicsIndices,
  Forecast72hPoint,
  getCpcbSeverity,
} from '../utils/corridorTelemetryEngine';

interface View1CorridorConsoleProps {
  perturbation: PerturbationState;
  onUpdatePerturbation: (patch: Partial<PerturbationState>) => void;
  onResetPreset: () => void;
  selectedNodeId: CorridorNodeId;
  onSelectNode: (nodeId: CorridorNodeId) => void;
  nodeReadouts: Record<CorridorNodeId, NodeLiveTelemetry>;
  activeNode: NodeLiveTelemetry;
  indices: ReactivePhysicsIndices;
  conformalOffsetQHat: number;
  forecast72h: Forecast72hPoint[];
  peakMse24h: number;
  peakCqr24h: number;
  leadTimeGainHrs: number;
}

export const View1CorridorConsole: React.FC<View1CorridorConsoleProps> = ({
  perturbation,
  onUpdatePerturbation,
  onResetPreset,
  selectedNodeId,
  onSelectNode,
  nodeReadouts,
  activeNode,
  indices,
  conformalOffsetQHat,
  forecast72h,
  peakMse24h,
  peakCqr24h,
  leadTimeGainHrs,
}) => {
  const forecastSeverity = getCpcbSeverity(peakCqr24h);
  const mseUnderpredictionGap = Math.max(0, peakCqr24h - peakMse24h);

  // Determine alignment to 315° NW transport corridor
  const angleDiffFrom315 = Math.abs(((perturbation.windDirDeg - 315 + 540) % 360) - 180);
  const isNwCorridorAligned = angleDiffFrom315 <= 45;

  // Compact inline sparkline bar widths (0 to 100%)
  const barPct01 = Math.min(100, Math.round((activeNode.pm25 / 500) * 100));
  const barPct02 = Math.min(100, Math.round((peakMse24h / 500) * 100));
  const barPct03 = Math.min(100, Math.round((peakCqr24h / 500) * 100));
  const barPct04 = Math.min(100, Math.round((peakCqr24h / 350) * 100));
  const barPct05 = Math.min(100, Math.round((leadTimeGainHrs / 14) * 100));
  const barPct06 = Math.min(100, Math.round((Math.max(0, indices.uNwVelocityKmh) / 20) * 100));

  // Non-overlapping callout box offsets for each of the 5 nodes in the 680x380 SVG
  const calloutPlacements: Record<
    CorridorNodeId,
    { boxX: number; boxY: number; anchorX: number; anchorY: number }
  > = {
    // Ludhiana (115, 82) -> Above-Left
    ludhiana: { boxX: 16, boxY: 18, anchorX: 90, anchorY: 52 },
    // Chandigarh (225, 122) -> Above-Right
    chandigarh: { boxX: 248, boxY: 54, anchorX: 248, anchorY: 78 },
    // Karnal (340, 184) -> Below-Left
    karnal: { boxX: 185, boxY: 204, anchorX: 303, anchorY: 214 },
    // Delhi NCR (455, 246) -> Above-Right
    delhi: { boxX: 478, boxY: 174, anchorX: 478, anchorY: 202 },
    // Lucknow (565, 298) -> Below-Right
    lucknow: { boxX: 546, boxY: 320, anchorX: 580, anchorY: 320 },
  };

  return (
    <div className="space-y-6">
      {/* SPACIOUS 3x2 TELEMETRY KPI CARD GRID */}
      <section aria-label="Primary Telemetry Specification Cards" className="my-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 01: Receptor PM2.5 */}
          <div className="p-6 bg-[#FAF9F5] border border-[#1C1C1C] flex flex-col justify-between min-h-[155px] rounded-none shadow-none">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#111111]">
                01 // RECEPTOR PM2.5
              </span>
              <span className="px-2 py-0.5 text-xs font-mono border border-[#D4D2C8] bg-[#EAE8E0] text-[#111111] font-semibold whitespace-nowrap">
                [{activeNode.nodeId.toUpperCase()}]
              </span>
            </div>

            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums tracking-tight text-[#111111]">
                {activeNode.pm25}
              </span>
              <span className="text-xs font-mono text-stone-600">µg/m³</span>
            </div>

            <div className="w-full h-1.5 bg-[#EAE8E0] border border-[#D4D2C8] mb-3">
              <div
                className="h-full bg-[#111111]"
                style={{ width: `${barPct01}%` }}
              />
            </div>

            <div className="text-xs font-mono leading-relaxed pt-3 border-t border-[#E2E0D8] flex justify-between items-center whitespace-nowrap text-[#18181B] tabular-nums">
              <span className="text-stone-600">Fine Ratio (PM₂.₅ / PM₁₀):</span>
              <span className="font-semibold">
                {indices.pmRatio.toFixed(2)} ({activeNode.pm10} µg/m³)
              </span>
            </div>
          </div>

          {/* Card 02: MSE Conditional Mean */}
          <div className="p-6 bg-[#FAF9F5] border border-[#1C1C1C] flex flex-col justify-between min-h-[155px] rounded-none shadow-none">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#111111]">
                02 // MSE CONDITIONAL MEAN
              </span>
              <span className="px-2 py-0.5 text-xs font-mono border border-[#D4D2C8] bg-[#EAE8E0] text-[#1D4ED8] font-semibold whitespace-nowrap">
                LGBM-L2
              </span>
            </div>

            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums tracking-tight text-[#1D4ED8]">
                {peakMse24h}
              </span>
              <span className="text-xs font-mono text-stone-600">µg/m³ (24h Peak)</span>
            </div>

            <div className="w-full h-1.5 bg-[#EAE8E0] border border-[#D4D2C8] mb-3">
              <div
                className="h-full bg-[#1D4ED8]"
                style={{ width: `${barPct02}%` }}
              />
            </div>

            <div className="text-xs font-mono leading-relaxed pt-3 border-t border-[#E2E0D8] flex justify-between items-center whitespace-nowrap text-[#18181B] tabular-nums">
              <span className="text-stone-600">Tail Smoothing Bias:</span>
              <span className="text-[#B91C1C] font-semibold">
                -{mseUnderpredictionGap} µg/m³ under-prediction
              </span>
            </div>
          </div>

          {/* Card 03: CQR-0.90 Upper Bound */}
          <div className="p-6 bg-[#FAF9F5] border border-[#1C1C1C] flex flex-col justify-between min-h-[155px] rounded-none shadow-none">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#111111]">
                03 // CQR-0.90 UPPER BOUND
              </span>
              <span className="px-2 py-0.5 text-xs font-mono border border-[#D4D2C8] bg-[#EAE8E0] text-[#B91C1C] font-semibold whitespace-nowrap">
                α = 0.90
              </span>
            </div>

            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums tracking-tight text-[#B91C1C]">
                {peakCqr24h}
              </span>
              <span className="text-xs font-mono text-stone-600">µg/m³ (24h Peak)</span>
            </div>

            <div className="w-full h-1.5 bg-[#EAE8E0] border border-[#D4D2C8] mb-3">
              <div
                className="h-full bg-[#B91C1C]"
                style={{ width: `${barPct03}%` }}
              />
            </div>

            <div className="text-xs font-mono leading-relaxed pt-3 border-t border-[#E2E0D8] flex justify-between items-center whitespace-nowrap text-[#18181B] tabular-nums">
              <span className="text-stone-600">Conformal Offset +Q̂₁₋δ:</span>
              <span className="text-[#15803D] font-bold">
                +{conformalOffsetQHat.toFixed(2)} µg/m³
              </span>
            </div>
          </div>

          {/* Card 04: CAQM GRAP Regime */}
          <div className="p-6 bg-[#FAF9F5] border border-[#1C1C1C] flex flex-col justify-between min-h-[155px] rounded-none shadow-none">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#111111]">
                04 // CAQM GRAP REGIME
              </span>
              <span className="px-2 py-0.5 text-xs font-mono border border-[#D4D2C8] bg-[#EAE8E0] text-[#111111] font-semibold whitespace-nowrap">
                STATUTORY
              </span>
            </div>

            <div className="my-2">
              <span
                className="inline-block px-3 py-1 text-sm font-mono font-bold uppercase tracking-wide border rounded-none whitespace-nowrap"
                style={{
                  backgroundColor: forecastSeverity.bgHex,
                  color: forecastSeverity.textHex,
                  borderColor: forecastSeverity.borderHex,
                }}
              >
                {forecastSeverity.grapStage}
              </span>
            </div>

            <div className="w-full h-1.5 bg-[#EAE8E0] border border-[#D4D2C8] mb-3">
              <div
                className="h-full"
                style={{
                  width: `${barPct04}%`,
                  backgroundColor: forecastSeverity.colorHex,
                }}
              />
            </div>

            <div className="text-xs font-mono leading-relaxed pt-3 border-t border-[#E2E0D8] flex justify-between items-center whitespace-nowrap text-[#18181B]">
              <span className="text-stone-600">24h Severity Class:</span>
              <span className="font-semibold">{forecastSeverity.category}</span>
            </div>
          </div>

          {/* Card 05: Early-Warning Lead */}
          <div className="p-6 bg-[#FAF9F5] border border-[#1C1C1C] flex flex-col justify-between min-h-[155px] rounded-none shadow-none">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#111111]">
                05 // EARLY-WARNING LEAD
              </span>
              <span className="px-2 py-0.5 text-xs font-mono border border-[#D4D2C8] bg-[#EAE8E0] text-[#15803D] font-semibold whitespace-nowrap">
                PRE-EMPTIVE
              </span>
            </div>

            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums tracking-tight text-[#15803D]">
                +{leadTimeGainHrs.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-stone-600">hrs ahead of breach</span>
            </div>

            <div className="w-full h-1.5 bg-[#EAE8E0] border border-[#D4D2C8] mb-3">
              <div
                className="h-full bg-[#15803D]"
                style={{ width: `${barPct05}%` }}
              />
            </div>

            <div className="text-xs font-mono leading-relaxed pt-3 border-t border-[#E2E0D8] flex justify-between items-center whitespace-nowrap text-[#18181B]">
              <span className="text-stone-600">vs. CPCB 24h Moving Avg:</span>
              <span className="font-semibold">Pre-emptive GRAP Stage-IV</span>
            </div>
          </div>

          {/* Card 06: 315° NW Advection Vector */}
          <div className="p-6 bg-[#FAF9F5] border border-[#1C1C1C] flex flex-col justify-between min-h-[155px] rounded-none shadow-none">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-[#111111]">
                06 // 315° NW ADVECTION
              </span>
              <span className="px-2 py-0.5 text-xs font-mono border border-[#D4D2C8] bg-[#EAE8E0] text-[#1D4ED8] font-semibold whitespace-nowrap">
                θ = {perturbation.windDirDeg}°
              </span>
            </div>

            <div className="my-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums tracking-tight text-[#18181B]">
                {Math.max(0, indices.uNwVelocityKmh).toFixed(2)}
              </span>
              <span className="text-xs font-mono text-stone-600">km/h axial velocity</span>
            </div>

            <div className="w-full h-1.5 bg-[#EAE8E0] border border-[#D4D2C8] mb-3">
              <div
                className="h-full bg-[#1D4ED8]"
                style={{ width: `${barPct06}%` }}
              />
            </div>

            <div className="text-xs font-mono leading-relaxed pt-3 border-t border-[#E2E0D8] flex justify-between items-center whitespace-nowrap text-[#18181B] tabular-nums">
              <span className="text-stone-600">Corridor Plume Flux Φ_adv:</span>
              <span className="font-bold text-[#1D4ED8]">
                {indices.phiAdvectionFlux.toFixed(2)} flux units
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN SPLIT WORKSPACE: LEFT (5 COLS) CORRIDOR SVG + PERTURBATION MATRIX | RIGHT (7 COLS) 72H CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT SPLIT PANEL: IGP CORRIDOR VECTOR SCHEMATIC & PERTURBATION CONTROLS */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Custom SVG Spatiotemporal Corridor Map */}
          <div className="bg-[#FAF9F5] border border-[#1C1C1C] rounded-none shadow-none">
            <div className="bg-[#EAE8E0] p-6 border-b border-[#1C1C1C] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-serif font-bold tracking-tight text-[#111111]">
                  Fig. 1A — IGP NW-to-SE Spatiotemporal Plume Advection Corridor
                </h2>
                <p className="text-xs text-stone-600 font-mono mt-1">
                  315° Axial Synoptic Transport: Ludhiana → Chandigarh → Karnal → Delhi NCR → Lucknow
                </p>
              </div>
              <span
                className={`text-xs font-mono font-semibold px-2.5 py-1 border rounded-none whitespace-nowrap ${
                  isNwCorridorAligned
                    ? 'bg-[#FEE2E2] border-[#B91C1C] text-[#B91C1C]'
                    : 'bg-[#FAF9F5] border-[#1C1C1C] text-[#18181B]'
                }`}
              >
                {isNwCorridorAligned ? '315° AXIAL LOCK' : 'OFF-AXIS FLOW'}
              </span>
            </div>

            {/* Engineered Cartographic Paper & Ink SVG Map (Expanded 680x380 viewBox, Zero Collisions) */}
            <div className="p-6 bg-[#FAF9F5]">
              <div className="border border-[#1C1C1C] bg-[#F4F3EE] p-2">
                <svg
                  viewBox="0 0 680 380"
                  className="w-full h-[310px] select-none"
                  role="img"
                  aria-label="Indo-Gangetic Plain 5-Node Advection Corridor Map"
                >
                  <defs>
                    <pattern
                      id="igpEditorialGrid"
                      width="34"
                      height="34"
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d="M 34 0 L 0 0 0 34"
                        fill="none"
                        stroke="#D4D2C8"
                        strokeWidth="0.75"
                      />
                    </pattern>
                    <marker
                      id="editorialPlumeArrow"
                      viewBox="0 0 10 10"
                      refX="6"
                      refY="5"
                      markerWidth="5.5"
                      markerHeight="5.5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#1D4ED8" />
                    </marker>
                  </defs>

                  {/* Technical Graticule Grid */}
                  <rect width="680" height="380" fill="url(#igpEditorialGrid)" />

                  {/* Himalayan Foothill Orographic Boundary Contour (NE Top-Right Boundary) */}
                  <path
                    d="M 190 12 Q 360 32, 515 88 T 670 155"
                    fill="none"
                    stroke="#57534E"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                  />
                  <text
                    x="430"
                    y="36"
                    fill="#44403C"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="600"
                  >
                    HIMALAYAN OROGRAPHIC BARRIER (NE)
                  </text>

                  {/* Indo-Gangetic Plain Plume Advection Corridor Swath */}
                  <path
                    d="M 115 82 L 225 122 L 340 184 L 455 246 L 565 298"
                    fill="none"
                    stroke="rgba(185, 28, 28, 0.12)"
                    strokeWidth="42"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Active Plume Transit Axis Line */}
                  <path
                    d="M 115 82 L 225 122 L 340 184 L 455 246 L 565 298"
                    fill="none"
                    stroke="#1D4ED8"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    markerEnd="url(#editorialPlumeArrow)"
                  />

                  {/* Transit-Lag Badges placed cleanly in dedicated open corridors */}
                  <g fontFamily="JetBrains Mono, monospace" fontSize="10">
                    {/* Lag Badge 1: Upwind Punjab/Chd (-12h..-8h) */}
                    <rect
                      x="64"
                      y="134"
                      width="96"
                      height="19"
                      fill="#FAF9F5"
                      stroke="#1C1C1C"
                      strokeWidth="0.9"
                    />
                    <text x="72" y="147" fill="#1D4ED8" fontWeight="600">
                      Δt = -12h..-8h
                    </text>

                    {/* Lag Badge 2: Karnal Transit (-6h lag) */}
                    <rect
                      x="362"
                      y="132"
                      width="84"
                      height="19"
                      fill="#FAF9F5"
                      stroke="#1C1C1C"
                      strokeWidth="0.9"
                    />
                    <text x="370" y="145" fill="#B91C1C" fontWeight="600">
                      Δt = -6h lag
                    </text>

                    {/* Lag Badge 3: Downwind Lucknow (+10h downwind) */}
                    <rect
                      x="388"
                      y="286"
                      width="98"
                      height="19"
                      fill="#FAF9F5"
                      stroke="#1C1C1C"
                      strokeWidth="0.9"
                    />
                    <text x="396" y="299" fill="#18181B" fontWeight="600">
                      +10h downwind
                    </text>
                  </g>

                  {/* Directional Wind Vectors rotated to perturbation.windDirDeg */}
                  {[
                    { x: 172, y: 102 },
                    { x: 282, y: 153 },
                    { x: 398, y: 215 },
                    { x: 510, y: 272 },
                  ].map((vec, idx) => {
                    const blowToAngleSvg = (perturbation.windDirDeg + 180) % 360;
                    return (
                      <g
                        key={idx}
                        transform={`translate(${vec.x}, ${vec.y}) rotate(${blowToAngleSvg})`}
                      >
                        <line
                          x1="0"
                          y1="11"
                          x2="0"
                          y2="-11"
                          stroke="#1D4ED8"
                          strokeWidth="1.8"
                        />
                        <polygon points="0,-14 -3.8,-6 3.8,-6" fill="#1D4ED8" />
                      </g>
                    );
                  })}

                  {/* Render 5 Corridor Station Nodes with Staggered Non-Overlapping Callout Boxes */}
                  {IGP_CORRIDOR_NODES.map((node) => {
                    const telemetry = nodeReadouts[node.id];
                    const sev = getCpcbSeverity(telemetry.pm25);
                    const isSelected = node.id === selectedNodeId;
                    const placement = calloutPlacements[node.id];

                    return (
                      <g
                        key={node.id}
                        className="cursor-pointer"
                        onClick={() => onSelectNode(node.id)}
                      >
                        {/* Crisp Leader Line connecting Station Node to Callout Box */}
                        <line
                          x1={node.svgX}
                          y1={node.svgY}
                          x2={placement.anchorX}
                          y2={placement.anchorY}
                          stroke="#1C1C1C"
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />

                        {/* Outer Target Ring if Selected */}
                        {isSelected && (
                          <circle
                            cx={node.svgX}
                            cy={node.svgY}
                            r="15"
                            fill="none"
                            stroke="#111111"
                            strokeWidth="1.6"
                            strokeDasharray="3 2"
                          />
                        )}

                        <circle
                          cx={node.svgX}
                          cy={node.svgY}
                          r={isSelected ? '8.5' : '6.5'}
                          fill={sev.colorHex}
                          stroke="#111111"
                          strokeWidth="1.8"
                        />

                        {/* Non-Overlapping Callout Box */}
                        <g transform={`translate(${placement.boxX}, ${placement.boxY})`}>
                          <rect
                            x="0"
                            y="0"
                            width="118"
                            height="36"
                            fill="#FAF9F5"
                            stroke="#1C1C1C"
                            strokeWidth={isSelected ? '1.8' : '1'}
                          />
                          <text
                            x="7"
                            y="14"
                            fill="#111111"
                            fontSize="10.5"
                            fontWeight="700"
                            fontFamily="Inter, sans-serif"
                          >
                            {node.shortLabel}
                          </text>
                          <text
                            x="7"
                            y="28"
                            fill={sev.colorHex}
                            fontSize="11"
                            fontWeight="700"
                            fontFamily="JetBrains Mono, monospace"
                          >
                            {telemetry.pm25} µg/m³
                          </text>
                        </g>
                      </g>
                    );
                  })}

                  {/* Bottom-Left Legend / Coordinate Footer inside SVG */}
                  <g transform="translate(16, 304)" fontFamily="JetBrains Mono, monospace">
                    <rect
                      x="0"
                      y="0"
                      width="260"
                      height="58"
                      fill="#FAF9F5"
                      stroke="#1C1C1C"
                      strokeWidth="1"
                    />
                    <text x="10" y="18" fill="#111111" fontSize="10" fontWeight="600">
                      WIND VECTOR: {perturbation.windSpeedKmh.toFixed(1)} km/h @ {perturbation.windDirDeg}°
                    </text>
                    <text x="10" y="34" fill="#1D4ED8" fontSize="10" fontWeight="600">
                      315° AXIAL PROJECTION: {Math.max(0, indices.uNwVelocityKmh).toFixed(2)} km/h
                    </text>
                    <text x="10" y="49" fill="#57534E" fontSize="9">
                      CLICK ANY CORRIDOR NODE TO INSPECT RECEPTOR
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* Atmospheric Physics Perturbation Sliders (Spacious Technical Controls) */}
          <div className="bg-[#FAF9F5] border border-[#1C1C1C] rounded-none shadow-none">
            <div className="bg-[#EAE8E0] p-6 border-b border-[#1C1C1C] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-serif font-bold tracking-tight text-[#111111]">
                  § 1.1 Atmospheric Physics Perturbation Matrix
                </h2>
                <p className="text-xs text-stone-600 font-mono mt-1">
                  Real-time propagation into Φ_adv, RNII, PSAI, CDCP & 24h CQR Upper Bound
                </p>
              </div>
              <button
                type="button"
                onClick={onResetPreset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-[#111111] bg-[#FAF9F5] hover:bg-[#111111] hover:text-[#FAF9F5] border border-[#1C1C1C] rounded-none cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                RESET EPISODE
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              {/* Slider 1: Upwind Source PM2.5 */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-stone-700 font-medium">01. Upwind PM₂.₅ (t-6h)</span>
                  <span className="text-[#B91C1C] font-bold tabular-nums">
                    {perturbation.upwindPm25} µg/m³
                  </span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={550}
                  step={5}
                  value={perturbation.upwindPm25}
                  onChange={(e) =>
                    onUpdatePerturbation({ upwindPm25: Number(e.target.value) })
                  }
                  className="w-full cursor-pointer"
                />
              </div>

              {/* Slider 2: Satellite AOD */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-stone-700 font-medium">02. Column Satellite AOD</span>
                  <span className="text-[#18181B] font-bold tabular-nums">
                    {perturbation.aod.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0.1}
                  max={3.2}
                  step={0.05}
                  value={perturbation.aod}
                  onChange={(e) =>
                    onUpdatePerturbation({ aod: Number(e.target.value) })
                  }
                  className="w-full cursor-pointer"
                />
              </div>

              {/* Slider 3: Surface Wind Speed */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-stone-700 font-medium">03. Wind_Speed_10m</span>
                  <span className="text-[#1D4ED8] font-bold tabular-nums">
                    {perturbation.windSpeedKmh.toFixed(1)} km/h
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={30}
                  step={0.5}
                  value={perturbation.windSpeedKmh}
                  onChange={(e) =>
                    onUpdatePerturbation({ windSpeedKmh: Number(e.target.value) })
                  }
                  className="w-full cursor-pointer"
                />
              </div>

              {/* Slider 4: Wind Direction */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-stone-700 font-medium">04. Wind_Dir_10m (NW=315°)</span>
                  <span className="text-[#1D4ED8] font-bold tabular-nums">
                    {perturbation.windDirDeg}°
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={2}
                  value={perturbation.windDirDeg}
                  onChange={(e) =>
                    onUpdatePerturbation({ windDirDeg: Number(e.target.value) })
                  }
                  className="w-full cursor-pointer"
                />
              </div>

              {/* Slider 5: Solar Radiation */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-stone-700 font-medium">05. Solar_Radiation_Wm2</span>
                  <span className="text-[#18181B] font-bold tabular-nums">
                    {perturbation.solarRadiationWm2} W/m²
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={750}
                  step={10}
                  value={perturbation.solarRadiationWm2}
                  onChange={(e) =>
                    onUpdatePerturbation({ solarRadiationWm2: Number(e.target.value) })
                  }
                  className="w-full cursor-pointer"
                />
              </div>

              {/* Slider 6: Ambient Temperature */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-stone-700 font-medium">06. Temp_2m_C</span>
                  <span className="text-[#18181B] font-bold tabular-nums">
                    {perturbation.temp2mC.toFixed(1)} °C
                  </span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={40}
                  step={0.5}
                  value={perturbation.temp2mC}
                  onChange={(e) =>
                    onUpdatePerturbation({ temp2mC: Number(e.target.value) })
                  }
                  className="w-full cursor-pointer"
                />
              </div>

              {/* Slider 7: Relative Humidity */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-stone-700 font-medium">07. Humidity_Percent</span>
                  <span className="text-[#18181B] font-bold tabular-nums">
                    {perturbation.humidityPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={98}
                  step={1}
                  value={perturbation.humidityPct}
                  onChange={(e) =>
                    onUpdatePerturbation({ humidityPct: Number(e.target.value) })
                  }
                  className="w-full cursor-pointer"
                />
              </div>

              {/* Slider 8: Mineral Dust Concentration */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-stone-700 font-medium">08. Crustal Dust_ugm3</span>
                  <span className="text-[#18181B] font-bold tabular-nums">
                    {perturbation.dustUgm3} µg/m³
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={380}
                  step={5}
                  value={perturbation.dustUgm3}
                  onChange={(e) =>
                    onUpdatePerturbation({ dustUgm3: Number(e.target.value) })
                  }
                  className="w-full cursor-pointer"
                />
              </div>
            </div>

            {/* Regime Toggles: Crop_Burning_Season & Festival_Period */}
            <div className="border-t border-[#1C1C1C] grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#1C1C1C]">
              <button
                type="button"
                onClick={() =>
                  onUpdatePerturbation({
                    cropBurningSeason: !perturbation.cropBurningSeason,
                  })
                }
                className={`px-6 py-3.5 text-left font-mono text-xs flex items-center justify-between cursor-pointer rounded-none transition-colors ${
                  perturbation.cropBurningSeason
                    ? 'bg-[#FEE2E2] text-[#B91C1C] font-bold'
                    : 'bg-[#FAF9F5] text-stone-600'
                }`}
              >
                <span>I_crop // Crop_Burning_Season</span>
                <span className="px-2 py-0.5 border border-[#1C1C1C] bg-[#FAF9F5] text-[#111111] whitespace-nowrap">
                  {perturbation.cropBurningSeason ? 'ACTIVE (1)' : 'INACTIVE (0)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onUpdatePerturbation({
                    festivalPeriod: !perturbation.festivalPeriod,
                  })
                }
                className={`px-6 py-3.5 text-left font-mono text-xs flex items-center justify-between cursor-pointer rounded-none transition-colors ${
                  perturbation.festivalPeriod
                    ? 'bg-[#FEF3C7] text-[#92400E] font-bold'
                    : 'bg-[#FAF9F5] text-stone-600'
                }`}
              >
                <span>I_fest // Festival_Period</span>
                <span className="px-2 py-0.5 border border-[#1C1C1C] bg-[#FAF9F5] text-[#111111] whitespace-nowrap">
                  {perturbation.festivalPeriod ? 'ACTIVE (1)' : 'INACTIVE (0)'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN PANEL: MULTI-HORIZON 72H CONFORMAL FORECAST & UNCERTAINTY BAND CHART */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-[#FAF9F5] border border-[#1C1C1C] rounded-none shadow-none flex-1 flex flex-col justify-between">
            <div className="bg-[#EAE8E0] p-6 border-b border-[#1C1C1C] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-serif font-bold tracking-tight text-[#111111]">
                  Fig. 1B — 72-Hour Multi-Horizon Conformal Forecast & Uncertainty Trajectory ({activeNode.nodeId.toUpperCase()})
                </h2>
                <p className="text-xs text-stone-600 font-mono mt-1">
                  48h Historical Telemetry (-47h..0h) + 24h Lead Conformal Quantile Trajectory (+1h..+24h)
                </p>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-mono">
                <span className="px-2.5 py-1 bg-[#FAF9F5] border border-[#1C1C1C] text-[#15803D] font-bold whitespace-nowrap">
                  1 - δ = {(perturbation.targetConformalCoverage * 100).toFixed(0)}%
                </span>
                <span className="px-2.5 py-1 bg-[#B91C1C] border border-[#1C1C1C] text-[#FAF9F5] font-bold whitespace-nowrap">
                  GRAP-IV τ = 250 µg/m³
                </span>
              </div>
            </div>

            {/* Recharts ComposedChart on Crisp Ivory Canvas */}
            <div className="p-6 flex-1 flex flex-col justify-center">
              <div className="w-full h-[460px] bg-[#FAF9F5] border border-[#D4D2C8] p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={forecast72h}
                    margin={{ top: 16, right: 20, left: 6, bottom: 10 }}
                  >
                    <CartesianGrid stroke="#D4D2C8" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="hourLabel"
                      stroke="#1C1C1C"
                      tick={{ fill: '#18181B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      interval={5}
                    />
                    <YAxis
                      stroke="#1C1C1C"
                      tick={{ fill: '#18181B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      domain={[0, 'auto']}
                      label={{
                        value: 'PM2.5 Concentration (µg/m³)',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#111111',
                        fontSize: 11,
                        fontFamily: 'JetBrains Mono',
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FAF9F5',
                        borderColor: '#1C1C1C',
                        borderRadius: '0px',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        color: '#111111',
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '11px',
                        paddingTop: '10px',
                        color: '#111111',
                      }}
                    />

                    {/* Shaded Conformal Prediction Interval [q_0.10, q_0.90 + Q_hat] */}
                    <Area
                      type="monotone"
                      dataKey="cqrBandRange"
                      name="Conformal 90% Interval [q̂₀.₁₀, q̂₀.₉₀ + Q̂₁₋δ]"
                      fill="#B91C1C"
                      fillOpacity={0.14}
                      stroke="none"
                    />

                    {/* CAQM GRAP Stage-IV Severe+ Emergency Threshold (250 ug/m3) */}
                    <ReferenceLine
                      y={250}
                      stroke="#B91C1C"
                      strokeWidth={1.75}
                      strokeDasharray="6 3"
                      label={{
                        value: 'CAQM GRAP Stage-IV Severe+ (250 µg/m³)',
                        position: 'insideTopRight',
                        fill: '#B91C1C',
                        fontSize: 10,
                        fontFamily: 'JetBrains Mono',
                      }}
                    />

                    {/* Forecast Origin t = 0h Vertical Divider */}
                    <ReferenceLine
                      x="+0h (22:00)"
                      stroke="#111111"
                      strokeWidth={1.4}
                      strokeDasharray="3 3"
                      label={{
                        value: 'NOW (t=0h → +24h Forecast)',
                        position: 'insideTopLeft',
                        fill: '#111111',
                        fontSize: 10,
                        fontFamily: 'JetBrains Mono',
                      }}
                    />

                    {/* Observed Ground Truth PM2.5 (-47h to 0h) in Carbon Black */}
                    <Line
                      type="monotone"
                      dataKey="observedPm25"
                      name="Observed Ground Truth PM2.5"
                      stroke="#111111"
                      strokeWidth={2.3}
                      dot={false}
                      connectNulls={false}
                    />

                    {/* 24h CPCB Moving Average (Lagging regulatory baseline) */}
                    <Line
                      type="monotone"
                      dataKey="cpcbMovingAvg24h"
                      name="24h CPCB Moving Avg (Lagging)"
                      stroke="#78716C"
                      strokeWidth={1.4}
                      strokeDasharray="2 2"
                      dot={false}
                    />

                    {/* Standard LightGBM (MSE) Conditional Mean Forecast in Cobalt Blue */}
                    <Line
                      type="monotone"
                      dataKey="lgbmMseForecast"
                      name="Standard LightGBM (MSE Mean)"
                      stroke="#1D4ED8"
                      strokeWidth={2.0}
                      strokeDasharray="5 4"
                      dot={false}
                    />

                    {/* Proposed Advection-CQR Upper Bound (alpha=0.90) in Crimson Vermilion */}
                    <Line
                      type="monotone"
                      dataKey="cqrUpperQ90"
                      name="Proposed Advection-CQR Upper Bound (α=0.90)"
                      stroke="#B91C1C"
                      strokeWidth={2.5}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Diagnostic Specification Strip under Chart */}
            <div className="border-t border-[#1C1C1C] grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D4D2C8] bg-[#EAE8E0] font-mono text-xs">
              <div className="p-4">
                <div className="text-[11px] uppercase text-stone-600 font-semibold">
                  EQ.01 // Plume Advection (Φ_adv)
                </div>
                <div className="text-base font-bold text-[#1D4ED8] mt-1 tabular-nums">
                  {indices.phiAdvectionFlux.toFixed(2)} units
                </div>
                <div className="text-[11px] text-stone-600 mt-0.5">
                  P{indices.phiPercentile} corridor percentile
                </div>
              </div>

              <div className="p-4">
                <div className="text-[11px] uppercase text-stone-600 font-semibold">
                  EQ.02 // Radiative Inversion (RNII)
                </div>
                <div className="text-base font-bold text-[#111111] mt-1 tabular-nums">
                  {indices.rniiIndex.toFixed(3)} idx
                </div>
                <div className="text-[11px] text-stone-600 mt-0.5">
                  P{indices.rniiPercentile} nocturnal PBL trap
                </div>
              </div>

              <div className="p-4">
                <div className="text-[11px] uppercase text-stone-600 font-semibold">
                  EQ.03 // Pyrogenic Stagnation (PSAI)
                </div>
                <div className="text-base font-bold text-[#B91C1C] mt-1 tabular-nums">
                  {indices.psaiIndex.toFixed(2)} idx
                </div>
                <div className="text-[11px] text-stone-600 mt-0.5">
                  P{indices.psaiPercentile} biomass accumulation
                </div>
              </div>

              <div className="p-4">
                <div className="text-[11px] uppercase text-stone-600 font-semibold">
                  EQ.04 // Combustion Partition (CDCP)
                </div>
                <div className="text-base font-bold text-[#15803D] mt-1 tabular-nums">
                  {indices.cdcpIndex.toFixed(3)} idx
                </div>
                <div className="text-[11px] text-stone-600 mt-0.5">
                  P{indices.cdcpPercentile} fine smoke vs. dust
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
