'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    onClose: (id: string) => void;
}

export default function Toast({ id, message, type, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, 5000); // Auto close after 5 seconds

        return () => clearTimeout(timer);
    }, [id, onClose]);

    const styles = {
        success: 'border-green-500/50 text-green-100',
        error: 'border-red-500/50 text-red-100',
        info: 'border-[var(--accent)]/50 text-blue-100',
    };

    const icons = {
        success: <CheckCircle2 className="text-green-400" size={20} />,
        error: <XCircle className="text-red-400" size={20} />,
        info: <Info className="text-[var(--accent)]" size={20} />,
    };

    return (
        <div
            className={`
        flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg 
        bg-[var(--card-bg)]/90 transition-all duration-300 animate-in slide-in-from-right-full fade-in
        min-w-[300px] max-w-md pointer-events-auto
        ${styles[type]}
      `}
            role="alert"
        >
            <div className="flex-shrink-0">{icons[type]}</div>
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button
                onClick={() => onClose(id)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close"
            >
                <X size={16} className="opacity-70" />
            </button>
        </div>
    );
}
