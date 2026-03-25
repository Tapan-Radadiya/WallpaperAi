import { getProfileData, getUploadedImages } from '@/lib/server/profile-utils';
import ProfileContent from '@/components/profile/ProfileContent';

export default async function ProfilePage() {
    // Standard profile page always fetches logged-in user's data
    const profileData = await getProfileData();
    const uploadedImagesRaw = await getUploadedImages();
    return <ProfileContent initialProfileData={profileData} initialUploadedImagesRaw={uploadedImagesRaw} />;
}
