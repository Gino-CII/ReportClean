import React from "react";
import { AlertTriangle, BadgeDollarSign, BarChart3, ListChecks, Percent, Rows3, Sigma, Trash2 } from "lucide-react";
import { KpiCard } from "./KpiCard";
import { formatNumber, formatPercent } from "../utils/formatters";

export function KpiGrid({ kpi }) {
  const cards = [
    { title: "原始資料列數", value: formatNumber(kpi?.原始資料列數), description: "Excel 原始讀取列數", trend: "來源", icon: Rows3, tone: "blue" },
    { title: "清理後明細筆數", value: formatNumber(kpi?.清理後明細筆數), description: "純明細資料列，不含小計與總計", trend: "可分析", icon: ListChecks, tone: "emerald" },
    { title: "移除空白列數", value: formatNumber(kpi?.移除空白列數), description: "已排除無效空白列", trend: "清理", icon: Trash2, tone: "amber" },
    { title: "小計 / 總計列", value: `${formatNumber(kpi?.偵測小計列數)} / ${formatNumber(kpi?.偵測總計列數)}`, description: "管理報表彙總列辨識", trend: "辨識", icon: Sigma, tone: "purple" },
    { title: "銷售總額", value: formatNumber(kpi?.銷售總額), description: "純明細版銷售金額加總", trend: "KPI", icon: BadgeDollarSign, tone: "blue" },
    { title: "毛利總額", value: formatNumber(kpi?.毛利總額), description: "純明細版毛利加總", trend: "KPI", icon: BarChart3, tone: "emerald" },
    { title: "平均毛利率", value: formatPercent(kpi?.平均毛利率), description: "毛利總額 / 銷售總額", trend: "比率", icon: Percent, tone: "purple" },
    { title: "異常資料筆數", value: formatNumber(kpi?.異常資料筆數), description: "日期或數值轉換異常", trend: kpi?.異常資料筆數 > 0 ? "需確認" : "正常", icon: AlertTriangle, tone: kpi?.異常資料筆數 > 0 ? "rose" : "emerald" }
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-950">KPI 摘要</h2>
        <p className="text-sm text-slate-500">清理結果、資料品質與金額指標總覽。</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => <KpiCard key={card.title} {...card} />)}
      </div>
    </section>
  );
}
