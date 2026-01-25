'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Tabs from '@/components/Tabs';
import ImageCard from '@/components/ImageCard';
import Modal from '@/components/Modal';
import { useMasonryGrid } from '@/hooks/useMasonryGrid';
import { useLikes } from '@/hooks/useLikes';
import { WallpaperImage } from '@/lib/data';
import api from '@/lib/api';
import { Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import LoginPrompt from '@/components/LoginPrompt';
import ImageDetails from '@/components/ImageDetails';
import VerificationStep from '@/components/auth/VerificationStep';
import EditProfileModal from '@/components/EditProfileModal';
import { APIResponseData, APILikedImage } from '@/types';

import VerificationBanner from './VerificationBanner';
import ProfileHeader from './ProfileHeader';
import ProfileStats from './ProfileStats';

const CLOUDFRONT_URL = "https://djrp6t1rc7td.cloudfront.net/";

interface ProfileContentProps {
    initialProfileData: APIResponseData | null;
}

export default function ProfileContent({ initialProfileData }: ProfileContentProps) {
    const [activeTab, setActiveTab] = useState('liked');
    const [selectedImage, setSelectedImage] = useState<WallpaperImage | null>(null);
    const [profileData, setProfileData] = useState<APIResponseData | null>(initialProfileData);

    // Fallback loading state if we need to fetch on client (e.g. initial fetch failed)
    const [loading, setLoading] = useState(!initialProfileData);

    const [uploadedImages, setUploadedImages] = useState<WallpaperImage[]>([]);
    const [isUploadsLoading, setIsUploadsLoading] = useState(false);
    const [hasFetchedUploads, setHasFetchedUploads] = useState(false);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const { user, login, isLoading: authLoading } = useAuth();
    const { isLiked, toggleLike, syncLikes } = useLikes();

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
            if (!user && !authLoading) {
                setLoading(false);
                return;
            }
            if (authLoading) return;

            try {
                const response = await api.get('/user/userData');
                if (response.data && response.data.data) {
                    const data = response.data.data;
                    if (data.userProfile?.avatarImage) {
                        const separator = data.userProfile.avatarImage.includes('?') ? '&' : '?';
                        data.userProfile.avatarImage = `${data.userProfile.avatarImage}${separator}t=${new Date().getTime()}`;
                    }
                    setProfileData(data);
                } else {
                    const data = response.data;
                    // simple fallback mapping if needed
                    setProfileData(data);
                }
            } catch (error) {
                console.error("Failed to fetch user data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user, authLoading, initialProfileData]);


    const processImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${CLOUDFRONT_URL}${url}`;
    };

    // Fetch Uploaded Images
    useEffect(() => {
        const fetchUploadedImages = async () => {
            if (activeTab === 'uploads' && !hasFetchedUploads && user) {
                setIsUploadsLoading(true);
                try {
                    const response = await api.get('/user/uploaded-images');
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
                            title: img.title
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

    const likedImages: WallpaperImage[] = React.useMemo(() => {
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
            title: img.title
        })) || [];
    }, [profileData]);

    const displayImages = activeTab === 'uploads' ? uploadedImages : likedImages;
    const { columns } = useMasonryGrid(displayImages);

    const tabs = [
        { id: 'liked', label: 'Liked' },
        { id: 'collections', label: 'Collections' },
        { id: 'uploads', label: 'Uploads' },
    ];

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
                            displayName: updatedData.userProfile.displayName,
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
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <LoginPrompt />
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

            {!user.is_verified && (
                <VerificationBanner onVerifyClick={() => setIsVerificationModalOpen(true)} />
            )}

            <ProfileHeader
                userProfile={profileData.userProfile}
                onEditClick={() => setIsEditModalOpen(true)}
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
                    <>
                        {likedImages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-muted/10 flex items-center justify-center">
                                    <Heart className="w-8 h-8 opacity-50" />
                                </div>
                                <p>
                                    No liked images yet.{' '}
                                    <Link href="/" className="text-[var(--accent)] hover:underline font-medium">
                                        Go explore!
                                    </Link>
                                </p>
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                {columns.map((colImages, colIndex) => (
                                    <div key={colIndex} className="flex-1 flex flex-col gap-4">
                                        {colImages.map((image) => (
                                            <ImageCard
                                                key={image.id}
                                                image={image}
                                                onClick={() => handleImageClick(image)}
                                                isLiked={isLiked(image.id)}
                                                onToggleLike={() => toggleLike(image.id)}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'collections' && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-muted/10 flex items-center justify-center">
                            <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <p>No collections created yet.</p>
                    </div>
                )}

                {activeTab === 'uploads' && (
                    <>
                        {isUploadsLoading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                            </div>
                        ) : uploadedImages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-muted/10 flex items-center justify-center">
                                    <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p>No uploads yet.</p>
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                {columns.map((colImages, colIndex) => (
                                    <div key={colIndex} className="flex-1 flex flex-col gap-4">
                                        {colImages.map((image) => (
                                            <ImageCard
                                                key={image.id}
                                                image={image}
                                                onClick={() => handleImageClick(image)}
                                                isLiked={isLiked(image.id)}
                                                onToggleLike={() => toggleLike(image.id)}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
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

            {profileData && (
                <EditProfileModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    currentProfile={profileData.userProfile}
                    onUpdateProfile={handleUpdateProfile}
                />
            )}
        </div>
    );
}
