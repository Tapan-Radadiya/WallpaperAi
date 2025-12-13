'use client';

import React, { useState } from 'react';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { LogIn, User as UserIcon, Upload } from 'lucide-react';
import Image from 'next/image';
import UploadModal from './UploadModal';

export default function Header() {
    const { user } = useAuth();
    const [imageError, setImageError] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    return (
        <header className="sticky top-0 z-10 backdrop-blur-md bg-[var(--background)]/80 border-b border-[var(--muted)]/20">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-2xl kedebideri-bold tracking-tight bg-gradient-to-r from-[var(--foreground)] to-[var(--muted)] bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                    WallpaperAI
                </Link>

                <div className="flex items-center gap-4">
                    <ThemeSwitcher />

                    {user ? (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-sm font-medium hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[var(--foreground)]/5"
                            >
                                <Upload size={16} />
                                <span>Upload</span>
                            </button>

                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 active:scale-95 transition-all"
                            >
                                <Upload size={18} />
                            </button>

                            <div className="w-px h-8 bg-[var(--muted)]/20 mx-1"></div>

                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end hidden sm:flex">
                                    <span className="text-sm font-medium text-[var(--foreground)]">{user.displayName}</span>
                                    <span className="text-xs text-[var(--muted)] truncate max-w-[150px]">{user.emailId}</span>
                                </div>
                                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[var(--muted)]/30 ring-2 ring-[var(--accent)]/20 hover:ring-[var(--accent)]/50 transition-all cursor-pointer">
                                    {user.avatarImage && !imageError ? (
                                        <Image
                                            src={user.avatarImage}
                                            alt={user.displayName || "User Avatar"}
                                            fill
                                            className="object-cover"
                                            onError={() => setImageError(true)}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-[var(--card-bg)] flex items-center justify-center">
                                            <span className="text-lg font-bold text-[var(--foreground)]">
                                                {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon size={20} />}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="px-4 py-2 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-sm font-medium hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <LogIn size={16} />
                            <span className="hidden sm:inline">Sign In</span>
                        </Link>
                    )}
                </div>
            </div>

            <UploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
            />
        </header>
    );
}
