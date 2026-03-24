'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { WallpaperImage } from '@/lib/data';
import api from '@/lib/api';
import { Heart, Bookmark, Share2, Info, ChevronDown, Download, Check, ArrowLeft, MoreHorizontal, Lock } from 'lucide-react';
import ImageCard from './ImageCard';

interface ImageDetailsMobileProps {
    image: WallpaperImage;
    relatedImages?: WallpaperImage[];
    onLike?: () => void;
    isLiked?: boolean;
    onRelatedImageClick?: (image: WallpaperImage) => void;
    onClose?: () => void;
    likesCount: number;
    downloadCount: number;
    hasPurchased: boolean;
    fetchedPrice: number | null;
}

export default function ImageDetailsMobile({
    image,
    relatedImages = [],
    onLike,
    isLiked,
    onRelatedImageClick,
    onClose,
    likesCount,
    downloadCount,
    hasPurchased,
    fetchedPrice
}: ImageDetailsMobileProps) {
    const { user } = useAuth();
    const router = useRouter(); 
    const [isDownloading, setIsDownloading] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);

    const isOwner = user?.id === image.userId;
    const isPremiumLocked = image.is_paid && !hasPurchased && !isOwner;

    const handleDownload = async (url: string, filename: string) => {
        if (!url) {
            console.error("Download failed: URL is missing");
            return;
        }

        // Fire and forget download count update
        api.patch(`/image/update-download-count/${image.id}`).catch(e => console.error("Error updating download count", e));

        try {
            setIsDownloading(true);
            setShowDownloadMenu(false);

            const res = await fetch(url, {
                method: 'GET',
                mode: 'cors',
            });

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error("Download failed, using fallback:", error);
            window.open(url, '_blank');
        } finally {
            setIsDownloading(false);
        }
    };

    const stats = [
        { label: 'Resolution', value: `${image.width} x ${image.height}` },
        { label: 'Size', value: '14.2 MB' }, // Placeholder size
        { label: 'Likes', value: likesCount.toLocaleString() },
        { label: 'Downloads', value: downloadCount.toLocaleString() },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-[var(--background)] relative lg:hidden">
            {/* Top Navigation */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20">
                <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-black/50 text-white backdrop-blur-sm"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex gap-2">
                    <button className="p-2 rounded-full bg-black/50 text-white backdrop-blur-sm">
                        <Share2 size={20} />
                    </button>
                    <button className="p-2 rounded-full bg-black/50 text-white backdrop-blur-sm">
                        <MoreHorizontal size={20} />
                    </button>
                </div>
            </div>

            {/* Main Image Section */}
            {/* Main Image Section */}
            <div className="relative w-full bg-black/5 flex justify-center">
                <div className="relative w-full max-h-[75vh]">
                    <img
                        src={image.rawUrl}
                        alt={image.description || 'Wallpaper'}
                        className="w-full h-auto max-h-[75vh] object-contain mx-auto"
                    />

                    {/* Floating Actions Overlay */}
                    <div className="absolute bottom-4 right-4 flex flex-col gap-3">
                        <button
                            onClick={onLike}
                            className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white transition-all shadow-sm"
                        >
                            <Heart size={24} className={isLiked ? "fill-red-500 text-red-500" : ""} />
                        </button>
                        <button className="p-3 rounded-full bg-black/40 backdrop-blur-md text-white transition-all shadow-sm">
                            <Bookmark size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="px-5 pt-6">
                {/* User Info */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[var(--muted)]/20">
                            <Image
                                src={image.userAvatar || '/placeholder-avatar.png'}
                                alt={image.userName}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div>
                            <h3 className="font-bold text-[var(--foreground)]">{image.userName}</h3>
                            <p className="text-xs text-[var(--muted)]">Professional Curator</p>
                        </div>
                    </div>
                    <button className="px-5 py-2 rounded-full border border-[var(--muted)]/20 text-xs font-bold hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all uppercase tracking-wide">
                        Follow
                    </button>
                </div>

                {/* Title & Description */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-3 kedebideri-bold tracking-tight">
                        {image.title || "Untitled Artwork"}
                    </h1>
                    <p className="text-sm text-[var(--muted)] leading-relaxed">
                        {image.description || "A stunning visual composition capturing the essence of the moment. Perfect for high-resolution displays."}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-8">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-[var(--muted)]/5 border border-[var(--muted)]/10">
                            <p className="text-xs text-[var(--muted)] mb-1 uppercase tracking-wider font-semibold">{stat.label}</p>
                            <p className="font-bold text-[var(--foreground)]">{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Similar Images */}
                {relatedImages.length > 0 && (
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Similar Images</h3>
                            <button
                                onClick={() => {
                                    onClose?.();
                                    router.push('/');
                                }}
                                className="text-sm font-medium text-[var(--accent)] hover:underline transition-colors"
                            >
                                See all
                            </button>
                        </div>
                        <div className="flex overflow-x-auto gap-4 pb-4 -mx-5 px-5 scrollbar-hide">
                            {relatedImages.map((img) => (
                                <div
                                    key={img.id}
                                    className="relative min-w-[140px] aspect-[3/4] rounded-xl overflow-hidden cursor-pointer"
                                    onClick={() => onRelatedImageClick?.(img)}
                                >
                                    <Image
                                        src={img.thumbnailUrl}
                                        alt={img.title || 'Similar image'}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Static Download / Purchase Button for Mobile */}
            <div className="w-full p-4 mt-auto">
                {isOwner ? (
                    <button disabled className="w-full py-4 bg-[var(--muted)]/20 text-[var(--muted)] rounded-full font-bold text-lg flex items-center justify-center gap-2 shadow-sm cursor-not-allowed border border-[var(--muted)]/10">
                        <Check size={20} />
                        <span>Your Owned Image</span>
                    </button>
                ) : isPremiumLocked ? (
                    <button
                        onClick={() => alert('Purchase flow to be integrated')}
                        className="w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black rounded-full font-bold text-lg flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-transform"
                    >
                        <Lock size={20} className="text-black/80" />
                        <span>Unlock Premium | ${fetchedPrice ?? image.price ?? '2.99'}</span>
                    </button>
                ) : (
                    <div className="relative">
                        <button
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                        disabled={isDownloading}
                        className="w-full py-4 bg-[var(--foreground)] text-[var(--background)] rounded-full font-bold text-lg flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-transform"
                    >
                        {isDownloading ? (
                            <div className="w-6 h-6 border-2 border-[var(--background)] border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Download Free</span>
                                <ChevronDown size={20} className={`opacity-70 transition-transform duration-200 ${showDownloadMenu ? 'rotate-180' : ''}`} />
                            </>
                        )}
                    </button>
                    {/* Download Menu */}
                    {showDownloadMenu && (
                        <div className="absolute bottom-full left-0 right-0 mb-4 bg-[var(--card-bg)] border border-[var(--muted)]/20 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 z-50 mx-auto">
                            <div className="p-2">
                                <button
                                    onClick={() => handleDownload(image.rawUrl, `wallpaper-${image.id}-original.jpg`)}
                                    className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-[var(--muted)]/10 transition-colors"
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="font-bold text-[var(--foreground)]">Original</span>
                                        <span className="text-xs text-[var(--muted)]">{image.width} x {image.height}</span>
                                    </div>
                                    <Download size={20} />
                                </button>
                                <button
                                    onClick={() => handleDownload(image.thumbnailUrl, `wallpaper-${image.id}-small.jpg`)}
                                    className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-[var(--muted)]/10 transition-colors border-t border-[var(--muted)]/10"
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="font-bold text-[var(--foreground)]">Small</span>
                                        <span className="text-xs text-[var(--muted)]">Thumbnail</span>
                                    </div>
                                    <Download size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                )}
            </div>
        </div>
    );
}
