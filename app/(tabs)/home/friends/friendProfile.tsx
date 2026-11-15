import ProfileScreen from '@/components/ui/Profile';
import { useLocalSearchParams } from 'expo-router';

export default function FriendProfileScreen() {
  const { friendId } = useLocalSearchParams<{ friendId?: string }>();

  return <ProfileScreen friendId={friendId} />;
}