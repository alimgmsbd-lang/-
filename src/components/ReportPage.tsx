import React, { useState } from 'react';
import {
  Download,
  Printer,
  FileSpreadsheet,
  Copy,
  Check,
  PieChart,
  Calendar,
  FileText,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Database,
  Share2,
  Smartphone,
  Eye,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Transaction, MarketList, DebtPerson, BillPayment, Budget } from '../types';
import { bnNum, formatMoney, getTodayBengaliDate } from '../utils/bengali';
import {
  downloadReportPdf,
  generateReportPdfBlob,
  sharePdfFile,
  openPdfInNewTab,
  exportToCSV,
  generateTextSummary,
  printOrSaveAsPdf,
  ReportData,
} from '../utils/pdfGenerator';
import { Language, formatMoneyByLang, translations } from '../utils/i18n';

interface ReportPageProps {
  transactions: Transaction[];
  marketLists: MarketList[];
  debtPeople: DebtPerson[];
  billPayments: BillPayment[];
  budgets: Budget[];
  userName: string;
  activePeriodName: string;
  lang?: Language;
  onOpenIncomeDetails: () => void;
  onOpenExpenseDetails: () => void;
  onOpenMarketDetails: () => void;
  onOpenPaymentReport: () => void;
  onExportAppBackup?: () => void;
}

export const ReportPage: React.FC<ReportPageProps> = ({
  transactions,
  marketLists,
  debtPeople,
  billPayments,
  budgets,
  userName,
  activePeriodName,
  lang = 'bn',
  onOpenIncomeDetails,
  onOpenExpenseDetails,
  onOpenMarketDetails,
  onOpenPaymentReport,
  onExportAppBackup,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'summary' | 'chart' | 'full_statement'>('summary');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isExportGuideOpen, setIsExportGuideOpen] = useState(false);

  // Calculations
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const transExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const marketExpense = marketLists.reduce((sum, m) => sum + m.total, 0);
  const totalExpense = transExpense + marketExpense;
  const netSavings = totalIncome - totalExpense;

  const totalDebtGiven = debtPeople
    .filter((p) => p.dir === 'give')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDebtTaken = debtPeople
    .filter((p) => p.dir === 'take')
    .reduce((sum, p) => sum + p.amount, 0);

  const reportData: ReportData = {
    periodName: activePeriodName || 'বর্তমান মাস',
    userName: userName || 'ব্যবহারকারী',
    generatedDate: getTodayBengaliDate(),
    totalIncome,
    totalExpense,
    netSavings,
    totalDebtGiven,
    totalDebtTaken,
    transactions,
    marketLists,
    debtPeople,
    billPayments,
    budgets,
  };

  // Group expenses by category
  const expenseByCategory: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });
  if (marketExpense > 0) {
    expenseByCategory['বাজার খরচ'] = (expenseByCategory['বাজার খরচ'] || 0) + marketExpense;
  }

  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const getOrGenerateBlob = async (): Promise<Blob> => {
    if (pdfBlob) return pdfBlob;
    const { blob } = await generateReportPdfBlob(reportData);
    setPdfBlob(blob);
    return blob;
  };

  // Handle PDF Download (100% Reliable, works on installed Android apps & browsers)
  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    setDownloadStatus('পিডিএফ তৈরি হচ্ছে... অনুগ্রহ করে অপেক্ষা করুন');
    try {
      const fileName = `হিসাব_খাতা_রিপোর্ট_${(activePeriodName || 'বর্তমান').replace(/\s+/g, '_')}.pdf`;
      const result = await downloadReportPdf(reportData, fileName);
      if (result.blob) {
        setPdfBlob(result.blob);
      }
      if (result.success) {
        if (result.method === 'share') {
          setDownloadStatus('✅ মোবাইলের সেভ / শেয়ার অপশন খোলা হয়েছে! Drive বা Files-এ সেভ করুন।');
        } else {
          setDownloadStatus('✅ পিডিএফ ডাউনলোডের অনুরোধ সম্পন্ন হয়েছে! ফাইলটি চেক করুন।');
        }
      } else {
        setDownloadStatus('⚠️ সাধারণ প্রিন্ট ভিউয়ার খোলা হয়েছে। নিচের অন্যান্য অপশনও ব্যবহার করতে পারেন।');
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      setDownloadStatus('⚠️ ব্রাউজারের প্রিন্ট ডায়লগ ওপেন করা হয়েছে');
      printOrSaveAsPdf();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Handle Native Mobile Share / Save to Drive & Files
  const handleShareMobile = async () => {
    setIsDownloadingPdf(true);
    setDownloadStatus('মোবাইলে সেভের জন্য প্রস্তুত হচ্ছে...');
    try {
      const blob = await getOrGenerateBlob();
      const fileName = `হিসাব_খাতা_রিপোর্ট_${(activePeriodName || 'বর্তমান').replace(/\s+/g, '_')}.pdf`;
      const shared = await sharePdfFile(blob, fileName, `হিসাব খাতা রিপোর্ট - ${activePeriodName}`);
      if (shared) {
        setDownloadStatus('✅ সফলভাবে শেয়ার / সেভ সম্পন্ন হয়েছে!');
      } else {
        // Direct download fallback
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (link.parentNode) link.parentNode.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 2000);
        setDownloadStatus('✅ ফাইল সরাসরি ডাউনলোড করা হয়েছে!');
      }
    } catch (err) {
      console.error(err);
      printOrSaveAsPdf();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Handle View in new tab / window
  const handleViewPdf = async () => {
    setIsDownloadingPdf(true);
    setDownloadStatus('পিডিএফ ওপেন করা হচ্ছে...');
    try {
      const blob = await getOrGenerateBlob();
      openPdfInNewTab(blob);
      setDownloadStatus('✅ নতুন উইন্ডোতে পিডিএফ ওপেন করা হয়েছে!');
    } catch (err) {
      console.error(err);
      printOrSaveAsPdf();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Handle Copy
  const handleCopySummary = () => {
    const text = generateTextSummary(reportData);
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  // Chart data calculations
  const totalBasis = totalIncome > 0 ? totalIncome : totalExpense || 1;
  const expensePct = Math.min(Math.round((totalExpense / totalBasis) * 100), 100);
  const savingsPct = totalIncome > totalExpense ? Math.round((netSavings / totalBasis) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shadow-xs">
        <div>
          <h1 className="font-bold text-lg">হিসাব রিপোর্ট ও বিবরণী</h1>
          <p className="text-xs text-stone-500">
            {activePeriodName || 'বর্তমান মাস'} • আর্থিক চিত্র
          </p>
        </div>

        {/* PROMINENT REPORT DOWNLOAD & PDF SAVE BUTTON */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExportGuideOpen(true)}
            className="p-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 transition"
            title="অ্যাপ এক্সপোর্ট করার নিয়ম"
          >
            <HelpCircle className="w-4 h-4 text-emerald-600" />
          </button>
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 active:scale-95 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>রিপোর্ট ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-3 pb-2">
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-200/80 dark:bg-stone-800/80 rounded-2xl">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'summary'
                ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>মাসিক হিসাব</span>
          </button>
          <button
            onClick={() => setActiveTab('chart')}
            className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'chart'
                ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>চার্ট বিশ্লেষণ</span>
          </button>
          <button
            onClick={() => setActiveTab('full_statement')}
            className={`flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'full_statement'
                ? 'bg-white dark:bg-stone-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-stone-600 dark:text-stone-400'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>পূর্ণ বিবরণী</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Net Savings Box */}
            <div className="bg-gradient-to-br from-emerald-500/15 via-emerald-600/10 to-teal-500/15 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-300/80 dark:border-emerald-800 rounded-3xl p-5 text-center shadow-xs">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                নেট সঞ্চয় / চলতি উদ্বৃত্ত
              </span>
              <div
                className={`text-3xl font-extrabold mt-1 tracking-tight ${
                  netSavings >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatMoney(netSavings)}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                {netSavings >= 0
                  ? 'অভিনন্দন! আপনার ব্যয়ের তুলনায় সঞ্চয় ইতিবাচক রয়েছে।'
                  : 'সতর্কতা: বর্তমান মাসে আয়ের চেয়ে ব্যয় বেশি হয়েছে।'}
              </p>
            </div>

            {/* Income Card (Clickable for full details) */}
            <div
              onClick={onOpenIncomeDetails}
              className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-emerald-200 dark:border-emerald-900/60 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-500 hover:shadow-sm transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-stone-800 dark:text-stone-100">
                    মোট আয় (বিস্তারিত দেখুন)
                  </div>
                  <div className="text-xs text-stone-500">
                    {bnNum(transactions.filter((t) => t.type === 'income').length)} টি আয়ের এন্ট্রি
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                  +{formatMoney(totalIncome)}
                </span>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* Expense Card (Clickable for full details) */}
            <div
              onClick={onOpenExpenseDetails}
              className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-rose-200 dark:border-rose-900/60 shadow-xs flex items-center justify-between cursor-pointer hover:border-rose-500 hover:shadow-sm transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-stone-800 dark:text-stone-100">
                    মোট ব্যয় (বিস্তারিত দেখুন)
                  </div>
                  <div className="text-xs text-stone-500">
                    আয়-ব্যয় খরচ ও বাজার কেনাকাটা সহ
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-rose-600 dark:text-rose-400">
                  -{formatMoney(totalExpense)}
                </span>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition" />
              </div>
            </div>

            {/* Market & Shop Breakdown Shortcuts */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={onOpenMarketDetails}
                className="p-3.5 bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-left hover:border-amber-400 transition shadow-2xs group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    {formatMoney(marketExpense)}
                  </span>
                </div>
                <div className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  বাজার রিপোর্ট
                </div>
                <div className="text-[11px] text-stone-400">তারিখভিত্তিক বাজার খরচ</div>
              </button>

              <button
                onClick={onOpenPaymentReport}
                className="p-3.5 bg-white dark:bg-stone-900 border border-sky-200 dark:border-sky-900/60 rounded-2xl text-left hover:border-sky-400 transition shadow-2xs group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <Wallet className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                    {formatMoney(totalDebtTaken)}
                  </span>
                </div>
                <div className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  দোকান বাকি ও দেনা
                </div>
                <div className="text-[11px] text-stone-400">পরিশোধ ও বকেয়া হিসাব</div>
              </button>
            </div>

            {/* Direct 1-Click PDF Download Banner */}
            <div className="mt-4 p-4 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md flex items-center justify-between">
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  ১-ক্লিকে পিডিএফ ডাউনলোড
                </div>
                <p className="text-[11px] text-emerald-100/90 mt-0.5">
                  সম্পূর্ণ বিবরণী সহ সরাসরি .pdf ফাইল পান
                </p>
              </div>
              <button
                onClick={() => {
                  setIsDownloadModalOpen(true);
                  handleDownloadPdf();
                }}
                disabled={isDownloadingPdf}
                className="px-3.5 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs shadow-xs hover:bg-emerald-50 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
              >
                {isDownloadingPdf ? (
                  <div className="w-3.5 h-3.5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>{isDownloadingPdf ? 'তৈরি হচ্ছে...' : 'পিডিএফ নিন'}</span>
              </button>
            </div>
          </div>
        )}

        {/* CHART TAB */}
        {activeTab === 'chart' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Visual breakdown donut representation */}
            <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
              <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100 mb-3 text-center">
                আয় বনাম ব্যয় ও সঞ্চয়ের অনুপাত
              </h3>

              <div className="flex items-center justify-center my-4">
                <div className="relative w-44 h-44 rounded-full flex items-center justify-center shadow-inner">
                  <div
                    className="w-full h-full rounded-full transition-all duration-500"
                    style={{
                      background: `conic-gradient(#e11d48 0% ${expensePct}%, #10b981 ${expensePct}% 100%)`,
                    }}
                  />
                  <div className="absolute w-28 h-28 rounded-full bg-white dark:bg-stone-900 flex flex-col items-center justify-center shadow-xs">
                    <span className="text-[11px] text-stone-400">মোট সঞ্চয়</span>
                    <span className="font-bold text-base text-emerald-600">
                      {bnNum(savingsPct)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-6 mt-4 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-rose-600" />
                  <span>ব্যয় ({bnNum(expensePct)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                  <span>সঞ্চয় ({bnNum(savingsPct)}%)</span>
                </div>
              </div>
            </div>

            {/* Category Breakdown Bars */}
            <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs">
              <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100 mb-3">
                খাতভিত্তিক ব্যয়ের হিসাব
              </h3>

              {Object.keys(expenseByCategory).length === 0 ? (
                <div className="text-center py-6 text-stone-400 text-xs">
                  কোনো ব্যয়ের রেকর্ড নেই
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(expenseByCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, amt]) => {
                      const pct = Math.min(
                        Math.round((amt / (totalExpense || 1)) * 100),
                        100
                      );
                      return (
                        <div key={cat}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-stone-700 dark:text-stone-300">
                              {cat}
                            </span>
                            <span className="font-bold text-stone-800 dark:text-stone-200">
                              {formatMoney(amt)} ({bnNum(pct)}%)
                            </span>
                          </div>
                          <div className="w-full bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-600 h-full rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FULL STATEMENT TAB */}
        {activeTab === 'full_statement' && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs text-stone-500">
                এই বিবরণীটি হুবহু নিচের বাটনে ক্লিক করে PDF হিসেবে সংরক্ষণ করতে পারেন
              </span>
              <button
                onClick={() => {
                  setIsDownloadModalOpen(true);
                  handleDownloadPdf();
                }}
                disabled={isDownloadingPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>পিডিএফ ডাউনলোড</span>
              </button>
            </div>

            {/* Printable Report Container */}
            <div
              id="full-printable-report-area"
              className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm text-stone-900"
            >
              {/* Report Header */}
              <div className="text-center border-b-2 border-emerald-600 pb-4 mb-4">
                <div className="inline-block bg-emerald-50 text-emerald-800 text-[11px] font-bold px-3 py-0.5 rounded-full mb-1">
                  অফিসিয়াল আর্থিক বিবরণী
                </div>
                <h2 className="text-2xl font-bold text-emerald-800">হিসাব খাতা - মাসিক রিপোর্ট</h2>
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-stone-600 mt-2">
                  <span>
                    <strong>সময়কাল:</strong> {activePeriodName || 'চলমান মাস'}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>হিসাবাধিকারী:</strong> {userName || 'ব্যবহারকারী'}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>প্রস্তুতির তারিখ:</strong> {getTodayBengaliDate()}
                  </span>
                </div>
              </div>

              {/* Summary 3-Box */}
              <div className="grid grid-cols-3 gap-2 mb-5 text-center">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[11px] text-emerald-700 font-semibold">সর্বমোট আয়</div>
                  <div className="text-base font-bold text-emerald-800 mt-0.5">
                    {formatMoney(totalIncome)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="text-[11px] text-rose-700 font-semibold">সর্বমোট ব্যয়</div>
                  <div className="text-base font-bold text-rose-800 mt-0.5">
                    {formatMoney(totalExpense)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[11px] text-amber-700 font-semibold">নেট সঞ্চয়</div>
                  <div className="text-base font-bold text-amber-800 mt-0.5">
                    {formatMoney(netSavings)}
                  </div>
                </div>
              </div>

              {/* Income Table */}
              <div className="mb-5">
                <div className="text-xs font-bold text-emerald-800 bg-emerald-100/70 px-3 py-1.5 rounded-t-lg border border-emerald-200">
                  ১. আয়ের বিবরণী
                </div>
                <table className="w-full text-xs border border-t-0 border-stone-200">
                  <thead className="bg-stone-50 font-semibold text-stone-700">
                    <tr>
                      <th className="p-2 text-left border-b border-stone-200">তারিখ</th>
                      <th className="p-2 text-left border-b border-stone-200">খাত</th>
                      <th className="p-2 text-left border-b border-stone-200">বিবরণ</th>
                      <th className="p-2 text-right border-b border-stone-200">টাকা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.filter((t) => t.type === 'income').length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-2 text-center text-stone-400">
                          কোনো আয়ের রেকর্ড নেই
                        </td>
                      </tr>
                    ) : (
                      transactions
                        .filter((t) => t.type === 'income')
                        .map((t) => (
                          <tr key={t.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                            <td className="p-2 text-stone-600">{t.date}</td>
                            <td className="p-2 font-medium">{t.category}</td>
                            <td className="p-2 text-stone-500">{t.desc || '-'}</td>
                            <td className="p-2 text-right font-bold text-emerald-700">
                              {formatMoney(t.amount)}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                  <tfoot className="bg-emerald-50/50 font-bold">
                    <tr>
                      <td colSpan={3} className="p-2 text-right text-stone-700">
                        মোট আয়:
                      </td>
                      <td className="p-2 text-right text-emerald-800">
                        {formatMoney(totalIncome)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Expense Table */}
              <div className="mb-5">
                <div className="text-xs font-bold text-rose-800 bg-rose-100/70 px-3 py-1.5 rounded-t-lg border border-rose-200">
                  ২. ব্যয়ের বিবরণী
                </div>
                <table className="w-full text-xs border border-t-0 border-stone-200">
                  <thead className="bg-stone-50 font-semibold text-stone-700">
                    <tr>
                      <th className="p-2 text-left border-b border-stone-200">তারিখ</th>
                      <th className="p-2 text-left border-b border-stone-200">খাত / দোকান</th>
                      <th className="p-2 text-left border-b border-stone-200">বিবরণ / পণ্য</th>
                      <th className="p-2 text-right border-b border-stone-200">টাকা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.filter((t) => t.type === 'expense').length === 0 &&
                    marketLists.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-2 text-center text-stone-400">
                          কোনো ব্যয়ের রেকর্ড নেই
                        </td>
                      </tr>
                    ) : (
                      <>
                        {transactions
                          .filter((t) => t.type === 'expense')
                          .map((t) => (
                            <tr key={t.id} className="border-b border-stone-100">
                              <td className="p-2 text-stone-600">{t.date}</td>
                              <td className="p-2 font-medium">{t.category}</td>
                              <td className="p-2 text-stone-500">{t.desc || '-'}</td>
                              <td className="p-2 text-right font-bold text-rose-700">
                                {formatMoney(t.amount)}
                              </td>
                            </tr>
                          ))}
                        {marketLists.map((m) => (
                          <tr key={`m-${m.id}`} className="border-b border-stone-100 bg-amber-50/20">
                            <td className="p-2 text-stone-600">{m.date}</td>
                            <td className="p-2 font-medium">বাজার: {m.shop}</td>
                            <td className="p-2 text-stone-500">
                              {m.items.map((i) => i.name).join(', ') || 'বিবিধ'}
                            </td>
                            <td className="p-2 text-right font-bold text-rose-700">
                              {formatMoney(m.total)}
                            </td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                  <tfoot className="bg-rose-50/50 font-bold">
                    <tr>
                      <td colSpan={3} className="p-2 text-right text-stone-700">
                        মোট ব্যয়:
                      </td>
                      <td className="p-2 text-right text-rose-800">
                        {formatMoney(totalExpense)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Debt & Dues Table */}
              <div className="mb-6">
                <div className="text-xs font-bold text-stone-800 bg-stone-100 px-3 py-1.5 rounded-t-lg border border-stone-200">
                  ৩. দেনা - পাওনা সারসংক্ষেপ
                </div>
                <table className="w-full text-xs border border-t-0 border-stone-200">
                  <thead className="bg-stone-50 font-semibold text-stone-700">
                    <tr>
                      <th className="p-2 text-left border-b border-stone-200">ব্যক্তি / পক্ষ</th>
                      <th className="p-2 text-left border-b border-stone-200">অবস্থা</th>
                      <th className="p-2 text-right border-b border-stone-200">পরিমাণ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debtPeople.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-2 text-center text-stone-400">
                          কোনো দেনা বা পাওনা নেই
                        </td>
                      </tr>
                    ) : (
                      debtPeople.map((p) => (
                        <tr key={p.id} className="border-b border-stone-100">
                          <td className="p-2 font-medium">{p.name}</td>
                          <td className="p-2 text-stone-600">
                            {p.dir === 'give' ? 'আমি পাবো (পাওনা)' : 'সে পাবে (দেনা)'}
                          </td>
                          <td
                            className={`p-2 text-right font-bold ${
                              p.dir === 'give' ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {formatMoney(p.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Signature and Verification Footer */}
              <div className="pt-6 border-t border-stone-200 flex justify-between items-end text-xs text-stone-500">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    হিসাব খাতা ডিজিটাল সিস্টেম দ্বারা প্রস্তুতকৃত
                  </div>
                  <div className="text-[11px]">তারিখ ও সময়: {new Date().toLocaleString('bn-BD')}</div>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-stone-400 mb-1" />
                  <div className="text-[11px] font-medium text-stone-600">হিসাবাধিকারীর স্বাক্ষর</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DOWNLOAD / PDF SAVE MODAL */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-6 border border-stone-200 dark:border-stone-800 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                    রিপোর্ট ডাউনলোড ও সেভ
                  </h3>
                  <p className="text-xs text-stone-500">
                    {activePeriodName || 'বর্তমান মাস'} • আর্থিক বিবরণী সংরক্ষণ
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsDownloadModalOpen(false);
                  setDownloadStatus(null);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Summary Pill */}
            <div className="grid grid-cols-3 gap-2 p-2.5 mb-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 text-center text-xs">
              <div>
                <span className="text-[10px] text-stone-500">মোট আয়</span>
                <div className="font-bold text-emerald-600 mt-0.5">+{formatMoney(totalIncome)}</div>
              </div>
              <div>
                <span className="text-[10px] text-stone-500">মোট ব্যয়</span>
                <div className="font-bold text-rose-600 mt-0.5">-{formatMoney(totalExpense)}</div>
              </div>
              <div>
                <span className="text-[10px] text-stone-500">নেট সঞ্চয়</span>
                <div className="font-bold text-sky-600 mt-0.5">{formatMoney(netSavings)}</div>
              </div>
            </div>

            {/* Status message banner */}
            {downloadStatus && (
              <div
                className={`p-3 rounded-2xl mb-3.5 text-xs font-semibold flex items-center gap-2 ${
                  downloadStatus.includes('✅')
                    ? 'bg-emerald-100/90 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                    : downloadStatus.includes('⚠️')
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                    : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                }`}
              >
                {downloadStatus.includes('✅') ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : downloadStatus.includes('⚠️') ? (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                )}
                <span>{downloadStatus}</span>
              </div>
            )}

            <div className="space-y-2.5">
              {/* Option 1: Mobile Share / Save to Drive & Files (FEATURED FOR ANDROID APP & MOBILE) */}
              <button
                onClick={handleShareMobile}
                disabled={isDownloadingPdf}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-700 hover:to-teal-800 flex items-center justify-between text-left transition group cursor-pointer shadow-md shadow-emerald-700/20 active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
                    {isDownloadingPdf ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Share2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm">ফোনে সেভ বা শেয়ার করুন</span>
                      <span className="bg-amber-300 text-stone-900 font-extrabold text-[9px] px-1.5 py-0.5 rounded-md">
                        মোবাইলে সেরা
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-100/95 mt-0.5">
                      Google Drive, Files বা WhatsApp-এ সরাসরি সেভ ও পাঠান
                    </div>
                  </div>
                </div>
                <Smartphone className="w-5 h-5 text-emerald-200 group-hover:scale-110 transition shrink-0" />
              </button>

              {/* Option 2: Direct PDF Download */}
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="w-full p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-100">
                      সরাসরি ডাউনলোড (.pdf ফাইল)
                    </div>
                    <div className="text-[11px] text-stone-500">
                      ব্রাউজারের ডাউনলোড ফোল্ডারে সেভ করার চেষ্টা করবে
                    </div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-emerald-600 group-hover:translate-y-0.5 transition shrink-0" />
              </button>

              {/* Option 3: View PDF in new tab */}
              <button
                onClick={handleViewPdf}
                disabled={isDownloadingPdf}
                className="w-full p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-100">
                      পিডিএফ ওপেন করে সরাসরি দেখুন
                    </div>
                    <div className="text-[11px] text-stone-500">
                      ডাউনলোডের আগেই ফোনে পুরো রিপোর্টটি পড়ে নিন
                    </div>
                  </div>
                </div>
                <Eye className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition shrink-0" />
              </button>

              {/* Option 4: Print or Save as PDF via Browser */}
              <button
                onClick={() => {
                  setActiveTab('full_statement');
                  setIsDownloadModalOpen(false);
                  setTimeout(() => {
                    printOrSaveAsPdf();
                  }, 300);
                }}
                className="w-full p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
                    <Printer className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-100">
                      প্রিন্ট / 'Save as PDF' অপশন
                    </div>
                    <div className="text-[11px] text-stone-500">
                      সিস্টেম প্রিন্ট ডায়লগের মাধ্যমে সেভ করুন
                    </div>
                  </div>
                </div>
                <Printer className="w-4 h-4 text-sky-600 group-hover:scale-110 transition shrink-0" />
              </button>

              {/* Option 5: Excel / CSV Download */}
              <button
                onClick={async () => {
                  setDownloadStatus('এক্সেল (CSV) ফাইল তৈরি হচ্ছে...');
                  const res = await exportToCSV(reportData, `হিসাব_খাতা_${(activePeriodName || 'চলমান').replace(/\s+/g, '_')}.csv`);
                  if (res.success) {
                    setDownloadStatus('✅ এক্সেল (CSV) ফাইল প্রস্তুত ও ডাউনলোড সম্পন্ন হয়েছে!');
                  }
                }}
                className="w-full p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-100">
                      এক্সেল / CSV রিপোর্ট ডাউনলোড
                    </div>
                    <div className="text-[11px] text-stone-500">
                      স্প্রেডশীট ও এক্সেলে টেবিল আকারে খোলার ফাইল
                    </div>
                  </div>
                </div>
                <FileSpreadsheet className="w-4 h-4 text-teal-600 group-hover:translate-y-0.5 transition shrink-0" />
              </button>

              {/* Option 6: Full App Data Backup */}
              {onExportAppBackup && (
                <button
                  onClick={() => {
                    onExportAppBackup();
                    setDownloadStatus('✅ সম্পূর্ণ অ্যাপের ব্যাকআপ ফাইল ডাউনলোড হয়েছে!');
                  }}
                  className="w-full p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 flex items-center justify-between text-left transition group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-100">
                        সম্পূর্ণ অ্যাপ ব্যাকআপ (.json)
                      </div>
                      <div className="text-[11px] text-stone-500">
                        সকল হিসাব, বাজার ও দেনা-পাওনার ব্যাকআপ
                      </div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-amber-600 group-hover:translate-y-0.5 transition shrink-0" />
                </button>
              )}

              {/* Option 7: Copy Text Summary */}
              <button
                onClick={handleCopySummary}
                className="w-full p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-between text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-stone-600 text-white flex items-center justify-center shrink-0">
                    {copiedSuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-100">
                      {copiedSuccess ? 'সারসংক্ষেপ কপি হয়েছে!' : 'হোয়াটসঅ্যাপের জন্য সারসংক্ষেপ কপি'}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      হোয়াটসঅ্যাপ বা মেসেঞ্জারে কাউকে পাঠানোর উপযোগী টেক্সট
                    </div>
                  </div>
                </div>
                <Copy className="w-4 h-4 text-stone-500 shrink-0" />
              </button>
            </div>

            {/* Helpful Notice for Installed App Users */}
            <div className="mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
              <span className="font-bold">📱 মোবাইল অ্যাপ ব্যবহারকারীদের জন্য টিপস:</span>
              <p className="mt-0.5 text-stone-600 dark:text-stone-300">
                আপনি যদি অ্যাপটি মোবাইলে ইনস্টল করে ব্যবহার করেন, তবে সরাসরি ডাউনলোড হতে সমস্যা হলে সবার উপরের{' '}
                <strong className="text-emerald-700 dark:text-emerald-400">"ফোনে সেভ বা শেয়ার করুন"</strong> বাটনে চাপ দিন। এতে সাথে সাথে আপনার ফোনের <em>Google Drive</em>, <em>Files</em> বা <em>WhatsApp</em>-এ নিরাপদে ফাইলটি সেভ করতে পারবেন।
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800">
              <button
                onClick={() => {
                  setIsDownloadModalOpen(false);
                  setDownloadStatus(null);
                }}
                className="w-full py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT & INSTALL APP GUIDE MODAL */}
      {isExportGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base">অ্যাপ এক্সপোর্ট ও ইনস্টল গাইড</h3>
              </div>
              <button
                onClick={() => setIsExportGuideOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm mb-1">
                  ১. ফোনে অ্যাপ হিসেবে ইনস্টল করা (Install on Phone)
                </h4>
                <p>
                  আপনার ফোনের ক্রোম (Chrome) ব্রাউজারে ৩-ডট মেনুতে চাপ দিয়ে <strong>"Add to Home screen"</strong> অথবা <strong>"Install app"</strong> চাপুন। তাহলে ফেসবুক বা বিকাশ অ্যাপের মতো আপনার ফোনের স্ক্রিনে অ্যাপ আইকন চলে আসবে!
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <h4 className="font-bold text-amber-800 dark:text-amber-300 text-sm mb-1">
                  ২. সম্পূর্ণ হিসাব ব্যাকআপ ও এক্সপোর্ট (Data Backup)
                </h4>
                <p>
                  প্রোফাইল পেজে গিয়ে <strong>"সম্পূর্ণ ডাটা ব্যাকআপ ডাউনলোড"</strong> বাটনে ক্লিক করলে আপনার সকল হিসাবের একটি সুরক্ষিত <code>.json</code> ফাইল আপনার মোবাইলে বা কম্পিউটারে সংরক্ষিত থাকবে।
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800">
                <h4 className="font-bold text-sky-800 dark:text-sky-300 text-sm mb-1">
                  ৩. অন্য ডিভাইসে ট্রান্সফার বা রিস্টোর
                </h4>
                <p>
                  ফোন পরিবর্তন করলেও সংরক্ষিত ব্যাকআপ ফাইলটি <strong>"ব্যাকআপ আপলোড"</strong> অপশন দিয়ে সাথে সাথে ফিরিয়ে আনতে পারবেন।
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsExportGuideOpen(false)}
              className="w-full mt-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
            >
              বুঝেছি
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
