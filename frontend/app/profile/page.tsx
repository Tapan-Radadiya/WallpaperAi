'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Tabs from '@/components/Tabs';
import ImageCard from '@/components/ImageCard';
import Modal from '@/components/Modal';
import { useMasonryGrid } from '@/hooks/useMasonryGrid';
import { useLikes } from '@/hooks/useLikes';
import { WallpaperImage } from '@/lib/data';
import api from '@/lib/api';
import { Globe, Instagram, Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import LoginPrompt from '@/components/LoginPrompt';
import ImageDetails from '@/components/ImageDetails';
import VerificationStep from '@/components/auth/VerificationStep';
import { Shield, Sparkles } from 'lucide-react';

// --- Interfaces ---
interface APIUserProfile {
    id: string;
    displayName: string;
    emailId: string;
    avatarImage: string;
    user_bio?: string;
    instagram_id?: string;
    portfolio_url?: string
}

interface APIImageOwner {
    id: string;
    avatar: string;
    userName: string;
}

interface APILikedImage {
    image_id: string;
    title?: string;
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

    const [uploadedImages, setUploadedImages] = useState<WallpaperImage[]>([]);
    const [isUploadsLoading, setIsUploadsLoading] = useState(false);
    const [hasFetchedUploads, setHasFetchedUploads] = useState(false);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

    const { user, isLoading: authLoading } = useAuth();

    const { isLiked, toggleLike, syncLikes } = useLikes();

    useEffect(() => {
        if (profileData?.likedImages) {
            const ids = profileData.likedImages.map(img => img.image_id);
            syncLikes(ids);
        }
    }, [profileData, syncLikes]);

    useEffect(() => {
        // Only fetch profile data if we have a user
        if (!user && !authLoading) {
            setLoading(false);
            return;
        }

        if (authLoading) return;

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
    }, [user, authLoading]);

    const processImageUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${CLOUDFRONT_URL}${url}`; // Prepend CloudFront if relative
    };

    // Fetch Uploaded Images when tab changes
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

    // Transform API liked images to WallpaperImage type
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

            {/* Verification Banner */}
            {!user.is_verified && (
                <div
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="mb-8 p-3 rounded-xl bg-gradient-to-r from-[var(--accent)]/10 to-[var(--accent)]/5 border border-[var(--accent)]/20 flex items-center justify-between gap-4 cursor-pointer hover:bg-[var(--accent)]/15 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                            <Shield size={16} className="text-[var(--accent)]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-[var(--foreground)] text-sm">Verify your account</h3>
                            <p className="text-[var(--muted)] text-xs hidden sm:block">Unlock uploads and join the community.</p>
                        </div>
                    </div>
                    <button className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 active:scale-95 transition-all shadow-md shadow-[var(--accent)]/20 whitespace-nowrap">
                        Verify Now
                    </button>
                </div>
            )}

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

                {profileData.userProfile.user_bio ? (
                    <p className="text-muted text-center max-w-md mb-2">
                        {profileData.userProfile.user_bio}
                    </p>
                ) : (
                    <p className="text-muted text-center max-w-md mb-2">
                        Wallpaper enthusiast. Creating and collecting the best aesthetics.
                    </p>
                )}

                <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
                    {profileData.userProfile.instagram_id && (
                        <a
                            href={`${profileData.userProfile.instagram_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-full bg-[#E1306C]/5 border border-[#E1306C]/30 text-[#E1306C] shadow-md shadow-[#E1306C]/10 hover:bg-[var(--card-bg)] hover:border-[var(--muted)]/20 hover:text-[var(--muted)] hover:shadow-sm transition-all duration-300 group"
                            aria-label={`Instagram: @${profileData.userProfile.instagram_id}`}
                        >
                            <Instagram size={20} className="group-hover:scale-110 transition-transform duration-300" />
                        </a>
                    )}

                    {profileData.userProfile.portfolio_url && (
                        <a
                            href={profileData.userProfile.portfolio_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-full bg-blue-500/5 border border-blue-500/30 text-blue-500 shadow-md shadow-blue-500/10 hover:bg-[var(--card-bg)] hover:border-[var(--muted)]/20 hover:text-[var(--muted)] hover:shadow-sm transition-all duration-300 group"
                            aria-label="Portfolio"
                        >
                            <Globe size={20} className="group-hover:scale-110 transition-transform duration-300" />
                        </a>
                    )}

                    {/* Future links can be added here easily */}
                </div>

                {!profileData.userProfile.instagram_id && !profileData.userProfile.portfolio_url && <div className="mb-6"></div>}

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
                            window.location.reload(); // Simple reload to refresh user state
                        }}
                    />
                </div>
            </Modal>
        </div>
    );
}
