import React from 'react';

export default function CollectionsTab() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-muted space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted/10 flex items-center justify-center">
                <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            </div>
            <p>No collections created yet.</p>
        </div>
    );
}
