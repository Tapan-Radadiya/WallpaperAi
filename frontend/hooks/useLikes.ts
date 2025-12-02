import { useState } from 'react';

export function useLikes() {
    const [likedImageIds, setLikedImageIds] = useState<Set<string>>(new Set());

    const toggleLike = (id: string) => {
        setLikedImageIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const isLiked = (id: string) => likedImageIds.has(id);

    return { isLiked, toggleLike };
}
