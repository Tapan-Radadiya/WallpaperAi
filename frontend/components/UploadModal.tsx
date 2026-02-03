'use client';

import React, { useState, useRef } from 'react';
import Modal from './Modal';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';

import api from '@/lib/api';
import { useToast } from '@/context/ToastContext';

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
    const [isDragging, setIsDragging] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type.startsWith('image/')) {
                setFile(droppedFile);
                setPreviewUrl(URL.createObjectURL(droppedFile));
            }
        }
    };

    const removeImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

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
                    <div
                        className={`
                            relative group flex-1 border-2 border-dashed rounded-2xl transition-all duration-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden
                            ${isDragging
                                ? 'border-[var(--accent)] bg-[var(--accent)]/5 scale-[1.02]'
                                : 'border-[var(--muted)]/40 hover:border-[var(--muted)] hover:bg-[var(--foreground)]/5'
                            }
                            ${previewUrl ? 'border-none p-0' : 'p-12'}
                        `}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !previewUrl && fileInputRef.current?.click()}
                    >
                        {previewUrl ? (
                            <div className="relative w-full h-full flex items-center justify-center bg-black/5 rounded-2xl overflow-hidden">
                                <Image
                                    src={previewUrl}
                                    alt="Preview"
                                    fill
                                    className="object-contain"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="p-3 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors transform hover:scale-110 shadow-lg"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className={`p-6 rounded-full bg-[var(--muted)]/10 mb-6 group-hover:bg-[var(--accent)]/10 transition-colors`}>
                                    <Upload size={48} className={`text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors`} />
                                </div>
                                <p className="text-lg font-bold text-[var(--foreground)] text-center mb-2">
                                    Drag and drop your wallpaper
                                </p>
                                <p className="text-sm text-[var(--muted)] text-center mb-6">
                                    or <span className="text-[var(--accent)] hover:underline">browse files</span> from your computer
                                </p>
                                <p className="text-xs text-[var(--muted)] text-center capitalize tracking-wider">
                                    SVG, PNG, JPG or GIF
                                </p>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>
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
