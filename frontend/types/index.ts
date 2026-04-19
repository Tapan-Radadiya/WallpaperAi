export interface APIUserProfile {
    id: string;
    userName: string;
    emailId: string;
    avatarImage: string;
    user_bio?: string;
    instagram_id?: string;
    portfolio_url?: string;
    totalUploads: string;
    totalLikesOnUploads: string;
    is_verified?: boolean; // Added this as it's used in User interface
}

export interface APIImageOwner {
    id: string;
    avatar: string;
    userName: string;
}

export interface APILikedImage {
    image_id: string;
    title?: string;
    is_paid?: boolean;
    price?: number;
    publishedOn?: string;
    description: string;
    width: number;
    height: number;
    thumbnail_url: string;
    raw_url: string;
    ownerData: APIImageOwner;
}

export interface APIResponseData {
    userProfile: APIUserProfile;
    likedImages: APILikedImage[];
}
