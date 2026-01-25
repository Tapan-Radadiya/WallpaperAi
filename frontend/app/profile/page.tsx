import { cookies } from 'next/headers';
import axios from 'axios';
import ProfileContent from '@/components/profile/ProfileContent';
import { APIResponseData } from '@/types';

async function getProfileData(): Promise<APIResponseData | null> {
    try {
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();
        const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join(';');

        // Use the same internal IP as Header.tsx or localhost if works, but consistency is key.
        // Header.tsx used http://192.168.1.31:3002/api/v1/user/profile
        // Here we need /user/userData
        const res = await axios.get('http://192.168.1.31:3002/api/v1/user/userData', {
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

export default async function ProfilePage() {
    const profileData = await getProfileData();

    return <ProfileContent initialProfileData={profileData} />;
}
