'use client';

import { WallpaperImage, getImages } from '@/lib/data';
import ImageCard from './ImageCard';
import { useEffect, useState, useRef, useCallback } from 'react';

export default function WallpaperGrid({ initialImages }: { initialImages: WallpaperImage[] }) {
    const [images, setImages] = useState<WallpaperImage[]>(initialImages);
    const [page, setPage] = useState(100);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [columns, setColumns] = useState<WallpaperImage[][]>([[], [], [], []]);
    const [numColumns, setNumColumns] = useState(4);
    const observer = useRef<IntersectionObserver | null>(null);

    // Determine number of columns based on window width
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) setNumColumns(1);
            else if (width < 1024) setNumColumns(2);
            else if (width < 1280) setNumColumns(3);
            else setNumColumns(4);
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Distribute images into columns
    useEffect(() => {
        const newColumns: WallpaperImage[][] = Array.from({ length: numColumns }, () => []);
        images.forEach((image, index) => {
            newColumns[index % numColumns].push(image);
        });
        setColumns(newColumns);
    }, [images, numColumns]);

    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && page < 1000) {
                setPage(prevPage => prevPage + 100);
            }
        }, {
            rootMargin: '1000px', // Pre-fetch when within 1000px of the bottom
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore, page]);

    useEffect(() => {
        if (page === 100) return;

        const loadMoreImages = async () => {
            setLoading(true);
            try {
                const newImages = await getImages(page);
                if (newImages.length === 0) {
                    setHasMore(false);
                } else {
                    setImages(prev => {
                        const existingIds = new Set(prev.map(img => img.id));
                        const uniqueNewImages = newImages.filter(img => !existingIds.has(img.id));
                        return [...prev, ...uniqueNewImages];
                    });
                }
            } catch (error) {
                console.error("Failed to load more images", error);
            } finally {
                setLoading(false);
            }
        };

        loadMoreImages();
    }, [page]);

    return (
        <div className="space-y-8 pb-8">
            <div className="flex gap-4 p-4">
                {columns.map((colImages, colIndex) => (
                    <div key={colIndex} className="flex-1 flex flex-col gap-4">
                        {colImages.map((image) => (
                            <ImageCard key={image.id} image={image} />
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

            {(!hasMore || page >= 1000) && (
                <div className="text-center py-8">
                    <p className="text-lg font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent animate-pulse">
                        Our photographers are capturing more moments for you...
                    </p>
                </div>
            )}
        </div>
    );
}
