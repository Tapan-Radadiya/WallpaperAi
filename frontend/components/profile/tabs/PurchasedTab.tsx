import React from 'react';
import { ShoppingBag } from 'lucide-react';
import ImageCard from '@/components/ImageCard';
import { useMasonryGrid } from '@/hooks/useMasonryGrid';
import { WallpaperImage } from '@/lib/data';

interface PurchasedTabProps {
    images: WallpaperImage[];
    isLoading: boolean;
    onImageClick: (image: WallpaperImage) => void;
    isLiked: (id: string) => boolean;
    onToggleLike: (id: string) => void;
}

export default function PurchasedTab({ images, isLoading, onImageClick, isLiked, onToggleLike }: PurchasedTabProps) {
    const { columns } = useMasonryGrid(images);

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
        );
    }

    if (images.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-muted/10 flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 opacity-50" />
                </div>
                <p>No purchased images yet.</p>
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
