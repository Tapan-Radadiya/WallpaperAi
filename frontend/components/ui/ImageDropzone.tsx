'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/context/ToastContext';
import { ALLOWED_IMAGES } from '@/constants';

interface ImageDropzoneProps {
    onFileSelect: (file: File) => void;
    currentImage?: string | null;
    variant?: 'circle' | 'rectangle';
    className?: string;
    description?: string;
    onRemove?: () => void;
    minSize?: number; // in bytes
    maxSize?: number; // in bytes
    validator?: (file: File) => Promise<boolean>;
}

export default function ImageDropzone({
    onFileSelect,
    currentImage,
    variant = 'rectangle',
    className = '',
    description = 'Drag and drop your image',
    onRemove,
    minSize = 0,
    maxSize = 10 * 1024 * 1024, // Default 10MB
    validator
}: ImageDropzoneProps) {
    const { showToast } = useToast();
    const [isDragging, setIsDragging] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update preview if prop changes (e.g. initial load or reset)
    React.useEffect(() => {
        setPreviewUrl(currentImage || null);
    }, [currentImage]);

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const validateAndSetFile = async (file: File) => {
        if (!ALLOWED_IMAGES.includes(file.type)) {
            showToast('Invalid file type. Please upload a valid image.', 'error');
            return;
        }

        if (file.size < minSize) {
            const minSizeMB = (minSize / (1024 * 1024)).toFixed(1);
            showToast(`Image is too small. Minimum size is ${minSizeMB}MB.`, 'error');
            return;
        }

        if (file.size > maxSize) {
            const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
            showToast(`Image is too large. Maximum size is ${maxSizeMB}MB.`, 'error');
            return;
        }

        if (validator) {
            setIsValidating(true);
            try {
                const isValid = await validator(file);
                if (!isValid) {
                    showToast('Image validation failed. Please try another image.', 'error');
                    setIsValidating(false);
                    return;
                }
            } catch (error) {
                console.error('Validation error:', error);
                showToast('An error occurred during image validation.', 'error');
                setIsValidating(false);
                return;
            }
            setIsValidating(false);
        }

        // Create local preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        onFileSelect(file);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (onRemove) onRemove();
    };

    const handleClick = () => {
        if (!previewUrl || variant === 'circle') {
            fileInputRef.current?.click();
        }
    };

    const isCircle = variant === 'circle';

    return (
        <div
            className={`
                relative group border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden
                ${isDragging
                    ? 'border-[var(--accent)] bg-[var(--accent)]/5 scale-[1.02]'
                    : 'border-[var(--muted)]/40 hover:border-[var(--muted)] hover:bg-[var(--foreground)]/5'
                }
                ${isCircle ? 'rounded-full w-36 h-36 shrink-0 aspect-square' : 'w-full rounded-2xl'}
                ${previewUrl ? 'p-0' : 'p-6'}
                ${previewUrl && !isCircle ? 'border-none' : ''}
                ${className}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            {previewUrl ? (
                <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${isCircle ? 'rounded-full' : 'rounded-2xl bg-black/5'}`}>
                    <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className={isCircle ? "object-cover" : "object-contain"}
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 transition-all duration-200">
                        {isCircle ? (
                            <Upload className="text-white drop-shadow-md" size={32} />
                        ) : onRemove && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="p-3 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors transform hover:scale-110 shadow-lg"
                            >
                                <X size={24} />
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {isCircle ? (
                        <div className="flex flex-col items-center text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
                            <ImageIcon size={32} className="mb-2" />
                            <span className="text-xs font-medium text-center px-2">{description}</span>
                        </div>
                    ) : (
                        <>
                            <div className={`p-6 rounded-full bg-[var(--muted)]/10 mb-6 group-hover:bg-[var(--accent)]/10 transition-colors`}>
                                <Upload size={48} className={`text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors`} />
                            </div>
                            <p className="text-lg font-bold text-[var(--foreground)] text-center mb-2">
                                {description}
                            </p>
                            <p className="text-sm text-[var(--muted)] text-center mb-6">
                                or <span className="text-[var(--accent)] hover:underline">browse files</span> from your computer
                            </p>
                            <p className="text-xs text-[var(--muted)] text-center capitalize tracking-wider">
                                {ALLOWED_IMAGES.map(type => type.replace('image/', '').toUpperCase()).join(', ')}
                            </p>
                        </>
                    )}
                </>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_IMAGES.join(',')}
                onChange={handleFileSelect}
                className="hidden"
            />

            {isValidating && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-white">
                    <Loader2 size={32} className="animate-spin mb-2" />
                    <span className="text-sm font-medium">Validating image...</span>
                </div>
            )}
        </div>
    );
}
