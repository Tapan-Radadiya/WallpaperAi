import React from 'react';
import { APIUserProfile } from '@/types';

interface ProfileStatsProps {
    userProfile: APIUserProfile;
    likesCount: number;
}

export default function ProfileStats({ userProfile, likesCount }: ProfileStatsProps) {
    return (
        <div className="flex gap-6 text-sm mb-8 justify-center">
            <div className="text-center">
                <span className="block font-bold text-lg">128</span>
                <span className="text-muted">Following</span>
            </div>
            <div className="text-center">
                <span className="block font-bold text-lg">843</span>
                <span className="text-muted">Followers</span>
            </div>
            <div className="text-center group relative cursor-help">
                <span className="block font-bold text-lg">{userProfile.totalLikesOnUploads || 0}</span>
                <span className="text-muted border-b border-dotted border-muted/50">Likes</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-popover text-popover-foreground text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-border z-10">
                    Total likes received on your uploads
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover"></div>
                </div>
            </div>
            <div className="text-center">
                <span className="block font-bold text-lg">{userProfile.totalUploads}</span>
                <span className="text-muted">Uploads</span>
            </div>
        </div>
    );
}
