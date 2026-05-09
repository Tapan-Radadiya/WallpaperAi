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
    title?: string;
    is_paid?: boolean;
    price?: number;
    publishedOn?: string;
    waterMarked_url?: string;
    preview_url?: string;
}

const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_AWS_CLOUDFRONT || '';

export const formatImageUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
        return url;
    }
    // Prepend CloudFront URL or at least a slash
    const baseUrl = CLOUDFRONT_URL.endsWith('/') ? CLOUDFRONT_URL.slice(0, -1) : CLOUDFRONT_URL;
    return `${baseUrl}/${url}`;
};

export async function getImages(page: number = 0): Promise<WallpaperImage[]> {
    try {
        const response = await api.get(`/image/data?page=${page}`);
        return (response.data.data || []).map((img: any) => ({
            ...img,
            userName: img.userName,
            rawUrl: formatImageUrl(img.rawUrl),
            thumbnailUrl: formatImageUrl(img.thumbnailUrl),
            userAvatar: formatImageUrl(img.userAvatar),
            waterMarked_url: formatImageUrl(img.waterMarked_url),
            preview_url: formatImageUrl(img.preview_url),
            title: img.title,
            is_paid: img.is_paid,
            price: img.price,
            publishedOn: img.publishedOn,
        }));
    } catch (error) {
        console.error('Error fetching images:', error);
        return [];
    }
}
