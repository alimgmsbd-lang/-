// Bengali digits map
const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export const bnNum = (n: number | string): string => {
  if (n === null || n === undefined || isNaN(Number(n))) {
    return '০';
  }
  // Convert standard number to string
  const numStr = typeof n === 'number' ? Math.round(n).toString() : n.toString();
  return numStr.replace(/\d/g, (d) => bengaliDigits[parseInt(d, 10)] || d);
};

export const formatMoney = (n: number): string => {
  const abs = Math.abs(Math.round(n));
  const formatted = abs.toLocaleString('en-IN');
  const bnFormatted = formatted.replace(/\d/g, (d) => bengaliDigits[parseInt(d, 10)] || d);
  return `${bnFormatted}৳`;
};

export const bengaliMonths = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export const getTodayBengaliDate = (): string => {
  const d = new Date();
  const day = bnNum(d.getDate());
  const month = bengaliMonths[d.getMonth()];
  const year = bnNum(d.getFullYear());
  return `${day} ${month}, ${year}`;
};

export const formatDateToBengali = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = bnNum(d.getDate());
    const month = bengaliMonths[d.getMonth()];
    const year = bnNum(d.getFullYear());
    return `${day} ${month}, ${year}`;
  } catch {
    return dateStr;
  }
};

export const quotesList = [
  'টাকার যত্ন নিন, টাকা আপনার যত্ন নেবে।',
  'আয় বুঝে ব্যয় করুন, সঞ্চয়ে সমৃদ্ধি আনুন।',
  'ঋণমুক্ত জীবন সবচেয়ে বড় প্রশান্তির জীবন।',
  'ছোট ছোট সঞ্চয় ভবিষ্যতে বড় বিপদে সহায় হয়।',
  'অপ্রয়োজনীয় খরচ পরিহার করাই বুদ্ধিমানের কাজ।',
  'নিয়মিত হিসাব রাখলে পরিবারের ভবিষ্যৎ নিরাপদ থাকে।'
];

export const incomeCategories = ['বেতন', 'ব্যবসা', 'বোনাস', 'ভাড়া প্রাপ্তি', 'বিনিয়োগ', 'অন্যান্য'];

export const expenseCategories = [
  'বাজার খরচ',
  'যাতায়াত',
  'খাবার ও রেস্তোরাঁ',
  'বাসা ভাড়া',
  'বিদ্যুৎ বিল',
  'গ্যাস বিল',
  'পানি ও ওয়াইফাই বিল',
  'চিকিৎসা ও ওষুধ',
  'কেনাকাটা ও পোশাক',
  'সন্তানের পড়াশোনা',
  'পরিবার বাবদ',
  'কিস্তি ও ঋণ',
  'অন্যান্য'
];
