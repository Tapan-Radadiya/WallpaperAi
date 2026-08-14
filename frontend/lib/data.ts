import api from './api';
import { PurchasedItem } from '@/types';

export type { PurchasedItem };

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
    waterMarked_preview_url?: string;
    waterMarked_url?: string;
    preview_url?: string;
}

const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_AWS_CLOUDFRONT || '';

export const formatImageUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = CLOUDFRONT_URL.endsWith('/') ? CLOUDFRONT_URL.slice(0, -1) : CLOUDFRONT_URL;
    return `${baseUrl}/${url.startsWith('/') ? url.slice(1) : url}`;
};

export async function getUserPurchases(): Promise<PurchasedItem[]> {
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
            return response.data.data.map((item: any) => {
                if (typeof item === 'string') {
                    return { id: item };
                }
                return {
                    id: item.id || item.image_id || item.imageId || '',
                    preview_url: item.preview_url || item.previewUrl,
                    thumbnail_url: item.thumbnail_url || item.thumbnailUrl,
                };
            });
        }
        return [];
    } catch (error) {
        return [];
    }
}

export async function getImages(page: number = 0, purchasedInput?: PurchasedItem[] | string[]): Promise<WallpaperImage[]> {
    try {
        const purchasedMap = new Map<string, PurchasedItem>();

        let purchasedList: PurchasedItem[] = [];
        if (purchasedInput) {
            purchasedList = purchasedInput.map(p => typeof p === 'string' ? { id: p } : p);
        } else {
            purchasedList = await getUserPurchases();
        }

        purchasedList.forEach(item => {
            if (item.id) {
                purchasedMap.set(item.id, item);
            }
        });

        const response = await api.get(`/image/data?page=${page}`);
        return (response.data.data || []).map((img: any) => {
            const owner = img.ownerData || {};
            const userName = owner.userName || img.userName || '';
            const rawAvatar = owner.userAvatar || owner.avatar || img.userAvatar || img.avatar || '';
            const userAvatar = formatImageUrl(rawAvatar);
            const userId = owner.userId || owner.id || img.userId || img.id || '';
            const imageId = img.id || img.image_id;

            const purchasedInfo = purchasedMap.get(imageId);
            const isPurchased = !!purchasedInfo;

            const rawPreview = (isPurchased && purchasedInfo?.preview_url)
                ? purchasedInfo.preview_url
                : img.preview_url;

            const rawThumbnail = (isPurchased && purchasedInfo?.thumbnail_url)
                ? purchasedInfo.thumbnail_url
                : img.thumbnailUrl || img.thumbnail_url;

            return {
                ...img,
                id: imageId,
                userName,
                userAvatar,
                userId,
                ownerData: {
                    userName,
                    userAvatar,
                    userId,
                },
                rawUrl: formatImageUrl(rawPreview || img.rawUrl),
                thumbnailUrl: formatImageUrl(rawThumbnail),
                waterMarked_preview_url: isPurchased ? undefined : formatImageUrl(img.waterMarked_preview_url || img.waterMarked_url),
                waterMarked_url: isPurchased ? undefined : formatImageUrl(img.waterMarked_preview_url || img.waterMarked_url),
                preview_url: formatImageUrl(rawPreview),
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
