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

        const res = await axios.get('http://192.168.1.31:3002/api/v1/user/profile', {
            headers: {
                Cookie: cookieHeader
            },
            withCredentials: true
        });

        if (res.status === 200) {
            const userData = res.data.data || res.data;
            return {
                id: userData.id || userData._id,
                displayName: userData.displayName,
                emailId: userData.emailId,
                avatarImage: userData.avatarImage
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
