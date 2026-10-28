interface GoogleReviewsOptionProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export function GoogleReviewsOption({ checked, onChange }: GoogleReviewsOptionProps) {
    return (
        <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-slate-200 p-3.5 hover:bg-slate-50">
            <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="mt-1 h-4 w-4 accent-blue-600 shrink-0" />
            <span className="text-sm text-slate-700">
                <span className="block font-medium">Giảm giá Google Maps Reviews</span>
                <span className="block text-xs text-slate-500 mt-1">Giảm 10%, tối đa 70.000đ. Thay thế điều chỉnh tổng đơn.</span>
            </span>
        </label>
    );
}
