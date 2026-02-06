import React from 'react';
import ImageCard from '@/components/ImageCard';
import { useMasonryGrid } from '@/hooks/useMasonryGrid';
import { WallpaperImage } from '@/lib/data';

interface UploadsTabProps {
    images: WallpaperImage[];
    isLoading: boolean;
    onImageClick: (image: WallpaperImage) => void;
    isLiked: (id: string) => boolean;
    onToggleLike: (id: string) => void;
}

export default function UploadsTab({ images, isLoading, onImageClick, isLiked, onToggleLike }: UploadsTabProps) {
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
                    <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <p>No uploads yet.</p>
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
