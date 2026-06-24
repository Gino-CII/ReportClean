import React from "react";
import { Download, LayoutDashboard } from "lucide-react";

export function AppHeader({ onDownload, hasResult }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 p-3 text-white shadow-lg">
            <LayoutDashboard size={28} />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                React + Excel Automation
              </span>
              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                SaaS Dashboard
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              ERP 銷售日報清理與 KPI 分析
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              將列印型管理報表轉換為可分析的標準資料表(Table)，支援小計/總計辨識、明細清理、Issue Log 與 Excel 匯出。
            </p>
          </div>
        </div>

        <button
          onClick={onDownload}
          disabled={!hasResult}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Download size={18} />
          下載清理結果
        </button>
      </div>
    </header>
  );
}
