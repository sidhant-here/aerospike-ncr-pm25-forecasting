import React, { useEffect, useRef, useState } from 'react';
import { Download, Sliders, Crosshair } from 'lucide-react';
import {
  EpisodeTimeStep,
  AblationStageRow,
  ThresholdCostPoint,
  ShapFeatureSummary,
} from '../utils/igpPhysicsEngine';

interface FiguresPanelProps {
  episodeSeries: EpisodeTimeStep[];
  table2Ablation: AblationStageRow[];
  costFrontier: ThresholdCostPoint[];
  optimalThresholdTauStar: number;
  shapSummaries: ShapFeatureSummary[];
  conformalOffsetQHat: number;
  targetCoverage: number;
  costRatioK: number;
  decisionThresholdTau: number;
}

export const FiguresPanel: React.FC<FiguresPanelProps> = ({
  episodeSeries,
  table2Ablation,
  costFrontier,
  optimalThresholdTauStar,
  shapSummaries,
  conformalOffsetQHat,
  targetCoverage,
  costRatioK,
  decisionThresholdTau,
}) => {
  const fig1CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fig2CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fig3CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fig4CanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [hoveredHourIdx, setHoveredHourIdx] = useState<number>(86);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const downloadCanvasAsPng = (
    canvas: HTMLCanvasElement | null,
    filename: string
  ) => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportStatus(`Saved 300-DPI ${filename}`);
    setTimeout(() => setExportStatus(null), 3000);
  };

  // --- Draw Figure 1: 3-Panel IGP Atmospheric Physics Diagnostics ---
  useEffect(() => {
    const canvas = fig1CanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1320;
    const H = 420;
    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Subtle panel dividers
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(440, 20);
    ctx.lineTo(440, H - 20);
    ctx.moveTo(870, 20);
    ctx.lineTo(870, H - 20);
    ctx.stroke();

    // ================= PANEL (a): Solar Radiation vs Nocturnal PM2.5 Hysteresis Loop =================
    const p1Left = 62;
    const p1Right = 408;
    const p1Top = 52;
    const p1Bottom = 358;
    const p1W = p1Right - p1Left;
    const p1H = p1Bottom - p1Top;

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 13px "IBM Plex Sans", sans-serif';
    ctx.fillText('(a) Solar Radiation vs. Nocturnal PBL Inversion Loop', 28, 30);

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(p1Left, p1Top);
    ctx.lineTo(p1Left, p1Bottom);
    ctx.lineTo(p1Right, p1Bottom);
    ctx.stroke();

    // Compute 24-hour diurnal cycle averages from episodeSeries
    const hourlyMeans = Array.from({ length: 24 }, (_, hr) => {
      const steps = episodeSeries.filter((s) => s.hourOfDay === hr);
      const meanSolar =
        steps.reduce((acc, s) => acc + s.solarRadiationWm2, 0) / Math.max(1, steps.length);
      const meanPm25 =
        steps.reduce((acc, s) => acc + s.groundTruthPm25, 0) / Math.max(1, steps.length);
      const meanRnii =
        steps.reduce((acc, s) => acc + s.rnii, 0) / Math.max(1, steps.length);
      return { hr, meanSolar, meanPm25, meanRnii };
    });

    // Gridlines
    ctx.font = '400 11px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#475569';
    for (let sVal = 0; sVal <= 500; sVal += 125) {
      const x = p1Left + (sVal / 550) * p1W;
      ctx.strokeStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.moveTo(x, p1Top);
      ctx.lineTo(x, p1Bottom);
      ctx.stroke();
      ctx.fillText(String(sVal), x - 10, p1Bottom + 18);
    }
    for (let pmVal = 150; pmVal <= 450; pmVal += 75) {
      const y = p1Bottom - ((pmVal - 130) / 340) * p1H;
      ctx.strokeStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.moveTo(p1Left, y);
      ctx.lineTo(p1Right, y);
      ctx.stroke();
      ctx.fillText(String(pmVal), p1Left - 32, y + 4);
    }

    // Draw hysteresis trajectory loop
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    hourlyMeans.forEach((pt, idx) => {
      const x = p1Left + (pt.meanSolar / 550) * p1W;
      const y = p1Bottom - ((pt.meanPm25 - 130) / 340) * p1H;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.stroke();

    // Draw hourly nodes colored by RNII
    hourlyMeans.forEach((pt) => {
      const x = p1Left + (pt.meanSolar / 550) * p1W;
      const y = p1Bottom - ((pt.meanPm25 - 130) / 340) * p1H;
      const isNight = pt.meanSolar === 0;
      ctx.fillStyle = isNight ? '#dc2626' : '#0284c7';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();

      if ([0, 4, 8, 13, 17, 21].includes(pt.hr)) {
        ctx.fillStyle = '#0f172a';
        ctx.font = '600 10px "IBM Plex Mono", monospace';
        ctx.fillText(
          `${String(pt.hr).padStart(2, '0')}h`,
          x + 7,
          y + (pt.hr === 0 ? -6 : 4)
        );
      }
    });

    ctx.fillStyle = '#334155';
    ctx.font = '500 11px "IBM Plex Sans", sans-serif';
    ctx.fillText('Solar Radiation (W/m²)', p1Left + 105, H - 14);
    ctx.save();
    ctx.translate(18, p1Top + 215);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Delhi PM2.5 (µg/m³)', 0, 0);
    ctx.restore();

    // ================= PANEL (b): Polar Wind Direction & 315° NW Plume Advection =================
    const cx = 655;
    const cy = 208;
    const maxR = 132;

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 13px "IBM Plex Sans", sans-serif';
    ctx.fillText('(b) Polar Wind Direction & 315° NW Corridor Plume', 468, 30);

    // Concentric wind speed rings
    [0.33, 0.66, 1.0].forEach((frac, idx) => {
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, maxR * frac, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#64748b';
      ctx.font = '400 10px "IBM Plex Mono", monospace';
      ctx.fillText(`${(idx + 1) * 4} km/h`, cx + 4, cy - maxR * frac + 11);
    });

    // Cardinal spokes
    const cardinals = [
      { label: 'N (0°)', deg: 0 },
      { label: 'E (90°)', deg: 90 },
      { label: 'S (180°)', deg: 180 },
      { label: 'W (270°)', deg: 270 },
    ];
    cardinals.forEach(({ label, deg }) => {
      const rad = ((deg - 90) * Math.PI) / 180;
      const xEnd = cx + maxR * Math.cos(rad);
      const yEnd = cy + maxR * Math.sin(rad);
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(xEnd, yEnd);
      ctx.stroke();

      const lx = cx + (maxR + 24) * Math.cos(rad) - 18;
      const ly = cy + (maxR + 18) * Math.sin(rad) + 4;
      ctx.fillStyle = '#334155';
      ctx.font = '600 10px "IBM Plex Mono", monospace';
      ctx.fillText(label, lx, ly);
    });

    // Highlight 315 deg NW-to-SE transport sector cone
    const nwStart = ((295 - 90) * Math.PI) / 180;
    const nwEnd = ((335 - 90) * Math.PI) / 180;
    ctx.fillStyle = 'rgba(2, 132, 199, 0.12)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, maxR, nwStart, nwEnd);
    ctx.closePath();
    ctx.fill();

    // 315 deg axis line
    const rad315 = ((315 - 90) * Math.PI) / 180;
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + (maxR + 10) * Math.cos(rad315), cy + (maxR + 10) * Math.sin(rad315));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#0369a1';
    ctx.font = '600 10px "IBM Plex Mono", monospace';
    ctx.fillText('315° NW Axis (Chd→Del)', cx - 135, cy - maxR - 6);

    // Plot episode observations in polar coordinates
    episodeSeries.forEach((step) => {
      const rad = ((step.windDirDeg - 90) * Math.PI) / 180;
      const r = Math.min(maxR, (step.windSpeedKmh / 12.0) * maxR);
      const px = cx + r * Math.cos(rad);
      const py = cy + r * Math.sin(rad);
      const severe = step.groundTruthPm25 >= 250;
      ctx.fillStyle = severe ? 'rgba(220, 38, 38, 0.78)' : 'rgba(2, 132, 199, 0.55)';
      ctx.beginPath();
      ctx.arc(px, py, severe ? 4.2 : 3.0, 0, Math.PI * 2);
      ctx.fill();
    });

    // ================= PANEL (c): Pyrogenic Stagnation (PSAI) vs. Combustion/Dust Partition (CDCP) =================
    const p3Left = 925;
    const p3Right = 1288;
    const p3Top = 52;
    const p3Bottom = 358;
    const p3W = p3Right - p3Left;
    const p3H = p3Bottom - p3Top;

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 13px "IBM Plex Sans", sans-serif';
    ctx.fillText('(c) Pyrogenic Stagnation (PSAI) vs. Dust Partition', 895, 30);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(p3Left, p3Top);
    ctx.lineTo(p3Left, p3Bottom);
    ctx.lineTo(p3Right, p3Bottom);
    ctx.stroke();

    // Grid & labels
    ctx.font = '400 11px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#475569';
    for (let ps = 0; ps <= 2.5; ps += 0.5) {
      const x = p3Left + (ps / 2.6) * p3W;
      ctx.strokeStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.moveTo(x, p3Top);
      ctx.lineTo(x, p3Bottom);
      ctx.stroke();
      ctx.fillText(ps.toFixed(1), x - 8, p3Bottom + 18);
    }

    for (let cd = 3.0; cd <= 6.0; cd += 0.75) {
      const y = p3Bottom - ((cd - 2.8) / 3.4) * p3H;
      ctx.strokeStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.moveTo(p3Left, y);
      ctx.lineTo(p3Right, y);
      ctx.stroke();
      ctx.fillText(cd.toFixed(1), p3Left - 30, y + 4);
    }

    // Scatter points
    episodeSeries.forEach((step) => {
      const x = p3Left + Math.min(1, Math.max(0, step.psai / 2.6)) * p3W;
      const y = p3Bottom - Math.min(1, Math.max(0, (step.cdcp - 2.8) / 3.4)) * p3H;
      const isGrap4 = step.groundTruthPm25 >= 250;
      ctx.fillStyle = isGrap4 ? 'rgba(220, 38, 38, 0.75)' : 'rgba(71, 85, 105, 0.5)';
      ctx.beginPath();
      ctx.arc(x, y, isGrap4 ? 4.2 : 3.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Legend box in panel c
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(p3Left + 16, p3Top + 14, 10, 10);
    ctx.fillStyle = '#0f172a';
    ctx.font = '500 11px "IBM Plex Sans", sans-serif';
    ctx.fillText('GRAP Stage-IV Pyrogenic (≥250 µg/m³)', p3Left + 32, p3Top + 23);

    ctx.fillStyle = '#475569';
    ctx.fillRect(p3Left + 16, p3Top + 32, 10, 10);
    ctx.fillStyle = '#0f172a';
    ctx.fillText('Sub-Threshold Mixed Crustal/Urban', p3Left + 32, p3Top + 41);

    ctx.fillStyle = '#334155';
    ctx.fillText('Pyrogenic Stagnation Index (PSAI)', p3Left + 88, H - 14);
    ctx.save();
    ctx.translate(886, p3Top + 230);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Combustion/Dust Partition (CDCP)', 0, 0);
    ctx.restore();
  }, [episodeSeries]);

  // --- Draw Figure 2: High-Resolution Winter GRAP Stage-IV Episode Time-Series ---
  useEffect(() => {
    const canvas = fig2CanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1320;
    const H = 430;
    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const left = 68;
    const right = W - 32;
    const top = 56;
    const bottom = H - 54;
    const plotW = right - left;
    const plotH = bottom - top;

    const minY = 50;
    const maxY = 560;
    const xOf = (idx: number) => left + (idx / (episodeSeries.length - 1)) * plotW;
    const yOf = (val: number) => bottom - ((val - minY) / (maxY - minY)) * plotH;

    // Title
    ctx.fillStyle = '#0f172a';
    ctx.font = '600 14px "IBM Plex Sans", sans-serif';
    ctx.fillText(
      `Fig. 2: 24-Hour Lead Forecasting of Extreme Nocturnal PM2.5 Spikes (Split CQR 1-δ = ${targetCoverage.toFixed(
        2
      )}, Q̂ = +${conformalOffsetQHat.toFixed(1)} µg/m³)`,
      left,
      28
    );

    // Highlight GRAP Stage-IV >= 250 ug/m3 zone
    const y250 = yOf(250);
    ctx.fillStyle = 'rgba(254, 226, 226, 0.32)';
    ctx.fillRect(left, top, plotW, y250 - top);

    // Horizontal gridlines
    ctx.font = '400 11px "IBM Plex Mono", monospace';
    for (let yv = 100; yv <= 500; yv += 100) {
      const py = yOf(yv);
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(left, py);
      ctx.lineTo(right, py);
      ctx.stroke();
      ctx.fillStyle = '#475569';
      ctx.fillText(`${yv}`, left - 36, py + 4);
    }

    // Vertical 24h day markers
    for (let h = 0; h < episodeSeries.length; h += 24) {
      const px = xOf(h);
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(px, top);
      ctx.lineTo(px, bottom);
      ctx.stroke();
      ctx.fillStyle = '#334155';
      ctx.fillText(episodeSeries[h].timestamp.slice(5, 10), px - 16, bottom + 20);
    }

    // Shaded Conformal Prediction Band [Lower Q10, Calibrated Upper CQR-90]
    ctx.fillStyle = 'rgba(2, 132, 199, 0.16)';
    ctx.beginPath();
    episodeSeries.forEach((step, idx) => {
      const px = xOf(idx);
      const py = yOf(step.cqrUpperBound);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    for (let idx = episodeSeries.length - 1; idx >= 0; idx--) {
      const px = xOf(idx);
      const py = yOf(episodeSeries[idx].lowerQ10);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // CAQM GRAP Stage-IV 250 ug/m3 threshold line
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(left, y250);
    ctx.lineTo(right, y250);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#b91c1c';
    ctx.font = '600 11px "IBM Plex Mono", monospace';
    ctx.fillText('CAQM GRAP Stage-IV Severe+ Threshold (250 µg/m³)', right - 345, y250 - 7);

    // Decision threshold tau line if different from 250
    if (Math.abs(decisionThresholdTau - 250) > 2) {
      const yTau = yOf(decisionThresholdTau);
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 1.3;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(left, yTau);
      ctx.lineTo(right, yTau);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#047857';
      ctx.fillText(`Active Decision Threshold τ = ${decisionThresholdTau} µg/m³`, left + 12, yTau - 6);
    }

    // 1. Standard LightGBM (MSE) dashed slate line
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    episodeSeries.forEach((step, idx) => {
      const px = xOf(idx);
      const py = yOf(step.msePrediction);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Uncalibrated LightGBM Quantile 0.90 amber dotted line
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.6;
    ctx.setLineDash([2, 3]);
    ctx.beginPath();
    episodeSeries.forEach((step, idx) => {
      const px = xOf(idx);
      const py = yOf(step.uncalibratedQ90);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Proposed CQR Upper Bound (solid cobalt blue)
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    episodeSeries.forEach((step, idx) => {
      const px = xOf(idx);
      const py = yOf(step.cqrUpperBound);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // 4. Ground Truth PM2.5 (solid obsidian black)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    episodeSeries.forEach((step, idx) => {
      const px = xOf(idx);
      const py = yOf(step.groundTruthPm25);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Hover / Selected probe vertical crosshair
    if (hoveredHourIdx >= 0 && hoveredHourIdx < episodeSeries.length) {
      const hx = xOf(hoveredHourIdx);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(hx, top);
      ctx.lineTo(hx, bottom);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Frame border
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(left, top, plotW, plotH);

    // Legend strip at bottom
    const legendItems = [
      { color: '#0f172a', label: 'Ground Truth PM2.5' },
      { color: '#0284c7', label: 'Proposed CQR Upper Bound' },
      { color: '#d97706', label: 'Uncalibrated Q90' },
      { color: '#64748b', label: 'Standard LightGBM (MSE)' },
    ];
    let lx = left;
    legendItems.forEach((item) => {
      ctx.fillStyle = item.color;
      ctx.fillRect(lx, H - 18, 16, 4);
      ctx.fillStyle = '#0f172a';
      ctx.font = '500 11px "IBM Plex Sans", sans-serif';
      ctx.fillText(item.label, lx + 22, H - 13);
      lx += 235;
    });
  }, [episodeSeries, conformalOffsetQHat, targetCoverage, decisionThresholdTau, hoveredHourIdx]);

  // --- Draw Figure 3: 5-Stage Ablation CSI/cRMSE & Asymmetric Cost Frontier ---
  useEffect(() => {
    const canvas = fig3CanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1320;
    const H = 400;
    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Panel (a): 5-Stage Ablation Progression
    const p1L = 68;
    const p1R = 595;
    const p1T = 54;
    const p1B = 335;
    const p1W = p1R - p1L;
    const p1H = p1B - p1T;

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 13px "IBM Plex Sans", sans-serif';
    ctx.fillText('(a) 5-Stage Physics Ablation: CSI vs. Tail cRMSE (>250 µg/m³)', p1L - 10, 28);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(p1L, p1T, p1W, p1H);

    // Plot bars for CSI and line for cRMSE_250
    const stageCount = table2Ablation.length;
    table2Ablation.forEach((row, idx) => {
      const cx = p1L + ((idx + 0.5) / stageCount) * p1W;
      const barW = 38;
      const csiH = ((row.csiThreatScore - 0.4) / 0.55) * p1H;
      ctx.fillStyle = idx === 4 ? '#0369a1' : '#38bdf8';
      ctx.fillRect(cx - barW - 2, p1B - csiH, barW, csiH);

      ctx.fillStyle = '#0f172a';
      ctx.font = '600 10px "IBM Plex Mono", monospace';
      ctx.fillText(row.csiThreatScore.toFixed(3), cx - barW - 2, p1B - csiH - 6);
      ctx.fillText(`Stage ${row.stage}`, cx - 22, p1B + 18);
    });

    // Plot cRMSE_250 curve
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    table2Ablation.forEach((row, idx) => {
      const cx = p1L + ((idx + 0.5) / stageCount) * p1W + 14;
      const cy = p1B - ((row.conditionalTailRmse250 - 20) / 60) * p1H;
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();

    table2Ablation.forEach((row, idx) => {
      const cx = p1L + ((idx + 0.5) / stageCount) * p1W + 14;
      const cy = p1B - ((row.conditionalTailRmse250 - 20) / 60) * p1H;
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '600 10px "IBM Plex Mono", monospace';
      ctx.fillText(`${row.conditionalTailRmse250.toFixed(1)}`, cx + 6, cy + 3);
    });

    // Panel (b): Asymmetric Public-Health Cost Curve
    const p2L = 710;
    const p2R = 1275;
    const p2T = 54;
    const p2B = 335;
    const p2W = p2R - p2L;
    const p2H = p2B - p2T;

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 13px "IBM Plex Sans", sans-serif';
    ctx.fillText(
      `(b) Asymmetric Cost Optimization Frontier (k = C_FN/C_FP = ${costRatioK.toFixed(1)}, τ* = ${optimalThresholdTauStar} µg/m³)`,
      p2L - 10,
      28
    );

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(p2L, p2T, p2W, p2H);

    const maxCost = Math.max(...costFrontier.map((c) => c.expectedCostPer100Hrs), 40);
    const minCost = 0;

    // Draw Cost curve
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    costFrontier.forEach((pt, idx) => {
      const px = p2L + ((pt.thresholdTau - 170) / 100) * p2W;
      const py = p2B - ((pt.expectedCostPer100Hrs - minCost) / (maxCost - minCost)) * p2H;
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Mark optimal threshold tau*
    const optX = p2L + ((optimalThresholdTauStar - 170) / 100) * p2W;
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 3]);
    ctx.beginPath();
    ctx.moveTo(optX, p2T);
    ctx.lineTo(optX, p2B);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#dc2626';
    ctx.font = '600 11px "IBM Plex Mono", monospace';
    ctx.fillText(`Optimal τ* = ${optimalThresholdTauStar} µg/m³`, optX + 6, p2T + 18);

    // X-axis labels
    ctx.fillStyle = '#475569';
    for (let tau = 170; tau <= 270; tau += 20) {
      const px = p2L + ((tau - 170) / 100) * p2W;
      ctx.fillText(`${tau}`, px - 10, p2B + 18);
    }
    ctx.fillStyle = '#0f172a';
    ctx.font = '500 11px "IBM Plex Sans", sans-serif';
    ctx.fillText('Decision Threshold τ (µg/m³)', p2L + 200, H - 14);
  }, [table2Ablation, costFrontier, optimalThresholdTauStar, costRatioK]);

  // --- Draw Figure 4: SHAP Beeswarm & RNII x PSAI Dependence Interaction ---
  useEffect(() => {
    const canvas = fig4CanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1320;
    const H = 410;
    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Panel (a): Global SHAP Beeswarm Summary
    const p1L = 235;
    const p1R = 640;
    const p1T = 52;
    const p1B = 355;
    const p1W = p1R - p1L;
    const p1H = p1B - p1T;

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 13px "IBM Plex Sans", sans-serif';
    ctx.fillText('(a) Global SHAP Beeswarm (Quantile α = 0.90 Upper Tail)', 28, 28);

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(p1L, p1T, p1W, p1H);

    // Zero SHAP reference line
    const zeroX = p1L + (45 / 115) * p1W;
    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(zeroX, p1T);
    ctx.lineTo(zeroX, p1B);
    ctx.stroke();
    ctx.setLineDash([]);

    shapSummaries.forEach((feat, fIdx) => {
      const rowY = p1T + ((fIdx + 0.5) / shapSummaries.length) * p1H;
      ctx.fillStyle = '#0f172a';
      ctx.font = '500 11px "IBM Plex Mono", monospace';
      ctx.fillText(feat.featureName.replace('feat_', ''), 24, rowY + 4);

      feat.samples.forEach((s, sIdx) => {
        const px = zeroX + (s.shapValueUgm3 / 75) * (p1W * 0.55);
        const jitterY = rowY + Math.sin(sIdx * 1.9) * 7;
        const highVal = s.featureValueNormalized > 0;
        ctx.fillStyle = highVal ? 'rgba(220, 38, 38, 0.72)' : 'rgba(2, 132, 199, 0.72)';
        ctx.beginPath();
        ctx.arc(Math.min(p1R - 6, Math.max(p1L + 6, px)), jitterY, 3.2, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    ctx.fillStyle = '#334155';
    ctx.font = '500 11px "IBM Plex Sans", sans-serif';
    ctx.fillText('SHAP Impact on 24h Upper-Tail PM2.5 Forecast (µg/m³)', p1L + 55, H - 16);

    // Panel (b): SHAP Dependence Interaction Plot (RNII x PSAI)
    const p2L = 735;
    const p2R = 1275;
    const p2T = 52;
    const p2B = 355;
    const p2W = p2R - p2L;
    const p2H = p2B - p2T;

    ctx.fillStyle = '#0f172a';
    ctx.font = '600 13px "IBM Plex Sans", sans-serif';
    ctx.fillText(
      '(b) Non-Linear SHAP Interaction: Radiative Inversion (RNII) × Pyrogenic Stagnation (PSAI)',
      p2L - 15,
      28
    );

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(p2L, p2T, p2W, p2H);

    const rniiSamples = shapSummaries[0]?.samples ?? [];
    rniiSamples.forEach((s) => {
      const px = p2L + ((s.featureValueNormalized + 1) / 2) * (p2W - 24) + 12;
      const py = p2B - ((s.shapValueUgm3 + 45) / 115) * (p2H - 24) - 12;
      const highPsai = s.interactionPartnerValue > 0.55;
      ctx.fillStyle = highPsai ? '#dc2626' : '#0284c7';
      ctx.beginPath();
      ctx.arc(px, py, 4.8, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#334155';
    ctx.font = '500 11px "IBM Plex Sans", sans-serif';
    ctx.fillText('Normalized Radiative Nocturnal Inversion Index (RNII)', p2L + 130, H - 16);
  }, [shapSummaries]);

  const activeStep = episodeSeries[hoveredHourIdx] || episodeSeries[86];

  return (
    <div className="space-y-8">
      {exportStatus && (
        <div
          role="status"
          className="px-4 py-2.5 bg-slate-900 text-white text-xs font-mono flex items-center justify-between border border-slate-700"
        >
          <span>{exportStatus}</span>
          <span>300-DPI IEEE Figure Ready</span>
        </div>
      )}

      {/* Figure 2 First / Primary Visual Anchor: Winter GRAP Stage-IV Episode with Interactive Crosshair Scrubber */}
      <section className="bg-white border border-slate-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Figure 2: Post-Monsoon GRAP Stage-IV Episode Trajectory (`fig2_cqr_vs_mse_grap4_episodes.png`)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Ground Truth Delhi PM2.5 vs. Standard MSE Under-Prediction, Uncalibrated Quantile 0.90, and Split Conformal CQR Band
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadCanvasAsPng(fig2CanvasRef.current, 'fig2_cqr_vs_mse_grap4_episodes.png')}
            className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download 300-DPI fig2.png
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <canvas
            ref={fig2CanvasRef}
            data-testid="canvas-fig2"
            className="w-full h-auto border border-slate-200 cursor-crosshair"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const relX = Math.max(0, Math.min(1, (e.clientX - rect.left - 40) / (rect.width - 60)));
              const idx = Math.round(relX * (episodeSeries.length - 1));
              if (idx >= 0 && idx < episodeSeries.length) {
                setHoveredHourIdx(idx);
              }
            }}
          />
        </div>

        {/* Interactive Hour Scrubber & Telemetry Probe */}
        <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-4 flex items-center gap-3">
            <Crosshair className="w-4 h-4 text-sky-700 shrink-0" />
            <label htmlFor="episode-hour-scrubber" className="text-xs font-medium text-slate-700 whitespace-nowrap">
              Probe Episode Hour ({activeStep.timestamp}):
            </label>
            <input
              id="episode-hour-scrubber"
              type="range"
              min={0}
              max={episodeSeries.length - 1}
              value={hoveredHourIdx}
              onChange={(e) => setHoveredHourIdx(Number(e.target.value))}
              className="w-full accent-sky-700"
            />
          </div>
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono tabular-nums bg-slate-50 p-3 border border-slate-200">
            <div>
              <div className="text-slate-500">Ground Truth</div>
              <div className="font-semibold text-slate-900 text-sm">
                {activeStep.groundTruthPm25} µg/m³
              </div>
            </div>
            <div>
              <div className="text-slate-500">LightGBM (MSE)</div>
              <div className="font-semibold text-slate-600 text-sm">
                {activeStep.msePrediction} µg/m³
              </div>
            </div>
            <div>
              <div className="text-slate-500">Uncalibrated Q90</div>
              <div className="font-semibold text-amber-700 text-sm">
                {activeStep.uncalibratedQ90} µg/m³
              </div>
            </div>
            <div>
              <div className="text-slate-500">Proposed CQR-90</div>
              <div className="font-semibold text-sky-700 text-sm">
                {activeStep.cqrUpperBound} µg/m³
              </div>
            </div>
            <div>
              <div className="text-slate-500">Upwind Chd (t-8h)</div>
              <div className="font-semibold text-slate-900 text-sm">
                {activeStep.upwindChdPm25Lag8} µg/m³
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Figure 1: 3-Panel IGP Atmospheric Physics Diagnostics */}
      <section className="bg-white border border-slate-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Figure 1: Three-Panel IGP Atmospheric Physics Diagnostics (`fig1_igp_physics_diagnostics.png`)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              (a) Solar Radiation vs. Nocturnal Boundary-Layer Inversion Loop · (b) Polar 315° NW Corridor Advection · (c) Pyrogenic Stagnation vs. Dust Partitioning
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadCanvasAsPng(fig1CanvasRef.current, 'fig1_igp_physics_diagnostics.png')}
            className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download 300-DPI fig1.png
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <canvas
            ref={fig1CanvasRef}
            data-testid="canvas-fig1"
            className="w-full h-auto border border-slate-200"
          />
        </div>
      </section>

      {/* Figure 3: 5-Stage Ablation CSI/cRMSE & Asymmetric Cost Frontier */}
      <section className="bg-white border border-slate-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Figure 3: Five-Stage Physics Ablation & Public-Health Cost Frontier (`fig3_ablation_csi_and_cost_frontier.png`)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              (a) Critical Success Index (CSI) & Conditional Tail RMSE Progression · (b) Asymmetric Cost Optimization Curve across Thresholds τ
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadCanvasAsPng(fig3CanvasRef.current, 'fig3_ablation_csi_and_cost_frontier.png')}
            className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download 300-DPI fig3.png
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <canvas
            ref={fig3CanvasRef}
            data-testid="canvas-fig3"
            className="w-full h-auto border border-slate-200"
          />
        </div>
      </section>

      {/* Figure 4: SHAP Beeswarm & RNII x PSAI Dependence Interaction */}
      <section className="bg-white border border-slate-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Figure 4: Explainable AI Attribution & Non-Linear Physics Synergy (`fig4_shap_interaction_mechanics.png`)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              (a) Global SHAP Beeswarm for Upper Quantile (α = 0.90) · (b) SHAP Dependence Interaction between RNII and PSAI
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadCanvasAsPng(fig4CanvasRef.current, 'fig4_shap_interaction_mechanics.png')}
            className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download 300-DPI fig4.png
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <canvas
            ref={fig4CanvasRef}
            data-testid="canvas-fig4"
            className="w-full h-auto border border-slate-200"
          />
        </div>
      </section>
    </div>
  );
};
