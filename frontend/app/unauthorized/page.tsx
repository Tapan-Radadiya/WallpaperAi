'use client';

import LoginPrompt from '@/components/LoginPrompt';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
            <LoginPrompt />
        </div>
    );
}
