'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Tabs from '@/components/Tabs';
import Modal from '@/components/Modal';
import { useLikes } from '@/hooks/useLikes';
import { WallpaperImage } from '@/lib/data';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import LoginPrompt from '@/components/LoginPrompt';
import ImageDetails from '@/components/ImageDetails';
import VerificationStep from '@/components/auth/VerificationStep';
import EditProfileModal from '@/components/EditProfileModal';
import { APIResponseData, APILikedImage } from '@/types';
import { useRouter } from 'next/navigation';

import VerificationBanner from './VerificationBanner';
import ProfileHeader from './ProfileHeader';
import ProfileStats from './ProfileStats';
import LikedTab from './tabs/LikedTab';
import CollectionsTab from './tabs/CollectionsTab';
import UploadsTab from './tabs/UploadsTab';
import PurchasedTab from './tabs/PurchasedTab';

const CLOUDFRONT_URL = "https://djrp6t1rc7td.cloudfront.net/";

const processImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${CLOUDFRONT_URL}${url}`;
};

interface ProfileContentProps {
    initialProfileData: APIResponseData | null;
    viewedUserId?: string;
    initialUploadedImagesRaw?: any[];
}

export default function ProfileContent({ initialProfileData, viewedUserId, initialUploadedImagesRaw }: ProfileContentProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('uploads');
    const [selectedImage, setSelectedImage] = useState<WallpaperImage | null>(null);
    const [profileData, setProfileData] = useState<APIResponseData | null>(initialProfileData);
    const { user, login, logout, isLoading: authLoading } = useAuth();

    // Determine if we are viewing our own profile
    const isOwnProfile = !viewedUserId || (!!user && user.id === viewedUserId);

    // If viewing another user, we don't rely on `user` object for loading state of profile data
    // But we still wait for auth to check if it's our own profile or not? 
    // Actually if initialProfileData is present, we are good.
    const [loading, setLoading] = useState(!initialProfileData);

    const [uploadedImages, setUploadedImages] = useState<WallpaperImage[]>(() => {
        if (!initialUploadedImagesRaw) return [];
        return initialUploadedImagesRaw.map((img: any) => ({
            id: img.image_id,
            width: img.width ?? '',
            height: img.height ?? '',
            rawUrl: processImageUrl(img.raw_url),
            thumbnailUrl: processImageUrl(img.thumbnail_url),
            description: img.description || 'Wallpaper',
            userName: img.ownerData?.userName || 'Unknown',
            userAvatar: processImageUrl(img.ownerData?.avatar),
            userId: img.ownerData?.id || '',
            title: img.title,
            is_paid: img.is_paid,
            price: img.price
        }));
    });
    const [isUploadsLoading, setIsUploadsLoading] = useState(false);
    const [hasFetchedUploads, setHasFetchedUploads] = useState(!!initialUploadedImagesRaw);

    const [purchasedImages, setPurchasedImages] = useState<WallpaperImage[]>([]);
    const [isPurchasedLoading, setIsPurchasedLoading] = useState(false);
    const [hasFetchedPurchased, setHasFetchedPurchased] = useState(false);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const { isLiked, toggleLike, syncLikes } = useLikes({ skipFetch: true });

    // Sync likes coming from server
    useEffect(() => {
        if (profileData?.likedImages) {
            const ids = profileData.likedImages.map(img => img.image_id);
            syncLikes(ids);
        }
    }, [profileData, syncLikes]);

    // Client-side fallback fetch if initial data is missing
    useEffect(() => {
        const fetchUserData = async () => {
            if (initialProfileData) return; // Already have data

            // If strictly waiting for auth (and not just viewing public profile)
            if (authLoading) return;

            if (!user && !authLoading) {
                setLoading(false);
                return;
            }

            try {
                let url = '/user/userData';
                if (viewedUserId) {
                    url = `/user/profile?userId=${viewedUserId}`;
                }
                const response = await api.get(url);
                if (response.data) {
                    let data = response.data.data || response.data;

                    // Normalize public profile data structure
                    if (!data.userProfile && data.userName) {
                        data = { userProfile: data, likedImages: [] };
                    }

                    if (data.userProfile?.avatarImage) {
                        const separator = data.userProfile.avatarImage.includes('?') ? '&' : '?';
                        data.userProfile.avatarImage = `${data.userProfile.avatarImage}${separator}t=${new Date().getTime()}`;
                    }
                    setProfileData(data);
                } else {
                    // Fallback or error handling
                    console.error("Invalid API response format");
                }
            } catch (error) {
                console.error("Failed to fetch user data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user, authLoading, initialProfileData]);


    // Reset uploads fetch state when switching users
    useEffect(() => {
        if (initialUploadedImagesRaw) {
            setUploadedImages(initialUploadedImagesRaw.map((img: any) => ({
                id: img.image_id,
                width: img.width ?? '',
                height: img.height ?? '',
                rawUrl: processImageUrl(img.raw_url),
                thumbnailUrl: processImageUrl(img.thumbnail_url),
                description: img.description || 'Wallpaper',
                userName: img.ownerData?.userName || 'Unknown',
                userAvatar: processImageUrl(img.ownerData?.avatar),
                userId: img.ownerData?.id || '',
                title: img.title,
                is_paid: img.is_paid,
                price: img.price
            })));
            setHasFetchedUploads(true);
        } else {
            setHasFetchedUploads(false);
            setUploadedImages([]);
        }
        setHasFetchedPurchased(false);
        setPurchasedImages([]);
    }, [viewedUserId, initialUploadedImagesRaw]);

    // Fetch Uploaded Images
    useEffect(() => {
        const fetchUploadedImages = async () => {
            // Allow fetch if 'uploads' tab is active AND we have a logged-in user
            if (activeTab === 'uploads' && !hasFetchedUploads && user) {
                setIsUploadsLoading(true);
                try {
                    const url = viewedUserId
                        ? `/user/uploaded-images?userId=${viewedUserId}`
                        : '/user/uploaded-images';

                    console.log("DEBUG: Fetching uploaded images from:", url);

                    const response = await api.get(url);
                    if (response.data && response.data.data) {
                        const mappedImages: WallpaperImage[] = response.data.data.map((img: APILikedImage) => ({
                            id: img.image_id,
                            width: img.width ?? '',
                            height: img.height ?? '',
                            rawUrl: processImageUrl(img.raw_url),
                            thumbnailUrl: processImageUrl(img.thumbnail_url),
                            description: img.description || 'Wallpaper',
                            userName: img.ownerData?.userName || 'Unknown',
                            userAvatar: processImageUrl(img.ownerData?.avatar),
                            userId: img.ownerData?.id || '',
                            title: img.title,
                            is_paid: img.is_paid,
                            price: img.price
                        }));
                        setUploadedImages(mappedImages);
                    }
                    setHasFetchedUploads(true);
                } catch (error) {
                    console.error("Failed to fetch uploaded images", error);
                } finally {
                    setIsUploadsLoading(false);
                }
            }
        };

        fetchUploadedImages();
    }, [activeTab, hasFetchedUploads, user]);

    // Fetch Purchased Images
    useEffect(() => {
        const fetchPurchasedImages = async () => {
            if (activeTab === 'purchased' && !hasFetchedPurchased && user && isOwnProfile) {
                setIsPurchasedLoading(true);
                try {
                    const response = await api.get('/user/purchased-images');
                    if (response.data && response.data.data) {
                        const mappedImages: WallpaperImage[] = response.data.data.map((img: any) => ({
                            id: img.image_id,
                            width: img.width,
                            height: img.height,
                            rawUrl: processImageUrl(img.imageRawPath),
                            thumbnailUrl: processImageUrl(img.thumbnail_url),
                            description: img.description || 'Purchased Image',
                            userName: img.userName || 'Unknown',
                            userAvatar: img.userProfileImage ? processImageUrl(img.userProfileImage) : '',
                            userId: '',
                            title: img.title,
                            is_paid: img.is_paid,
                            price: img.price
                        }));
                        setPurchasedImages(mappedImages);
                    }
                    setHasFetchedPurchased(true);
                } catch (error) {
                    console.error("Failed to fetch purchased images", error);
                } finally {
                    setIsPurchasedLoading(false);
                }
            }
        };

        fetchPurchasedImages();
    }, [activeTab, hasFetchedPurchased, user, isOwnProfile]);

    const likedImages: WallpaperImage[] = useMemo(() => {
        return profileData?.likedImages?.map((img) => ({
            id: img.image_id,
            width: img.width ?? '',
            height: img.height ?? '',
            rawUrl: processImageUrl(img.raw_url),
            thumbnailUrl: processImageUrl(img.thumbnail_url),
            description: img.description || 'Wallpaper',
            userName: img.ownerData?.userName || 'Unknown',
            userAvatar: processImageUrl(img.ownerData?.avatar),
            userId: img.ownerData?.id || '',
            title: img.title,
            is_paid: img.is_paid,
            price: img.price
        })) || [];
    }, [profileData]);

    const displayImages = activeTab === 'uploads' ? uploadedImages :
        activeTab === 'purchased' ? purchasedImages :
            likedImages;

    const allTabs = [
        { id: 'uploads', label: 'Uploads' },
        { id: 'liked', label: 'Liked' },
        { id: 'collections', label: 'Collections' },
        { id: 'purchased', label: 'Purchased' },
    ];

    const tabs = isOwnProfile ? allTabs : allTabs.filter(t => t.id === 'uploads');

    useEffect(() => {
        if (!isOwnProfile && activeTab !== 'uploads') {
            setActiveTab('uploads');
        }
    }, [isOwnProfile, activeTab]);

    const handleImageClick = (image: WallpaperImage) => {
        setSelectedImage(image);
    };

    const handleCloseModal = () => {
        setSelectedImage(null);
    };

    const handleUpdateProfile = async (formData: FormData) => {
        try {
            const response = await api.put('/user/update-user', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.status === 200) {
                // Refresh data logic
                const r = await api.get('/user/userData');
                if (r.data && r.data.data) {
                    const updatedData = r.data.data;
                    if (updatedData.userProfile?.avatarImage) {
                        const separator = updatedData.userProfile.avatarImage.includes('?') ? '&' : '?';
                        updatedData.userProfile.avatarImage = `${updatedData.userProfile.avatarImage}${separator}t=${new Date().getTime()}`;
                    }
                    setProfileData(updatedData);

                    if (user) {
                        login({
                            ...user,
                            userName: updatedData.userProfile.userName, // Changed from displayName
                            avatarImage: updatedData.userProfile.avatarImage,
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Failed to update profile", error);
        } finally {
            setIsEditModalOpen(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
        );
    }

    if (!user) {
        if (!authLoading) {
            router.push('/unauthorized');
        }
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center text-muted">
                Failed to load profile.
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

            {isOwnProfile && user && !user.is_verified && (
                <VerificationBanner onVerifyClick={() => setIsVerificationModalOpen(true)} />
            )}

            <ProfileHeader
                userProfile={profileData.userProfile}
                onEditClick={() => setIsEditModalOpen(true)}
                isOwnProfile={isOwnProfile}
            />

            <ProfileStats
                userProfile={profileData.userProfile}
                likesCount={likedImages.length}
            />

            <div className="flex flex-col items-center mb-8">
                <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'liked' && (
                    <LikedTab
                        images={likedImages}
                        onImageClick={handleImageClick}
                        isLiked={isLiked}
                        onToggleLike={toggleLike}
                    />
                )}

                {activeTab === 'collections' && (
                    <CollectionsTab />
                )}

                {activeTab === 'uploads' && (
                    <UploadsTab
                        images={uploadedImages}
                        isLoading={isUploadsLoading}
                        onImageClick={handleImageClick}
                        isLiked={isLiked}
                        onToggleLike={toggleLike}
                    />
                )}

                {activeTab === 'purchased' && (
                    <PurchasedTab
                        images={purchasedImages}
                        isLoading={isPurchasedLoading}
                        onImageClick={handleImageClick}
                        isLiked={isLiked}
                        onToggleLike={toggleLike}
                    />
                )}
            </div>

            <Modal
                isOpen={!!selectedImage}
                onClose={handleCloseModal}
            >
                {selectedImage && (
                    <ImageDetails
                        image={selectedImage}
                        relatedImages={displayImages.slice(0, 10)}
                        isLiked={isLiked(selectedImage.id)}
                        onLike={() => toggleLike(selectedImage.id)}
                        onRelatedImageClick={setSelectedImage}
                        onClose={handleCloseModal}
                    />
                )}
            </Modal>

            <Modal
                isOpen={isVerificationModalOpen}
                onClose={() => setIsVerificationModalOpen(false)}
            >
                <div className="bg-[var(--card-bg)] rounded-3xl p-6 md:p-8 w-full max-w-md border border-[var(--muted)]/20 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                    <VerificationStep
                        registeredEmail={user.emailId}
                        autoResend={true}
                        onSuccess={() => {
                            setIsVerificationModalOpen(false);
                            window.location.reload();
                        }}
                    />
                </div>
            </Modal>

            {
                profileData && (
                    <EditProfileModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        currentProfile={profileData.userProfile}
                        onUpdateProfile={handleUpdateProfile}
                    />
                )
            }
        </div >
    );
}
