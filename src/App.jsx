import React, { useState } from "react";
import * as XLSX from "xlsx";
import { AppHeader } from "./components/AppHeader";
import { FileUploadCard } from "./components/FileUploadCard";
import { KpiGrid } from "./components/KpiGrid";
import { DiagnosisTable } from "./components/DiagnosisTable";
import { DataPreviewTabs } from "./components/DataPreviewTabs";
import { IssueLogTable } from "./components/IssueLogTable";
import { DownloadPanel } from "./components/DownloadPanel";
import { cleanWorkbook } from "./utils/excelCleaner";
import { exportCleanExcel } from "./utils/exportExcel";

export default function App() {
  const [fileName, setFileName] = useState("");
  const [originalFileName, setOriginalFileName] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [rawRows, setRawRows] = useState([]);
  const [result, setResult] = useState(null);
  const [warning, setWarning] = useState("");
  const [activeTab, setActiveTab] = useState("raw");
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const resetBeforeUpload = () => {
    setWarning("");
    setResult(null);
    setRawRows([]);
    setSheetName("");
    setActiveTab("raw");
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetBeforeUpload();

    setFileName(file.name);
    setOriginalFileName(file.name.replace(/\.[^/.]+$/, ""));

    try {
      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true
      });

      const firstSheetName = workbook.SheetNames[0];
      setSheetName(firstSheetName);

      const worksheet = workbook.Sheets[firstSheetName];

      const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ""
      });

      const cleaned = cleanWorkbook(rows);

      setRawRows(rows);
      setResult(cleaned);
      setActiveTab("raw");

      setFileInputKey(Date.now());
      event.target.value = "";
    } catch (error) {
      setWarning(error.message || "Excel 讀取或清理失敗。");
      setResult(null);
      setRawRows([]);
      setFileInputKey(Date.now());
      event.target.value = "";
    }
  };

  const handleDownload = () => {
    if (!result) {
      setWarning("目前沒有可下載的清理結果，請先上傳並完成清理。");
      return;
    }

    try {
      exportCleanExcel(result, originalFileName || "ERP銷售日報");
    } catch (error) {
      setWarning(`Excel 下載失敗：${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader onDownload={handleDownload} hasResult={!!result} />

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <section className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <FileUploadCard
              fileInputKey={fileInputKey}
              fileName={fileName}
              sheetName={sheetName}
              rawRowCount={rawRows.length}
              warning={warning}
              onUpload={handleUpload}
            />
          </div>

          <div className="lg:col-span-8">
            <KpiGrid kpi={result?.kpi} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <DiagnosisTable data={result?.diagnosis || []} />
          </div>

          <div className="lg:col-span-5">
            <DownloadPanel
              hasResult={!!result}
              originalFileName={originalFileName}
              onDownload={handleDownload}
            />
          </div>
        </section>

        <DataPreviewTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          rawRows={rawRows}
          cleanWithSubtotalTotal={result?.cleanWithSubtotalTotal || []}
          cleanDetailOnly={result?.cleanDetailOnly || []}
        />

        <IssueLogTable data={result?.issueLog || []} />
      </main>
    </div>
  );
}
