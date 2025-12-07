import { getImages } from '@/lib/data';
import WallpaperGrid from '@/components/WallpaperGrid';
import Header from '@/components/Header';
import { headers } from 'next/headers';

export default async function Home() {
  const images = await getImages();
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);

  return (
    <main className="min-h-screen pb-10">
      <Header />

      <div className="container mx-auto mt-6">
        <WallpaperGrid initialImages={images} isMobile={isMobile} />
      </div>
    </main>
  );
}
