import React, { useMemo } from "react";
import { Database, FileText, Table2 } from "lucide-react";

export function DataPreviewTabs({ activeTab, setActiveTab, rawRows, cleanWithSubtotalTotal, cleanDetailOnly }) {
  const rawPreview = useMemo(() => rawRows.slice(0, 12), [rawRows]);
  const tabs = [
    { key: "raw", label: "原始資料預覽", icon: FileText },
    { key: "with", label: "保留小計與總計版", icon: Database },
    { key: "detail", label: "純明細版", icon: Table2 }
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">資料預覽</h2>
          <p className="text-sm text-slate-500">檢查原始資料與兩種清理輸出結果。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition ${activeTab === tab.key ? "bg-purple-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                <Icon size={16} />{tab.label}
              </button>
            );
          })}
        </div>
      </div>
      {activeTab === "raw" && <RawTable rows={rawPreview} total={rawRows.length} />}
      {activeTab === "with" && <JsonTable data={cleanWithSubtotalTotal} />}
      {activeTab === "detail" && <JsonTable data={cleanDetailOnly} />}
    </section>
  );
}

function RawTable({ rows, total }) {
  if (!rows.length) return <EmptyTable />;
  return (
    <div className="overflow-auto rounded-2xl border border-slate-200">
      <table className="min-w-full text-sm"><tbody>{rows.map((row, i) => (
        <tr key={i} className={i % 2 ? "bg-white" : "bg-slate-50"}>
          <td className="sticky left-0 bg-slate-100 px-4 py-3 font-bold text-slate-500">{i + 1}</td>
          {row.map((cell, j) => <td key={j} className="whitespace-nowrap px-4 py-3 text-slate-700">{String(cell ?? "")}</td>)}
        </tr>
      ))}</tbody></table>
      <PreviewFooter shown={rows.length} total={total} />
    </div>
  );
}

function JsonTable({ data }) {
  if (!data.length) return <EmptyTable />;
  const rows = data.slice(0, 15);
  const columns = Object.keys(rows[0]);
  return (
    <div className="overflow-auto rounded-2xl border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100"><tr>{columns.map((col) => <th key={col} className="whitespace-nowrap px-4 py-3 text-left font-bold text-slate-700">{col}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => (
          <tr key={i} className={i % 2 ? "bg-white" : "bg-slate-50"}>{columns.map((col) => <td key={col} className="whitespace-nowrap px-4 py-3 text-slate-700">{col === "資料列類型" ? <RowTypeBadge value={row[col]} /> : String(row[col] ?? "")}</td>)}</tr>
        ))}</tbody>
      </table>
      <PreviewFooter shown={rows.length} total={data.length} />
    </div>
  );
}

function RowTypeBadge({ value }) {
  const style = value === "明細" ? "bg-emerald-50 text-emerald-700" : value === "小計" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>;
}
function PreviewFooter({ shown, total }) { return <div className="border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">預覽 {shown} 筆 / 共 {total} 筆</div>; }
function EmptyTable() { return <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">尚無資料，請先上傳 Excel。</div>; }
