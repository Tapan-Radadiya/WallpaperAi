import { useState, useEffect } from 'react';
import { WallpaperImage } from '@/lib/data';

export function useMasonryGrid(images: WallpaperImage[], isMobile: boolean = false) {
    const [columns, setColumns] = useState<WallpaperImage[][]>([[], [], [], []]);
    const [numColumns, setNumColumns] = useState(isMobile ? 1 : 4);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) setNumColumns(1);
            else if (width < 1024) setNumColumns(2);
            else if (width < 1280) setNumColumns(3);
            else setNumColumns(4);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const newColumns: WallpaperImage[][] = Array.from({ length: numColumns }, () => []);
        images.forEach((image, index) => {
            newColumns[index % numColumns].push(image);
        });
        setColumns(newColumns);
    }, [images, numColumns]);

    return { columns };
}
