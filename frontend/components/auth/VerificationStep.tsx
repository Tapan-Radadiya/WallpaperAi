'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Shield, Loader2, AlertCircle } from 'lucide-react';
import { HttpStatusCode } from 'axios';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

interface VerificationStepProps {
    registeredEmail: string;
    onSuccess?: () => void;
    autoResend?: boolean;
}

export default function VerificationStep({ registeredEmail, onSuccess, autoResend = false }: VerificationStepProps) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const router = useRouter();
    const { showToast } = useToast();
    const hasAutoResent = useRef(false);

    useEffect(() => {
        if (autoResend && !hasAutoResent.current) {
            hasAutoResent.current = true;
            handleResendEmail();
        }
    }, [autoResend]);

    const handleOtpChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;

        setError(null); // Clear error on change

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
        if (pastedData.every(char => !isNaN(Number(char)))) {
            const newOtp = [...otp];
            pastedData.forEach((char, index) => {
                if (index < 6) newOtp[index] = char;
            });
            setOtp(newOtp);
            inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
        }
    };

    const handleVerify = async () => {
        const verificationCode = otp.join('');
        if (verificationCode.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setError(null);
        setIsVerifying(true);
        try {
            const response = await api.post('/user-verification/verify-user', {
                emailId: registeredEmail,
                verificationCode: verificationCode
            });

            if (response.status === HttpStatusCode.Ok || response.status === HttpStatusCode.Created) {
                showToast('Email verified successfully!', 'success');
                if (onSuccess) {
                    onSuccess();
                } else {
                    router.push('/login');
                }
            } else {
                setError('Verification failed. Invalid code.');
            }
        } catch (error: any) {
            console.error('Verification error:', error);
            setError(error.response?.data?.message || 'Verification failed. Please try again.');
        } finally {
            setIsVerifying(false);
        }
    };

    const handleResendEmail = async () => {
        setIsResending(true);
        setError(null);
        try {
            const response = await api.post('/user-verification/resend-verification-email', {
                emailId: registeredEmail
            });

            if (response.status === HttpStatusCode.Ok) {
                showToast('Verification code resent successfully.', 'success');
            } else {
                setError('Failed to resend email. Please try again.');
            }
        } catch (error: any) {
            console.error('Resend email error:', error);
            setError(error.response?.data?.message || 'Failed to resend email.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="relative z-10 flex flex-col items-center justify-center py-12 space-y-6 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-[var(--accent)]/10 rounded-full flex items-center justify-center mb-2">
                <Shield size={40} className="text-[var(--accent)]" />
            </div>
            <div className="space-y-2 max-w-md">
                <h1 className="text-3xl kedebideri-bold text-[var(--foreground)]">Verify Your Email</h1>
                <p className="text-[var(--muted)]">
                    We've sent a verification code to <span className="font-medium text-[var(--foreground)]">{registeredEmail}</span>
                </p>
            </div>

            <div className="w-full max-w-sm space-y-8">
                <div className="flex justify-center gap-3">
                    {otp.map((digit, index: number) => (
                        <input
                            key={index}
                            ref={el => { inputRefs.current[index] = el }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            className={`w-12 h-14 bg-[var(--background)] text-[var(--foreground)] border rounded-xl text-center text-xl font-medium outline-none transition-all
                                ${digit ? 'border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'border-[var(--muted)]/30 focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]'}
                            `}
                        />
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-sm animate-in fade-in slide-in-from-top-1">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <button
                    type="button"
                    disabled={isVerifying || otp.join('').length !== 6}
                    className="w-full bg-[var(--foreground)] text-[var(--background)] rounded-xl py-4 font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    onClick={handleVerify}
                >
                    {isVerifying ? (
                        <>
                            <Loader2 className="animate-spin" size={22} />
                            Verifying...
                        </>
                    ) : (
                        'Verify'
                    )}
                </button>

                <button
                    type="button"
                    disabled={isResending}
                    className="text-[var(--accent)] font-medium hover:underline text-sm flex items-center justify-center gap-2 mx-auto disabled:opacity-70 disabled:cursor-not-allowed"
                    onClick={handleResendEmail}
                >
                    {isResending ? (
                        <>
                            <Loader2 className="animate-spin" size={14} />
                            Resending...
                        </>
                    ) : (
                        'Resend Email'
                    )}
                </button>
            </div>
        </div>
    );
}
