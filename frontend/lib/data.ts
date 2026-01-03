import api from './api';

export interface WallpaperImage {
    id: string;
    width: number;
    height: number;
    rawUrl: string;
    thumbnailUrl: string;
    description: string;
    userName: string;
    userAvatar: string;
    userId: string;
}

export async function getImages(page: number = 0): Promise<WallpaperImage[]> {
    try {
        const response = await api.get(`/image/data?page=${page}`);
        // Adjust endpoint to feed if needed, or keep /image depending on API
        // User didn't specify endpoint name for feed, but /image usually implies feed or list.
        // Assuming API returns array of objects matching the new structure
        return (response.data.data || []).map((img: any) => ({
            ...img,
            rawUrl: img.rawUrl,
            thumbnailUrl: img.thumbnailUrl,
            userAvatar: img.userAvatar
        }));
    } catch (error) {
        console.error('Error fetching images:', error);
        return [];
    }
}
