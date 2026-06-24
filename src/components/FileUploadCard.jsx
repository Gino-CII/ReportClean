import React from "react";
import { AlertTriangle, FileSpreadsheet, UploadCloud } from "lucide-react";

export function FileUploadCard({ fileInputKey, fileName, sheetName, rawRowCount, warning, onUpload }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
          <UploadCloud size={24} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-950">檔案上傳</h2>
          <p className="text-sm text-slate-500">支援 .xlsx，資料僅在瀏覽器端處理。</p>
        </div>
      </div>

      <label className="group flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 px-5 py-10 text-center transition hover:border-blue-400 hover:from-blue-100 hover:to-purple-100">
        <div className="mb-3 rounded-2xl bg-white p-4 text-blue-600 shadow-sm transition group-hover:scale-105">
          <FileSpreadsheet size={34} />
        </div>
        <div className="text-base font-bold text-slate-900">拖曳或選擇 Excel 檔案</div>
        <div className="mt-1 text-sm text-slate-500">僅支援 .xlsx</div>
        <input key={fileInputKey} type="file" accept=".xlsx" onChange={onUpload} className="hidden" />
      </label>

      <div className="mt-5 grid gap-3 text-sm">
        <InfoRow label="檔名" value={fileName || "-"} />
        <InfoRow label="工作表" value={sheetName || "-"} />
        <InfoRow label="原始資料列數" value={rawRowCount || "-"} />
      </div>

      {warning && (
        <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <div>{warning}</div>
        </div>
      )}
    </section>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="max-w-[210px] truncate font-semibold text-slate-900">{value}</span>
    </div>
  );
}
