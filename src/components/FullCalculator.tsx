import React, { useState } from 'react';
import { ArrowLeft, Delete, RotateCcw } from 'lucide-react';
import { bnNum } from '../utils/bengali';

interface FullCalculatorProps {
  onBack: () => void;
}

export const FullCalculator: React.FC<FullCalculatorProps> = ({ onBack }) => {
  const [display, setDisplay] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [hasEvaluated, setHasEvaluated] = useState<boolean>(false);

  const handleKey = (key: string) => {
    if (key === 'C') {
      setDisplay('');
      setHasEvaluated(false);
      return;
    }
    if (key === 'BACK') {
      setDisplay((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '=') {
      if (!display) return;
      try {
        const sanitized = display.replace(/×/g, '*').replace(/÷/g, '/');
        // eslint-disable-next-line no-new-func
        const res = Function(`'use strict'; return (${sanitized})`)();
        if (typeof res === 'number' && !isNaN(res)) {
          const formattedRes = Math.round(res * 1000) / 1000;
          setHistory((prev) => [`${display} = ${formattedRes}`, ...prev.slice(0, 4)]);
          setDisplay(formattedRes.toString());
          setHasEvaluated(true);
        } else {
          setDisplay('Error');
        }
      } catch {
        setDisplay('Error');
      }
      return;
    }

    if (hasEvaluated && !['+', '-', '*', '/'].includes(key)) {
      setDisplay(key);
      setHasEvaluated(false);
    } else {
      setHasEvaluated(false);
      setDisplay((prev) => prev + key);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <ArrowLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </button>
          <div>
            <h1 className="font-bold text-lg">হিসাব ক্যালকুলেটর</h1>
            <p className="text-xs text-stone-500">দ্রুত ও নির্ভুল হিসাব-নিকাশ</p>
          </div>
        </div>
        <button
          onClick={() => {
            setDisplay('');
            setHistory([]);
          }}
          title="রিসেট"
          className="p-2 rounded-xl text-stone-500 hover:text-rose-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-4 flex flex-col justify-between max-w-md mx-auto w-full">
        {/* Screen */}
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-5 shadow-sm border border-stone-200 dark:border-stone-800 mb-4 flex flex-col justify-end min-h-[170px]">
          {/* History */}
          <div className="space-y-1 mb-2 text-right overflow-y-auto max-h-16 text-xs text-stone-400">
            {history.map((h, i) => (
              <div key={i} className="font-mono">{bnNum(h)}</div>
            ))}
          </div>

          {/* Main output */}
          <div className="text-right">
            <div className="text-4xl font-extrabold font-mono tracking-wider text-emerald-700 dark:text-emerald-400 overflow-x-auto whitespace-nowrap">
              {display ? bnNum(display) : '০'}
            </div>
          </div>
        </div>

        {/* Buttons Grid */}
        <div className="grid grid-cols-4 gap-3 bg-white dark:bg-stone-900 p-4 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <button
            onClick={() => handleKey('C')}
            className="h-14 rounded-2xl font-bold text-lg text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 active:scale-95 transition"
          >
            C
          </button>
          <button
            onClick={() => handleKey('BACK')}
            className="h-14 rounded-2xl flex items-center justify-center text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 active:scale-95 transition"
          >
            <Delete className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleKey('/100')}
            className="h-14 rounded-2xl font-bold text-lg text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 active:scale-95 transition"
          >
            %
          </button>
          <button
            onClick={() => handleKey('/')}
            className="h-14 rounded-2xl font-bold text-xl text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 active:scale-95 transition"
          >
            ÷
          </button>

          {['7', '8', '9'].map((n) => (
            <button
              key={n}
              onClick={() => handleKey(n)}
              className="h-14 rounded-2xl font-bold text-xl text-stone-800 dark:text-stone-100 bg-stone-100/70 dark:bg-stone-800 hover:bg-stone-200 active:scale-95 transition"
            >
              {bnNum(n)}
            </button>
          ))}
          <button
            onClick={() => handleKey('*')}
            className="h-14 rounded-2xl font-bold text-xl text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 active:scale-95 transition"
          >
            ×
          </button>

          {['4', '5', '6'].map((n) => (
            <button
              key={n}
              onClick={() => handleKey(n)}
              className="h-14 rounded-2xl font-bold text-xl text-stone-800 dark:text-stone-100 bg-stone-100/70 dark:bg-stone-800 hover:bg-stone-200 active:scale-95 transition"
            >
              {bnNum(n)}
            </button>
          ))}
          <button
            onClick={() => handleKey('-')}
            className="h-14 rounded-2xl font-bold text-xl text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 active:scale-95 transition"
          >
            -
          </button>

          {['1', '2', '3'].map((n) => (
            <button
              key={n}
              onClick={() => handleKey(n)}
              className="h-14 rounded-2xl font-bold text-xl text-stone-800 dark:text-stone-100 bg-stone-100/70 dark:bg-stone-800 hover:bg-stone-200 active:scale-95 transition"
            >
              {bnNum(n)}
            </button>
          ))}
          <button
            onClick={() => handleKey('+')}
            className="h-14 rounded-2xl font-bold text-xl text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 active:scale-95 transition"
          >
            +
          </button>

          <button
            onClick={() => handleKey('0')}
            className="h-14 rounded-2xl font-bold text-xl text-stone-800 dark:text-stone-100 bg-stone-100/70 dark:bg-stone-800 hover:bg-stone-200 active:scale-95 transition"
          >
            ০
          </button>
          <button
            onClick={() => handleKey('00')}
            className="h-14 rounded-2xl font-bold text-xl text-stone-800 dark:text-stone-100 bg-stone-100/70 dark:bg-stone-800 hover:bg-stone-200 active:scale-95 transition"
          >
            ০০
          </button>
          <button
            onClick={() => handleKey('.')}
            className="h-14 rounded-2xl font-bold text-xl text-stone-800 dark:text-stone-100 bg-stone-100/70 dark:bg-stone-800 hover:bg-stone-200 active:scale-95 transition"
          >
            .
          </button>
          <button
            onClick={() => handleKey('=')}
            className="h-14 rounded-2xl font-bold text-xl text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition shadow-lg shadow-emerald-600/30"
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
};
