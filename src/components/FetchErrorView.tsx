import { AlertTriangle, RefreshCw } from 'lucide-react';

interface FetchErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function FetchErrorView({ message, onRetry }: FetchErrorViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 p-4">
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 max-w-md w-full text-center shadow-sm">
        <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1.5">
          Không thể tải dữ liệu
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-6">{message}</p>
        <button
          type="button"
          onClick={onRetry ?? (() => window.location.reload())}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-lg text-xs sm:text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw size={14} />
          <span>Thử tải lại</span>
        </button>
      </div>
    </div>
  );
}
