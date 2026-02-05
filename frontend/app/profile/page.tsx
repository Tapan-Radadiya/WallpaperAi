import { cookies } from 'next/headers';
import axios from 'axios';
import ProfileContent from '@/components/profile/ProfileContent';
import { APIResponseData } from '@/types';

async function getProfileData(userId?: string): Promise<APIResponseData | null> {
    try {
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();
        const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join(';');

        let url = 'http://192.168.1.31:3002/api/v1/user/userData';
        if (userId) {
            url = `http://192.168.1.31:3002/api/v1/user/profile?userId=${userId}`;
        }

        const res = await axios.get(url, {
            headers: {
                Cookie: cookieHeader
            },
            withCredentials: true
        });

        if (res.status === 200) {
            const data = res.data.data || res.data;
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

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ProfilePage({ searchParams }: PageProps) {
    const resolvedSearchParams = await searchParams;
    const userId = typeof resolvedSearchParams.userId === 'string' ? resolvedSearchParams.userId : undefined;
    const profileData = await getProfileData(userId);

    return <ProfileContent initialProfileData={profileData} viewedUserId={userId} />;
}
