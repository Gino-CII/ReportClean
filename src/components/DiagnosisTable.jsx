import React from "react";
import { CheckCircle2, ClipboardList, HelpCircle } from "lucide-react";

export function DiagnosisTable({ data }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-purple-50 p-3 text-purple-700">
          <ClipboardList size={22} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950">問題診斷摘要</h2>
          <p className="text-sm text-slate-500">依報表問題診斷表自動分類與處理。</p>
        </div>
      </div>
      {data.length === 0 ? <EmptyState /> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-left font-bold">問題類型</th>
                <th className="px-4 py-3 text-right font-bold">發現數量</th>
                <th className="px-4 py-3 text-left font-bold">處理方式</th>
                <th className="px-4 py-3 text-left font-bold">檢核狀態</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className={index % 2 ? "bg-white" : "bg-slate-50"}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.問題類型}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-700">{row.發現數量}</td>
                  <td className="px-4 py-3 text-slate-600">{row.處理方式}</td>
                  <td className="px-4 py-3"><StatusBadge value={row.檢核狀態} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ value }) {
  const isOk = value === "已處理" || value === "已通過";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${isOk ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
      {isOk ? <CheckCircle2 size={14} /> : <HelpCircle size={14} />}
      {value}
    </span>
  );
}

function EmptyState() {
  return <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">尚無診斷資料，請先上傳 Excel。</div>;
}
