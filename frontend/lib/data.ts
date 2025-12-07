import api from './api';

export interface WallpaperImage {
    id: string;
    width: number;
    height: number;
    imageUrl: {
        raw: string;
        full: string;
        small: string;
        thumb: string;
        regular: string;
        small_s3: string;
    };
    alt_text: string;
    description: string;
    userName: string;
    userAvatar: string;
    userId: string;
    // Keeping created_at optional as it's not in the new sample but might still be there or needed
    created_at?: string;
    // source might be removed or kept if used elsewhere, but not in sample. Keeping compatible if code uses it, 
    // but the sample "id" is UUID, so it's likely our backend ID.
}

export async function getImages(page: number = 0): Promise<WallpaperImage[]> {
    try {
        const response = await api.get(`/image?page=${page}`);
        // Assuming the API returns the same structure: { statusCode, message, data: [...] }
        // If the API returns the array directly, remove .data.data and use .data
        return response.data.data;
    } catch (error) {
        console.error('Error fetching images:', error);
        return [];
    }
}
