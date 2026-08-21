'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { WallpaperImage, formatImageUrl, getUserPurchases, PurchasedItem } from '@/lib/data';
import api from '@/lib/api';
import Modal from './Modal';
import ImageDetails from './ImageDetails';
import Image from 'next/image';
import Link from 'next/link';
import { useLikes } from '@/hooks/useLikes';

import { useAuth } from '@/context/AuthContext';

export default function SearchLayout({ purchasedIds }: { purchasedIds?: PurchasedItem[] | string[] }) {
    const { purchasedItems } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<WallpaperImage[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<WallpaperImage | null>(null);
    const [purchasedMap, setPurchasedMap] = useState<Map<string, PurchasedItem>>(() => {
        const map = new Map<string, PurchasedItem>();
        const initialList = purchasedIds || purchasedItems || [];
        initialList.forEach(p => {
            const item = typeof p === 'string' ? { id: p } : p;
            if (item.id) map.set(item.id, item);
        });
        return map;
    });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { isLiked, toggleLike } = useLikes();

    useEffect(() => {
        const updatePurchasedMap = (items: (PurchasedItem | string)[]) => {
            const map = new Map<string, PurchasedItem>();
            items.forEach(p => {
                const item = typeof p === 'string' ? { id: p } : p;
                if (item.id) map.set(item.id, item);
            });
            setPurchasedMap(map);
        };

        if (purchasedIds) {
            updatePurchasedMap(purchasedIds);
        } else if (purchasedItems) {
            updatePurchasedMap(purchasedItems);
        }
    }, [purchasedIds, purchasedItems]);

    // Debounce API calls
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            const trimmedQuery = query.trim();
            if (!trimmedQuery) {
                setResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            try {
                // Adjust endpoint based on user's exact path: /image-search?text=...
                const response = await api.get(`/image-search?text=${encodeURIComponent(trimmedQuery)}`);

                // Assuming response.data.data or response.data contains the array
                // Depending on axios/backend structure, it might be response.data
                const dataArray = response.data?.data || response.data || [];

                // Map API data to WallpaperImage interface
                const mappedResults: WallpaperImage[] = dataArray.map((img: any) => {
                    const id = img.id || img.image_id || img.imageSource || Math.random().toString(36).substring(7);
                    const purchasedInfo = purchasedMap.get(id);
                    const isPurchased = !!purchasedInfo;

                    const rawPreview = (isPurchased && purchasedInfo?.preview_url)
                        ? purchasedInfo.preview_url
                        : img.preview_url;

                    const rawThumbnail = (isPurchased && purchasedInfo?.thumbnail_url)
                        ? purchasedInfo.thumbnail_url
                        : img.thumbnailUrl || img.thumbnail_url || img.imageSource;

                    const rawUrl = formatImageUrl(rawPreview || img.imageSource || img.rawUrl || '');
                    const preview_url = formatImageUrl(rawPreview);
                    const thumbnailUrl = formatImageUrl(rawThumbnail);
                    const waterMarked_preview_url = isPurchased ? undefined : formatImageUrl(img.waterMarked_preview_url || img.waterMarked_url);

                    return {
                        id,
                        width: img.width || 800,
                        height: img.height || 600,
                        rawUrl,
                        thumbnailUrl,
                        preview_url,
                        description: img.imageDescription || img.description || '',
                        userName: img.userName || 'Unknown User',
                        userAvatar: formatImageUrl(img.userAvatar),
                        userId: img.userId || 'unknown',
                        title: img.imageTitle || img.title || img.imageDescription || 'Untitled',
                        publishedOn: img.publishedOn,
                        is_paid: isPurchased ? false : img.is_paid,
                        purchased_image: isPurchased || img.purchased_image,
                        waterMarked_preview_url,
                        waterMarked_url: waterMarked_preview_url
                    };
                });

                setResults(mappedResults);
            } catch (error) {
                console.error("Search API failed:", error);
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 1000); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleImageClick = (image: WallpaperImage) => {
        setIsDropdownOpen(false);
        setSelectedImage(image);
    };

    return (
        <div className="flex flex-col w-full relative z-40">
            <div className="relative w-full" ref={dropdownRef}>
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-muted" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        const val = e.target.value;
                        setQuery(val);
                        setIsDropdownOpen(true);
                        
                        if (val.trim()) {
                            setIsSearching(true);
                        } else {
                            setResults([]);
                            setIsSearching(false);
                        }
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Search beautiful wallpapers (e.g., 'mountain', 'autumn')..."
                    className="w-full pl-12 pr-12 py-4 rounded-2xl bg-card-bg border border-muted/20 focus:border-accent text-foreground placeholder-muted outline-none ring-2 ring-transparent focus:ring-accent/20 transition-all font-inter text-lg shadow-sm"
                />

                {isSearching && (
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                        <Loader2 className="h-5 w-5 text-muted animate-spin" />
                    </div>
                )}

                {/* Dropdown Menu */}
                {isDropdownOpen && query.trim() && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-card-bg border border-muted/20 shadow-2xl rounded-2xl overflow-hidden max-h-[384px] overflow-y-auto overscroll-contain flex flex-col z-50 animate-in fade-in slide-in-from-top-4 duration-200">
                        {isSearching && results.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center text-muted">
                                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                <span>Searching...</span>
                            </div>
                        ) : results.length > 0 ? (
                            results.map(image => (
                                <button
                                    key={image.id}
                                    onClick={() => handleImageClick(image)}
                                    className="flex items-center gap-4 p-4 hover:bg-muted/10 transition-colors w-full text-left border-b border-muted/10 last:border-0 cursor-pointer"
                                >
                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-muted/20">
                                        <Image
                                            src={image.thumbnailUrl || image.rawUrl}
                                            alt={image.title || 'Thumbnail'}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0 py-1">
                                        <div className="flex justify-between items-start w-full gap-2">
                                            <span className="font-semibold text-foreground truncate">{image.title || 'Untitled Wallpaper'}</span>
                                            <Link 
                                                href={`/profile/${image.userId}`}
                                                onClick={(e) => e.stopPropagation()} // Prevent triggering the image Modal when clicking the username
                                                className="text-xs font-medium text-accent hover:text-accent/80 shrink-0 bg-accent/10 hover:bg-accent/20 transition-colors px-2 py-0.5 rounded-md"
                                            >
                                                @{image.userName}
                                            </Link>
                                        </div>
                                        {image.description && image.description !== image.title ? (
                                            <span className="text-sm text-muted/70 truncate mt-1 block">{image.description}</span>
                                        ) : (
                                            <span className="text-xs text-muted/50 truncate mt-1 block">Click to view wallpaper details</span>
                                        )}
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="p-8 text-center text-muted">
                                No wallpapers found for &quot;{query}&quot;
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Modal
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
            >
                {selectedImage && (
                    <ImageDetails
                        key={selectedImage.id}
                        image={selectedImage}
                        relatedImages={results.filter(img => img.id !== selectedImage.id).slice(0, 10)}
                        isLiked={isLiked(selectedImage.id)}
                        onLike={() => toggleLike(selectedImage.id)}
                        onRelatedImageClick={setSelectedImage}
                        onClose={() => setSelectedImage(null)}
                    />
                )}
            </Modal>
        </div>
    );
}
