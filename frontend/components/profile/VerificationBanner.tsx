import React from 'react';
import { Shield } from 'lucide-react';

interface VerificationBannerProps {
    onVerifyClick: () => void;
}

export default function VerificationBanner({ onVerifyClick }: VerificationBannerProps) {
    return (
        <div
            onClick={onVerifyClick}
            className="mb-8 p-3 rounded-xl bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent)]/5 border border-[var(--accent)]/20 flex items-center justify-between gap-4 cursor-pointer hover:bg-[var(--accent)]/15 transition-colors group"
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                    <Shield size={16} className="text-[var(--accent)]" />
                </div>
                <div>
                    <h3 className="font-bold text-[var(--foreground)] text-sm">Verify your account</h3>
                    <p className="text-[var(--muted)] text-xs hidden sm:block">Unlock uploads and join the community.</p>
                </div>
            </div>
            <button className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 active:scale-95 transition-all shadow-md shadow-[var(--accent)]/20 whitespace-nowrap">
                Verify Now
            </button>
        </div>
    );
}
