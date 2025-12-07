'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios, { HttpStatusCode } from 'axios';

export interface User {
    id: string;
    displayName: string;
    emailId: string;
    avatarImage: string;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for active session on mount
    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await axios.get('/api/v1/user/profile', {
                    withCredentials: true
                });

                if (res.status === HttpStatusCode.Ok) {
                    const userData = res.data.data || res.data;
                    setUser({
                        id: userData.id || userData._id,
                        displayName: userData.displayName,
                        emailId: userData.emailId,
                        avatarImage: userData.avatarImage
                    });
                }
            } catch (error) {
                // Session likely invalid or expired
                console.log("No active session found");
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
