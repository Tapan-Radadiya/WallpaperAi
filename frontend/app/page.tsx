import { getImages } from '@/lib/data';
import WallpaperGrid from '@/components/WallpaperGrid';
import SearchLayout from '@/components/SearchLayout';
import Header from '@/components/Header';
import { headers } from 'next/headers';

export default async function Home() {
  const images = await getImages();
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);

  return (
    <main className="min-h-screen pb-10">
      <div className="container mx-auto px-4 mt-6 space-y-12">
        <SearchLayout />
        <div>
           <WallpaperGrid initialImages={images} isMobile={isMobile} />
        </div>
      </div>
    </main>
  );
}
