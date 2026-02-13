'use client';

import BackgroundSlider from '@/components/BackgroundSlider';
import { useToast } from '@/context/ToastContext';
import axios from 'axios';
import { ArrowLeft, ArrowRight, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { useForm } from 'react-hook-form';
import sampleImages from '../../lib/sample.json';

type FormData = {
    password: string;
    confirmPassword: string;
};

export default function ResetPasswordPage() {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        mode: 'onChange'
    });

    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const password = watch('password');

    const [ticket, setTicket] = React.useState<string | null>(null);
    const [renderError, setRenderError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const ticketParam = searchParams.get('ticket');
        if (ticketParam) {
            setTicket(ticketParam);
            // Remove ticket from URL without reloading
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        } else if (!ticket) {
            setRenderError("Invalid or missing reset link. Please use the link provided in your email.");
        }
    }, [searchParams, ticket]);

    const onSubmit = async (data: FormData) => {
        if (!ticket) {
            showToast("Invalid session. Please try again.", "error");
            return;
        }

        try {
            const res = await axios.post('/api/v1/auth/update-password', {
                user_ticket: ticket,
                new_password: data.password
            });

            showToast("Password reset successfully", "success");
            router.push('/login');
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'Failed to reset password. Please try again.', 'error');
        }
    };

    if (renderError) {
        return (
            <div data-theme="dark" className="min-h-screen flex items-center justify-center p-4">
                <BackgroundSlider images={sampleImages} />
                <div className="w-full max-w-md bg-[var(--card-bg)]/80 rounded-3xl p-8 shadow-2xl border border-[var(--muted)]/20 backdrop-blur-md relative overflow-hidden z-10 text-center">
                    <h1 className="text-2xl kedebideri-bold text-[var(--foreground)] mb-4">Invalid Link</h1>
                    <p className="text-[var(--muted)] mb-6">{renderError}</p>
                    <Link href="/login" className="px-6 py-2 bg-[var(--foreground)] text-[var(--background)] rounded-xl font-medium hover:opacity-90 transition-all inline-flex items-center gap-2">
                        <ArrowLeft size={16} />
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div data-theme="dark" className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative">
            <BackgroundSlider images={sampleImages} />

            <div className="w-full max-w-md bg-[var(--card-bg)]/80 rounded-3xl p-8 shadow-2xl border border-[var(--muted)]/20 backdrop-blur-md relative overflow-hidden z-10">

                {/* Decorative background elements inside card */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl kedebideri-bold text-[var(--foreground)] mb-2">Reset Password</h1>
                        <p className="text-[var(--muted)] text-sm">Enter your new password below</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        {/* Password Field */}
                        <div className="space-y-1">
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="New Password *"
                                    className="w-full bg-[var(--background)] text-[var(--foreground)] border border-[var(--muted)]/30 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--muted)]/50"
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: {
                                            value: 6,
                                            message: 'Password must be at least 6 characters'
                                        }
                                    })}
                                />
                            </div>
                            {errors.password && <span className="text-red-500 text-xs pl-1">{errors.password.message}</span>}
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-1">
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="Confirm Password *"
                                    className="w-full bg-[var(--background)] text-[var(--foreground)] border border-[var(--muted)]/30 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all placeholder:text-[var(--muted)]/50"
                                    {...register('confirmPassword', {
                                        required: 'Please confirm your password',
                                        validate: (value) => value === password || 'Passwords do not match'
                                    })}
                                />
                            </div>
                            {errors.confirmPassword && <span className="text-red-500 text-xs pl-1">{errors.confirmPassword.message}</span>}
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
                                    Updating...
                                </>
                            ) : (
                                <>
                                    Reset Password
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
