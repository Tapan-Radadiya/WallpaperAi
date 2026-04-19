'use client';

import React, { useState, useEffect, useRef } from 'react';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import Link from 'next/link';
import { LogIn, User as UserIcon, Upload, X, LogOut, Loader2, Search } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/api';
import UploadModal from './UploadModal';
import LoginPrompt from './LoginPrompt';
import Modal from './Modal';
import { useToast } from '@/context/ToastContext';

import { User, useAuth } from '@/context/AuthContext';

interface HeaderClientProps {
    initialUser: User | null;
}

export default function HeaderClient({ initialUser }: HeaderClientProps) {
    const { user: contextUser, login, logout } = useAuth();
    const { showToast } = useToast();
    const [imageError, setImageError] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isSynced, setIsSynced] = useState(false);
    const headerRef = useRef<HTMLElement>(null);
    const pathname = usePathname();
    const router = useRouter();
    const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/reset-password';
    const isLoginPage = pathname === '/login';
    const isForgotPasswordPage = pathname === '/forgot-password';

    // Sync server-side user data with client context
    useEffect(() => {
        if (initialUser) {
            login(initialUser);
        }
        setIsSynced(true);
    }, [initialUser, login]);

    // High-performance vanilla JS scroll listener
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const headerEl = headerRef.current;
        if (!headerEl) return;

        let lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
        let ticking = false;

        const updateHeader = () => {
            const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;

            if (currentScrollY < 60) {
                headerEl.style.transform = 'translateY(0)';
            } else if (currentScrollY > lastScrollY && currentScrollY > 60) {
                // Scroll down
                headerEl.style.transform = 'translateY(-100%)';
            } else if (currentScrollY < lastScrollY - 5) {
                // Scroll up
                headerEl.style.transform = 'translateY(0)';
            }

            lastScrollY = currentScrollY <= 0 ? 0 : currentScrollY;
            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(updateHeader);
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const user = isSynced ? contextUser : initialUser;

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await api.post('/auth/log-out');

            // Short delay for visual feedback
            setTimeout(async () => {
                await logout(); // Clear context user

                // Use window.location to properly clear all states and prevent layout shifts during client transition
                // This ensures a fresh start for the login page and clears any lingering data
                window.location.href = '/login';
            }, 1000);
        } catch (error) {
            console.error("Logout API call failed", error);
            setIsLoggingOut(false);
        }
    };

    const handleUploadClick = () => {
        if (user) {
            if (user.is_verified) {
                setShowUploadModal(true);
            } else {
                showToast("Please verify your email on your profile page to upload images.", "error");
                router.push('/profile');
            }
        } else {
            setShowLoginPrompt(true);
        }
    };

    return (
        <>
        <header
            ref={headerRef}
            className={`fixed w-full left-0 top-0 z-50 backdrop-blur-md bg-[var(--background)]/80 border-b border-[var(--muted)]/20 transition-transform duration-300 ease-in-out`}
        >
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-2xl kedebideri-bold tracking-tight bg-gradient-to-r from-[var(--foreground)] to-[var(--muted)] bg-clip-text text-transparent hover:opacity-80 transition-opacity cursor-pointer">
                    WallpaperAI
                </Link>

                <div className="flex items-center gap-4">
                    <ThemeSwitcher />

                    <div className="flex items-center gap-4">
                        {/* Logout Button - Only visible on Profile Page */}
                        {user && pathname === '/profile' && (
                            <button
                                onClick={handleLogout}
                                className="p-2 text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all cursor-pointer"
                                title="Sign Out"
                            >
                                <LogOut size={20} />
                            </button>
                        )}
                        {/* Upload Button - Hidden on auth pages */}
                        {!isAuthPage && (
                            <>
                                <button
                                    onClick={handleUploadClick}
                                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-sm font-medium hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[var(--foreground)]/5 cursor-pointer"
                                >
                                    <Upload size={16} />
                                    <span>Upload</span>
                                </button>

                                <button
                                    onClick={handleUploadClick}
                                    className="sm:hidden flex items-center justify-center w-10 h-10 rounded-full bg-[var(--foreground)] text-[var(--background)] hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                                >
                                    <Upload size={18} />
                                </button>

                                <div className="w-px h-8 bg-[var(--muted)]/20 mx-1"></div>
                            </>
                        )}

                        {user ? (
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-end hidden sm:flex">
                                    <span className="text-sm font-medium text-[var(--foreground)]">{user.userName}</span>
                                    <span className="text-xs text-[var(--muted)] truncate max-w-[150px]">{user.emailId}</span>
                                </div>
                                <Link href="/profile">
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[var(--muted)]/30 ring-2 ring-[var(--accent)]/20 hover:ring-[var(--accent)]/50 transition-all cursor-pointer">
                                        {user.avatarImage && !imageError ? (
                                            <Image
                                                src={user.avatarImage}
                                                alt={user.userName || "User Avatar"}
                                                fill
                                                className="object-cover"
                                                onError={() => setImageError(true)}
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[var(--card-bg)] flex items-center justify-center">
                                                <span className="text-lg font-bold text-[var(--foreground)]">
                                                    {user.userName ? user.userName.charAt(0).toUpperCase() : <UserIcon size={20} />}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </div>
                        ) : (
                            isLoginPage || isForgotPasswordPage ? (
                                <Link
                                    href="/register"
                                    className="px-4 py-2 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-sm font-medium hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <LogIn size={16} />
                                    <span className="hidden sm:inline">Sign Up</span>
                                </Link>
                            ) : (
                                <Link
                                    href="/login"
                                    className="px-4 py-2 rounded-xl bg-[var(--foreground)] text-[var(--background)] text-sm font-medium hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <LogIn size={16} />
                                    <span className="hidden sm:inline">Sign In</span>
                                </Link>
                            )
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
            <Modal
                isOpen={isLoggingOut}
                onClose={() => { }} // Prevent closing while logging out
            >
                <div className="bg-[var(--card-bg)] p-8 rounded-3xl flex flex-col items-center justify-center space-y-4 border border-[var(--muted)]/20 shadow-2xl outline-none">
                    <div className="p-4 rounded-full bg-[var(--accent)]/10">
                        <Loader2 className="animate-spin text-[var(--accent)]" size={40} />
                    </div>
                    <div className="text-center">
                        <h3 className="text-xl font-bold text-[var(--foreground)]">Signing Out</h3>
                        <p className="text-[var(--muted)] text-sm mt-1">Please wait a moment...</p>
                    </div>
                </div>
            </Modal>
        </header>
        {/* Spacer to prevent layout shifts since header is now fixed */}
        <div className="h-16 w-full shrink-0" aria-hidden="true" />
        </>
    );
}
