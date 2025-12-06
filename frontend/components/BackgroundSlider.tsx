'use client';

import React from 'react';

interface BackgroundSliderProps {
    images: { imageURL: string }[];
}

export default function BackgroundSlider({ images }: BackgroundSliderProps) {
    // Split images into 5 rows for smaller grid items
    const rowCount = 5;
    const itemsPerRow = Math.ceil(images.length / rowCount);
    const rows = Array.from({ length: rowCount }, (_, i) =>
        images.slice(i * itemsPerRow, (i + 1) * itemsPerRow)
    );

    if (!images || images.length === 0) return null;

    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-black/90 flex flex-col justify-center gap-4">
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/80 z-10 backdrop-blur-[2px]" />

            {/* CSS for Marquee Animation */}
            <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee {
          animation: marquee 120s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse 130s linear infinite;
        }
      `}</style>

            {rows.map((rowImages, rowIndex) => (
                <div
                    key={rowIndex}
                    className="relative w-full overflow-hidden"
                    style={{ height: '20vh' }}
                >
                    <div
                        className={`flex gap-4 absolute top-0 left-0 w-max ${rowIndex % 2 === 0 ? 'animate-marquee' : 'animate-marquee-reverse'
                            }`}
                    >
                        {/* Duplicate images multiple times to ensure seamless loop for wide screens */}
                        {[...rowImages, ...rowImages, ...rowImages, ...rowImages].map((img, imgIndex) => (
                            <div
                                key={`${rowIndex}-${imgIndex}`}
                                className="relative h-[18vh] aspect-[16/9] rounded-xl overflow-hidden opacity-40 hover:opacity-90 transition-opacity duration-300"
                            >
                                <img
                                    src={img.imageURL}
                                    alt={`Wallpaper ${rowIndex}-${imgIndex}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
