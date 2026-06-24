import React from "react";
import { Download, FileCheck2, ShieldCheck } from "lucide-react";

export function DownloadPanel({ hasResult, originalFileName, onDownload }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 to-blue-950 p-6 text-white shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-white/10 p-3"><FileCheck2 size={24} /></div>
        <div>
          <h2 className="text-lg font-bold">Excel 匯出中心</h2>
          <p className="mt-1 text-sm leading-6 text-blue-100">輸出含清理結果、純明細資料、Validation Check 與 Issue Log。</p>
        </div>
      </div>
      <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm">
        <div className="mb-2 flex items-center gap-2 font-semibold text-emerald-200"><ShieldCheck size={16} />檔名規則</div>
        <div className="break-all text-blue-50">{originalFileName || "原始檔名"}_資料清洗_YYYYMMDD_HHNNSS.xlsx</div>
      </div>
      <button onClick={onDownload} disabled={!hasResult} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-500">
        <Download size={18} />下載清理後 Excel
      </button>
    </section>
  );
}
