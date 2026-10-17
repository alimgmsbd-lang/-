import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Language, monthsData, formatNumberByLang } from '../utils/i18n';

interface HeaderProps {
  userName: string;
  avatarUrl: string;
  selectedMonthIdx: number;
  selectedYear: number;
  activeArchiveName: string | null;
  lang: Language;
  onProfileClick: () => void;
  onSelectMonth: (monthIdx: number, year: number) => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName,
  avatarUrl,
  selectedMonthIdx,
  selectedYear,
  activeArchiveName,
  lang,
  onProfileClick,
  onSelectMonth,
}) => {
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);

  // Get current active month display name
  const currentMonthItem = monthsData[selectedMonthIdx] || monthsData[0];
  const activeMonthName = lang === 'bn' ? currentMonthItem.bn : currentMonthItem.en;
  const activeYearStr = formatNumberByLang(selectedYear, lang);

  const monthBannerText = activeArchiveName
    ? `${lang === 'bn' ? '📁 সংরক্ষিত:' : '📁 Archived:'} ${activeArchiveName}`
    : `📅 ${lang === 'bn' ? 'মাস:' : 'Month:'} ${activeMonthName} ${activeYearStr}`;

  return (
    <div className="relative">
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white pt-5 pb-12 px-6 rounded-b-[36px] shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-emerald-100/90 tracking-wide">
              {lang === 'bn' ? 'হিসাব খাতা অ্যাপে স্বাগতম' : 'Welcome to Ledger Khata'}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
              {userName || (lang === 'bn' ? 'ব্যবহারকারী' : 'User')}
            </h1>
          </div>
          <button
            onClick={onProfileClick}
            className="w-12 h-12 rounded-full border-2 border-white/60 bg-white/20 overflow-hidden shadow-md active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
            title={lang === 'bn' ? 'প্রোফাইল দেখুন' : 'View Profile'}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
                }}
              />
            ) : (
              <img
                src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            )}
          </button>
        </div>
      </div>

      {/* Month Banner with click-to-change Month feature */}
      <div className="px-5 -mt-4">
        <button
          onClick={() => setIsMonthModalOpen(true)}
          className={`w-full py-1.5 px-4 rounded-xl text-center text-xs font-bold shadow-xs tracking-wide flex items-center justify-center gap-1.5 active:scale-98 transition cursor-pointer ${
            activeArchiveName
              ? 'bg-amber-500 text-stone-900 border border-amber-400'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400/40'
          }`}
          title={lang === 'bn' ? 'মাস পরিবর্তন করতে ক্লিক করুন' : 'Click to change month'}
        >
          <span>{monthBannerText}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-80" />
        </button>
      </div>

      {/* Month Selection Modal */}
      {isMonthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                  {lang === 'bn' ? 'মাসের নাম নির্ধারণ করুন' : 'Select Month'}
                </h3>
              </div>
              <button
                onClick={() => setIsMonthModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-500 mb-3">
              {lang === 'bn'
                ? 'যে মাসের হিসাব পরিচালনা করতে চান তা নির্বাচন করুন:'
                : 'Select the month for ledger operations:'}
            </p>

            {/* 12 Months Grid */}
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
              {monthsData.map((m) => {
                const isSelected = selectedMonthIdx === m.idx;
                return (
                  <button
                    key={m.idx}
                    onClick={() => {
                      onSelectMonth(m.idx, selectedYear);
                      setIsMonthModalOpen(false);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                  >
                    {lang === 'bn' ? m.bn : m.en}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800 flex justify-between items-center text-xs">
              <span className="text-stone-500">{lang === 'bn' ? 'বছর:' : 'Year:'} {activeYearStr}</span>
              <button
                onClick={() => setIsMonthModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-semibold"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
