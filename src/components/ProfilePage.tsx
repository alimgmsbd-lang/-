import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Moon,
  Sun,
  User,
  CalendarPlus,
  FolderArchive,
  Check,
  Download,
  Upload,
  Copy,
  Database,
  Cloud,
  CloudUpload,
  CloudDownload,
  Languages,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { UserProfile, ArchiveItem } from '../types';
import { Language, translations } from '../utils/i18n';
import {
  signInGoogleDrive,
  signOutGoogleDrive,
  saveBackupToGoogleDrive,
  loadBackupFromGoogleDrive,
  getCurrentDriveUser,
  getDriveAccessToken,
  initGoogleDriveAuth,
} from '../utils/googleDrive';
import { FullAppBackup } from '../utils/pdfGenerator';

interface ProfilePageProps {
  userProfile: UserProfile;
  darkMode: boolean;
  lang: Language;
  archives: ArchiveItem[];
  activeArchiveIndex: number;
  autoDriveSync: boolean;
  lastDriveSyncTime: string | null;
  getFullBackupData: () => FullAppBackup;
  onBack: () => void;
  onUpdateProfile: (name: string, img: string) => void;
  onToggleDarkMode: () => void;
  onToggleLanguage: (newLang: Language) => void;
  onToggleAutoDriveSync: (enabled: boolean) => void;
  onSetLastDriveSyncTime: (time: string) => void;
  onStartNewMonth: (startDate: string, endDate: string) => void;
  onSelectArchive: (index: number) => void;
  onLoadSampleData?: () => void;
  onExportBackup: () => void;
  onImportBackup: (importedData: any) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  userProfile,
  darkMode,
  lang,
  archives,
  activeArchiveIndex,
  autoDriveSync,
  lastDriveSyncTime,
  getFullBackupData,
  onBack,
  onUpdateProfile,
  onToggleDarkMode,
  onToggleLanguage,
  onToggleAutoDriveSync,
  onSetLastDriveSyncTime,
  onStartNewMonth,
  onSelectArchive,
  onLoadSampleData,
  onExportBackup,
  onImportBackup,
}) => {
  const t = translations[lang];
  const [name, setName] = useState(userProfile.name);
  const [img, setImg] = useState(userProfile.img);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Drive state
  const [googleUser, setGoogleUser] = useState<any>(getCurrentDriveUser());
  const [isDriveBusy, setIsDriveBusy] = useState(false);
  const [driveStatusMsg, setDriveStatusMsg] = useState<string | null>(null);

  // New Month Modal
  const [isNewMonthModalOpen, setIsNewMonthModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .split('T')[0]
  );

  useEffect(() => {
    initGoogleDriveAuth((user) => {
      setGoogleUser(user);
    });
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(name.trim() || (lang === 'bn' ? 'ব্যবহারকারী' : 'User'), img.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleConfirmNewMonth = () => {
    if (!startDate || !endDate) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে শুরুর ও শেষের তারিখ নির্বাচন করুন' : 'Please select dates');
      return;
    }
    if (confirm(lang === 'bn' ? 'বর্তমান মাসের হিসাব সংরক্ষণ করে নতুন মাস শুরু করতে চান?' : 'Start new month and archive current?')) {
      onStartNewMonth(startDate, endDate);
      setIsNewMonthModalOpen(false);
      alert(lang === 'bn' ? 'নতুন মাস সফলভাবে শুরু হয়েছে এবং পূর্বের হিসাব সংরক্ষণ করা হয়েছে।' : 'New month started and archived.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (confirm(lang === 'bn' ? 'এই ব্যাকআপ ফাইলটি রিস্টোর করতে চান? এতে বর্তমান ডাটা আপডেট হবে।' : 'Restore this backup? Current data will be replaced.')) {
          onImportBackup(parsed);
          alert(lang === 'bn' ? 'ব্যাকআপ সফলভাবে রিস্টোর করা হয়েছে!' : 'Backup restored successfully!');
        }
      } catch (err) {
        alert(lang === 'bn' ? 'ভুল ফাইল ফরম্যাট! অনুগ্রহ করে বৈধ .json ব্যাকআপ ফাইল আপলোড করুন।' : 'Invalid .json backup file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Google Drive Handlers
  const handleGoogleSignIn = async () => {
    setIsDriveBusy(true);
    setDriveStatusMsg(lang === 'bn' ? 'Google অ্যাকাউন্টে কানেক্ট হচ্ছে...' : 'Connecting Google Account...');
    try {
      const res = await signInGoogleDrive();
      if (res?.user) {
        setGoogleUser(res.user);
        setDriveStatusMsg(lang === 'bn' ? 'Google ড্রাইভ সফলভাবে সংযুক্ত হয়েছে!' : 'Connected to Google Drive!');
        setTimeout(() => setDriveStatusMsg(null), 3000);
      }
    } catch (err: any) {
      setDriveStatusMsg(lang === 'bn' ? 'কানেক্ট হতে পারেনি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।' : 'Failed to connect. Please try again.');
    } finally {
      setIsDriveBusy(false);
    }
  };

  const handleGoogleSignOut = async () => {
    if (confirm(lang === 'bn' ? 'Google ড্রাইভ সংযোগ বিচ্ছিন্ন করতে চান?' : 'Disconnect Google Drive?')) {
      await signOutGoogleDrive();
      setGoogleUser(null);
      setDriveStatusMsg(null);
    }
  };

  const handleSaveToDriveNow = async () => {
    if (!getDriveAccessToken()) {
      await handleGoogleSignIn();
      if (!getDriveAccessToken()) return;
    }

    setIsDriveBusy(true);
    setDriveStatusMsg(t.savingToDrive);
    try {
      const backup = getFullBackupData();
      const res = await saveBackupToGoogleDrive(backup);
      if (res.success) {
        const timeNow = new Date().toLocaleTimeString(lang === 'bn' ? 'bn-BD' : 'en-US');
        onSetLastDriveSyncTime(timeNow);
        setDriveStatusMsg(t.savedToDriveSuccess);
        setTimeout(() => setDriveStatusMsg(null), 3500);
      }
    } catch (err: any) {
      setDriveStatusMsg(`⚠️ ${t.driveError}: ${err.message || 'Failed'}`);
    } finally {
      setIsDriveBusy(false);
    }
  };

  const handleRestoreFromDrive = async () => {
    if (!getDriveAccessToken()) {
      await handleGoogleSignIn();
      if (!getDriveAccessToken()) return;
    }

    if (!confirm(lang === 'bn' ? 'গুগল ড্রাইভ থেকে সর্বশেষ ব্যাকআপ এনে বর্তমান অ্যাপে রিস্টোর করতে চান?' : 'Restore latest backup from Google Drive?')) {
      return;
    }

    setIsDriveBusy(true);
    setDriveStatusMsg(lang === 'bn' ? 'ড্রাইভ থেকে ডাটা লোড হচ্ছে...' : 'Loading from Drive...');
    try {
      const data = await loadBackupFromGoogleDrive();
      if (data) {
        onImportBackup(data);
        setDriveStatusMsg(lang === 'bn' ? 'গুগল ড্রাইভ থেকে রিস্টোর সম্পন্ন হয়েছে!' : 'Restored from Google Drive!');
        setTimeout(() => setDriveStatusMsg(null), 3500);
      } else {
        setDriveStatusMsg(lang === 'bn' ? 'গুগল ড্রাইভে কোনো ব্যাকআপ ফাইল পাওয়া যায়নি।' : 'No backup file found in Drive.');
      }
    } catch (err: any) {
      setDriveStatusMsg(`⚠️ ${err.message || 'Error loading'}`);
    } finally {
      setIsDriveBusy(false);
    }
  };

  const appShareUrl = window.location.href;

  const handleCopyAppUrl = () => {
    navigator.clipboard.writeText(appShareUrl);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </button>
          <div>
            <h1 className="font-bold text-lg">{t.profileAndSettings}</h1>
            <p className="text-xs text-stone-500">{t.languageSub}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 max-w-md mx-auto w-full">
        {/* 1. Dark Mode Card */}
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300">
              {darkMode ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <div className="font-bold text-sm text-stone-800 dark:text-stone-100">
                {t.darkMode}
              </div>
              <div className="text-xs text-stone-500">{t.darkModeSub}</div>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={onToggleDarkMode}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
          </label>
        </div>

        {/* 2. LANGUAGE SWITCHER (DIRECTLY UNDER DARK MODE) */}
        <div className="p-4 rounded-3xl bg-white dark:bg-stone-900 border-2 border-emerald-500/40 dark:border-emerald-600 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Languages className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-stone-800 dark:text-stone-100">
                  {t.language}
                </div>
                <div className="text-xs text-stone-500">{t.languageSub}</div>
              </div>
            </div>
          </div>

          {/* Bengali & English Toggle Buttons */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-2xl">
            <button
              onClick={() => onToggleLanguage('bn')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                lang === 'bn'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-emerald-600'
              }`}
            >
              <span>বাংলা (Bengali)</span>
              {lang === 'bn' && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onToggleLanguage('en')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                lang === 'en'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-emerald-600'
              }`}
            >
              <span>English</span>
              {lang === 'en' && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 3. GOOGLE DRIVE BACKUP & AUTO-SYNC */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border-2 border-sky-500/50 dark:border-sky-600 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-sky-600" />
              {t.googleDriveBackup}
            </h3>
            <span className="text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded-full font-bold">
              Google Cloud
            </span>
          </div>
          <p className="text-xs text-stone-500 mb-3">{t.googleDriveSub}</p>

          {/* Drive Status Alert */}
          {driveStatusMsg && (
            <div className="p-2.5 rounded-xl mb-3 text-xs font-semibold bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-2">
              <RefreshCw className={`w-3.5 h-3.5 ${isDriveBusy ? 'animate-spin' : ''}`} />
              <span>{driveStatusMsg}</span>
            </div>
          )}

          {!googleUser ? (
            /* Sign In Button with Official Google Branding */
            <button
              onClick={handleGoogleSignIn}
              disabled={isDriveBusy}
              className="w-full py-2.5 px-4 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl shadow-xs flex items-center justify-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-700/60 active:scale-98 transition cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              <span className="font-bold text-xs sm:text-sm text-stone-700 dark:text-stone-200">
                {t.signInWithGoogle}
              </span>
            </button>
          ) : (
            /* Signed In User View with Auto-Sync & Action Buttons */
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs">
                <div className="flex items-center gap-2">
                  {googleUser.photoURL ? (
                    <img src={googleUser.photoURL} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px]">
                      G
                    </div>
                  )}
                  <span className="font-semibold text-stone-800 dark:text-stone-200 truncate max-w-[170px]">
                    {googleUser.displayName || googleUser.email}
                  </span>
                </div>
                <button
                  onClick={handleGoogleSignOut}
                  className="text-rose-500 hover:text-rose-600 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.signOut}</span>
                </button>
              </div>

              {/* Auto Sync Toggle */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80">
                <div className="text-xs">
                  <span className="font-bold text-sky-900 dark:text-sky-200 block">
                    {t.autoSyncToDrive}
                  </span>
                  <span className="text-[10px] text-stone-500">
                    {lastDriveSyncTime ? `${t.lastSynced} ${lastDriveSyncTime}` : 'হিসাব পরিবর্তন হলেই স্বয়ংক্রিয় সেভ'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoDriveSync}
                    onChange={(e) => onToggleAutoDriveSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600" />
                </label>
              </div>

              {/* Sync Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSaveToDriveNow}
                  disabled={isDriveBusy}
                  className="py-2 px-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>{t.saveToDriveNow}</span>
                </button>
                <button
                  onClick={handleRestoreFromDrive}
                  disabled={isDriveBusy}
                  className="py-2 px-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 border border-stone-300 dark:border-stone-700 cursor-pointer"
                >
                  <CloudDownload className="w-4 h-4 text-sky-600" />
                  <span>{t.restoreFromDrive}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Local App Export & Backup Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100 flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-emerald-600" />
            {t.appExportBackup}
          </h3>
          <p className="text-xs text-stone-500 mb-3">
            {lang === 'bn'
              ? 'মোবাইল বা কম্পিউটারের মেমোরিতে সরাসরি .json ব্যাকআপ ফাইল সংরক্ষণ করুন'
              : 'Save direct .json backup files to your device storage'}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onExportBackup}
              className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer"
            >
              <Download className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                {t.exportBackupBtn}
              </span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer"
            >
              <Upload className="w-5 h-5 text-sky-600" />
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                {t.importBackupBtn}
              </span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>

          <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
            <span className="text-stone-600 dark:text-stone-300 font-medium">
              {t.shareAppLink}
            </span>
            <button
              onClick={handleCopyAppUrl}
              className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 text-xs font-semibold flex items-center gap-1"
            >
              {isCopiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopiedLink ? t.copiedLink : t.copyLink}</span>
            </button>
          </div>
        </div>

        {/* 5. User Profile Info */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-600" />
            {t.userInfo}
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">{t.yourName}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl py-2 px-3 text-sm text-stone-800 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">{t.avatarUrl}</label>
              <input
                type="text"
                value={img}
                onChange={(e) => setImg(e.target.value)}
                placeholder="https://..."
                className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl py-2 px-3 text-xs text-stone-800 dark:text-stone-100"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {isSaved ? <Check className="w-4 h-4" /> : null}
              <span>{isSaved ? t.savedInfoSuccess : t.saveInfo}</span>
            </button>
          </form>
        </div>

        {/* 6. Month Archive Management */}
        <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs">
          <h3 className="font-bold text-sm text-stone-800 dark:text-stone-100 mb-1 flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-amber-600" />
            {t.monthArchiveMgmt}
          </h3>
          <p className="text-xs text-stone-500 mb-4">
            {lang === 'bn'
              ? 'প্রতি মাসের শেষে নতুন মাস শুরু করে আগের মাসের পূর্ণাঙ্গ খাতা সংরক্ষণ করুন'
              : 'Archive current month and start fresh for new month'}
          </p>

          <button
            onClick={() => setIsNewMonthModalOpen(true)}
            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 mb-4 transition cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>{t.startNewMonth}</span>
          </button>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5 flex items-center gap-1.5">
              <FolderArchive className="w-3.5 h-3.5 text-stone-400" />
              {t.viewPreviousMonths}
            </label>
            <select
              value={activeArchiveIndex}
              onChange={(e) => onSelectArchive(Number(e.target.value))}
              className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl py-2 px-3 text-sm text-stone-800 dark:text-stone-100"
            >
              <option value="-1">📅 {t.currentActiveMonth}</option>
              {archives.map((arc, idx) => (
                <option key={arc.id} value={idx}>
                  📁 {arc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 7. Sample Data */}
        {onLoadSampleData && (
          <div className="p-4 rounded-3xl bg-stone-100 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-center">
            <button
              onClick={() => {
                if (confirm(lang === 'bn' ? 'নমুনা তথ্য যোগ করতে চান?' : 'Load sample ledger data?')) {
                  onLoadSampleData();
                }
              }}
              className="px-4 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:border-emerald-500 transition shadow-2xs cursor-pointer"
            >
              + {lang === 'bn' ? 'নমুনা ডাটা লোড করুন' : 'Load Sample Data'}
            </button>
          </div>
        )}
      </div>

      {/* New Month Modal */}
      {isNewMonthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-6 border border-stone-200 dark:border-stone-800">
            <h3 className="font-bold text-base mb-1">{t.startNewMonth}</h3>
            <p className="text-xs text-stone-500 mb-4">
              {lang === 'bn'
                ? 'বর্তমান চলমান হিসাব একটি নতুন আর্কাইভে সংরক্ষিত হবে এবং বর্তমান খাতা নতুন শুরু হবে।'
                : 'Current records will be saved into archive and current ledger will reset for the new month.'}
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">
                  {lang === 'bn' ? 'শুরুর তারিখ' : 'Start Date'}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl py-2 px-3 text-sm text-stone-800 dark:text-stone-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">
                  {lang === 'bn' ? 'শেষ তারিখ' : 'End Date'}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl py-2 px-3 text-sm text-stone-800 dark:text-stone-100"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsNewMonthModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-semibold"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleConfirmNewMonth}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
