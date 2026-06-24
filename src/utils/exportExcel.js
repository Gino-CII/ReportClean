import * as XLSX from "xlsx";

export function exportCleanExcel(result, originalFileName) {
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(result.cleanWithSubtotalTotal), "Clean_With_Subtotal_Total");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(result.cleanDetailOnly), "Clean_Detail_Only");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(result.validation), "Validation_Check");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(result.issueLog), "Issue_Log");

  const now = new Date();
  const yyyymmdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const hhnnss = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const outputFileName = `${originalFileName}_資料清洗_${yyyymmdd}_${hhnnss}.xlsx`;

  XLSX.writeFile(workbook, outputFileName);
}
