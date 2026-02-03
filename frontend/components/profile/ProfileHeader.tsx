import React from 'react';
import Image from 'next/image';
import { Pencil, Instagram, Globe, LogOut } from 'lucide-react';
import { APIUserProfile } from '@/types';

interface ProfileHeaderProps {
    userProfile: APIUserProfile;
    onEditClick: () => void;
}

export default function ProfileHeader({ userProfile, onEditClick }: ProfileHeaderProps) {
    return (
        <div className="flex flex-col items-center mb-12">
            <div className="relative w-32 h-32 mb-4">
                {userProfile.avatarImage ? (
                    <Image
                        src={userProfile.avatarImage}
                        alt={userProfile.userName}
                        fill
                        className="rounded-full object-cover border-4 border-card-bg shadow-lg"
                    />
                ) : (
                    <div className="w-full h-full rounded-full bg-muted/20 flex items-center justify-center text-4xl font-bold text-muted">
                        {userProfile.userName?.charAt(0) || 'U'}
                    </div>
                )}

                {/* Edit Profile Button Overlay */}
                <button
                    onClick={onEditClick}
                    className="absolute cursor-pointer bottom-0 right-0 p-2 bg-[var(--accent)] rounded-full text-white shadow-lg hover:scale-110 active:scale-95 transition-all border-2 border-[var(--background)]"
                    title="Edit Profile"
                >
                    <Pencil size={16} />
                </button>
            </div>
            <h1 className="text-3xl font-bold mb-2 kedebideri-bold">{userProfile.userName}</h1>

            {userProfile.user_bio ? (
                <p className="text-muted text-center max-w-md mb-4">
                    {userProfile.user_bio}
                </p>
            ) : (
                <p className="text-muted text-center max-w-md mb-4">
                    Wallpaper enthusiast. Creating and collecting the best aesthetics.
                </p>
            )}


            <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
                {userProfile.instagram_id && (
                    <a
                        href={`${userProfile.instagram_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-full bg-[#E1306C]/5 border border-[#E1306C]/30 text-[#E1306C] shadow-md shadow-[#E1306C]/10 hover:bg-[var(--card-bg)] hover:border-[var(--muted)]/20 hover:text-[var(--muted)] hover:shadow-sm transition-all duration-300 group"
                        aria-label={`Instagram: @${userProfile.instagram_id}`}
                    >
                        <Instagram size={20} className="group-hover:scale-110 transition-transform duration-300" />
                    </a>
                )}

                {userProfile.portfolio_url && (
                    <a
                        href={userProfile.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-full bg-blue-500/5 border border-blue-500/30 text-blue-500 shadow-md shadow-blue-500/10 hover:bg-[var(--card-bg)] hover:border-[var(--muted)]/20 hover:text-[var(--muted)] hover:shadow-sm transition-all duration-300 group"
                        aria-label="Portfolio"
                    >
                        <Globe size={20} className="group-hover:scale-110 transition-transform duration-300" />
                    </a>
                )}
            </div>

            {!userProfile.instagram_id && !userProfile.portfolio_url && <div className="mb-6"></div>}
        </div>
    );
}
