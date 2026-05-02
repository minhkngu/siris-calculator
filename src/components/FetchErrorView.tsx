import { Calculator } from 'lucide-react';

interface FetchErrorViewProps {
    message: string;
}

export function FetchErrorView({ message }: FetchErrorViewProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-zinc-200 max-w-md w-full text-center">
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Calculator size={32} />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 mb-2">Lỗi tải dữ liệu</h2>
                <p className="text-zinc-500 mb-8">{message}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                    Thử lại
                </button>
            </div>
        </div>
    );
}