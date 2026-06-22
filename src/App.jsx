import React, { useMemo, useState } from "react";
import * as XLSX from "xlsx";

export default function App() {
  const [fileName, setFileName] = useState("");
  const [originalFileName, setOriginalFileName] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [rawRows, setRawRows] = useState([]);
  const [result, setResult] = useState(null);
  const [warning, setWarning] = useState("");
  const [activeTab, setActiveTab] = useState("raw");
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadFileName, setDownloadFileName] = useState("");

  const expectedHeaders = [
    "業務", "日期", "客戶", "產品代號", "產品名稱",
    "區域", "數量", "單價", "銷售金額", "毛利"
  ];

  const toNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const cleaned = String(value).replace(/,/g, "").trim();
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  };

  const isBlankRow = (row) =>
    row.every((v) => v === null || v === undefined || String(v).trim() === "");

  const rowText = (row) =>
    row.map((v) => (v ?? "").toString()).join(" ").trim();

  const detectHeaderRowIndex = (rows) => {
    let bestIndex = -1;
    let bestScore = 0;

    rows.forEach((row, index) => {
      const score = row.filter((cell) =>
        expectedHeaders.includes(String(cell ?? "").trim())
      ).length;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    return bestScore >= 5 ? bestIndex : -1;
  };

  const parseBusinessGroup = (text) => {
    const match = text.match(/業務[:：]\s*([A-Z0-9]+)\s*(.+)/);
    if (!match) return null;

    return {
      businessId: match[1],
      businessName: match[2],
      businessFull: `${match[1]} ${match[2]}`
    };
  };

  const splitBusiness = (value) => {
    const text = String(value ?? "").trim();
    const match = text.match(/^([A-Z0-9]+)\s+(.+)$/);

    if (!match) {
      return {
        businessId: "",
        businessName: text
      };
    }

    return {
      businessId: match[1],
      businessName: match[2]
    };
  };

  const normalizeDate = (value) => {
    if (!value) return null;

    if (typeof value === "number") {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (!parsed) return null;
      return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
    }

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;

    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const cleanWorkbook = (rows) => {
    const issueLog = [];
    const validation = [];
    const headerRowIndex = detectHeaderRowIndex(rows);

    if (headerRowIndex === -1) {
      throw new Error("無法自動偵測欄位名稱列，請確認是否包含日期、業務、客戶、產品、區域、數量、單價、銷售金額、毛利等欄位。");
    }

    const headers = rows[headerRowIndex].map((h) => String(h ?? "").trim());
    const dataRows = rows.slice(headerRowIndex + 1);

    const headerMap = {};
    headers.forEach((h, i) => {
      if (h) headerMap[h] = i;
    });

    const sourceInfo = rows.slice(0, headerRowIndex).filter((r) => !isBlankRow(r));

    let currentBusiness = null;
    let lastValues = {};
    let blankRowCount = 0;
    let subtotalCount = 0;
    let totalCount = 0;
    let footerCount = 0;
    let fillDownCount = 0;
    let abnormalCount = 0;

    const cleanWithSubtotalTotal = [];
    const cleanDetailOnly = [];

    dataRows.forEach((row, offset) => {
      const sourceRowNo = headerRowIndex + offset + 2;
      const text = rowText(row);

      if (isBlankRow(row)) {
        blankRowCount++;
        issueLog.push({
          來源列號: sourceRowNo,
          問題類型: "空白列",
          問題描述: "整列空白",
          處理方式: "排除",
          檢核狀態: "已處理"
        });
        return;
      }

      if (text.includes("報表頁尾") || text.includes("系統產出") || text.includes("列印")) {
        footerCount++;
        issueLog.push({
          來源列號: sourceRowNo,
          問題類型: "頁尾",
          問題描述: text,
          處理方式: "排除",
          檢核狀態: "已處理"
        });
        return;
      }

      const group = parseBusinessGroup(text);
      if (group) {
        currentBusiness = group;
        lastValues["業務"] = group.businessFull;

        issueLog.push({
          來源列號: sourceRowNo,
          問題類型: "業務分組標題列",
          問題描述: text,
          處理方式: "解析為業務ID與業務姓名，供後續明細補值",
          檢核狀態: "已處理"
        });
        return;
      }

      const firstCell = String(row[0] ?? "").trim();
      const isSubtotal = text.includes("小計");
      const isTotal = firstCell === "總計" || text === "總計" || text.includes("總計");

      const originalBusiness = row[headerMap["業務"]] ?? "";
      const businessParts = splitBusiness(originalBusiness);

      const record = {
        來源列號: sourceRowNo,
        資料列類型: isSubtotal ? "小計" : isTotal ? "總計" : "明細",
        業務ID: businessParts.businessId,
        業務姓名: businessParts.businessName,
        業務: originalBusiness,
        日期: normalizeDate(row[headerMap["日期"]]),
        客戶: row[headerMap["客戶"]] ?? "",
        產品代號: row[headerMap["產品代號"]] ?? "",
        產品名稱: row[headerMap["產品名稱"]] ?? "",
        區域: row[headerMap["區域"]] ?? "",
        數量: toNumber(row[headerMap["數量"]]),
        單價: toNumber(row[headerMap["單價"]]),
        銷售金額: toNumber(row[headerMap["銷售金額"]]),
        毛利: toNumber(row[headerMap["毛利"]])
      };

      if (isSubtotal) {
        subtotalCount++;

        record.業務 = firstCell.replace("小計", "").trim();

        const business = splitBusiness(record.業務);
        record.業務ID = business.businessId;
        record.業務姓名 = business.businessName;

        cleanWithSubtotalTotal.push(record);
        return;
      }

      if (isTotal) {
        totalCount++;
        record.業務 = "總計";
        record.業務ID = "";
        record.業務姓名 = "總計";

        cleanWithSubtotalTotal.push(record);
        return;
      }

      if (!record.業務 && currentBusiness) {
        record.業務 = currentBusiness.businessFull;
        record.業務ID = currentBusiness.businessId;
        record.業務姓名 = currentBusiness.businessName;
        fillDownCount++;
      }

      if (!record.客戶 && lastValues["客戶"]) {
        record.客戶 = lastValues["客戶"];
        fillDownCount++;
      }

      if (record.業務) {
        lastValues["業務"] = record.業務;
      }

      if (record.客戶) {
        lastValues["客戶"] = record.客戶;
      }

      const numericFields = ["數量", "單價", "銷售金額", "毛利"];
      numericFields.forEach((field) => {
        if (record[field] === null) {
          abnormalCount++;
          issueLog.push({
            來源列號: sourceRowNo,
            問題類型: "資料型態",
            問題描述: `${field} 無法轉為數值`,
            處理方式: "列入異常清單，請人工確認",
            檢核狀態: "需確認"
          });
        }
      });

      if (!record.日期) {
        abnormalCount++;
        issueLog.push({
          來源列號: sourceRowNo,
          問題類型: "日期格式",
          問題描述: "日期無法正確轉換",
          處理方式: "列入異常清單，請人工確認",
          檢核狀態: "需確認"
        });
      }

      cleanWithSubtotalTotal.push(record);
      cleanDetailOnly.push(record);
    });

    const salesTotal = cleanDetailOnly.reduce((sum, r) => sum + (r.銷售金額 || 0), 0);
    const grossProfitTotal = cleanDetailOnly.reduce((sum, r) => sum + (r.毛利 || 0), 0);
    const avgGrossMargin = salesTotal ? grossProfitTotal / salesTotal : 0;

    const kpi = {
      原始資料列數: rows.length,
      清理後明細筆數: cleanDetailOnly.length,
      移除空白列數: blankRowCount,
      偵測小計列數: subtotalCount,
      偵測總計列數: totalCount,
      銷售總額: salesTotal,
      毛利總額: grossProfitTotal,
      平均毛利率: avgGrossMargin,
      異常資料筆數: abnormalCount
    };

    const diagnosis = [
      ["頁首", sourceInfo.length, "保留為來源資訊，不納入明細表", "已處理"],
      ["頁尾", footerCount, "排除", "已處理"],
      ["小計", subtotalCount, "保留版標示為小計；純明細版排除", "已處理"],
      ["總計", totalCount, "保留版標示為總計；純明細版排除", "已處理"],
      ["空白列", blankRowCount, "排除", "已處理"],
      ["分類值缺漏", fillDownCount, "業務與客戶欄位向下填滿", "已處理"],
      ["資料型態", abnormalCount, "日期與數值轉換，異常列入 Issue Log", abnormalCount ? "需確認" : "已通過"],
      ["欄位名稱", headerRowIndex + 1, "自動偵測欄位名稱列", "已處理"]
    ].map(([問題類型, 發現數量, 處理方式, 檢核狀態]) => ({
      問題類型,
      發現數量,
      處理方式,
      檢核狀態
    }));

    validation.push(
      { 檢核項目: "原始資料列數", 檢核值: rows.length },
      { 檢核項目: "欄位名稱列", 檢核值: headerRowIndex + 1 },
      { 檢核項目: "清理後明細筆數", 檢核值: cleanDetailOnly.length },
      { 檢核項目: "保留小計總計版筆數", 檢核值: cleanWithSubtotalTotal.length },
      { 檢核項目: "純明細銷售總額", 檢核值: salesTotal },
      { 檢核項目: "純明細毛利總額", 檢核值: grossProfitTotal },
      { 檢核項目: "平均毛利率", 檢核值: `${(avgGrossMargin * 100).toFixed(2)}%` },
      { 檢核項目: "異常資料筆數", 檢核值: abnormalCount }
    );

    return {
      sourceInfo,
      headers,
      cleanWithSubtotalTotal,
      cleanDetailOnly,
      diagnosis,
      issueLog,
      validation,
      kpi
    };
  };

const handleUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // 重新上傳時，先清空舊資料
  setWarning("");
  setResult(null);
  setRawRows([]);
  setSheetName("");
  setDownloadUrl("");
  setDownloadFileName("");
  setFileName(file.name);
  const sourceFileName  = file.name.replace(/\.[^/.]+$/, "");
  setOriginalFileName(sourceFileName);

  try {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }

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

    // 重新設定畫面資料
    setRawRows(rows);
    setResult(cleaned);
    setActiveTab("raw");

    // 重設 file input，避免同一個檔名再次上傳時不觸發 onChange
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

  const downloadExcel = () => {
    if (!result) {
      setWarning("目前沒有可下載的清理結果，請先上傳並完成清理。");
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(result.cleanWithSubtotalTotal),
        "Clean_With_Subtotal_Total"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(result.cleanDetailOnly),
        "Clean_Detail_Only"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(result.validation),
        "Validation_Check"
      );

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(result.issueLog),
        "Issue_Log"
      );

      const now = new Date();

      const yyyymmdd =
      `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

      const hhnnss =
      `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array"
      });

      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download =
        `${originalFileName}_資料清洗_${yyyymmdd}_${hhnnss}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      setWarning(`Excel 下載失敗：${error.message}`);
    }
  };

  const formatNumber = (num) =>
    typeof num === "number"
      ? num.toLocaleString("zh-TW", { maximumFractionDigits: 2 })
      : "-";

  const rawPreview = useMemo(() => rawRows.slice(0, 12), [rawRows]);

  const renderTable = (data, maxRows = 10) => {
    if (!data || data.length === 0) {
      return <div className="text-sm text-slate-500">尚無資料</div>;
    }

    const rows = data.slice(0, maxRows);
    const columns = Object.keys(rows[0]);

    return (
      <div className="overflow-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              {columns.map((col) => (
                <th key={col} className="whitespace-nowrap px-3 py-2 text-left font-semibold text-slate-700">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                {columns.map((col) => (
                  <td key={col} className="whitespace-nowrap px-3 py-2 text-slate-700">
                    {String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-3 py-2 text-xs text-slate-500">
          預覽 {rows.length} 筆 / 共 {data.length} 筆
        </div>
      </div>
    );
  };

  const renderRawTable = () => (
    <div className="overflow-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-sm">
        <tbody>
          {rawPreview.map((row, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="whitespace-nowrap bg-slate-100 px-3 py-2 font-semibold text-slate-500">
                {i + 1}
              </td>
              {row.map((cell, j) => (
                <td key={j} className="whitespace-nowrap px-3 py-2 text-slate-700">
                  {String(cell ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const kpiCards = result
    ? [
        ["原始資料列數", result.kpi.原始資料列數],
        ["清理後明細筆數", result.kpi.清理後明細筆數],
        ["移除空白列數", result.kpi.移除空白列數],
        ["小計列數", result.kpi.偵測小計列數],
        ["總計列數", result.kpi.偵測總計列數],
        ["銷售總額", result.kpi.銷售總額],
        ["毛利總額", result.kpi.毛利總額],
        ["平均毛利率", `${(result.kpi.平均毛利率 * 100).toFixed(2)}%`],
        ["異常資料筆數", result.kpi.異常資料筆數]
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                ERP 銷售日報清理與 KPI 分析
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                將列印型管理報表轉換為可分析的標準資料表(Table)，並輸出保留小計總計版與純明細版。
              </p>
            </div>

            <button
              onClick={downloadExcel}
              disabled={!result}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              下載 Excel 清理結果
            </button>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold">檔案上傳</h2>
            <p className="mt-2 text-sm text-slate-600">
              支援 .xlsx，所有處理均在瀏覽器端完成。
            </p>

            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 p-8 text-center hover:bg-blue-100">
              <span className="font-semibold text-blue-700">選擇 Excel 檔案</span>
              <span className="mt-1 text-xs text-slate-500">.xlsx only</span>
              <input
                key={fileInputKey}
                type="file"
                accept=".xlsx"
                onChange={handleUpload}
                className="hidden"
              />
            </label>

            <div className="mt-5 space-y-2 text-sm">
              <div><span className="font-semibold">檔名：</span>{fileName || "-"}</div>
              <div><span className="font-semibold">工作表：</span>{sheetName || "-"}</div>
              <div><span className="font-semibold">原始資料列數：</span>{rawRows.length || "-"}</div>
            </div>

            {warning && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {warning}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
            <h2 className="text-lg font-bold">KPI 摘要</h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {kpiCards.length === 0 ? (
                <div className="text-sm text-slate-500">請先上傳 Excel 檔案。</div>
              ) : (
                kpiCards.map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
                    <div className="text-xs font-semibold text-slate-500">{label}</div>
                    <div className="mt-2 text-2xl font-bold text-slate-900">
                      {typeof value === "number" ? formatNumber(value) : value}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">問題診斷摘要</h2>
          <div className="mt-4">{renderTable(result?.diagnosis || [], 20)}</div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {[
              ["raw", "原始資料預覽"],
              ["with", "保留小計與總計版"],
              ["detail", "純明細版"]
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                  activeTab === key
                    ? "bg-purple-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5">
            {activeTab === "raw" && renderRawTable()}
            {activeTab === "with" && renderTable(result?.cleanWithSubtotalTotal || [], 15)}
            {activeTab === "detail" && renderTable(result?.cleanDetailOnly || [], 15)}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold">Issue Log 預覽</h2>
          <div className="mt-4">{renderTable(result?.issueLog || [], 20)}</div>
        </section>
      </div>
    </div>
  );
}