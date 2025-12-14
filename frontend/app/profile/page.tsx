'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Tabs from '@/components/Tabs';
import ImageCard from '@/components/ImageCard';
import Modal from '@/components/Modal';
import { useMasonryGrid } from '@/hooks/useMasonryGrid';
import { useLikes } from '@/hooks/useLikes';
import { WallpaperImage } from '@/lib/data';
import api from '@/lib/api';

// --- Interfaces ---
interface APIUserProfile {
    id: string;
    displayName: string;
    emailId: string;
    avatarImage: string;
}

interface APIImageOwner {
    id: string;
    avatar: string;
    userName: string;
}

interface APILikedImage {
    image_id: string;
    is_paid: boolean;
    description: string;
    width: number;
    height: number;
    thumbnail_url: string;
    raw_url: string;
    ownerData: APIImageOwner;
}

interface APIResponseData {
    userProfile: APIUserProfile;
    likedImages: APILikedImage[];
}

const CLOUDFRONT_URL = "https://djrp6t1rc7td.cloudfront.net/";

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState('liked');
    const [selectedImage, setSelectedImage] = useState<WallpaperImage | null>(null);
    const [profileData, setProfileData] = useState<APIResponseData | null>(null);
    const [loading, setLoading] = useState(true);

    const { isLiked, toggleLike, syncLikes } = useLikes();

    useEffect(() => {
        if (profileData?.likedImages) {
            const ids = profileData.likedImages.map(img => img.image_id);
            syncLikes(ids);
        }
    }, [profileData, syncLikes]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get('/user/userData');
                // The API response user provided structure: { data: { userProfile: ..., likedImages: ... } } / or maybe response.data IS the object
                // Usually axios response.data is the body. The user said: "data": { ... }.
                // If standard response structure is { statusCode: ..., data: { ... } }
                if (response.data && response.data.data) {
                    setProfileData(response.data.data);
                } else {
                    // Fallback if structure is different
                    setProfileData(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch user data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const processImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${CLOUDFRONT_URL}${url}`; // Prepend CloudFront if relative
    };

    // Transform API liked images to WallpaperImage type
    const likedImages: WallpaperImage[] = React.useMemo(() => {
        return profileData?.likedImages?.map((img) => ({
            id: img.image_id,
            width: img.width,
            height: img.height,
            rawUrl: processImageUrl(img.raw_url),
            thumbnailUrl: processImageUrl(img.thumbnail_url),
            description: img.description || 'Wallpaper',
            userName: img.ownerData?.userName || 'Unknown',
            userAvatar: processImageUrl(img.ownerData?.avatar),
            userId: img.ownerData?.id || ''
        })) || [];
    }, [profileData]);

    const { columns } = useMasonryGrid(likedImages);

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

    if (loading) {
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
        <div className="min-h-screen pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Profile Header */}
            <div className="flex flex-col items-center mb-12">
                <div className="relative w-32 h-32 mb-4">
                    {profileData.userProfile.avatarImage ? (
                        <Image
                            src={profileData.userProfile.avatarImage}
                            alt={profileData.userProfile.displayName}
                            fill
                            className="rounded-full object-cover border-4 border-card-bg shadow-lg"
                        />
                    ) : (
                        <div className="w-full h-full rounded-full bg-muted/20 flex items-center justify-center text-4xl font-bold text-muted">
                            {profileData.userProfile.displayName?.charAt(0) || 'U'}
                        </div>
                    )}
                </div>
                <h1 className="text-3xl font-bold mb-2 kedebideri-bold">{profileData.userProfile.displayName}</h1>
                <p className="text-muted text-center max-w-md mb-6">
                    Wallpaper enthusiast. Creating and collecting the best aesthetics.
                </p>

                {/* Statistics (Static as requested) */}
                <div className="flex gap-6 text-sm mb-8">
                    <div className="text-center">
                        <span className="block font-bold text-lg">128</span>
                        <span className="text-muted">Following</span>
                    </div>
                    <div className="text-center">
                        <span className="block font-bold text-lg">843</span>
                        <span className="text-muted">Followers</span>
                    </div>
                    <div className="text-center">
                        <span className="block font-bold text-lg">24</span>
                        <span className="text-muted">Likes</span>
                    </div>
                </div>

                <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'liked' && (
                    <>
                        {likedImages.length === 0 ? (
                            <div className="text-center py-20 text-muted">
                                No liked images yet. Go explore!
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
                    <div className="flex flex-col items-center justify-center py-20 text-muted space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-muted/10 flex items-center justify-center">
                            <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p>No uploads yet.</p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={!!selectedImage}
                onClose={handleCloseModal}
                downloadUrl={selectedImage?.rawUrl}
                downloadName={`wallpaper-${selectedImage?.id}`}
            >
                {selectedImage && (
                    <div className="flex items-center justify-center p-4 w-full h-full">
                        <Image
                            src={selectedImage.rawUrl}
                            alt={selectedImage.description || 'Wallpaper'}
                            width={selectedImage.width}
                            height={selectedImage.height}
                            className="max-w-full max-h-[85vh] w-auto h-auto object-contain"
                            priority
                            quality={100}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
}
