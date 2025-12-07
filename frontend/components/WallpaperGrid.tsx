'use client';

import { WallpaperImage } from '@/lib/data';
import ImageCard from './ImageCard';
import Modal from './Modal';
import { useState } from 'react';
import Image from 'next/image';
import { useWallpaperData } from '@/hooks/useWallpaperData';
import { useMasonryGrid } from '@/hooks/useMasonryGrid';
import { useLikes } from '@/hooks/useLikes';

export default function WallpaperGrid({ initialImages, isMobile }: { initialImages: WallpaperImage[], isMobile?: boolean }) {
    const { images, loading, hasMore, lastElementRef, page } = useWallpaperData(initialImages);
    const { columns } = useMasonryGrid(images, isMobile);
    const { isLiked, toggleLike } = useLikes();
    const [selectedImage, setSelectedImage] = useState<WallpaperImage | null>(null);

    const handleImageClick = (image: WallpaperImage) => {
        setSelectedImage(image);
    };

    const handleCloseModal = () => {
        setSelectedImage(null);
    };

    return (
        <>
            <div className="space-y-8 pb-8">
                <div className="flex gap-4 p-4">
                    {columns.map((colImages, colIndex) => (
                        <div key={colIndex} className="flex-1 flex flex-col gap-4">
                            {colImages.map((image) => (
                                <ImageCard
                                    key={image.id}
                                    image={image}
                                    onClick={() => handleImageClick(image)}
                                    isLiked={isLiked(image.id)}
                                    onToggleLike={() => toggleLike(image.id)}
                                />
                            ))}
                        </div>
                    ))}
                </div>

                {/* Sentinel for infinite scroll */}
                <div ref={lastElementRef} className="h-4 w-full" />

                {loading && (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                    </div>
                )}

                {(!hasMore) && (
                    <div className="text-center py-8">
                        <p className="text-lg font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent animate-pulse">
                            Our photographers are capturing more moments for you...
                        </p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={!!selectedImage}
                onClose={handleCloseModal}
                downloadUrl={selectedImage?.imageUrl.full || selectedImage?.imageUrl.regular}
                downloadName={`wallpaper-${selectedImage?.id}`}
            >
                {selectedImage && (
                    <div className="relative w-full h-[80vh] md:h-[90vh]">
                        <Image
                            src={selectedImage.imageUrl.full || selectedImage.imageUrl.regular}
                            alt={selectedImage.alt_text || 'Wallpaper'}
                            fill
                            className="object-contain"
                            sizes="100vw"
                            priority
                            quality={100}
                        />
                    </div>
                )}
            </Modal>
        </>
    );
}
