'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface User {
    id: string;
    userName: string;
    emailId: string;
    avatarImage: string;
    is_verified?: boolean;
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
    // Check for active session on mount
    /*
    useEffect(() => {
        const checkSession = async () => {
             // Logic moved to SSR in Header component and hydrated via HeaderClient
             setIsLoading(false);
        };
        checkSession();
    }, []);
    */
    // Simplified to just stop loading immediately or keep it false if initialized
    useEffect(() => {
        setIsLoading(false);
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
