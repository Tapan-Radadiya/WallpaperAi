import Image from 'next/image';
import { WallpaperImage } from '@/lib/data';
import { Maximize2, Heart, Crown } from 'lucide-react';
import { useState, useRef } from 'react';

interface ImageCardProps {
    image: WallpaperImage;
    onClick?: () => void;
    isLiked?: boolean;
    onToggleLike?: () => void;
}

export default function ImageCard({ image, onClick, isLiked, onToggleLike }: ImageCardProps) {
    const [showHeartAnimation, setShowHeartAnimation] = useState(false);
    const clickTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleCardClick = () => {
        if (clickTimeout.current) {
            // Double click detected
            clearTimeout(clickTimeout.current);
            clickTimeout.current = null;

            if (!isLiked) {
                onToggleLike?.();
            }
            setShowHeartAnimation(true);
            setTimeout(() => setShowHeartAnimation(false), 1000);
        } else {
            // Single click - wait for potential second click
            clickTimeout.current = setTimeout(() => {
                clickTimeout.current = null;
                onClick?.();
            }, 250);
        }
    };

    return (
        <div
            className="group relative mb-4 break-inside-avoid rounded-xl overflow-hidden bg-card-bg shadow-sm hover:shadow-xl transition-all duration-300 border border-muted/10 cursor-pointer"
            onClick={handleCardClick}
        >
            <div className="relative w-full">
                <Image
                    src={(image.is_paid && image.waterMarked_url) ? image.waterMarked_url : image.rawUrl}
                    alt={image.description || 'Wallpaper'}
                    width={image.width}
                    height={image.height}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-black/50 rounded-full p-3 text-white backdrop-blur-sm transform scale-75 group-hover:scale-100 transition-all duration-300">
                        <Maximize2 size={24} className="transform rotate-45" />
                    </div>
                </div>

                {/* Premium Badge */}
                {image.is_paid && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-1.5 z-10 pointer-events-none">
                        <Crown size={14} className="text-yellow-400" />
                        <span className="text-white text-[11px] font-bold uppercase tracking-wider">Premium</span>
                    </div>
                )}

                {/* Heart Animation Overlay */}
                {showHeartAnimation && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <Heart
                            size={80}
                            className="text-white fill-white animate-ping"
                            style={{ animationDuration: '1s' }}
                        />
                    </div>
                )}

                {/* Like Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleLike?.();
                    }}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm transition-all duration-300 z-10 opacity-0 group-hover:opacity-100"
                >
                    <Heart
                        size={20}
                        className={`transition-colors duration-300 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`}
                    />
                </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                <p className="text-white text-sm font-medium truncate">
                    {image.title || image.description || 'Untitled'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                    {image.userAvatar && (
                        <div className="relative w-4 h-4 rounded-full overflow-hidden">
                            {/* Optimized avatar could be here if needed, simple img for now or next/image */}
                            <img src={image.userAvatar} alt={image.userName} className="w-full h-full object-cover" />
                        </div>
                    )}
                    <p className="text-white/80 text-xs">
                        {image.userName || 'Unknown Photographer'}
                    </p>
                </div>
            </div>
        </div>
    );
}
