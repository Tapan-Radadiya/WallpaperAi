'use client';

import React, { useState } from 'react';
import BackgroundSlider from '@/components/BackgroundSlider';
import sampleImages from '../../lib/sample.json';
import RegistrationStep from '@/components/auth/RegistrationStep';
import VerificationStep from '@/components/auth/VerificationStep';

export default function RegisterPage() {
    const [isVerificationStep, setIsVerificationStep] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    const handleRegistrationSuccess = (email: string) => {
        setRegisteredEmail(email);
        setIsVerificationStep(true);
    };

    return (
        <div data-theme="dark" className="h-[calc(100vh-4rem)] w-full overflow-hidden flex items-center justify-center p-4 relative bg-[var(--background)]">
            <BackgroundSlider images={sampleImages} />

            <div className="w-full max-w-6xl bg-[var(--card-bg)]/80 rounded-3xl p-6 shadow-2xl border border-[var(--muted)]/20 backdrop-blur-md relative z-10 animate-in fade-in zoom-in duration-300">

                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--accent)]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-[var(--accent)]/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

                {isVerificationStep ? (
                    <VerificationStep registeredEmail={registeredEmail} />
                ) : (
                    <RegistrationStep onRegistrationSuccess={handleRegistrationSuccess} />
                )}
            </div>
        </div>
    );
}
