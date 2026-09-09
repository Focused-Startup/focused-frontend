import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@apollo/client/react';
import { router } from 'expo-router';
import { useState } from 'react';
import {
	ActivityIndicator,
	Modal,
	RefreshControl,
	ScrollView,
	StyleSheet,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { Header } from '@/components/ui/Header';
import { useAppUser } from '@/contexts/UserContext';
import { GET_FRIENDS } from '@/graphql/queries';

type Friend = {
	id: number;
	username: string;
	firstName: string | null;
	lastName: string | null;
};

export default function FriendsScreen() {
	const colorScheme = useColorScheme() ?? 'light';
	const colors = Colors[colorScheme];
	const { appUser } = useAppUser();
	const [isAddModalVisible, setIsAddModalVisible] = useState(false);
	const [username, setUsername] = useState('');
	const [refreshing, setRefreshing] = useState(false);
	const { data, loading, error, refetch } = useQuery(GET_FRIENDS, {
		variables: { id: appUser?.id ?? 0 },
		skip: !appUser,
	});

	const friends = (data?.friends.users ?? []) as Friend[];

	const refreshFriends = async () => {
		setRefreshing(true);
		try {
			await refetch();
		} finally {
			setRefreshing(false);
		}
	};

	const getDisplayName = (friend: Friend) =>
		[friend.firstName, friend.lastName].filter(Boolean).join(' ') || friend.username;

	const headerLeft = (
		<TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} accessibilityLabel="Go back">
			<Ionicons name="arrow-back" size={25} color={colors.tint} />
		</TouchableOpacity>
	);

	const headerRight = (
		<TouchableOpacity onPress={() => setIsAddModalVisible(true)} activeOpacity={0.7} accessibilityLabel="Add friend">
			<Ionicons name="person-add-outline" size={25} color={colors.tint} />
		</TouchableOpacity>
	);

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
			<Header title="Friends" headerLeft={headerLeft} headerRight={headerRight} />
			<ScrollView
				contentContainerStyle={styles.content}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshFriends} tintColor={colors.tint} />}
				showsVerticalScrollIndicator={false}
			>
				<ThemedText style={styles.intro}>Stay connected with the people you care about.</ThemedText>

				{loading ? (
					<ActivityIndicator style={styles.loader} color={colors.tint} />
				) : error ? (
					<View style={styles.emptyState}>
						<Ionicons name="cloud-offline-outline" size={42} color={colors.iconLight} />
						<ThemedText style={styles.emptyText}>Could not load your friends.</ThemedText>
						<TouchableOpacity onPress={refreshFriends} style={styles.retryButton}>
							<ThemedText style={[styles.retryText, { color: colors.tint }]}>Try again</ThemedText>
						</TouchableOpacity>
					</View>
				) : friends.length === 0 ? (
					<View style={styles.emptyState}>
						<Ionicons name="people-outline" size={48} color={colors.iconLight} />
						<ThemedText style={styles.emptyText}>You have not added any friends yet.</ThemedText>
					</View>
				) : (
					friends.map((friend) => (
						<View key={friend.id} style={styles.friendCard}>
							{/* TODO: store friends profile pictures in the future */}
							<View style={[styles.avatar, { backgroundColor: `${colors.tint}22` }]}>
								<ThemedText style={[styles.avatarText, { color: colors.tint }]}>
									{getDisplayName(friend).charAt(0).toUpperCase()}
								</ThemedText>
							</View>
							<View style={styles.friendDetails}>
								<ThemedText style={styles.friendName}>{getDisplayName(friend)}</ThemedText>
								<ThemedText style={styles.username}>@{friend.username}</ThemedText>
								<View style={styles.actions}>
									<TouchableOpacity
										style={styles.actionButton}
										onPress={() => router.push({ pathname: '/(tabs)/home/friends/friendProfile', params: { friendId: friend.id } })}
									>
										<Ionicons name="person-outline" size={16} color={colors.tint} />
										<ThemedText style={[styles.actionText, { color: colors.tint }]}>Profile</ThemedText>
									</TouchableOpacity>
									<TouchableOpacity
										style={styles.actionButton}
										onPress={() => router.push({ pathname: '/(tabs)/home/friends/friendCanvas', params: { friendId: friend.id } })}
									>
										<Ionicons name="brush-outline" size={16} color={colors.tint} />
										<ThemedText style={[styles.actionText, { color: colors.tint }]}>Canvas</ThemedText>
									</TouchableOpacity>
								</View>
							</View>
						</View>
					))
				)}
			</ScrollView>

			<Modal
				visible={isAddModalVisible}
				transparent
				animationType="slide"
				onRequestClose={() => setIsAddModalVisible(false)}
			>
				<View style={styles.modalBackdrop}>
					<View style={[styles.modalCard, { backgroundColor: colors.background }]}>
						<View style={styles.modalHeader}>
							<ThemedText type="subtitle">Add a friend</ThemedText>
							<TouchableOpacity onPress={() => setIsAddModalVisible(false)} accessibilityLabel="Close">
								<Ionicons name="close" size={24} color={colors.icon} />
							</TouchableOpacity>
						</View>
						<TextInput
							value={username}
							onChangeText={setUsername}
							placeholder="Friend's username"
							placeholderTextColor={colors.iconLight}
							autoCapitalize="none"
							style={[styles.input, { color: colors.text, borderColor: colors.iconLight }]}
						/>
						<TouchableOpacity
							style={[styles.addButton, { backgroundColor: colors.tint }, !username.trim() && styles.disabledButton]}
							disabled={!username.trim()}
							onPress={() => setIsAddModalVisible(false)}
						>
							<ThemedText style={styles.addButtonText}>Send request</ThemedText>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	content: { paddingHorizontal: 20, paddingTop: 100, paddingBottom: 40 },
	intro: { marginBottom: 20, color: '#687076' },
	loader: { marginTop: 50 },
	friendCard: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		marginBottom: 12,
		borderRadius: 16,
		backgroundColor: 'rgba(255, 255, 255, 0.9)',
		borderWidth: 1,
		borderColor: 'rgba(0,0,0,0.05)',
		elevation: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.06,
		shadowRadius: 5,
	},
	avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
	avatarText: { fontSize: 21, fontWeight: '700' },
	friendDetails: { flex: 1 },
	friendName: { fontSize: 17, fontWeight: '700' },
	username: { marginTop: 2, color: '#687076', fontSize: 13 },
	actions: { flexDirection: 'row', gap: 18, marginTop: 12 },
	actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
	actionText: { fontSize: 13, fontWeight: '600' },
	emptyState: { alignItems: 'center', marginTop: 70, gap: 12 },
	emptyText: { color: '#687076', textAlign: 'center' },
	retryButton: { padding: 8 },
	retryText: { fontWeight: '600' },
	modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
	modalCard: { padding: 20, paddingBottom: 34, borderTopLeftRadius: 22, borderTopRightRadius: 22 },
	modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
	input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 14 },
	addButton: { alignItems: 'center', borderRadius: 10, paddingVertical: 13 },
	disabledButton: { opacity: 0.45 },
	addButtonText: { color: '#fff', fontWeight: '700' },
});
