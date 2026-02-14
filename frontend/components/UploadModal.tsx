'use client';

import React, { useState } from 'react';
import Modal from './Modal';
import { Upload, X, Loader2 } from 'lucide-react';

import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import ImageDropzone from './ui/ImageDropzone';
import { MIN_WALLPAPER_SIZE, MAX_WALLPAPER_SIZE } from '@/constants';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
    const { showToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [hashtags, setHashtags] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isPaid, setIsPaid] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            showToast('Please select an image first', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('is_paid', 'false'); // Forced to false as feature is disabled
            formData.append('category', 'test');
            // Ensure hashtags are sent correctly. If users type "#nature #dark", we might want to just send that string
            // or clean it up. The user didn't specify format details other than sending the field.
            // I will send it as is for now.
            formData.append('hashTags', hashtags);
            formData.append('title', title);
            formData.append('description', description);

            await api.post('/image/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true
            });

            showToast('Wallpaper uploaded successfully!', 'success');
            onClose();

            // Reset form
            setFile(null);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            setHashtags('');
            setTitle('');
            setDescription('');
            setIsPaid(false);
        } catch (error: any) {
            console.error('Upload failed:', error);
            const errorMessage = error.response?.data?.message || 'Failed to upload wallpaper';
            showToast(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} hideCloseButton={true}>
            <div
                className="w-full max-w-6xl bg-[var(--card-bg)] rounded-3xl overflow-hidden shadow-2xl border border-[var(--muted)]/20 animate-in fade-in zoom-in-95 duration-200 flex flex-col md:flex-row min-h-[600px]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Left Side - Image Upload Area */}
                <div className="w-full md:w-1/2 p-8 bg-[var(--background)]/50 border-b md:border-b-0 md:border-r border-[var(--muted)]/20 flex flex-col relative">
                    <ImageDropzone
                        variant="rectangle"
                        currentImage={previewUrl}
                        onFileSelect={(selectedFile) => {
                            setFile(selectedFile);
                            setPreviewUrl(URL.createObjectURL(selectedFile));
                        }}
                        onRemove={() => {
                            setFile(null);
                            if (previewUrl) URL.revokeObjectURL(previewUrl);
                            setPreviewUrl(null);
                        }}
                        description="Drag and drop your wallpaper (>3MB)"
                        className="h-full"
                        minSize={MIN_WALLPAPER_SIZE}
                        maxSize={MAX_WALLPAPER_SIZE}
                    />
                </div>

                {/* Right Side - Form Inputs */}
                <div className="w-full md:w-1/2 p-6 flex flex-col relative bg-[var(--card-bg)]">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h2 className="text-lg font-bold text-[var(--foreground)]">Upload Wallpaper</h2>
                            <p className="text-xs text-[var(--muted)] mt-0.5">Share your creation with the community</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 -mr-1.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors rounded-full hover:bg-[var(--foreground)]/10"
                        >
                            <X size={20} />
                        </button>
                    </div>


                    {/* Title Input */}
                    <div className="space-y-1.5">
                        <label className="text-s font-semibold text-[var(--foreground)] capitalize tracking-wide">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Give your wallpaper a name"
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--background)] border border-[var(--muted)]/20 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-all placeholder:text-[var(--muted)]/40 text-[var(--foreground)] text-sm"
                        />
                    </div>

                    {/* Description Input */}
                    <div className="space-y-1.5">
                        <label className="text-s font-semibold text-[var(--foreground)] capitalize tracking-wide">Description</label>
                        <textarea
                            value={description}
                            rows={5}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Tell us about this wallpaper..."
                            className="w-full px-3 py-2.5 rounded-lg bg-[var(--background)] border border-[var(--muted)]/20 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-all resize-none placeholder:text-[var(--muted)]/40 text-[var(--foreground)] text-sm"
                        />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
                        {/* Hashtags Input */}
                        <div className="space-y-1.5">
                            <label className="text-s font-semibold text-[var(--foreground)] capitalize tracking-wide">Hashtags</label>
                            <input
                                type="text"
                                value={hashtags}
                                onChange={(e) => setHashtags(e.target.value)}
                                placeholder="e.g. #nature #dark #aesthetic"
                                className="w-full px-3 py-2.5 rounded-lg bg-[var(--background)] border border-[var(--muted)]/20 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] outline-none transition-all placeholder:text-[var(--muted)]/40 text-[var(--foreground)] text-sm"
                            />
                        </div>


                        {/* Paid Toggle */}
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--background)] border border-[var(--muted)]/20 opacity-60">
                            <span className="text-s font-semibold text-[var(--foreground)] capitalize tracking-wide flex items-center gap-2">
                                Paid Wallpaper ?
                                <span className="text-[10px] bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Coming Soon</span>
                            </span>
                            <button
                                type="button"
                                disabled={true}
                                onClick={() => { }}
                                className={`
                                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-not-allowed
                                    bg-[var(--muted)]/20
                                `}
                            >
                                <span
                                    className={`
                                        inline-block h-4 w-4 transform rounded-full bg-[var(--muted)] transition-transform duration-200
                                        translate-x-1
                                    `}
                                />
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={!file || isSubmitting}
                            className={`
                                w-full py-2.5 rounded-lg font-bold text-sm text-[var(--background)] flex items-center justify-center gap-2 transition-all mt-auto
                                ${!file || isSubmitting
                                    ? 'bg-[var(--muted)]/30 cursor-not-allowed text-[var(--muted)]'
                                    : 'bg-[var(--foreground)] hover:opacity-90 active:scale-[0.98] shadow-sm hover:shadow-md'
                                }
                            `}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    <span>Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    <span>Upload Wallpaper</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </Modal>
    );
}
