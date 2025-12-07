'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    downloadUrl?: string;
    downloadName?: string;
}

export default function Modal({ isOpen, onClose, children, downloadUrl, downloadName }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    const handleDownload = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!downloadUrl) return;

        try {
            const response = await fetch(downloadUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = downloadName || 'wallpaper-download';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback to opening in new tab if blob download fails
            window.open(downloadUrl, '_blank');
        }
    };


    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-8 transition-opacity duration-300"
            onClick={onClose}
        >

            <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
                {downloadUrl && (
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-[var(--foreground)] hover:opacity-90 text-[var(--background)] px-5 py-2.5 rounded-full transition-all duration-300 font-medium group shadow-lg shadow-black/10 hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer border border-[var(--muted)]/20"
                        title="Download Image"
                    >
                        <Download size={18} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
                        <span>Download</span>
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="bg-black/20 hover:bg-[var(--foreground)]/20 backdrop-blur-md text-white/70 hover:text-white rounded-full p-2 transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-90 cursor-pointer"
                >
                    <X size={24} />
                </button>
            </div>
            <div
                className="relative max-w-7xl max-h-full w-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >

                {children}
            </div>
        </div>,
        document.body
    );
}
