'use client';

import React from 'react';
import Image from 'next/image';
import { WallpaperImage } from '@/lib/data';
import api from '@/lib/api';
import { Heart, Bookmark, Share2, Info, ChevronDown } from 'lucide-react';
import ImageCard from './ImageCard';

interface ImageDetailsProps {
    image: WallpaperImage;
    relatedImages?: WallpaperImage[];
    onDownload?: () => void;
    onLike?: () => void;
    isLiked?: boolean;
    onRelatedImageClick?: (image: WallpaperImage) => void;
}

export default function ImageDetails({ image, relatedImages = [], onDownload, onLike, isLiked, onRelatedImageClick }: ImageDetailsProps) {
    const [isFullSize, setIsFullSize] = React.useState(false);
    const [likesCount, setLikesCount] = React.useState<number>(0);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Scroll to top when image changes
    React.useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [image.id]);

    // Fetch detailed image data (likes)
    React.useEffect(() => {
        const fetchImageDetails = async () => {
            try {
                const res = await api.get(`/image/image-data/${image.id}`);
                if (res.data && typeof res.data.imageLikes === 'number') {
                    setLikesCount(res.data.imageLikes);
                }
            } catch (err) {
                console.error("Failed to fetch image details:", err);
            }
        };
        fetchImageDetails();
    }, [image.id]);


    // Mock data for UI that is not in the data model yet
    const stats = [
        { label: 'Resolution', value: `${image.width} x ${image.height}` },
        { label: 'Size', value: '14.2 MB' },
        { label: 'Format', value: 'RAW' },
        { label: 'Likes', value: likesCount.toLocaleString() },
    ];

    return (
        <div
            ref={containerRef}
            className="flex flex-col bg-[var(--card-bg)] rounded-3xl overflow-hidden max-w-7xl w-full h-[95vh] shadow-2xl overflow-y-auto custom-scrollbar"
        >
            {/* Split View Container */}
            <div className="flex flex-col md:flex-row w-full min-h-[800px] md:h-auto">
                {/* Left Side: Main Image */}
                <div className="relative w-full md:w-[70%] bg-black/5 min-h-[50vh] md:min-h-full group">
                    <div
                        className="absolute inset-0 flex items-center justify-center p-2 md:p-4 cursor-zoom-in"
                        onClick={() => setIsFullSize(true)}
                    >
                        <Image
                            src={image.rawUrl}
                            alt={image.description || 'Wallpaper'}
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>

                    {/* Full Size Overlay */}
                    {isFullSize && (
                        <div
                            className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsFullSize(false);
                            }}
                        >
                            <div className="relative w-full h-full">
                                <Image
                                    src={image.rawUrl}
                                    alt={image.description || 'Wallpaper'}
                                    fill
                                    className="object-contain"
                                    priority
                                    quality={100}
                                />
                            </div>
                            <button
                                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsFullSize(false);
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    )}

                    {/* Floating Actions Overlay */}
                    <div className="absolute top-6 right-6 flex flex-col gap-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                            onClick={(e) => { e.stopPropagation(); onLike?.(); }}
                            className="p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                        >
                            <Heart size={20} className={isLiked ? "fill-red-500 text-red-500" : ""} />
                        </button>
                        <button className="p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm">
                            <Bookmark size={20} />
                        </button>
                        <button className="p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm">
                            <Share2 size={20} />
                        </button>
                        <button className="p-3 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm">
                            <Info size={20} />
                        </button>
                    </div>
                </div>

                {/* Right Side: Sidebar Details */}
                <div className="w-full md:w-[30%] bg-[var(--background)] p-6 md:p-8 flex flex-col border-l border-[var(--muted)]/10 text-left">
                    {/* User Header */}
                    <div className="flex items-center justify-between mb-8">
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
                                <h3 className="font-bold text-[var(--foreground)] leading-none mb-1">{image.userName}</h3>
                                <p className="text-xs text-[var(--muted)]">Professional Curator</p>
                            </div>
                        </div>
                        <button className="px-5 py-2 rounded-full border border-[var(--muted)]/20 text-xs font-bold hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-all uppercase tracking-wide">
                            Follow
                        </button>
                    </div>

                    {/* Title & Description */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-3 kedebideri-bold tracking-tight">
                            {image.title || "Untitled Artwork"}
                        </h2>
                        <p className="text-sm text-[var(--muted)] leading-relaxed">
                            {image.description || "A stunning visual composition capturing the essence of the moment. Perfect for high-resolution displays."}
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        {stats.map((stat, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-[var(--muted)]/5 border border-[var(--muted)]/10">
                                <p className="text-xs text-[var(--muted)] mb-1 uppercase tracking-wider font-semibold">{stat.label}</p>
                                <p className="font-bold text-[var(--foreground)]">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Download Button */}
                    <div className="mt-auto pt-4">
                        <button
                            onClick={onDownload}
                            className="w-full py-4 bg-[var(--foreground)] text-[var(--background)] rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-[var(--foreground)]/10 group"
                        >
                            <span>Download Free</span>
                            <ChevronDown size={20} className="ml-2 opacity-70" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Similar Images Section */}
            {relatedImages.length > 0 && (
                <div className="p-8 border-t border-[var(--muted)]/10 bg-[var(--background)] min-h-[500px]">
                    <h1 className="text-3xl font-bold text-[var(--foreground)] mb-6 kedebideri-bold">Similar Images</h1>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {relatedImages.map((img) => (
                            <div key={img.id} className="cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all">
                                <ImageCard
                                    image={img}
                                    isLiked={false}
                                    onToggleLike={() => { }}
                                    onClick={() => onRelatedImageClick?.(img)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
