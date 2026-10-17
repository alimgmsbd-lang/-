import React, { useState } from 'react';
import { Delete, Check, X } from 'lucide-react';
import { bnNum } from '../utils/bengali';

interface PopupCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (val: number) => void;
  title?: string;
  initialValue?: number;
}

export const PopupCalculator: React.FC<PopupCalculatorProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'ক্যালকুলেটর',
  initialValue,
}) => {
  const [expression, setExpression] = useState<string>(
    initialValue && initialValue > 0 ? initialValue.toString() : ''
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleKey = (key: string) => {
    setError(null);
    if (key === 'C') {
      setExpression('');
      return;
    }
    if (key === 'BACK') {
      setExpression((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '=') {
      calculateResult(false);
      return;
    }
    if (key === 'OK') {
      calculateResult(true);
      return;
    }
    // Prevent duplicate operators
    const lastChar = expression.slice(-1);
    const isOp = ['+', '-', '*', '/'].includes(key);
    if (isOp && ['+', '-', '*', '/'].includes(lastChar)) {
      setExpression((prev) => prev.slice(0, -1) + key);
      return;
    }

    setExpression((prev) => prev + key);
  };

  const calculateResult = (closeOnSuccess: boolean) => {
    if (!expression.trim()) {
      if (closeOnSuccess) onClose();
      return;
    }
    try {
      // Safe evaluation of basic arithmetic
      const sanitized = expression.replace(/×/g, '*').replace(/÷/g, '/');
      // eslint-disable-next-line no-new-func
      const result = Function(`'use strict'; return (${sanitized})`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        const rounded = Math.round(result * 100) / 100;
        setExpression(rounded.toString());
        if (closeOnSuccess) {
          onConfirm(rounded);
          onClose();
        }
      } else {
        setError('ভুল হিসাব');
      }
    } catch {
      setError('ভুল ফরম্যাট');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 dark:border-stone-800">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-emerald-600 dark:bg-emerald-700 text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧮</span>
            <h3 className="font-bold text-base">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Display */}
        <div className="p-4 bg-stone-100 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800 text-right">
          <div className="text-xs text-stone-500 dark:text-stone-400 mb-1 font-medium">
            হিসাব ইনপুট ও ফলাফল
          </div>
          <div className="text-3xl font-bold font-mono tracking-wider text-emerald-800 dark:text-emerald-400 overflow-x-auto whitespace-nowrap min-h-[40px] flex items-center justify-end">
            {expression ? bnNum(expression) : '০'}
          </div>
          {error && <div className="text-xs text-rose-500 mt-1">{error}</div>}
        </div>

        {/* Keypad */}
        <div className="p-4 grid grid-cols-4 gap-2.5 bg-white dark:bg-stone-900">
          <button
            onClick={() => handleKey('C')}
            className="h-12 rounded-xl font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 active:scale-95 transition"
          >
            C
          </button>
          <button
            onClick={() => handleKey('BACK')}
            className="h-12 rounded-xl flex items-center justify-center text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 active:scale-95 transition"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleKey('/100')}
            className="h-12 rounded-xl font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 active:scale-95 transition"
          >
            %
          </button>
          <button
            onClick={() => handleKey('/')}
            className="h-12 rounded-xl font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 active:scale-95 transition text-lg"
          >
            ÷
          </button>

          {['7', '8', '9'].map((n) => (
            <button
              key={n}
              onClick={() => handleKey(n)}
              className="h-12 rounded-xl font-bold text-lg text-stone-800 dark:text-stone-100 bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 active:scale-95 transition shadow-xs"
            >
              {bnNum(n)}
            </button>
          ))}
          <button
            onClick={() => handleKey('*')}
            className="h-12 rounded-xl font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 active:scale-95 transition text-lg"
          >
            ×
          </button>

          {['4', '5', '6'].map((n) => (
            <button
              key={n}
              onClick={() => handleKey(n)}
              className="h-12 rounded-xl font-bold text-lg text-stone-800 dark:text-stone-100 bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 active:scale-95 transition shadow-xs"
            >
              {bnNum(n)}
            </button>
          ))}
          <button
            onClick={() => handleKey('-')}
            className="h-12 rounded-xl font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 active:scale-95 transition text-lg"
          >
            -
          </button>

          {['1', '2', '3'].map((n) => (
            <button
              key={n}
              onClick={() => handleKey(n)}
              className="h-12 rounded-xl font-bold text-lg text-stone-800 dark:text-stone-100 bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 active:scale-95 transition shadow-xs"
            >
              {bnNum(n)}
            </button>
          ))}
          <button
            onClick={() => handleKey('+')}
            className="h-12 rounded-xl font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 active:scale-95 transition text-lg"
          >
            +
          </button>

          <button
            onClick={() => handleKey('0')}
            className="h-12 rounded-xl font-bold text-lg text-stone-800 dark:text-stone-100 bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 active:scale-95 transition shadow-xs"
          >
            ০
          </button>
          <button
            onClick={() => handleKey('.')}
            className="h-12 rounded-xl font-bold text-lg text-stone-800 dark:text-stone-100 bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 active:scale-95 transition shadow-xs"
          >
            .
          </button>
          <button
            onClick={() => handleKey('=')}
            className="h-12 rounded-xl font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 active:scale-95 transition text-lg"
          >
            =
          </button>
          <button
            onClick={() => handleKey('OK')}
            className="h-12 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition flex items-center justify-center gap-1 shadow-md shadow-emerald-600/30"
          >
            <Check className="w-5 h-5" />
            <span>ঠিক</span>
          </button>
        </div>
      </div>
    </div>
  );
};
