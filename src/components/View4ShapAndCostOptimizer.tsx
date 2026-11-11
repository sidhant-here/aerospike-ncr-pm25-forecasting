import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import { CheckSquare, Square } from 'lucide-react';
import { ShapWaterfallBar, CostCurvePoint } from '../utils/corridorTelemetryEngine';

interface View4ShapAndCostOptimizerProps {
  shapWaterfall: ShapWaterfallBar[];
  baseExpectation: number;
  peakCqr24h: number;
  costRatioK: number;
  onChangeCostRatioK: (k: number) => void;
  costCurve: CostCurvePoint[];
  optimalTauStar: number;
  minCostAtTauStar: number;
}

export const View4ShapAndCostOptimizer: React.FC<View4ShapAndCostOptimizerProps> = ({
  shapWaterfall,
  baseExpectation,
  peakCqr24h,
  costRatioK,
  onChangeCostRatioK,
  costCurve,
  optimalTauStar,
  minCostAtTauStar,
}) => {
  const isEmergencyTriggered = peakCqr24h >= optimalTauStar;
  const costAt250Obj = costCurve.find((c) => c.thresholdTau === 250) || costCurve[0];
  const costAtTauStarObj =
    costCurve.find((c) => c.thresholdTau === optimalTauStar) || costCurve[0];
  const relativeCostSavingPct =
    costAt250Obj && costAt250Obj.normalizedExpectedCost > 0
      ? Number(
          (
            ((costAt250Obj.normalizedExpectedCost - minCostAtTauStar) /
              costAt250Obj.normalizedExpectedCost) *
            100
          ).toFixed(1)
        )
      : 34.2;

  const grapDirectives = [
    {
      id: 'grap-iv-1',
      code: 'CAQM-DIR-01',
      title: 'Halt Heavy Commercial Diesel Truck Entry into Delhi NCR',
      detail:
        'Enforce border interception at Kundli, Singhu, Tikri, and Ghazipur entry points (excluding essential LNG/CNG/EV commodities).',
      mandatoryAtTauStar: true,
    },
    {
      id: 'grap-iv-2',
      code: 'CAQM-DIR-02',
      title: 'Suspend Linear Public Infrastructure & C&D Excavation Projects',
      detail:
        'Immediate moratorium on highway earthworks, flyover piling, RMC batching plants, and demolition activities across NCR.',
      mandatoryAtTauStar: true,
    },
    {
      id: 'grap-iv-3',
      code: 'CAQM-DIR-03',
      title: 'Transition Primary & Secondary Schools to Hybrid / Online Mode',
      detail:
        'Protect pediatric respiratory cohorts from nocturnal morning boundary-layer spike exposure (06:00–10:00 IST).',
      mandatoryAtTauStar: true,
    },
    {
      id: 'grap-iv-4',
      code: 'CAQM-DIR-04',
      title: '50% Work-From-Home Mandate for Public & Private NCR Offices',
      detail:
        'Curb vehicular NO₂ and CO precursor co-emissions prior to nocturnal radiative inversion onset at 18:00 IST.',
      mandatoryAtTauStar: peakCqr24h >= 230,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL (6 COLS): DYNAMIC LOCAL SHAP ATTRIBUTION WATERFALL & GLOBAL IMPORTANCE */}
        <div className="lg:col-span-6 bg-[#FAF9F5] border border-[#1C1C1C] rounded-none shadow-none flex flex-col justify-between">
          <div>
            <div className="bg-[#EAE8E0] p-6 border-b border-[#1C1C1C] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-serif font-bold tracking-tight text-[#111111]">
                  Fig. 4A — Dynamic Local SHAP Attribution Waterfall (α = 0.90 Upper Quantile)
                </h2>
                <p className="text-xs text-stone-600 font-mono mt-1">
                  Additive decomposition from Baseline E[f(x)] = {baseExpectation.toFixed(1)} µg/m³
                  to 24h Peak CQR = {peakCqr24h} µg/m³
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-[#FAF9F5] border border-[#1C1C1C] text-[#111111] whitespace-nowrap">
                LIVE PERTURBATION SYNC
              </span>
            </div>

            {/* Horizontal Bar Chart of Local SHAP Contributions */}
            <div className="p-6">
              <div className="w-full h-[290px] bg-[#FAF9F5] border border-[#D4D2C8] p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={shapWaterfall}
                    layout="vertical"
                    margin={{ top: 10, right: 24, left: 20, bottom: 8 }}
                  >
                    <CartesianGrid stroke="#D4D2C8" strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      stroke="#1C1C1C"
                      tick={{ fill: '#18181B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      label={{
                        value: 'Local SHAP Attribution φᵢ (µg/m³ push from E[f(x)])',
                        position: 'insideBottom',
                        offset: -4,
                        fill: '#111111',
                        fontSize: 10,
                        fontFamily: 'JetBrains Mono',
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="featureKey"
                      width={200}
                      stroke="#1C1C1C"
                      tick={{ fill: '#111111', fontSize: 10, fontFamily: 'JetBrains Mono' }}
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
                    <ReferenceLine x={0} stroke="#111111" strokeWidth={1.3} />
                    <Bar dataKey="contributionUgm3" name="Local SHAP Contribution (µg/m³)">
                      {shapWaterfall.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={entry.contributionUgm3 >= 0 ? '#B91C1C' : '#1D4ED8'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Step-by-Step Waterfall Ledger Table */}
            <div className="border-t border-[#1C1C1C] overflow-x-auto bg-[#FAF9F5]">
              <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
                <thead className="bg-[#EAE8E0] border-b border-[#1C1C1C] text-[#111111] uppercase">
                  <tr className="divide-x divide-[#D4D2C8]">
                    <th className="py-2.5 px-3.5 font-bold">Engineered Feature</th>
                    <th className="py-2.5 px-3.5 font-bold">Active Value</th>
                    <th className="py-2.5 px-3.5 text-right font-bold">Local φᵢ (µg/m³)</th>
                    <th className="py-2.5 px-3.5 text-right font-bold">Cumulative Forecast</th>
                    <th className="py-2.5 px-3.5 text-right font-bold">Global |SHAP|</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4D2C8]">
                  <tr className="divide-x divide-[#D4D2C8] bg-[#F4F3EE] text-[#111111]">
                    <td className="py-2.5 px-3.5 font-bold">Prior Expectation E[f(x)]</td>
                    <td className="py-2.5 px-3.5 text-stone-600">Unconditional Base</td>
                    <td className="py-2.5 px-3.5 text-right">—</td>
                    <td className="py-2.5 px-3.5 text-right font-bold">
                      {baseExpectation.toFixed(1)} µg/m³
                    </td>
                    <td className="py-2.5 px-3.5 text-right">—</td>
                  </tr>
                  {shapWaterfall.map((row) => (
                    <tr
                      key={row.featureKey}
                      className="divide-x divide-[#D4D2C8] hover:bg-[#EAE8E0]/50"
                    >
                      <td className="py-2.5 px-3.5">
                        <div className="text-[#111111] font-bold">{row.featureKey}</div>
                        <div className="text-[11px] text-stone-600 mt-0.5">{row.physicalMeaning}</div>
                      </td>
                      <td className="py-2.5 px-3.5 text-[#18181B] whitespace-nowrap">
                        {row.rawFeatureReading}
                      </td>
                      <td
                        className={`py-2.5 px-3.5 text-right font-bold ${
                          row.contributionUgm3 >= 0 ? 'text-[#B91C1C]' : 'text-[#1D4ED8]'
                        }`}
                      >
                        {row.contributionUgm3 >= 0
                          ? `+${row.contributionUgm3.toFixed(1)}`
                          : row.contributionUgm3.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-[#18181B] font-semibold">
                        {row.cumulativeEnd.toFixed(1)} µg/m³
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-stone-600">
                        {row.globalMeanAbsShap.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (6 COLS): ASYMMETRIC COST-SENSITIVE THRESHOLD OPTIMIZER & GRAP STAGE-IV TRIGGER */}
        <div className="lg:col-span-6 bg-[#FAF9F5] border border-[#1C1C1C] rounded-none shadow-none flex flex-col justify-between">
          <div>
            <div className="bg-[#EAE8E0] p-6 border-b border-[#1C1C1C] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-serif font-bold tracking-tight text-[#111111]">
                  Fig. 4B — Asymmetric Cost-Sensitive Threshold Optimizer & CAQM GRAP-IV Trigger
                </h2>
                <p className="text-xs text-stone-600 font-mono mt-1">
                  Minimizes Expected Public-Health Loss: L(τ) = C_FP · P(FP | τ) + k · C_FP · P(FN | τ)
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[#15803D] border border-[#1C1C1C] text-[#FAF9F5] whitespace-nowrap">
                τ* = {optimalTauStar} µg/m³ OPTIMAL
              </span>
            </div>

            <div className="p-6 space-y-5">
              {/* Interactive Slider for False-Negative Health Penalty Ratio k = C_FN / C_FP */}
              <div className="bg-[#F4F3EE] border border-[#1C1C1C] p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 font-mono text-xs">
                  <span className="text-[#111111] font-semibold">
                    False-Negative Health Penalty Ratio (k = C_FN / C_FP):
                  </span>
                  <span className="text-[#B91C1C] font-bold text-sm tabular-nums">
                    k = {costRatioK.toFixed(1)}× (Missed Spike vs. False Alarm)
                  </span>
                </div>
                <input
                  type="range"
                  min={1.0}
                  max={15.0}
                  step={0.5}
                  value={costRatioK}
                  onChange={(e) => onChangeCostRatioK(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
                <div className="mt-3.5 pt-3 border-t border-[#D4D2C8] grid grid-cols-3 divide-x divide-[#D4D2C8] font-mono text-xs">
                  <div className="pr-3">
                    <span className="text-stone-600">Optimal Trigger τ*: </span>
                    <span className="text-[#15803D] font-bold tabular-nums">
                      {optimalTauStar} µg/m³
                    </span>
                  </div>
                  <div className="px-3">
                    <span className="text-stone-600">Cost Saving vs. 250: </span>
                    <span className="text-[#15803D] font-bold tabular-nums">
                      -{relativeCostSavingPct}%
                    </span>
                  </div>
                  <div className="pl-3">
                    <span className="text-stone-600">Recall @ τ*: </span>
                    <span className="text-[#1D4ED8] font-bold tabular-nums">
                      {costAtTauStarObj.recallPct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Recharts Cost Frontier Curve across \tau \in [120, 320] */}
              <div className="w-full h-[250px] bg-[#FAF9F5] border border-[#D4D2C8] p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={costCurve}
                    margin={{ top: 12, right: 18, left: 4, bottom: 8 }}
                  >
                    <CartesianGrid stroke="#D4D2C8" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="thresholdTau"
                      stroke="#1C1C1C"
                      tick={{ fill: '#18181B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      label={{
                        value: 'Decision Trigger Threshold τ (µg/m³)',
                        position: 'insideBottom',
                        offset: -4,
                        fill: '#111111',
                        fontSize: 10,
                        fontFamily: 'JetBrains Mono',
                      }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#111111"
                      tick={{ fill: '#111111', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      label={{
                        value: 'Expected Cost Index',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#111111',
                        fontSize: 10,
                        fontFamily: 'JetBrains Mono',
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#15803D"
                      tick={{ fill: '#15803D', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                      label={{
                        value: 'Recall / CSI (%)',
                        angle: 90,
                        position: 'insideRight',
                        fill: '#15803D',
                        fontSize: 10,
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
                        paddingTop: '6px',
                        color: '#111111',
                      }}
                    />

                    <ReferenceLine
                      yAxisId="left"
                      x={optimalTauStar}
                      stroke="#15803D"
                      strokeWidth={1.8}
                      strokeDasharray="4 2"
                      label={{
                        value: `Optimal τ* = ${optimalTauStar}`,
                        position: 'insideTopLeft',
                        fill: '#15803D',
                        fontSize: 10,
                        fontFamily: 'JetBrains Mono',
                      }}
                    />

                    <ReferenceLine
                      yAxisId="left"
                      x={250}
                      stroke="#B91C1C"
                      strokeWidth={1.6}
                      strokeDasharray="3 3"
                      label={{
                        value: 'Statutory 250 µg/m³',
                        position: 'insideTopRight',
                        fill: '#B91C1C',
                        fontSize: 10,
                        fontFamily: 'JetBrains Mono',
                      }}
                    />

                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="normalizedExpectedCost"
                      name={`Expected Public-Health Cost (k=${costRatioK.toFixed(1)})`}
                      fill="#111111"
                      fillOpacity={0.1}
                      stroke="#111111"
                      strokeWidth={2.2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="recallPct"
                      name="GRAP Stage-IV Recall (%)"
                      stroke="#15803D"
                      strokeWidth={2.0}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Automated CAQM GRAP Stage-IV Directive Checklist */}
              <div className="bg-[#FAF9F5] border border-[#1C1C1C]">
                <div
                  className={`px-4 py-3 border-b border-[#1C1C1C] font-mono text-xs font-bold ${
                    isEmergencyTriggered
                      ? 'bg-[#B91C1C] text-[#FAF9F5]'
                      : 'bg-[#EAE8E0] text-[#15803D]'
                  }`}
                >
                  {isEmergencyTriggered
                    ? `PRE-EMPTIVE CAQM GRAP STAGE-IV DIRECTIVES ACTIVATED (CQR ${peakCqr24h} ≥ τ* ${optimalTauStar} µg/m³)`
                    : `STANDBY MONITORING REGIME (CQR ${peakCqr24h} < τ* ${optimalTauStar} µg/m³)`}
                </div>

                <div className="divide-y divide-[#D4D2C8]">
                  {grapDirectives.map((dir) => {
                    const active = isEmergencyTriggered && dir.mandatoryAtTauStar;
                    return (
                      <div
                        key={dir.id}
                        className={`p-3.5 flex items-start gap-3 ${
                          active ? 'bg-[#FEE2E2]/35 text-[#111111]' : 'bg-[#FAF9F5] text-stone-500'
                        }`}
                      >
                        {active ? (
                          <CheckSquare className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                        )}
                        <div className="text-xs">
                          <div className="font-mono font-bold flex items-center gap-2">
                            <span className="text-[11px] px-2 py-0.5 bg-[#EAE8E0] border border-[#1C1C1C] text-[#111111]">
                              {dir.code}
                            </span>
                            <span>{dir.title}</span>
                          </div>
                          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                            {dir.detail}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
