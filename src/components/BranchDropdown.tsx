import { Building, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Branch } from './types';

const BRANCH_THEMES = [
    { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500', shadow: 'shadow-indigo-100' },
    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', shadow: 'shadow-emerald-100' },
    { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500', shadow: 'shadow-amber-100' },
    { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', shadow: 'shadow-rose-100' },
    { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500', shadow: 'shadow-violet-100' },
    { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500', shadow: 'shadow-cyan-100' },
];

interface BranchDropdownProps {
    branches: Branch[];
    selectedBranchId: string;
    showDropdown: boolean;
    onToggle: () => void;
    onSelect: (branchId: string) => void;
}

export function BranchDropdown({ branches, selectedBranchId, showDropdown, onToggle, onSelect }: BranchDropdownProps) {
    const selectedBranch = branches.find(b => b.id === selectedBranchId);
    const themeIndex = Math.max(0, branches.findIndex(b => b.id === selectedBranchId));

    return (
        <div className="relative p-3 lg:p-4">
            <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-2 tracking-wider">Cơ sở</label>
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between group"
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        selectedBranchId ? BRANCH_THEMES[themeIndex % BRANCH_THEMES.length].bg : "bg-zinc-100"
                    )}>
                        <Building size={16} className={cn(
                            selectedBranchId ? BRANCH_THEMES[themeIndex % BRANCH_THEMES.length].text : "text-zinc-400"
                        )} />
                    </div>
                    <div className="text-left">
                        <div className="text-sm font-bold text-zinc-900 truncate max-w-[150px]">
                            {selectedBranch?.name || 'Chọn cơ sở'}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate max-w-[150px]">
                            {selectedBranch?.address || 'Vị trí'}
                        </div>
                    </div>
                </div>
                <ChevronDown size={16} className={cn("text-zinc-400 transition-transform", showDropdown && "rotate-180")} />
            </button>

            <AnimatePresence>
                {showDropdown && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={onToggle} />
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 mt-2 w-full min-w-[240px] bg-white shadow-2xl rounded-2xl border border-zinc-200 p-2 z-50 overflow-hidden"
                        >
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                {branches.map((branch, idx) => {
                                    const theme = BRANCH_THEMES[idx % BRANCH_THEMES.length];
                                    return (
                                        <button
                                            key={branch.id}
                                            onClick={() => {
                                                onSelect(branch.id);
                                                onToggle();
                                            }}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left mb-1 last:mb-0",
                                                selectedBranchId === branch.id
                                                    ? cn(theme.bg, theme.text, "font-bold")
                                                    : "hover:bg-zinc-50 text-zinc-600"
                                            )}
                                        >
                                            <div className={cn("w-2 h-2 rounded-full", theme.dot)} />
                                            <div className="flex-1">
                                                <div className="text-sm">{branch.name}</div>
                                                <div className="text-[10px] opacity-70">{branch.address}</div>
                                            </div>
                                            {selectedBranchId === branch.id && <Check size={14} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}