import api from './api';

export interface WallpaperImage {
    source: string;
    id: string;
    width: number;
    height: number;
    imageUrl: {
        small: string;
        large: string;
        regular: string;
        downloadable: string;
    };
    alt_text: string;
    description: string;
    created_at: string;
}

export async function getImages(page: number = 100): Promise<WallpaperImage[]> {
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
