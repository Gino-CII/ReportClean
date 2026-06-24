import * as XLSX from "xlsx";

const expectedHeaders = ["業務", "日期", "客戶", "產品代號", "產品名稱", "區域", "數量", "單價", "銷售金額", "毛利"];

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const cleaned = String(value).replace(/,/g, "").trim();
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

const isBlankRow = (row) => row.every((v) => v === null || v === undefined || String(v).trim() === "");
const rowText = (row) => row.map((v) => (v ?? "").toString()).join(" ").trim();

const detectHeaderRowIndex = (rows) => {
  let bestIndex = -1;
  let bestScore = 0;
  rows.forEach((row, index) => {
    const score = row.filter((cell) => expectedHeaders.includes(String(cell ?? "").trim())).length;
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
  return { businessId: match[1], businessName: match[2], businessFull: `${match[1]} ${match[2]}` };
};

const splitBusiness = (value) => {
  const text = String(value ?? "").trim();
  const match = text.match(/^([A-Z0-9]+)\s+(.+)$/);
  if (!match) return { businessId: "", businessName: text };
  return { businessId: match[1], businessName: match[2] };
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

export function cleanWorkbook(rows) {
  const issueLog = [];
  const validation = [];
  const headerRowIndex = detectHeaderRowIndex(rows);

  if (headerRowIndex === -1) {
    throw new Error("無法自動偵測欄位名稱列，請確認是否包含日期、業務、客戶、產品、區域、數量、單價、銷售金額、毛利等欄位。");
  }

  const headers = rows[headerRowIndex].map((h) => String(h ?? "").trim());
  const dataRows = rows.slice(headerRowIndex + 1);
  const headerMap = {};
  headers.forEach((h, i) => { if (h) headerMap[h] = i; });
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
      issueLog.push({ 來源列號: sourceRowNo, 問題類型: "空白列", 問題描述: "整列空白", 處理方式: "排除", 檢核狀態: "已處理" });
      return;
    }

    if (text.includes("報表頁尾") || text.includes("系統產出") || text.includes("列印")) {
      footerCount++;
      issueLog.push({ 來源列號: sourceRowNo, 問題類型: "頁尾", 問題描述: text, 處理方式: "排除", 檢核狀態: "已處理" });
      return;
    }

    const group = parseBusinessGroup(text);
    if (group) {
      currentBusiness = group;
      lastValues["業務"] = group.businessFull;
      issueLog.push({ 來源列號: sourceRowNo, 問題類型: "業務分組標題列", 問題描述: text, 處理方式: "解析為業務ID與業務姓名，供後續明細補值", 檢核狀態: "已處理" });
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

    if (record.業務) lastValues["業務"] = record.業務;
    if (record.客戶) lastValues["客戶"] = record.客戶;

    ["數量", "單價", "銷售金額", "毛利"].forEach((field) => {
      if (record[field] === null) {
        abnormalCount++;
        issueLog.push({ 來源列號: sourceRowNo, 問題類型: "資料型態", 問題描述: `${field} 無法轉為數值`, 處理方式: "列入異常清單，請人工確認", 檢核狀態: "需確認" });
      }
    });

    if (!record.日期) {
      abnormalCount++;
      issueLog.push({ 來源列號: sourceRowNo, 問題類型: "日期格式", 問題描述: "日期無法正確轉換", 處理方式: "列入異常清單，請人工確認", 檢核狀態: "需確認" });
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
  ].map(([問題類型, 發現數量, 處理方式, 檢核狀態]) => ({ 問題類型, 發現數量, 處理方式, 檢核狀態 }));

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

  return { sourceInfo, headers, cleanWithSubtotalTotal, cleanDetailOnly, diagnosis, issueLog, validation, kpi };
}
