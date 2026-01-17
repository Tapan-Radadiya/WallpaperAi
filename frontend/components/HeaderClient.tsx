'use client';

import React, { useState } from 'react';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import Link from 'next/link';
import { LogIn, User as UserIcon, Upload, X } from 'lucide-react';
import Image from 'next/image';
import UploadModal from './UploadModal';
import LoginPrompt from './LoginPrompt';
import Modal from './Modal';

import { User, useAuth } from '@/context/AuthContext';

interface HeaderClientProps {
    initialUser: User | null;
}

export default function HeaderClient({ initialUser }: HeaderClientProps) {
    const { user, login } = useAuth();
    const [imageError, setImageError] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);

    // Sync server-side user data with client context
    React.useEffect(() => {
        if (initialUser) {
            login(initialUser);
        }
    }, [initialUser, login]);

    const handleUploadClick = () => {
        if (user) {
            setShowUploadModal(true);
        } else {
            setShowLoginPrompt(true);
        }
    };

    return (
        <header className="sticky top-0 z-10 backdrop-blur-md bg-[var(--background)]/80 border-b border-[var(--muted)]/20">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-2xl kedebideri-bold tracking-tight bg-gradient-to-r from-[var(--foreground)] to-[var(--muted)] bg-clip-text text-transparent hover:opacity-80 transition-opacity cursor-pointer">
                    WallpaperAI
                </Link>

                <div className="flex items-center gap-4">
                    <ThemeSwitcher />

                    <div className="flex items-center gap-4">
                        {/* Upload Button - Always visible */}
                        <button
                            onClick={handleUploadClick}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-sm font-medium hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[var(--foreground)]/5"
                        >
                            <Upload size={16} />
                            <span>Upload</span>
                        </button>

                        <button
                            onClick={handleUploadClick}
                            className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 active:scale-95 transition-all"
                        >
                            <Upload size={18} />
                        </button>

                        <div className="w-px h-8 bg-[var(--muted)]/20 mx-1"></div>

                        {user ? (
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end hidden sm:flex">
                                    <span className="text-sm font-medium text-[var(--foreground)]">{user.displayName}</span>
                                    <span className="text-xs text-[var(--muted)] truncate max-w-[150px]">{user.emailId}</span>
                                </div>
                                <Link href="/profile">
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
                                </Link>
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
            </div>

            <UploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
            />

            <Modal
                isOpen={showLoginPrompt}
                onClose={() => setShowLoginPrompt(false)}
            >
                <div className="bg-[var(--card-bg)] p-6 rounded-3xl w-full max-w-md border border-[var(--muted)]/20 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => setShowLoginPrompt(false)}
                        className="absolute top-4 right-4 p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors rounded-full hover:bg-[var(--foreground)]/10"
                    >
                        <X size={20} />
                    </button>
                    <LoginPrompt
                        title="Sign in to Upload"
                        message="Please log in to share your wallpapers with the community."
                        onClose={() => setShowLoginPrompt(false)}
                    />
                </div>
            </Modal>
        </header>
    );
}
