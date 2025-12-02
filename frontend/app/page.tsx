import { getImages } from '@/lib/data';
import WallpaperGrid from '@/components/WallpaperGrid';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { headers } from 'next/headers';

export default async function Home() {
  const images = await getImages();
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);

  return (
    <main className="min-h-screen pb-10">
      <header className="sticky top-0 z-10 backdrop-blur-md bg-background/80 border-b border-muted/20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted bg-clip-text text-transparent">
            WallpaperAI
          </h1>
          <ThemeSwitcher />
        </div>
      </header>

      <div className="container mx-auto mt-6">
        <WallpaperGrid initialImages={images} isMobile={isMobile} />
      </div>
    </main>
  );
}
