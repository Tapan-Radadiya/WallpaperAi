'use client';

import { createContext, ReactNode, useContext, useEffect, useState, useCallback, useRef } from 'react';
import Modal from '@/components/Modal';
import LoginPrompt from '@/components/LoginPrompt';
import { X } from 'lucide-react';

import { PurchasedItem, getUserPurchases } from '@/lib/data';

export interface User {
    id: string;
    userName: string;
    emailId: string;
    avatarImage: string;
    is_verified?: boolean;
}

export interface LoginPromptOptions {
    title?: string;
    message?: string;
}

interface AuthContextType {
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
    isLoading: boolean;
    showLoginPrompt: (options?: LoginPromptOptions | string, message?: string) => void;
    hideLoginPrompt: () => void;
    purchasedItems: PurchasedItem[] | null;
    fetchPurchases: (force?: boolean) => Promise<PurchasedItem[]>;
    isPurchased: (imageId: string) => boolean;
    getPurchasedItem: (imageId: string) => PurchasedItem | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [purchasedItems, setPurchasedItems] = useState<PurchasedItem[] | null>(null);

    const userRef = useRef<User | null>(null);
    userRef.current = user;

    const purchasedItemsRef = useRef<PurchasedItem[] | null>(null);
    purchasedItemsRef.current = purchasedItems;

    const isFetchingPurchasesRef = useRef<boolean>(false);

    const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
    const [loginPromptConfig, setLoginPromptConfig] = useState<LoginPromptOptions>({
        title: "Authentication Required",
        message: "Please log in to continue."
    });

    useEffect(() => {
        setIsLoading(false);
    }, []);

    const fetchPurchases = useCallback(async (force = false) => {
        const currentUser = userRef.current;
        if (!currentUser) {
            setPurchasedItems([]);
            purchasedItemsRef.current = [];
            return [];
        }

        if (!force && purchasedItemsRef.current !== null) {
            return purchasedItemsRef.current;
        }

        if (isFetchingPurchasesRef.current) {
            return purchasedItemsRef.current || [];
        }

        isFetchingPurchasesRef.current = true;
        try {
            const items = await getUserPurchases();
            setPurchasedItems(items);
            purchasedItemsRef.current = items;
            return items;
        } catch (error) {
            console.error("Failed to fetch user purchases:", error);
            setPurchasedItems([]);
            purchasedItemsRef.current = [];
            return [];
        } finally {
            isFetchingPurchasesRef.current = false;
        }
    }, []);

    useEffect(() => {
        if (user && purchasedItems === null) {
            fetchPurchases();
        } else if (!user && purchasedItems !== null) {
            setPurchasedItems(null);
            purchasedItemsRef.current = null;
        }
    }, [user?.id, purchasedItems, fetchPurchases]);

    const isPurchased = useCallback((imageId: string) => {
        if (!purchasedItems || !imageId) return false;
        return purchasedItems.some(item => item.id === imageId);
    }, [purchasedItems]);

    const getPurchasedItem = useCallback((imageId: string) => {
        if (!purchasedItems || !imageId) return undefined;
        return purchasedItems.find(item => item.id === imageId);
    }, [purchasedItems]);

    const login = useCallback((userData: User) => {
        setUser(prev => {
            if (prev?.id === userData.id) return prev;
            return userData;
        });
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setPurchasedItems(null);
        purchasedItemsRef.current = null;
    }, []);

    const showLoginPrompt = useCallback((options?: LoginPromptOptions | string, message?: string) => {
        if (typeof options === 'string') {
            setLoginPromptConfig({
                title: options,
                message: message || "Please log in to perform this action."
            });
        } else if (options) {
            setLoginPromptConfig({
                title: options.title || "Authentication Required",
                message: options.message || "Please log in to perform this action."
            });
        } else {
            setLoginPromptConfig({
                title: "Authentication Required",
                message: "Please log in to perform this action."
            });
        }
        setIsLoginPromptOpen(true);
    }, []);

    const hideLoginPrompt = useCallback(() => {
        setIsLoginPromptOpen(false);
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            login,
            logout,
            isLoading,
            showLoginPrompt,
            hideLoginPrompt,
            purchasedItems,
            fetchPurchases,
            isPurchased,
            getPurchasedItem
        }}>
            {children}
            <Modal
                isOpen={isLoginPromptOpen}
                onClose={hideLoginPrompt}
                zIndexClass="z-[100]"
            >
                <div className="bg-[var(--card-bg)] p-6 rounded-3xl w-full max-w-md border border-[var(--muted)]/20 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={hideLoginPrompt}
                        className="absolute top-4 right-4 p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors rounded-full hover:bg-[var(--foreground)]/10"
                    >
                        <X size={20} />
                    </button>
                    <LoginPrompt
                        title={loginPromptConfig.title}
                        message={loginPromptConfig.message}
                        onClose={hideLoginPrompt}
                    />
                </div>
            </Modal>
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
