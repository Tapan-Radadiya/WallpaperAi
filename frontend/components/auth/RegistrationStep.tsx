'use client';

import React, { useState, useEffect } from 'react';
import { validateImage } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { User, Mail, Lock, ArrowRight, Loader2, FileText, Instagram, Globe, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import axios, { HttpStatusCode } from 'axios';
import { useToast } from '@/context/ToastContext';
import { useDebounce } from '@/hooks/useDebounce';
import { ALLOWED_EMAILS_DOMAINS, MAX_FILE_SIZE } from '../../constants';
import ImageDropzone from '../ui/ImageDropzone';

type FormData = {
    username: string;
    emailId: string;
    user_bio: string;
    password: string;
    user_avatar: FileList;
    instagram_url?: string;
    portfolio_url?: string;
};

interface RegistrationStepProps {
    onRegistrationSuccess: (email: string) => void;
}

export default function RegistrationStep({ onRegistrationSuccess }: RegistrationStepProps) {
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        mode: 'onSubmit'
    });

    const avatarFile = watch('user_avatar');
    const { showToast } = useToast();

    // Form level error state
    const [formError, setFormError] = useState<string | null>(null);

    // Username checking state
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [usernameMessage, setUsernameMessage] = useState('');
    const [isUsernameValid, setIsUsernameValid] = useState<boolean | null>(null);

    const username = watch('username');
    const debouncedUsername = useDebounce(username, 500);

    useEffect(() => {
        const checkUsernameUnique = async () => {
            if (!debouncedUsername || debouncedUsername.length < 3) {
                setIsUsernameValid(null);
                setUsernameMessage('');
                return;
            }

            setIsCheckingUsername(true);
            try {
                const response = await axios.get(`/api/v1/user/username-exists/${debouncedUsername}`);
                // 200 OK means username is not taken (Available)
                if (response.status === HttpStatusCode.Ok) {
                    setIsUsernameValid(true);
                    setUsernameMessage('Username is available');
                }
            } catch (error: any) {
                if (error.response?.status === 409) {
                    setIsUsernameValid(false);
                    setUsernameMessage(error.response?.data?.message || 'Username is already taken');
                } else {
                    // Handle other errors or treat as potentially available but let submission fail if real issue
                    setIsUsernameValid(null);
                    setUsernameMessage('Error checking username');
                }
            } finally {
                setIsCheckingUsername(false);
            }
        };

        checkUsernameUnique();
    }, [debouncedUsername]);

    // Email checking state
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [emailMessage, setEmailMessage] = useState('');
    const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null);

    const email = watch('emailId');
    const debouncedEmail = useDebounce(email, 500);

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

    useEffect(() => {
        const checkEmailUnique = async () => {
            if (!debouncedEmail || !emailRegex.test(debouncedEmail)) {
                setIsEmailValid(null);
                setEmailMessage('');
                return;
            }

            const emailDomain = debouncedEmail.split('@')[1];
            if (!ALLOWED_EMAILS_DOMAINS.includes(emailDomain)) {
                setIsEmailValid(false);
                setEmailMessage('Signup with this email provider is currently unavailable. Please try a different email.');
                return;
            }

            setIsCheckingEmail(true);
            try {
                const response = await axios.get(`/api/v1/user/useremail-exists/${debouncedEmail}`);
                if (response.status === HttpStatusCode.Ok) {
                    setIsEmailValid(true);
                    setEmailMessage('Email is available');
                }
            } catch (error: any) {
                if (error.response?.status === 409) {
                    setIsEmailValid(false);
                    setEmailMessage(error.response?.data?.message || 'Email is already registered');
                } else {
                    setIsEmailValid(null);
                    setEmailMessage('Error checking email');
                }
            } finally {
                setIsCheckingEmail(false);
            }
        };

        checkEmailUnique();
    }, [debouncedEmail]);

    // Handle avatar preview
    useEffect(() => {
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
        // Prevent submission if checks are failing or still running
        if (isUsernameValid === false || isEmailValid === false || isCheckingUsername || isCheckingEmail) {
            return;
        }

        setFormError(null); // Clear previous errors

        const formData = new FormData();
        formData.append('userName', data.username);
        formData.append('emailId', data.emailId);
        formData.append('user_bio', data.user_bio);
        formData.append('password', data.password);
        formData.append('user_avatar', data.user_avatar[0]);
        if (data.instagram_url) formData.append('instagram_id', data.instagram_url);
        if (data.portfolio_url) formData.append('portfolio_url', data.portfolio_url);

        try {
            const res = await axios.post('/api/v1/auth/register', formData, {
                withCredentials: true
            });
            if (res.status === HttpStatusCode.Created) {
                showToast('Registration successful! Please verify your email.', 'success');
                onRegistrationSuccess(data.emailId);
            } else {
                setFormError('User registration failed. Please try again.');
            }
        } catch (error: any) {
            console.error(error);
            setFormError(error.response?.data?.message || 'Registration failed. Please try again.');
        }
    };

    return (
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

            {/* Left Column: Header & Avatar */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center space-y-4 md:border-r md:border-[var(--muted)]/20 md:pr-8">
                <div className="space-y-2">
                    <h1 className="text-4xl kedebideri-bold text-[var(--foreground)]">Create Account</h1>
                    <p className="text-[var(--muted)] text-base">Join us and start exploring amazing wallpapers</p>
                </div>

                {/* Avatar Upload */}
                <div className="flex flex-col items-center justify-center py-2 w-full max-w-[200px]">
                    <ImageDropzone
                        variant="circle"
                        onFileSelect={(file) => {
                            const dt = new DataTransfer();
                            dt.items.add(file);
                            setValue('user_avatar', dt.files, { shouldValidate: true });
                        }}
                        currentImage={avatarPreview}
                        description="Upload Photo *"
                        maxSize={MAX_FILE_SIZE}
                        validator={validateImage}
                    />
                    <input
                        type="hidden"
                        {...register('user_avatar', {
                            required: 'Avatar is required'
                        })}
                    />
                    {errors.user_avatar && (
                        <span className="text-red-500 text-sm mt-2">{errors.user_avatar.message}</span>
                    )}
                </div>
            </div>

            {/* Right Column: Form Fields */}
            <div className="md:col-span-8 flex flex-col justify-center">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Username Field */}
                        <div className="space-y-1">
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Username *"
                                    className="w-full bg-[var(--background)] text-[var(--foreground)] border border-[var(--muted)]/30 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--muted)]/50"
                                    {...register('username', {
                                        required: 'Username is required',
                                        minLength: { value: 3, message: 'Minimum 3 characters' }
                                    })}
                                />
                            </div>

                            {isCheckingUsername && <span className="text-[var(--muted)] text-xs pl-1 flex items-center gap-1"><Loader2 className="animate-spin" size={12} /> Checking...</span>}
                            {!isCheckingUsername && isUsernameValid === true && <span className="text-green-500 text-xs pl-1 flex items-center gap-1"><CheckCircle size={12} /> {usernameMessage}</span>}
                            {!isCheckingUsername && isUsernameValid === false && <span className="text-red-500 text-xs pl-1 flex items-center gap-1"><XCircle size={12} /> {usernameMessage}</span>}
                            {errors.username && <span className="text-red-500 text-xs pl-1">{errors.username.message}</span>}
                        </div>

                        {/* Email Field */}
                        <div className="space-y-1">
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors" size={20} />
                                <input
                                    type="email"
                                    placeholder="Email Address *"
                                    className="w-full bg-[var(--background)] text-[var(--foreground)] border border-[var(--muted)]/30 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--muted)]/50"
                                    {...register('emailId', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: "Invalid email address"
                                        },
                                        validate: (value) => {
                                            const domain = value.split('@')[1];
                                            if (!ALLOWED_EMAILS_DOMAINS.includes(domain)) {
                                                return "Signup with this email provider is currently unavailable. Please try a different email.";
                                            }
                                            return true;
                                        }
                                    })}
                                />
                            </div>
                            {isCheckingEmail && <span className="text-[var(--muted)] text-xs pl-1 flex items-center gap-1"><Loader2 className="animate-spin" size={12} /> Checking...</span>}
                            {!isCheckingEmail && isEmailValid === true && <span className="text-green-500 text-xs pl-1 flex items-center gap-1"><CheckCircle size={12} /> {emailMessage}</span>}
                            {!isCheckingEmail && isEmailValid === false && <span className="text-red-500 text-xs pl-1 flex items-center gap-1"><XCircle size={12} /> {emailMessage}</span>}
                            {errors.emailId && <span className="text-red-500 text-xs pl-1">{errors.emailId.message}</span>}
                        </div>
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Password Field */}
                        <div className="space-y-1">
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="Password *"
                                    className="w-full bg-[var(--background)] text-[var(--foreground)] border border-[var(--muted)]/30 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--muted)]/50"
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: { value: 6, message: 'Minimum 6 characters' }
                                    })}
                                />
                            </div>
                            {errors.password && <span className="text-red-500 text-xs pl-1">{errors.password.message}</span>}
                        </div>

                        {/* Instagram Field */}
                        <div className="space-y-1">
                            <div className="relative group">
                                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors" size={20} />
                                <input
                                    type="text"
                                    placeholder="Instagram URL (Optional)"
                                    className="w-full bg-[var(--background)] text-[var(--foreground)] border border-[var(--muted)]/30 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--muted)]/50"
                                    {...register('instagram_url')}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Portfolio Field */}
                    <div className="space-y-1">
                        <div className="relative group">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Portfolio URL (Optional)"
                                className="w-full bg-[var(--background)] text-[var(--foreground)] border border-[var(--muted)]/30 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--muted)]/50"
                                {...register('portfolio_url')}
                            />
                        </div>
                    </div>

                    {/* Bio Field - Full Width */}
                    <div className="space-y-1">
                        <div className="relative group">
                            <FileText className="absolute left-4 top-3 text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors" size={20} />
                            <textarea
                                rows={3}
                                placeholder="Tell us a bit about yourself... *"
                                className="w-full bg-[var(--background)] text-[var(--foreground)] border border-[var(--muted)]/30 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--muted)]/50 resize-none"
                                {...register('user_bio', {
                                    required: 'Bio is required',
                                    minLength: { value: 10, message: 'Bio must be at least 10 characters long' }
                                })}
                            />
                        </div>
                        {errors.user_bio && <span className="text-red-500 text-xs pl-1">{errors.user_bio.message}</span>}
                    </div>

                    {/* Form Error Message */}
                    {formError && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-1">
                            <AlertCircle size={18} />
                            <span>{formError}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting || isCheckingUsername || isCheckingEmail || isUsernameValid === false || isEmailValid === false}
                        className="w-full bg-[var(--foreground)] text-[var(--background)] rounded-xl py-4 font-medium hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-lg"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={22} />
                                Creating Account...
                            </>
                        ) : (
                            <>
                                Create Account
                                <ArrowRight size={22} />
                            </>
                        )}
                    </button>

                    <div className="mt-4 text-center text-sm text-[var(--muted)]">
                        Already have an account?{' '}
                        <Link href="/login" className="text-[var(--accent)] font-medium hover:underline">
                            Sign In
                        </Link>
                    </div>
                </form>
            </div >
        </div >
    );
}
