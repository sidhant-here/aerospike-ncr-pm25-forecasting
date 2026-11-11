import React, { useMemo, useState } from 'react';
import { Copy, Check, Download, Terminal, FileCode } from 'lucide-react';
import {
  JUPYTER_NOTEBOOK_CELLS,
  buildFullPythonPercentScript,
  buildIpynbJsonString,
  getNotebookLineStats,
  NotebookCell,
} from '../data/jupyterNotebookData';

export const NotebookStudioPanel: React.FC = () => {
  const [cellFilter, setCellFilter] = useState<'all' | 'ipynb-json' | 'code' | 'markdown'>('all');
  const [copiedCellId, setCopiedCellId] = useState<string | null>(null);
  const [copiedIpynb, setCopiedIpynb] = useState(false);

  const ipynbJsonString = useMemo(() => buildIpynbJsonString(), []);
  const lineStats = useMemo(() => getNotebookLineStats(), []);

  const filteredCells = JUPYTER_NOTEBOOK_CELLS.filter((c) =>
    cellFilter === 'all' || cellFilter === 'ipynb-json' ? true : c.cellType === cellFilter
  );

  const handleCopyIpynbJson = async () => {
    try {
      await navigator.clipboard.writeText(ipynbJsonString);
      setCopiedIpynb(true);
      setTimeout(() => setCopiedIpynb(false), 2500);
    } catch {
      setCopiedIpynb(true);
    }
  };

  const handleDownloadIpynbJson = () => {
    const blob = new Blob([ipynbJsonString], {
      type: 'application/x-ipynb+json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'igp_cqr_pm25_forecasting_ieee.ipynb';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPythonPercent = () => {
    const fullScript = buildFullPythonPercentScript();
    const blob = new Blob([fullScript], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'igp_cqr_pm25_forecasting_ieee.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCell = async (cell: NotebookCell) => {
    const text = `${cell.rawCellHeader}\n${cell.content}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCellId(cell.id);
      setTimeout(() => setCopiedCellId(null), 2000);
    } catch {
      setCopiedCellId(cell.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Toolbar */}
      <div className="bg-white border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-baseline gap-2.5">
            <h2 className="text-base font-semibold text-slate-900">
              Jupyter Notebook (`igp_cqr_pm25_forecasting_ieee.ipynb` · nbformat v4.5)
            </h2>
            <span className="text-xs font-mono text-sky-800 font-medium">
              · {lineStats.totalContentLines} Total Lines ({lineStats.codeLines} Code · {lineStats.markdownLines} Markdown)
            </span>
          </div>
          <p className="text-xs text-slate-600">
            Single-Source Option 1 Loader (`load_igp_corridor_data()`) · 60,000-Row 3-City Fallback · 4 Physics Feature Groups · Split CQR Calibration · Tables 1–3 & 300-DPI Figures
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Cell / Format Segmented Control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200">
            {(
              [
                { id: 'all', label: `All Cells (${JUPYTER_NOTEBOOK_CELLS.length})` },
                { id: 'ipynb-json', label: 'Raw .ipynb JSON' },
                { id: 'code', label: 'Code Cells' },
                { id: 'markdown', label: 'Markdown' },
              ] as const
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setCellFilter(mode.id)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  cellFilter === mode.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleCopyIpynbJson}
            className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedIpynb ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied .ipynb JSON
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy .ipynb JSON
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadIpynbJson}
            className="px-3.5 py-2 text-xs font-medium bg-sky-700 text-white hover:bg-sky-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download .ipynb
          </button>

          <button
            type="button"
            onClick={handleDownloadPythonPercent}
            className="px-3.5 py-2 text-xs font-medium bg-slate-100 text-slate-900 border border-slate-300 hover:bg-slate-200 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            Download .py (# %%)
          </button>
        </div>
      </div>

      {cellFilter === 'ipynb-json' ? (
        <section className="bg-white border border-slate-200 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-800">
              igp_cqr_pm25_forecasting_ieee.ipynb (Jupyter Notebook JSON Schema v4.5)
            </span>
            <span className="text-xs font-mono text-slate-500">
              13 Cells · Python 3 (ipykernel)
            </span>
          </div>
          <pre className="p-5 bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed max-h-[680px]">
            <code>{ipynbJsonString}</code>
          </pre>
        </section>
      ) : (
        /* Notebook Cell List */
        <div className="space-y-5">
          {filteredCells.map((cell, idx) => (
            <article
              key={cell.id}
              className="bg-white border border-slate-200 overflow-hidden"
            >
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-mono font-semibold text-sky-800">
                    In [{idx + 1}] · {cell.cellType} cell ({cell.rawCellHeader})
                  </span>
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>
                  <span className="font-medium text-slate-800">
                    Section {cell.sectionNumber}: {cell.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCell(cell)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedCellId === cell.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      Copied Cell
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copy Cell
                    </>
                  )}
                </button>
              </div>

              {cell.cellType === 'markdown' ? (
                <div className="p-5 bg-white text-slate-800 text-xs font-mono whitespace-pre-wrap leading-relaxed border-b border-slate-100">
                  <div className="text-slate-400 select-none mb-1">{cell.rawCellHeader}</div>
                  {cell.content}
                </div>
              ) : (
                <div>
                  <pre className="p-5 bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
                    <code>
                      <span className="text-sky-400">{cell.rawCellHeader}</span>
                      {'\n'}
                      {cell.content}
                    </code>
                  </pre>
                  {cell.executionOutput && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200 font-mono text-xs text-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-500 mb-1.5 text-[11px]">
                        <Terminal className="w-3.5 h-3.5 text-slate-500" />
                        <span>Executed Cell Output (stdout):</span>
                      </div>
                      <pre className="whitespace-pre-wrap overflow-x-auto leading-relaxed text-slate-900">
                        {cell.executionOutput}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
