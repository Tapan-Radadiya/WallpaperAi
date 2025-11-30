import Image from "next/image";
import { ImageData } from "../types";

interface ImageGalleryProps {
  images: ImageData[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Wallpaper Gallery
            </h1>
            <p className="text-lg text-gray-600">
              Discover stunning high-quality wallpapers for your devices
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="mb-8 text-center">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{images.length}</span> beautiful wallpapers
          </p>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image
                  src={image.imageUrl.regular}
                  alt={image.alt_text || 'Wallpaper image'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                
                {/* Overlay with download button */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-300 flex items-center justify-center">
                  <a
                    href={image.imageUrl.downloadable}
                    download
                    className="opacity-0 group-hover:opacity-100 bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
                  >
                    Download
                  </a>
                </div>
              </div>

              {/* Image Info */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                  {image.alt_text || 'Untitled Wallpaper'}
                </h3>
                
                {image.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {image.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Source: {image.source}</span>
                  <span>{image.width} × {image.height}</span>
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  {new Date(image.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200 text-center">
          <p className="text-gray-600">
            Beautiful wallpapers from {images[0]?.source || 'various sources'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Click on any image to download it in high quality
          </p>
        </footer>
      </main>
    </div>
  );
}
