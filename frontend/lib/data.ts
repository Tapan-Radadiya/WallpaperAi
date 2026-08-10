import api from './api';

export interface OwnerData {
    userName: string;
    userAvatar: string;
    userId: string;
}

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
    ownerData?: OwnerData;
    title?: string;
    is_paid?: boolean;
    purchased_image?: boolean;
    price?: number;
    publishedOn?: string;
    waterMarked_url?: string;
    preview_url?: string;
}

const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_AWS_CLOUDFRONT || '';

export const formatImageUrl = (url?: string): string => {
    if (!url) return '';
    // Prepend CloudFront URL or at least a slash
    const baseUrl = CLOUDFRONT_URL.endsWith('/') ? CLOUDFRONT_URL.slice(0, -1) : CLOUDFRONT_URL;
    return `${baseUrl}/${url}`;
};

export async function getUserPurchases(): Promise<string[]> {
    try {
        let headers: Record<string, string> = {};
        if (typeof window === 'undefined') {
            const { cookies } = await import('next/headers');
            const cookieStore = await cookies();
            const allCookies = cookieStore.getAll();
            const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join(';');
            if (!cookieHeader) {
                return [];
            }
            headers['Cookie'] = cookieHeader;
        }
        const response = await api.get('/user/get-user-purchases', { headers });
        if (response.data && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        return [];
    }
}

export async function getImages(page: number = 0, purchasedIds?: string[]): Promise<WallpaperImage[]> {
    try {
        let purchasedSet: Set<string>;
        if (purchasedIds) {
            purchasedSet = new Set(purchasedIds);
        } else {
            const userPurchases = await getUserPurchases();
            purchasedSet = new Set(userPurchases);
        }

        const response = await api.get(`/image/data?page=${page}`);
        return (response.data.data || []).map((img: any) => {
            const owner = img.ownerData || {};
            const userName = owner.userName || img.userName || '';
            const rawAvatar = owner.userAvatar || owner.avatar || img.userAvatar || img.avatar || '';
            const userAvatar = formatImageUrl(rawAvatar);
            const userId = owner.userId || owner.id || img.userId || img.id || '';
            const isPurchased = purchasedSet.has(img.id) || purchasedSet.has(img.image_id);

            return {
                ...img,
                userName,
                userAvatar,
                userId,
                ownerData: {
                    userName,
                    userAvatar,
                    userId,
                },
                rawUrl: formatImageUrl(img.rawUrl),
                thumbnailUrl: formatImageUrl(img.thumbnailUrl),
                waterMarked_url: formatImageUrl(img.waterMarked_url),
                preview_url: formatImageUrl(img.preview_url),
                title: img.title,
                is_paid: isPurchased ? false : img.is_paid,
                purchased_image: isPurchased || img.purchased_image,
                price: img.price,
                publishedOn: img.publishedOn,
            };
        });
    } catch (error) {
        console.error('Error fetching images:', error);
        return [];
    }
}
