'use client';

import BackgroundSlider from '@/components/BackgroundSlider';
import axios, { HttpStatusCode } from 'axios';
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import sampleImages from '../../lib/sample.json';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

type FormData = {
    emailId: string;
    password: string;
};

export default function LoginPage() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        mode: 'onSubmit'
    });

    const router = useRouter();
    const { showToast } = useToast();
    const { login } = useAuth();

    const onSubmit = async (data: FormData) => {
        try {
            const res = await axios.post('/api/v1/auth/login', data, {
                withCredentials: true
            });

            if (res.status === HttpStatusCode.Ok || res.status === HttpStatusCode.Created) {
                // Assuming response data structure contains user data
                // Adjusting based on standard patterns, if it's res.data.user or res.data
                const userData = res.data.data || res.data;

                // Ensure the data matches User interface, or manually map it
                login({
                    id: userData.id || userData._id,
                    userName: userData.userName,
                    emailId: userData.emailId,
                    avatarImage: userData.avatarImage,
                    is_verified: userData.is_verified
                });

                showToast('Login successful', 'success');
                router.push("/")
            } else {
                showToast('Login failed! Please check your credentials.', 'error');
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'An error occurred during login. Please try again.', 'error');
        }
    };

    return (
        <div data-theme="dark" className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative">
            <BackgroundSlider images={sampleImages} />

            <div className="w-full max-w-md bg-[var(--card-bg)]/80 rounded-3xl p-8 shadow-2xl border border-[var(--muted)]/20 backdrop-blur-md relative overflow-hidden z-10">

                {/* Decorative background elements inside card */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--accent)]/5 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl kedebideri-bold text-[var(--foreground)] mb-2">Welcome Back</h1>
                        <p className="text-[var(--muted)] text-sm">Sign in to continue your journey</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

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
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-[var(--muted)]">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-[var(--accent)] font-medium hover:underline">
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
