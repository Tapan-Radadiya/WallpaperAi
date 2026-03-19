import SearchLayout from '@/components/SearchLayout';

export const metadata = {
  title: 'Search | WallpaperAi',
  description: 'Search for beautiful wallpapers',
};

export default function SearchPage() {
  return (
    <main className="min-h-screen pb-10">
      <div className="container mx-auto px-4 mt-6">
        <h1 className="text-3xl font-orbitron font-bold mb-6 text-foreground">Search Wallpapers</h1>
        <SearchLayout />
      </div>
    </main>
  );
}
