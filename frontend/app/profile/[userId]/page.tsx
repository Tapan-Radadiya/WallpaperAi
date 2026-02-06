import { getProfileData } from '@/lib/server/profile-utils';
import ProfileContent from '@/components/profile/ProfileContent';

interface PageProps {
    params: Promise<{ userId: string }>;
}

export default async function PublicProfilePage({ params }: PageProps) {
    const { userId } = await params;
    const profileData = await getProfileData(userId);

    return <ProfileContent initialProfileData={profileData} viewedUserId={userId} />;
}
