import ImageGallery from "./components/ImageGallery";
import { ImageResponse, ImageData } from "./types";

// Server component to fetch image data
async function getImages(): Promise<ImageData[]> {
  try {
    // Import the JSON file directly in server component
    const imageData = await import('../imagedata.json');
    const data: ImageResponse = imageData.default;
    return data.data;
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
}

export default async function Home() {
  // Fetch images on the server
  const images = await getImages();

  return <ImageGallery images={images} />;
}
