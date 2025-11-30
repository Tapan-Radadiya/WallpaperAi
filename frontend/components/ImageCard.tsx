import Image from 'next/image';
import { WallpaperImage } from '@/lib/data';

export default function ImageCard({ image }: { image: WallpaperImage }) {
    return (
        <div className="group relative mb-4 break-inside-avoid rounded-xl overflow-hidden bg-card-bg shadow-sm hover:shadow-xl transition-all duration-300 border border-muted/10">
            <div className="relative w-full">
                <Image
                    src={image.imageUrl.regular}
                    alt={image.alt_text || 'Wallpaper'}
                    width={image.width}
                    height={image.height}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    placeholder="blur"
                    blurDataURL={image.imageUrl.small}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-sm font-medium truncate">
                    {image.alt_text || 'Untitled'}
                </p>
                <p className="text-white/80 text-xs mt-1">
                    {image.source}
                </p>
            </div>
        </div>
    );
}
