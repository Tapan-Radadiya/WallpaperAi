'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Tab {
    id: string;
    label: string;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (id: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
    return (
        <div className="flex space-x-1 p-1 bg-card-bg rounded-xl max-w-fit mx-auto shadow-sm border border-muted/10 items-center justify-center">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
            relative rounded-lg px-6 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2
            ${activeTab === tab.id ? 'text-foreground' : 'text-muted hover:text-foreground'}
          `}
                    style={{
                        WebkitTapHighlightColor: 'transparent',
                    }}
                >
                    {activeTab === tab.id && (
                        <motion.span
                            layoutId="bubble"
                            className="absolute inset-0 z-10 bg-white/10 dark:bg-white/5 bg-accent/5 rounded-lg border border-accent/10 shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                    )}
                    <span className="relative z-20">{tab.label}</span>
                </button>
            ))}
        </div>
    );
}
