'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Loader2, Instagram, Globe } from 'lucide-react';
import Image from 'next/image';
import ImageDropzone from './ui/ImageDropzone';
import { MAX_FILE_SIZE } from '@/constants';
import { validateImage } from '@/lib/api';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentProfile: {
        userName: string;
        avatarImage: string;
        user_bio?: string;
        instagram_id?: string;
        portfolio_url?: string;
    };
    onUpdateProfile: (formData: FormData) => Promise<void>;
}

export default function EditProfileModal({ isOpen, onClose, currentProfile, onUpdateProfile }: EditProfileModalProps) {
    const [userName, setUserName] = useState(currentProfile.userName);
    const [bio, setBio] = useState(currentProfile.user_bio || '');
    const [instagram, setInstagram] = useState(currentProfile.instagram_id || '');
    const [portfolio, setPortfolio] = useState(currentProfile.portfolio_url || '');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState(currentProfile.avatarImage);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setUserName(currentProfile.userName);
            setBio(currentProfile.user_bio || '');
            setInstagram(currentProfile.instagram_id || '');
            setPortfolio(currentProfile.portfolio_url || '');
            setAvatarPreview(currentProfile.avatarImage);
            setAvatarFile(null);
        }
    }, [isOpen, currentProfile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData();
        if (userName.trim()) formData.append('userName', userName);

        // Validate bio
        if (!bio.trim()) {
            setIsLoading(false);
            return;
        }
        formData.append('user_bio', bio);

        if (instagram.trim()) formData.append('instagram_id', instagram);
        if (portfolio.trim()) formData.append('portfolio_url', portfolio);

        // Only append avatar if a new file was selected
        if (avatarFile) {
            formData.append('user_avatar', avatarFile);
        }

        try {
            await onUpdateProfile(formData);
            onClose();
        } catch (error) {
            console.error("Failed to update profile", error);
            // Handle error (toast, etc.) - Parent can also handle this
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-[var(--card-bg)] w-full max-w-lg rounded-3xl border border-[var(--muted)]/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-[var(--muted)]/10 flex justify-between items-center bg-[var(--background)]/50 backdrop-blur-md sticky top-0 z-10">
                    <h2 className="text-xl font-bold kedebideri-bold">Edit Profile</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-[var(--muted)]/10 transition-colors"
                    >
                        <X size={20} className="text-[var(--muted)]" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto no-scrollbar space-y-6">

                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <ImageDropzone
                            variant="circle"
                            currentImage={avatarPreview}
                            onFileSelect={(file) => {
                                setAvatarFile(file);
                                setAvatarPreview(URL.createObjectURL(file));
                            }}
                            description="Click to upload new avatar"
                            maxSize={MAX_FILE_SIZE}
                            validator={validateImage}
                        />
                    </div>

                    {/* Display Name (Requested to be userName now) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground)]">Username</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="w-full bg-[var(--background)] border border-[var(--muted)]/20 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all"
                                placeholder="Your Username"
                            />
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--foreground)]">Bio *</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className={`w-full bg-[var(--background)] border ${!bio.trim() && isLoading ? 'border-red-500' : 'border-[var(--muted)]/20'} rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all min-h-[100px] resize-none`}
                            placeholder="Tell us a little about yourself..."
                            maxLength={160}
                        />
                        <div className="flex justify-between items-center">
                            {!bio.trim() && isLoading && (
                                <span className="text-red-500 text-xs">Bio is required</span>
                            )}
                            <span className="text-xs text-[var(--muted)] ml-auto">{bio.length}/160</span>
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-[var(--foreground)]">Social Links</h3>

                        <div className="space-y-2">
                            <label className="text-xs text-[var(--muted)]">Instagram Username or URL</label>
                            <div className="relative">
                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
                                <input
                                    type="text"
                                    value={instagram}
                                    onChange={(e) => setInstagram(e.target.value)}
                                    className="w-full bg-[var(--background)] border border-[var(--muted)]/20 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all"
                                    placeholder="instagram_user"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-[var(--muted)]">Portfolio URL</label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={18} />
                                <input
                                    type="url"
                                    value={portfolio}
                                    onChange={(e) => setPortfolio(e.target.value)}
                                    className="w-full bg-[var(--background)] border border-[var(--muted)]/20 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all"
                                    placeholder="https://yourwebsite.com"
                                />
                            </div>
                        </div>
                    </div>

                </form>

                {/* Footer */}
                <div className="p-6 border-t border-[var(--muted)]/10 flex justify-end gap-3 bg-[var(--background)]/50 backdrop-blur-md sticky bottom-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl border border-[var(--muted)]/20 text-[var(--muted)] hover:bg-[var(--muted)]/10 transition-all font-medium"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 active:scale-95 transition-all font-medium shadow-lg shadow-[var(--accent)]/20 flex items-center gap-2"
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 size={18} className="animate-spin" />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
