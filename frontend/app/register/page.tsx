'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Lock, Upload, ArrowRight, Loader2, Image as ImageIcon, FileText } from 'lucide-react';
import Link from 'next/link';
import axios, { HttpStatusCode } from 'axios';
import BackgroundSlider from '@/components/BackgroundSlider';
import sampleImages from '../../lib/sample.json';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

type FormData = {
    username: string;
    emailId: string;
    user_bio: string;
    password: string;
    user_avatar: FileList;
};

export default function RegisterPage() {
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        mode: 'onBlur'
    });

    const avatarFile = watch('user_avatar');
    const router = useRouter();
    const { showToast } = useToast();

    // Handle avatar preview
    React.useEffect(() => {
        if (avatarFile && avatarFile.length > 0) {
            const file = avatarFile[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setAvatarPreview(null);
        }
    }, [avatarFile]);

    const onSubmit = async (data: FormData) => {

        const formData = new FormData();
        formData.append('displayName', data.username);
        formData.append('emailId', data.emailId);
        formData.append('user_bio', data.user_bio);
        formData.append('password', data.password);
        formData.append('user_avatar', data.user_avatar[0]);



        const res = await axios.post('/api/v1/auth/register', formData, {
            withCredentials: true
        })
        if (res.status === HttpStatusCode.Created) {
            showToast('User registered successfully! Redirecting to login...', 'success');
            router.push("/login")
        } else {
            showToast('User registration failed. Please try again.', 'error');
        }
    };

    return (
        <div data-theme="dark" className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative">
            <BackgroundSlider images={sampleImages} />

            <div className="w-full max-w-md bg-[var(--card-bg)]/80 rounded-3xl p-8 shadow-2xl border border-[var(--muted)]/20 backdrop-blur-md relative overflow-hidden z-10">

                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl kedebideri-bold text-[var(--foreground)] mb-2">Create Account</h1>
                        <p className="text-[var(--muted)] text-sm">Join us and start exploring amazing wallpapers</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        {/* Avatar Upload */}
                        <div className="flex flex-col items-center justify-center mb-6">
                            <label
                                htmlFor="user_avatar"
                                className="relative cursor-pointer group"
                            >
                                <div className={`w-28 h-28 rounded-full flex items-center justify-center border-2 border-dashed transition-all duration-300 overflow-hidden
                  ${errors.user_avatar ? 'border-red-500 bg-red-500/5' : 'border-[var(--muted)] hover:border-[var(--accent)] bg-[var(--background)]'}
                `}>
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
                                            <ImageIcon size={24} className="mb-1" />
                                            <span className="text-xs">Upload *</span>
                                        </div>
                                    )}

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                        <Upload className="text-white" size={24} />
                                    </div>
                                </div>
                                <input
                                    id="user_avatar"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    {...register('user_avatar', {
                                        required: 'Avatar is required'
                                    })}
                                />
                            </label>
                            {errors.user_avatar && (
                                <span className="text-red-500 text-xs mt-2">{errors.user_avatar.message}</span>
                            )}
                        </div>

                        {/* Username Field */}
                        <div className="space-y-1">
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Username *"
                                    className="w-full bg-[var(--background)] text-[var(--foreground)] border border-[var(--muted)]/30 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--muted)]/50"
                                    {...register('username', {
                                        required: 'Username is required',
                                        minLength: { value: 3, message: 'Minimum 3 characters' }
                                    })}
                                />
                            </div>
                            {errors.username && <span className="text-red-500 text-xs pl-1">{errors.username.message}</span>}
                        </div>

                        {/* Email Field */}
                        <div className="space-y-1">
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors" size={20} />
                                <input
                                    type="email"
                                    placeholder="Email Address *"
                                    className="w-full bg-[var(--background)] text-[var(--foreground)] border border-[var(--muted)]/30 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--muted)]/50"
                                    {...register('emailId', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: "Invalid email address"
                                        }
                                    })}
                                />
                            </div>
                            {errors.emailId && <span className="text-red-500 text-xs pl-1">{errors.emailId.message}</span>}
                        </div>

                        {/* Bio Field */}
                        <div className="space-y-1">
                            <div className="relative group">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Bio (Optional)"
                                    className="w-full bg-[var(--background)] text-[var(--foreground)] border border-[var(--muted)]/30 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--muted)]/50"
                                    {...register('user_bio')}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1">
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="Password *"
                                    className="w-full bg-[var(--background)] text-[var(--foreground)] border border-[var(--muted)]/30 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--muted)]/50"
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: { value: 6, message: 'Minimum 6 characters' }
                                    })}
                                />
                            </div>
                            {errors.password && <span className="text-red-500 text-xs pl-1">{errors.password.message}</span>}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[var(--foreground)] text-[var(--background)] rounded-xl py-3.5 font-medium hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-[var(--muted)]">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[var(--accent)] font-medium hover:underline">
                            Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
