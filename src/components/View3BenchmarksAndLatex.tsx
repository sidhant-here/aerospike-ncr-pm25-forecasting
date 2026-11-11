import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Copy, Check, FileCode, Download } from 'lucide-react';
import { ModelBenchmarkRow, AblationStageRow } from '../utils/igpPhysicsEngine';

interface View3BenchmarksAndLatexProps {
  table1Benchmarks: ModelBenchmarkRow[];
  table2Ablation: AblationStageRow[];
  onDownloadNotebook: () => void;
}

export const View3BenchmarksAndLatex: React.FC<View3BenchmarksAndLatexProps> = ({
  table1Benchmarks,
  table2Ablation,
  onDownloadNotebook,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showLatexDrawer, setShowLatexDrawer] = useState(true);

  const ablationChartData = table2Ablation.map((row) => ({
    stageShort: `Stage ${row.stage}`,
    stageFull: row.stageLabel,
    cRmse250: row.conditionalTailRmse250,
    csiPct: Number((row.csiThreatScore * 100).toFixed(1)),
    recallPct: row.grap4RecallPct,
  }));

  const generateLatexTable1 = () => {
    const rowsTex = table1Benchmarks
      .map((r) => {
        const isProposed = r.id === 'proposed-cqr-90';
        const nameCell = isProposed ? `\\textbf{${r.modelName}}` : r.modelName;
        const cRmseCell = isProposed
          ? `\\textbf{${r.conditionalTailRmse250.toFixed(2)}}`
          : r.conditionalTailRmse250.toFixed(2);
        const csiCell = isProposed
          ? `\\textbf{${(r.csiThreatScore * 100).toFixed(1)}\\%}`
          : `${(r.csiThreatScore * 100).toFixed(1)}\\%`;
        const covCell = isProposed
          ? `\\textbf{${r.empiricalCoveragePct.toFixed(1)}\\%}`
          : `${r.empiricalCoveragePct.toFixed(1)}\\%`;
        return `${nameCell} & ${r.overallRmse.toFixed(2)} & ${cRmseCell} & ${r.pinballLoss90.toFixed(
          2
        )} & ${csiCell} & ${r.grap4RecallPct.toFixed(1)}\\% & ${covCell} & ${r.wilcoxonPValue} \\\\`;
      })
      .join('\n');

    return `\\begin{table*}[t]
\\centering
\\caption{24-Hour Ahead Verification Benchmark for Extreme Nocturnal $\\text{PM}_{2.5}$ Spikes ($\\ge 250\\,\\mu\\text{g/m}^3$) in the Indo-Gangetic Plain}
\\label{tab:table1_benchmark}
\\begin{tabular}{lccccccc}
\\hline\\hline
\\textbf{Model Architecture} & \\textbf{Overall RMSE} & \\textbf{cRMSE ($>250$)} & \\textbf{Pinball ($\\alpha=0.90$)} & \\textbf{GRAP-IV CSI} & \\textbf{Recall (\\%)} & \\textbf{Coverage (\\%)} & \\textbf{Wilcoxon $p$} \\\\
\\hline
${rowsTex}
\\hline\\hline
\\end{tabular}
\\end{table*}`;
  };

  const generateLatexTable2 = () => {
    const rowsTex = table2Ablation
      .map((r) => {
        const isFinal = r.stage === 5;
        const stageCell = isFinal ? `\\textbf{${r.stageLabel}}` : r.stageLabel;
        return `${stageCell} & ${r.featureCount} & ${r.conditionalTailRmse250.toFixed(
          2
        )} & ${r.pinballLoss90.toFixed(2)} & ${(r.csiThreatScore * 100).toFixed(
          1
        )}\\% & ${r.grap4RecallPct.toFixed(1)}\\% & ${r.empiricalCoveragePct.toFixed(
          1
        )}\\% & ${r.deltaCsiPct} \\\\`;
      })
      .join('\n');

    return `\\begin{table*}[t]
\\centering
\\caption{5-Stage Multi-Source Physics \\& Corridor Advection Ablation Study (24h Lead Horizon)}
\\label{tab:table2_ablation}
\\begin{tabular}{lccccccc}
\\hline\\hline
\\textbf{Ablation Configuration} & \\textbf{Features} & \\textbf{cRMSE ($>250$)} & \\textbf{Pinball ($\\alpha=0.90$)} & \\textbf{CSI (\\%)} & \\textbf{Recall (\\%)} & \\textbf{Coverage (\\%)} & \\textbf{$\\Delta$ CSI} \\\\
\\hline
${rowsTex}
\\hline\\hline
\\end{tabular}
\\end{table*}`;
  };

  const fullLatexBundle = `${generateLatexTable1()}\n\n${generateLatexTable2()}`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadTex = () => {
    const blob = new Blob([fullLatexBundle], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'igp_cqr_ieee_tables_1_and_2.tex';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* TABLE 1: 7-MODEL ALGORITHMIC & CONFORMAL VERIFICATION MATRIX */}
      <div className="bg-[#FAF9F5] border border-[#1C1C1C] rounded-none shadow-none">
        <div className="bg-[#EAE8E0] p-6 border-b border-[#1C1C1C] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-serif font-bold tracking-tight text-[#111111]">
              Table I — 7-Model Algorithmic & Conformal Verification Matrix (24-Hour Lead Horizon)
            </h2>
            <p className="text-xs text-stone-600 font-mono mt-1">
              Evaluated on strictly held-out Winter Peak Test Episodes (CAQM GRAP Stage-IV Severe+
              threshold τ = 250 µg/m³)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(generateLatexTable1(), 'tab1')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold bg-[#FAF9F5] hover:bg-[#111111] hover:text-[#FAF9F5] text-[#111111] border border-[#1C1C1C] rounded-none cursor-pointer transition-colors whitespace-nowrap"
            >
              {copiedId === 'tab1' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#15803D]" />
                  COPIED TABLE I LATEX
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  COPY TABLE I LATEX
                </>
              )}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto bg-[#FAF9F5]">
          <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
            <thead className="bg-[#EAE8E0] border-b border-[#1C1C1C] text-xs uppercase text-[#111111]">
              <tr className="divide-x divide-[#D4D2C8]">
                <th className="py-3.5 px-4 font-bold">Model Architecture</th>
                <th className="py-3.5 px-4 font-bold">Family</th>
                <th className="py-3.5 px-4 text-right font-bold">Overall RMSE (µg/m³)</th>
                <th className="py-3.5 px-4 text-right font-bold">cRMSE (&gt;250 µg/m³) ↓</th>
                <th className="py-3.5 px-4 text-right font-bold">Pinball (α=0.90) ↓</th>
                <th className="py-3.5 px-4 text-right font-bold">GRAP-IV CSI (%) ↑</th>
                <th className="py-3.5 px-4 text-right font-bold">Spike Recall (%) ↑</th>
                <th className="py-3.5 px-4 text-right font-bold">90% Coverage ↑</th>
                <th className="py-3.5 px-4 text-right font-bold">Wilcoxon p-value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4D2C8]">
              {table1Benchmarks.map((row) => {
                const isProposed = row.id === 'proposed-cqr-90';
                const isBestOverallRmse = row.id === 'lgbm-mse';
                return (
                  <tr
                    key={row.id}
                    className={`divide-x divide-[#D4D2C8] ${
                      isProposed
                        ? 'bg-[#DCFCE7]/50 font-bold text-[#111111]'
                        : 'hover:bg-[#EAE8E0]/50 text-[#18181B]'
                    }`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      {row.modelName}
                      {isProposed && (
                        <span className="ml-2 px-2 py-0.5 text-[10px] bg-[#15803D] text-[#FAF9F5] border border-[#1C1C1C]">
                          PROPOSED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-stone-600">{row.family}</td>
                    <td
                      className={`py-3 px-4 text-right ${
                        isBestOverallRmse ? 'text-[#1D4ED8] font-bold' : ''
                      }`}
                    >
                      {row.overallRmse.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right ${
                        isProposed ? 'text-[#15803D] font-bold' : 'text-[#18181B]'
                      }`}
                    >
                      {row.conditionalTailRmse250.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right ${
                        isProposed ? 'text-[#15803D] font-bold' : ''
                      }`}
                    >
                      {row.pinballLoss90.toFixed(2)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right ${
                        isProposed ? 'text-[#15803D] font-bold' : ''
                      }`}
                    >
                      {(row.csiThreatScore * 100).toFixed(1)}%
                    </td>
                    <td
                      className={`py-3 px-4 text-right ${
                        isProposed ? 'text-[#15803D] font-bold' : ''
                      }`}
                    >
                      {row.grap4RecallPct.toFixed(1)}%
                    </td>
                    <td
                      className={`py-3 px-4 text-right ${
                        row.empiricalCoveragePct >= 89.5
                          ? 'text-[#15803D] font-bold'
                          : 'text-[#B91C1C]'
                      }`}
                    >
                      {row.empiricalCoveragePct.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right text-stone-600">{row.wilcoxonPValue}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE 2: 5-STAGE ABLATION STUDY + SIDE-BY-SIDE GROUPED BAR CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Table 2 Ablation Matrix */}
        <div className="lg:col-span-7 bg-[#FAF9F5] border border-[#1C1C1C] rounded-none shadow-none flex flex-col justify-between">
          <div>
            <div className="bg-[#EAE8E0] p-6 border-b border-[#1C1C1C] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-serif font-bold tracking-tight text-[#111111]">
                  Table II — 5-Stage Multi-Source Physics & Corridor Advection Ablation Study
                </h2>
                <p className="text-xs text-stone-600 font-mono mt-1">
                  Stepwise reduction in Conditional Tail RMSE (&gt;250 µg/m³) & gain in GRAP-IV CSI
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(generateLatexTable2(), 'tab2')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold bg-[#FAF9F5] hover:bg-[#111111] hover:text-[#FAF9F5] text-[#111111] border border-[#1C1C1C] rounded-none cursor-pointer transition-colors whitespace-nowrap"
              >
                {copiedId === 'tab2' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#15803D]" />
                    COPIED TABLE II
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    COPY TABLE II LATEX
                  </>
                )}
              </button>
            </div>

            <div className="overflow-x-auto bg-[#FAF9F5]">
              <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
                <thead className="bg-[#EAE8E0] border-b border-[#1C1C1C] text-xs uppercase text-[#111111]">
                  <tr className="divide-x divide-[#D4D2C8]">
                    <th className="py-3 px-3.5 font-bold">Ablation Stage & Added Physical Group</th>
                    <th className="py-3 px-3.5 text-right font-bold">Cols</th>
                    <th className="py-3 px-3.5 text-right font-bold">cRMSE (&gt;250)</th>
                    <th className="py-3 px-3.5 text-right font-bold">Pinball</th>
                    <th className="py-3 px-3.5 text-right font-bold">CSI (%)</th>
                    <th className="py-3 px-3.5 text-right font-bold">Coverage</th>
                    <th className="py-3 px-3.5 text-right font-bold">Δ CSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D4D2C8]">
                  {table2Ablation.map((row) => {
                    const isStage5 = row.stage === 5;
                    return (
                      <tr
                        key={row.stage}
                        className={`divide-x divide-[#D4D2C8] ${
                          isStage5
                            ? 'bg-[#DCFCE7]/50 text-[#111111] font-bold'
                            : 'hover:bg-[#EAE8E0]/50 text-[#18181B]'
                        }`}
                      >
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-[#111111]">{row.stageLabel}</div>
                          <div className="text-[11px] text-stone-600 font-normal mt-0.5">
                            {row.addedComponents}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-right text-stone-600">
                          {row.featureCount}
                        </td>
                        <td
                          className={`py-3 px-3.5 text-right ${
                            isStage5 ? 'text-[#15803D] font-bold' : 'text-[#B91C1C]'
                          }`}
                        >
                          {row.conditionalTailRmse250.toFixed(2)}
                        </td>
                        <td className="py-3 px-3.5 text-right">{row.pinballLoss90.toFixed(2)}</td>
                        <td
                          className={`py-3 px-3.5 text-right ${
                            isStage5 ? 'text-[#15803D] font-bold' : 'text-[#1D4ED8]'
                          }`}
                        >
                          {(row.csiThreatScore * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          {row.empiricalCoveragePct.toFixed(1)}%
                        </td>
                        <td className="py-3 px-3.5 text-right text-[#15803D] font-semibold">
                          {row.deltaCsiPct}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-[#1C1C1C] grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#1C1C1C] bg-[#EAE8E0] font-mono text-xs">
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase text-stone-600 font-semibold">
                  01 // Tail Error Reduction (Stage 1 → 5)
                </div>
                <div className="text-base font-bold text-[#B91C1C] mt-1 tabular-nums">
                  68.45 → 31.40 µg/m³ (-54.1%)
                </div>
              </div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase text-stone-600 font-semibold">
                  02 // Threat Score (CSI) Gain (Stage 1 → 5)
                </div>
                <div className="text-base font-bold text-[#15803D] mt-1 tabular-nums">
                  59.4% → 86.4% (+45.5% rel)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Grouped Bar Chart of Ablation Progression */}
        <div className="lg:col-span-5 bg-[#FAF9F5] border border-[#1C1C1C] rounded-none shadow-none flex flex-col justify-between">
          <div className="bg-[#EAE8E0] p-6 border-b border-[#1C1C1C]">
            <h2 className="text-base font-serif font-bold tracking-tight text-[#111111]">
              Fig. 3A — Ablation Progression: Tail cRMSE (&gt;250) vs. GRAP-IV CSI (%)
            </h2>
            <p className="text-xs text-stone-600 font-mono mt-1">
              Monotonic error reduction and threat-score improvement across Stages 1 to 5
            </p>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-center">
            <div className="w-full h-[340px] bg-[#FAF9F5] border border-[#D4D2C8] p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ablationChartData}
                  margin={{ top: 14, right: 16, left: 0, bottom: 8 }}
                >
                  <CartesianGrid stroke="#D4D2C8" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="stageShort"
                    stroke="#1C1C1C"
                    tick={{ fill: '#18181B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  />
                  <YAxis
                    stroke="#1C1C1C"
                    tick={{ fill: '#18181B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
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
                      paddingTop: '8px',
                      color: '#111111',
                    }}
                  />
                  <Bar
                    dataKey="cRmse250"
                    name="Conditional Tail RMSE (>250 µg/m³) ↓"
                    fill="#B91C1C"
                  />
                  <Bar
                    dataKey="csiPct"
                    name="CAQM GRAP-IV Threat Score CSI (%) ↑"
                    fill="#15803D"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ONE-CLICK IEEE LATEX CODE DRAWER & JUPYTER NOTEBOOK ARCHIVE */}
      <div className="bg-[#FAF9F5] border border-[#1C1C1C] rounded-none shadow-none">
        <div className="bg-[#EAE8E0] p-6 border-b border-[#1C1C1C] flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-serif font-bold tracking-tight text-[#111111]">
              § 3.1 IEEE Double-Column LaTeX Table Exporter (`table*` Environment)
            </h2>
            <p className="text-xs text-stone-600 font-mono mt-1">
              Publication-ready LaTeX source for Table I and Table II + Standalone 572-line Jupyter
              Notebook (.ipynb)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowLatexDrawer(!showLatexDrawer)}
              className="px-3.5 py-1.5 text-xs font-mono font-semibold bg-[#FAF9F5] hover:bg-[#111111] hover:text-[#FAF9F5] text-[#111111] border border-[#1C1C1C] rounded-none cursor-pointer transition-colors whitespace-nowrap"
            >
              {showLatexDrawer ? 'HIDE LATEX SOURCE' : 'SHOW LATEX SOURCE'}
            </button>
            <button
              type="button"
              onClick={() => handleCopy(fullLatexBundle, 'bundle')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold bg-[#FAF9F5] hover:bg-[#111111] hover:text-[#FAF9F5] text-[#111111] border border-[#1C1C1C] rounded-none cursor-pointer transition-colors whitespace-nowrap"
            >
              {copiedId === 'bundle' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#15803D]" />
                  COPIED FULL LATEX BUNDLE
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  COPY BOTH TABLES (.TEX)
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleDownloadTex}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold bg-[#1D4ED8] hover:bg-[#111111] text-[#FAF9F5] border border-[#1C1C1C] rounded-none cursor-pointer transition-colors whitespace-nowrap"
            >
              <FileCode className="w-3.5 h-3.5" />
              DOWNLOAD .TEX BUNDLE
            </button>
            <button
              type="button"
              onClick={onDownloadNotebook}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold bg-[#111111] hover:bg-[#B91C1C] text-[#FAF9F5] border border-[#1C1C1C] rounded-none cursor-pointer transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              DOWNLOAD STANDALONE .IPYNB
            </button>
          </div>
        </div>

        {showLatexDrawer && (
          <div className="p-6">
            <pre className="p-4 bg-[#F4F3EE] border border-[#1C1C1C] text-xs font-mono text-[#18181B] overflow-x-auto max-h-[280px] leading-relaxed rounded-none">
              {fullLatexBundle}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
