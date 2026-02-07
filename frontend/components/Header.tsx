import React from 'react';
import { cookies } from 'next/headers';
import axios from 'axios';
import HeaderClient from './HeaderClient';
import { User } from '@/context/AuthContext';

async function getUser(): Promise<User | null> {
    try {
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();
        const cookieHeader = allCookies.map(c => `${c.name}=${c.value}`).join(';');
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/profile`, {
            headers: {
                Cookie: cookieHeader
            },
            withCredentials: true
        });

        if (res.status === 200) {
            const userData = res.data.data || res.data;
            return {
                id: userData.id || userData._id,
                userName: userData.userName,
                emailId: userData.emailId,
                avatarImage: userData.avatarImage ?
                    `${userData.avatarImage}${userData.avatarImage.includes('?') ? '&' : '?'}t=${new Date().getTime()}` :
                    userData.avatarImage,
                is_verified: userData.is_verified
            };
        }
        return null;
    } catch (error) {
        return null;
    }
}

export default async function Header() {
    const user = await getUser();
    return <HeaderClient initialUser={user} />;
}
