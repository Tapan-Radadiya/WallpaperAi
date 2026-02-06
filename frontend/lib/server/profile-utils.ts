import { cookies } from 'next/headers';
import axios from 'axios';
import { APIResponseData } from '@/types';

// Consider moving this to a config file if not already
const API_BASE_URL = 'http://192.168.1.31:3002/api/v1';

export async function getProfileData(userId?: string): Promise<APIResponseData | null> {
    try {
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();
        const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join(';');

        let url = `${API_BASE_URL}/user/userData`;
        if (userId) {
            url = `${API_BASE_URL}/user/profile?userId=${userId}`;
        }

        const res = await axios.get(url, {
            headers: {
                Cookie: cookieHeader
            },
            withCredentials: true
        });

        if (res.status === 200) {
            let data = res.data.data || res.data;

            // Normalize public profile data structure
            if (!data.userProfile && data.userName) {
                data = { userProfile: data, likedImages: [] };
            }

            if (data.userProfile?.avatarImage) {
                const separator = data.userProfile.avatarImage.includes('?') ? '&' : '?';
                data.userProfile.avatarImage = `${data.userProfile.avatarImage}${separator}t=${new Date().getTime()}`;
            }
            return data;
        }
        return null;
    } catch (error) {
        // console.error("Server fetch error", error);
        return null;
    }
}
