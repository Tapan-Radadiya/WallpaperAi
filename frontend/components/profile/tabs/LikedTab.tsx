import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import ImageCard from '@/components/ImageCard';
import { useMasonryGrid } from '@/hooks/useMasonryGrid';
import { WallpaperImage } from '@/lib/data';

interface LikedTabProps {
    images: WallpaperImage[];
    onImageClick: (image: WallpaperImage) => void;
    isLiked: (id: string) => boolean;
    onToggleLike: (id: string) => void;
}

export default function LikedTab({ images, onImageClick, isLiked, onToggleLike }: LikedTabProps) {
    const { columns } = useMasonryGrid(images);

    if (images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-muted/10 flex items-center justify-center">
                    <Heart className="w-8 h-8 opacity-50" />
                </div>
                <p>
                    No liked images yet.{' '}
                    <Link href="/" className="text-[var(--accent)] hover:underline font-medium">
                        Go explore!
                    </Link>
                </p>
            </div>
        );
    }

    return (
        <div className="flex gap-4">
            {columns.map((colImages, colIndex) => (
                <div key={colIndex} className="flex-1 flex flex-col gap-4">
                    {colImages.map((image) => (
                        <ImageCard
                            key={image.id}
                            image={image}
                            onClick={() => onImageClick(image)}
                            isLiked={isLiked(image.id)}
                            onToggleLike={() => onToggleLike(image.id)}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}
