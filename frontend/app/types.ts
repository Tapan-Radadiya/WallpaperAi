export interface ImageUrl {
  small: string;
  large: string;
  regular: string;
  downloadable: string;
}

export interface ImageData {
  source: string;
  id: string;
  width: number;
  height: number;
  imageUrl: ImageUrl;
  alt_text: string;
  description: string;
  created_at: string;
}

export interface ImageResponse {
  statusCode: number;
  message: string;
  data: ImageData[];
}
