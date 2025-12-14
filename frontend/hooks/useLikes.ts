import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';

export function useLikes(initialLikedIds: string[] = []) {
    const [likedImageIds, setLikedImageIds] = useState<Set<string>>(new Set(initialLikedIds));

    useEffect(() => {
        const fetchLikedImages = async () => {
            try {
                const response = await api.get('/image/liked-images');
                if (response.data && Array.isArray(response.data.data)) {
                    setLikedImageIds(prev => {
                        const newSet = new Set(prev);
                        response.data.data.forEach((id: string) => newSet.add(id));
                        return newSet;
                    });
                }
            } catch (error) {
                // Silently fail or log, specific error handling depends on requirements (e.g. 401 if not logged in)
                console.error("Failed to fetch liked images:", error);
            }
        };

        fetchLikedImages();
    }, []);

    const toggleLike = async (id: string) => {
        const isCurrentlyLiked = likedImageIds.has(id);
        const newStatus = !isCurrentlyLiked;

        // Optimistic Update
        setLikedImageIds(prev => {
            const newSet = new Set(prev);
            if (isCurrentlyLiked) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });

        try {
            const endpoint = newStatus ? '/image/like' : '/image/unlike';
            await api.post(endpoint, {
                imageId: id,
                like: newStatus
            });
        } catch (error) {
            console.error("Failed to update like status", error);
            // Revert state on failure
            setLikedImageIds(prev => {
                const newSet = new Set(prev);
                if (isCurrentlyLiked) {
                    newSet.add(id);
                } else {
                    newSet.delete(id);
                }
                return newSet;
            });
        }
    };

    const isLiked = useCallback((id: string) => likedImageIds.has(id), [likedImageIds]);

    const syncLikes = useCallback((ids: string[]) => {
        setLikedImageIds(new Set(ids));
    }, []);

    return { isLiked, toggleLike, syncLikes };
}
