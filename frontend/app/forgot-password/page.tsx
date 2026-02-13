'use client';

import BackgroundSlider from '@/components/BackgroundSlider';
import { useToast } from '@/context/ToastContext';
import axios, { HttpStatusCode } from 'axios';
import { ArrowLeft, ArrowRight, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import sampleImages from '../../lib/sample.json';

type FormData = {
    emailId: string;
};

export default function ForgotPasswordPage() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({
        mode: 'onSubmit'
    });

    const router = useRouter();
    const { showToast } = useToast();

    const onSubmit = async (data: FormData) => {
        try {
            const res = await axios.put('/api/v1/auth/reset-password', data);

            if (res.status === HttpStatusCode.Ok || res.status === HttpStatusCode.Created) {
                showToast('Password reset link sent to your email.', 'success');
                // Redirect to login after a short delay or immediately
                setTimeout(() => router.push('/login'), 2000);
            } else {
                showToast('Failed to send reset link. Please try again.', 'error');
            }
        } catch (error: any) {
            console.error(error);
            showToast(error.response?.data?.message || 'An error occurred. Please try again.', 'error');
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
                        <h1 className="text-3xl kedebideri-bold text-[var(--foreground)] mb-2">Forgot Password</h1>
                        <p className="text-[var(--muted)] text-sm">Enter your email to reset your password</p>
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

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[var(--foreground)] text-[var(--background)] rounded-xl py-3.5 font-medium hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Sending Link...
                                </>
                            ) : (
                                <>
                                    Send Reset Link
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-[var(--muted)]">
                        <Link href="/login" className="text-[var(--accent)] font-medium hover:underline flex items-center justify-center gap-2">
                            <ArrowLeft size={16} />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
