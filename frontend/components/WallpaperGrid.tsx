'use client';

import { WallpaperImage, PurchasedItem } from '@/lib/data';
import ImageCard from './ImageCard';
import Modal from './Modal';
import { useState } from 'react';
import ImageDetails from './ImageDetails';
import { useWallpaperData } from '@/hooks/useWallpaperData';
import { useMasonryGrid } from '@/hooks/useMasonryGrid';
import { useLikes } from '@/hooks/useLikes';

export default function WallpaperGrid({ initialImages, purchasedIds, isMobile }: { initialImages: WallpaperImage[], purchasedIds?: PurchasedItem[] | string[], isMobile?: boolean }) {
    const { images, loading, hasMore, lastElementRef, page } = useWallpaperData(initialImages, purchasedIds);
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
            >
                {selectedImage && (
                    <ImageDetails
                        key={selectedImage.id}
                        image={selectedImage}
                        relatedImages={images.slice(0, 10)}
                        isLiked={isLiked(selectedImage.id)}
                        onLike={() => toggleLike(selectedImage.id)}
                        onRelatedImageClick={setSelectedImage}
                        onClose={handleCloseModal}
                    />
                )}
            </Modal>
        </>
    );
}
