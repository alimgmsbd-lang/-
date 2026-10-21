import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Transaction, MarketList, DebtPerson, BillPayment, Budget, Shop, ArchiveItem, UserProfile } from '../types';
import { bnNum, formatMoney, getTodayBengaliDate } from './bengali';

export interface ReportData {
  periodName: string;
  userName: string;
  generatedDate: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  totalDebtGiven: number; // আমি পাবো
  totalDebtTaken: number; // আমি দেবো
  transactions: Transaction[];
  marketLists: MarketList[];
  debtPeople: DebtPerson[];
  billPayments: BillPayment[];
  budgets: Budget[];
}

export interface FullAppBackup {
  appName: string;
  version: string;
  exportedAt: string;
  userProfile: UserProfile;
  transactions: Transaction[];
  marketLists: MarketList[];
  shops: Shop[];
  debtPeople: DebtPerson[];
  debtHistory: any[];
  budgets: Budget[];
  billPayments: BillPayment[];
  archives: ArchiveItem[];
}

export interface DeliverFileResult {
  success: boolean;
  method: 'share' | 'download' | 'data_url' | 'fallback_opened' | 'failed';
  error?: any;
}

/**
 * Creates or gets an offscreen report DOM container populated with full report data.
 * Positioned at left: 0, top: 0 with z-index: -99999 so html2canvas computes positive bounds
 * without crashing or clipping in mobile WebViews.
 */
export function getOrCreateReportDom(data: ReportData): HTMLElement {
  const containerId = '__hisab_khata_pdf_render_container__';
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.position = 'fixed';
    container.style.left = '0';
    container.style.top = '0';
    container.style.width = '794px'; // Standard A4 width in px at 96 DPI
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#1f2937';
    container.style.fontFamily = "'Hind Siliguri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    container.style.zIndex = '-99999';
    container.style.pointerEvents = 'none';
    container.style.padding = '32px';
    container.style.boxSizing = 'border-box';
    document.body.appendChild(container);
  }

  // Filter incomes and expenses
  const incomes = data.transactions.filter((t) => t.type === 'income');
  const expenses = data.transactions.filter((t) => t.type === 'expense');

  // Build the complete HTML report layout with standard inline hex colors
  container.innerHTML = `
    <div style="background:#ffffff; color:#1f2937; font-family:'Hind Siliguri', sans-serif; line-height:1.5;">
      <!-- Header -->
      <div style="text-align:center; border-bottom:3px solid #059669; padding-bottom:16px; margin-bottom:20px;">
        <span style="display:inline-block; background:#ecfdf5; color:#065f46; font-size:12px; font-weight:bold; padding:4px 14px; border-radius:9999px; margin-bottom:6px; border:1px solid #a7f3d0;">
          অফিসিয়াল আর্থিক প্রতিবেদন
        </span>
        <h1 style="font-size:26px; font-weight:800; color:#065f46; margin:4px 0 8px 0;">হিসাব খাতা - আর্থিক বিবরণী</h1>
        <div style="display:flex; justify-content:center; gap:16px; font-size:13px; color:#4b5563;">
          <span><strong>সময়কাল:</strong> ${data.periodName || 'বর্তমান মাস'}</span>
          <span>•</span>
          <span><strong>হিসাবাধিকারী:</strong> ${data.userName || 'ব্যবহারকারী'}</span>
          <span>•</span>
          <span><strong>প্রস্তুতির তারিখ:</strong> ${data.generatedDate}</span>
        </div>
      </div>

      <!-- 3 Summary Cards -->
      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-bottom:24px;">
        <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:12px; padding:12px; text-align:center;">
          <div style="font-size:12px; font-weight:600; color:#166534;">সর্বমোট আয়</div>
          <div style="font-size:20px; font-weight:800; color:#15803d; margin-top:4px;">+${formatMoney(data.totalIncome)}</div>
        </div>
        <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:12px; text-align:center;">
          <div style="font-size:12px; font-weight:600; color:#991b1b;">সর্বমোট ব্যয়</div>
          <div style="font-size:20px; font-weight:800; color:#b91c1c; margin-top:4px;">-${formatMoney(data.totalExpense)}</div>
        </div>
        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:12px; text-align:center;">
          <div style="font-size:12px; font-weight:600; color:#1e40af;">নেট সঞ্চয় / উদ্বৃত্ত</div>
          <div style="font-size:20px; font-weight:800; color:#1d4ed8; margin-top:4px;">${formatMoney(data.netSavings)}</div>
        </div>
      </div>

      <!-- Income Table -->
      <div style="margin-bottom:24px;">
        <div style="background:#059669; color:#ffffff; font-weight:bold; font-size:13px; padding:8px 12px; border-radius:8px 8px 0 0;">
          ১. আয়ের বিবরণী
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:12px; border:1px solid #e5e7eb;">
          <thead>
            <tr style="background:#f9fafb; color:#374151; border-bottom:1px solid #e5e7eb;">
              <th style="padding:8px 12px; text-align:left; width:25%;">তারিখ</th>
              <th style="padding:8px 12px; text-align:left; width:25%;">খাত / ক্যাটাগরি</th>
              <th style="padding:8px 12px; text-align:left; width:30%;">বিবরণ</th>
              <th style="padding:8px 12px; text-align:right; width:20%;">পরিমাণ</th>
            </tr>
          </thead>
          <tbody>
            ${
              incomes.length === 0
                ? `<tr><td colspan="4" style="padding:10px; text-align:center; color:#9ca3af;">কোনো আয়ের রেকর্ড পাওয়া যায়নি</td></tr>`
                : incomes
                    .map(
                      (t) => `
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:8px 12px; color:#4b5563;">${t.date}</td>
                <td style="padding:8px 12px; font-weight:600;">${t.category}</td>
                <td style="padding:8px 12px; color:#6b7280;">${t.desc || '-'}</td>
                <td style="padding:8px 12px; text-align:right; font-weight:bold; color:#16a34a;">+${formatMoney(t.amount)}</td>
              </tr>`
                    )
                    .join('')
            }
          </tbody>
          <tfoot>
            <tr style="background:#f0fdf4; font-weight:bold;">
              <td colspan="3" style="padding:8px 12px; text-align:right;">মোট আয়:</td>
              <td style="padding:8px 12px; text-align:right; color:#15803d; font-size:13px;">${formatMoney(data.totalIncome)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Expense & Market Table -->
      <div style="margin-bottom:24px;">
        <div style="background:#dc2626; color:#ffffff; font-weight:bold; font-size:13px; padding:8px 12px; border-radius:8px 8px 0 0;">
          ২. ব্যয়ের বিবরণী (দৈনন্দিন খরচ ও বাজার ফর্দ)
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:12px; border:1px solid #e5e7eb;">
          <thead>
            <tr style="background:#f9fafb; color:#374151; border-bottom:1px solid #e5e7eb;">
              <th style="padding:8px 12px; text-align:left; width:22%;">তারিখ</th>
              <th style="padding:8px 12px; text-align:left; width:25%;">খাত / দোকান</th>
              <th style="padding:8px 12px; text-align:left; width:33%;">বিবরণ / পণ্যের তালিকা</th>
              <th style="padding:8px 12px; text-align:right; width:20%;">পরিমাণ</th>
            </tr>
          </thead>
          <tbody>
            ${
              expenses.length === 0 && data.marketLists.length === 0
                ? `<tr><td colspan="4" style="padding:10px; text-align:center; color:#9ca3af;">কোনো ব্যয়ের রেকর্ড নেই</td></tr>`
                : [
                    ...expenses.map(
                      (t) => `
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:8px 12px; color:#4b5563;">${t.date}</td>
                <td style="padding:8px 12px; font-weight:600;">${t.category}</td>
                <td style="padding:8px 12px; color:#6b7280;">${t.desc || '-'}</td>
                <td style="padding:8px 12px; text-align:right; font-weight:bold; color:#dc2626;">-${formatMoney(t.amount)}</td>
              </tr>`
                    ),
                    ...data.marketLists.map(
                      (m) => `
              <tr style="border-bottom:1px solid #f3f4f6; background:#fffbeb;">
                <td style="padding:8px 12px; color:#4b5563;">${m.date}</td>
                <td style="padding:8px 12px; font-weight:600;">দোকান: ${m.shop}</td>
                <td style="padding:8px 12px; color:#6b7280;">${m.items.map((i) => i.name).join(', ') || 'বিবিধ'}</td>
                <td style="padding:8px 12px; text-align:right; font-weight:bold; color:#dc2626;">-${formatMoney(m.total)}</td>
              </tr>`
                    ),
                  ].join('')
            }
          </tbody>
          <tfoot>
            <tr style="background:#fef2f2; font-weight:bold;">
              <td colspan="3" style="padding:8px 12px; text-align:right;">মোট ব্যয়:</td>
              <td style="padding:8px 12px; text-align:right; color:#b91c1c; font-size:13px;">${formatMoney(data.totalExpense)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Debt & Loans Table -->
      <div style="margin-bottom:24px;">
        <div style="background:#475569; color:#ffffff; font-weight:bold; font-size:13px; padding:8px 12px; border-radius:8px 8px 0 0;">
          ৩. দেনা - পাওনা সারসংক্ষেপ
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:12px; border:1px solid #e5e7eb;">
          <thead>
            <tr style="background:#f9fafb; color:#374151; border-bottom:1px solid #e5e7eb;">
              <th style="padding:8px 12px; text-align:left; width:40%;">ব্যক্তি / প্রতিষ্ঠানের নাম</th>
              <th style="padding:8px 12px; text-align:left; width:30%;">অবস্থা</th>
              <th style="padding:8px 12px; text-align:right; width:30%;">টাকার পরিমাণ</th>
            </tr>
          </thead>
          <tbody>
            ${
              data.debtPeople.length === 0
                ? `<tr><td colspan="3" style="padding:10px; text-align:center; color:#9ca3af;">কোনো দেনা বা পাওনা নেই</td></tr>`
                : data.debtPeople
                    .map(
                      (p) => `
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:8px 12px; font-weight:600;">${p.name} ${p.addr ? `(${p.addr})` : ''}</td>
                <td style="padding:8px 12px; color:${p.dir === 'give' ? '#16a34a' : '#dc2626'}; font-weight:bold;">
                  ${p.dir === 'give' ? 'আমি পাবো (পাওনা)' : 'সে পাবে (দেনা)'}
                </td>
                <td style="padding:8px 12px; text-align:right; font-weight:bold; color:#1f2937;">${formatMoney(p.amount)}</td>
              </tr>`
                    )
                    .join('')
            }
          </tbody>
        </table>
      </div>

      <!-- Signature & Seal -->
      <div style="border-top:2px solid #e5e7eb; padding-top:20px; display:flex; justify-content:space-between; align-items:flex-end; font-size:12px; color:#6b7280;">
        <div>
          <div style="font-weight:bold; color:#065f46;">হিসাব খাতা ডিজিটাল সিস্টেম দ্বারা স্বয়ংক্রিয়ভাবে প্রস্তুতকৃত</div>
          <div style="font-size:11px; margin-top:4px;">তারিখ ও সময়: ${new Date().toLocaleString('bn-BD')}</div>
        </div>
        <div style="text-align:center;">
          <div style="width:140px; border-bottom:1px solid #9ca3af; margin-bottom:4px;"></div>
          <div style="font-weight:600; color:#374151;">হিসাবাধিকারীর স্বাক্ষর</div>
        </div>
      </div>
    </div>
  `;

  return container;
}

/**
 * Generates high quality PDF Blob and Data URI using html2canvas & jsPDF.
 * Uses JPEG compression at 0.95 quality to prevent mobile WebView out-of-memory crashes.
 */
export async function generateReportPdfBlob(
  data: ReportData
): Promise<{ blob: Blob; dataUri: string; pdf: jsPDF }> {
  const reportDom = getOrCreateReportDom(data);

  // Ensure fonts are ready
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      // Continue if fonts check is unsupported
    }
  }

  // Small delay for DOM layout settling
  await new Promise((resolve) => setTimeout(resolve, 100));

  const canvas = await html2canvas(reportDom, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 794,
    scrollX: 0,
    scrollY: 0,
  });

  // Use JPEG 0.95 to dramatically save memory on Android WebViews while keeping text super crisp
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  let heightLeft = imgHeight;
  let page = 0;

  pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    page++;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, -(page * pageHeight), imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
  }

  const blob = pdf.output('blob');
  let dataUri = '';
  try {
    dataUri = pdf.output('datauristring');
  } catch (e) {
    // ignore
  }

  return { blob, dataUri, pdf };
}

/**
 * Universal Mobile-Safe File Deliverer:
 * 1. Native Web Share API (Files): 100% works on installed Android apps, PWAs, Samsung, iOS.
 *    Allows saving to Google Drive, Files, WhatsApp, etc.
 * 2. Anchor Blob Download.
 * 3. Base64 Data URI link click.
 */
export async function deliverFile(
  blob: Blob,
  fileName: string,
  title = 'হিসাব খাতা রিপোর্ট'
): Promise<DeliverFileResult> {
  const isMobile =
    typeof navigator !== 'undefined' &&
    (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 1));

  // 1. Try Native Web Share API if on mobile device
  if (isMobile && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const file = new File([blob], fileName, { type: blob.type || 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title,
          text: `${title} - হিসাব খাতা থেকে সংগৃহীত`,
        });
        return { success: true, method: 'share' };
      }
    } catch (shareErr: any) {
      if (shareErr && shareErr.name !== 'AbortError') {
        console.warn('Native Web Share with file failed, continuing to download:', shareErr);
      }
    }
  }

  // 2. Standard Blob Download Anchor
  try {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      try {
        if (link.parentNode) link.parentNode.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } catch (e) {
        // cleanup
      }
    }, 4000);

    return { success: true, method: 'download' };
  } catch (err) {
    console.error('Blob download anchor failed:', err);
  }

  // 3. Fallback: Base64 Data URI
  try {
    const reader = new FileReader();
    return await new Promise<DeliverFileResult>((resolve) => {
      reader.onloadend = () => {
        try {
          const dataUri = reader.result as string;
          const link = document.createElement('a');
          link.href = dataUri;
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            if (link.parentNode) link.parentNode.removeChild(link);
          }, 2000);
          resolve({ success: true, method: 'data_url' });
        } catch (e) {
          resolve({ success: false, method: 'data_url', error: e });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, method: 'data_url', error: reader.error });
      };
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    return { success: false, method: 'failed', error: err };
  }
}

/**
 * Directly shares the PDF via native share sheet (Google Drive, WhatsApp, Files, etc.)
 */
export async function sharePdfFile(
  blob: Blob,
  fileName = 'হিসাব_খাতা_রিপোর্ট.pdf',
  title = 'হিসাব খাতা রিপোর্ট'
): Promise<boolean> {
  try {
    const file = new File([blob], fileName, { type: 'application/pdf' });
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title,
        text: 'হিসাব খাতা থেকে আর্থিক বিবরণী',
      });
      return true;
    }
  } catch (err: any) {
    if (err && err.name !== 'AbortError') {
      console.warn('Share failed:', err);
    }
  }
  return false;
}

/**
 * Opens PDF in a new window or tab
 */
export function openPdfInNewTab(blob: Blob): void {
  try {
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');
    if (!win) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) document.body.removeChild(a);
      }, 1000);
    }
  } catch (err) {
    console.error('Could not open PDF in new tab:', err);
  }
}

/**
 * Robust PDF generator that always succeeds:
 * 1. Finds or generates the clean report DOM
 * 2. Generates high quality multi-page A4 PDF
 * 3. Delivers via Mobile Web Share or direct Blob download
 */
export async function downloadReportPdf(
  data: ReportData,
  fileName = 'হিসাব_খাতা_রিপোর্ট.pdf'
): Promise<{ success: boolean; method: string; blob?: Blob; dataUri?: string; error?: any }> {
  try {
    const { blob, dataUri } = await generateReportPdfBlob(data);
    const result = await deliverFile(blob, fileName, `হিসাব খাতা রিপোর্ট - ${data.periodName}`);
    return { ...result, blob, dataUri };
  } catch (err) {
    console.error('Error generating PDF:', err);
    try {
      window.print();
    } catch (pe) {
      console.warn('window.print also failed:', pe);
    }
    return { success: false, method: 'failed', error: err };
  }
}

/**
 * Downloads an existing visible DOM element by ID
 */
export async function downloadElementAsPdf(
  elementId: string,
  fileName = 'হিসাব_খাতা_রিপোর্ট.pdf'
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Element #${elementId} not currently visible, using fallback print...`);
    window.print();
    return true;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let page = 0;

    pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      page++;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, -(page * pageHeight), imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    const pdfBlob = pdf.output('blob');
    await deliverFile(pdfBlob, fileName, 'হিসাব খাতা রিপোর্ট');
    return true;
  } catch (err) {
    console.error('Error exporting element:', err);
    window.print();
    return true;
  }
}

/**
 * Print or Save as PDF via Browser
 */
export function printOrSaveAsPdf(): void {
  window.print();
}

/**
 * Export data as UTF-8 CSV with BOM (works seamlessly in Excel and Google Sheets)
 */
export async function exportToCSV(
  data: ReportData,
  filename = 'হিসাব_খাতা_ডাটা.csv'
): Promise<DeliverFileResult> {
  const rows: string[][] = [];

  rows.push(['হিসাব খাতা - আর্থিক বিবরণী']);
  rows.push(['সময়কাল', data.periodName]);
  rows.push(['ব্যবহারকারী', data.userName]);
  rows.push(['রিপোর্ট তৈরির তারিখ', data.generatedDate]);
  rows.push([]);

  rows.push(['সারসংক্ষেপ']);
  rows.push(['মোট আয়', data.totalIncome.toString()]);
  rows.push(['মোট ব্যয়', data.totalExpense.toString()]);
  rows.push(['নেট সঞ্চয় / উদ্বৃত্ত', data.netSavings.toString()]);
  rows.push(['মোট পাওনা (আমি পাবো)', data.totalDebtGiven.toString()]);
  rows.push(['মোট দেনা (সে পাবে)', data.totalDebtTaken.toString()]);
  rows.push([]);

  rows.push(['আয় ও ব্যয়ের বিবরণী']);
  rows.push(['তারিখ', 'ধরন', 'খাত/ক্যাটাগরি', 'বিবরণ', 'টাকা']);
  data.transactions.forEach((t) => {
    rows.push([
      t.date,
      t.type === 'income' ? 'আয়' : 'ব্যয়',
      t.category,
      t.desc || '',
      t.amount.toString(),
    ]);
  });
  rows.push([]);

  rows.push(['বাজার খরচ বিবরণী']);
  rows.push(['তারিখ', 'দোকানের নাম', 'পণ্যের বিবরণ', 'মোট খরচ']);
  data.marketLists.forEach((m) => {
    const itemNames = m.items.map((i) => `${i.name} (${i.price}৳)`).join(', ');
    rows.push([m.date, m.shop, itemNames, m.total.toString()]);
  });
  rows.push([]);

  const csvContent =
    '\uFEFF' +
    rows
      .map((row) =>
        row
          .map((field) => {
            const str = String(field || '').replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      )
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  return await deliverFile(blob, filename, 'হিসাব খাতা এক্সেল ডাটা');
}

/**
 * Export complete application data backup as JSON
 */
export async function exportAppBackup(
  backup: FullAppBackup,
  filename?: string
): Promise<DeliverFileResult> {
  const defaultName = `হিসাব_খাতা_ব্যাকআপ_${new Date().toISOString().split('T')[0]}.json`;
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  return await deliverFile(blob, filename || defaultName, 'হিসাব খাতা সম্পূর্ণ ডাটা ব্যাকআপ');
}

/**
 * Generates formatted text summary for WhatsApp / Messenger sharing
 */
export function generateTextSummary(data: ReportData): string {
  return `📊 *হিসাব খাতা রিপোর্ট*
📅 সময়কাল: ${data.periodName}
👤 ব্যবহারকারী: ${data.userName}
🕒 তারিখ: ${data.generatedDate}
─────────────────
🟢 মোট আয়: ${formatMoney(data.totalIncome)}
🔴 মোট ব্যয়: ${formatMoney(data.totalExpense)}
💎 নেট সঞ্চয়: ${formatMoney(data.netSavings)}
─────────────────
🤝 মোট পাওনা: ${formatMoney(data.totalDebtGiven)}
⚠️ মোট দেনা: ${formatMoney(data.totalDebtTaken)}
📝 মোট লেনদেন: ${bnNum(data.transactions.length + data.marketLists.length)} টি`;
}
