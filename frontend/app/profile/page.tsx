import { getProfileData } from '@/lib/server/profile-utils';
import ProfileContent from '@/components/profile/ProfileContent';

export default async function ProfilePage() {
    // Standard profile page always fetches logged-in user's data
    const profileData = await getProfileData();
    return <ProfileContent initialProfileData={profileData} />;
}
