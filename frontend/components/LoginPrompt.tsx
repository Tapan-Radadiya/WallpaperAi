'use client';

import React from 'react';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

export default function LoginPrompt({
    title = "Authentication Required",
    message = "Please log in to access this page and view your profile.",
    onClose
}: {
    title?: string;
    message?: string;
    onClose?: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center p-4 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-3xl bg-[var(--accent)]/10 flex items-center justify-center mb-6 shadow-lg shadow-[var(--accent)]/5">
                <LogIn size={40} className="text-[var(--accent)]" />
            </div>

            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-3 tracking-tight">
                {title}
            </h2>

            <p className="text-[var(--muted)] max-w-md mb-8 text-lg leading-relaxed">
                {message}
            </p>

            <div className="flex gap-4">
                <Link
                    href="/login"
                    onClick={onClose}
                    className="px-8 py-3 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                    <LogIn size={20} />
                    Log In
                </Link>
                <Link
                    href="/register"
                    onClick={onClose}
                    className="px-8 py-3 rounded-xl bg-[var(--card-bg)] border border-[var(--muted)]/20 text-[var(--foreground)] font-bold hover:bg-[var(--muted)]/5 active:scale-95 transition-all"
                >
                    Sign Up
                </Link>
            </div>
        </div>
    );
}
