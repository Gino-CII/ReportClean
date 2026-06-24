import React from "react";
import { AlertCircle, Bug } from "lucide-react";

export function IssueLogTable({ data }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-rose-50 p-3 text-rose-700"><Bug size={22} /></div>
        <div>
          <h2 className="text-lg font-bold text-slate-950">Issue Log 預覽</h2>
          <p className="text-sm text-slate-500">記錄資料清理過程中的問題、處理方式與檢核狀態。</p>
        </div>
      </div>
      {data.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">尚無 Issue Log。</div> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100"><tr>{["來源列號", "嚴重度", "問題類型", "問題描述", "處理方式", "檢核狀態"].map(h => <th key={h} className="px-4 py-3 text-left font-bold text-slate-700">{h}</th>)}</tr></thead>
            <tbody>{data.slice(0, 20).map((row, index) => (
              <tr key={index} className={index % 2 ? "bg-white" : "bg-slate-50"}>
                <td className="px-4 py-3 font-semibold text-slate-700">{row.來源列號}</td>
                <td className="px-4 py-3"><SeverityBadge issueType={row.問題類型} /></td>
                <td className="px-4 py-3 font-semibold text-slate-900">{row.問題類型}</td>
                <td className="px-4 py-3 text-slate-600">{row.問題描述}</td>
                <td className="px-4 py-3 text-slate-600">{row.處理方式}</td>
                <td className="px-4 py-3 text-slate-600">{row.檢核狀態}</td>
              </tr>
            ))}</tbody>
          </table>
          <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">預覽 {Math.min(data.length, 20)} 筆 / 共 {data.length} 筆</div>
        </div>
      )}
    </section>
  );
}

function SeverityBadge({ issueType }) {
  const highRisk = ["資料型態", "日期格式"];
  const isHigh = highRisk.includes(issueType);
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${isHigh ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}`}><AlertCircle size={13} />{isHigh ? "高" : "中"}</span>;
}
