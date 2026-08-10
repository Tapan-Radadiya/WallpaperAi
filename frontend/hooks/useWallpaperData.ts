import { useState, useEffect, useRef, useCallback } from 'react';
import { WallpaperImage, getImages } from '@/lib/data';

export function useWallpaperData(initialImages: WallpaperImage[], purchasedIds?: string[]) {
    // Initial images are page 0
    const [images, setImages] = useState<WallpaperImage[]>(initialImages);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observer = useRef<IntersectionObserver | null>(null);

    // Update images when initialImages changes (e.g. initial server-side render or re-navigation)
    useEffect(() => {
        setImages(initialImages);
        setPage(0); // Reset page to 0 when initial images change
        setHasMore(true); // Reset hasMore
    }, [initialImages]);

    useEffect(() => {
        // Skip fetching if page is 0, since we already have initialImages
        // But if we navigated back or something and page was reset to 0, initialImages logic above handles it.
        // We only want to fetch if getting page 1+. 
        // OR: If we want to support refetching page 0, we'd need different logic.
        // For infinite scroll starting with server data:
        // Server data = Page 0.
        // Next load = Page 1.
        if (page === 0) return;

        const loadMoreImages = async () => {
            setLoading(true);
            try {
                const newImages = await getImages(page, purchasedIds);
                if (newImages.length > 0) {
                    setImages(prev => {
                        const existingIds = new Set(prev.map(img => img.id));
                        const uniqueNewImages = newImages.filter(img => !existingIds.has(img.id));
                        return [...prev, ...uniqueNewImages];
                    });
                }
                
                if (newImages.length < 100) {
                    setHasMore(false);
                }
            } catch (error) {
                console.error("Failed to load more images", error);
            } finally {
                setLoading(false);
            }
        };

        loadMoreImages();
    }, [page]);

    const lastElementRef = useCallback((node: HTMLDivElement) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        }, {
            rootMargin: '1000px', // Pre-fetch before reaching bottom
        });

        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    return { images, loading, hasMore, lastElementRef, page };
}
