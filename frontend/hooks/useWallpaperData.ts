import { useState, useEffect, useRef, useCallback } from 'react';
import { WallpaperImage, getImages } from '@/lib/data';

export function useWallpaperData(initialImages: WallpaperImage[]) {
    const [images, setImages] = useState<WallpaperImage[]>(initialImages);
    const [page, setPage] = useState(100);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver | null>(null);

    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && page < 1000) {
                setPage(prevPage => prevPage + 100);
            }
        }, {
            rootMargin: '1000px',
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

    return { images, loading, hasMore, lastElementRef, page };
}
