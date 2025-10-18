import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

import { Calendar } from 'react-native-calendars';
import { Colors } from '../../constants/Colors';
import { CustomButton } from '../../components/CustomButton';
import { Ionicons } from '@expo/vector-icons';
import { ListingService } from '../../services';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '../../components/ThemedText';
import { UserReview } from '../../components/UserReview';

// Placeholder values if server does not have these fields yet
const defaultReviews = [
  { name: 'John D.', rating: 5, review: 'Great experience!', profileImage: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { name: 'Priya S.', rating: 5, review: 'Very knowledgeable and friendly.', profileImage: 'https://randomuser.me/api/portraits/women/2.jpg' },
];

export default function GuideDetailScreen() {
		const { title } = useLocalSearchParams();
		const [details, setDetails] = useState<any | null>(null);
		const [loading, setLoading] = useState<boolean>(true);
		const [error, setError] = useState<string | null>(null);
		const [selectedDate, setSelectedDate] = useState('');
		const [calendarVisible, setCalendarVisible] = useState(false);
    const [packages, setPackages] = useState<PackageListItem[]>([]);
    const [packagesLoading, setPackagesLoading] = useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [reloadKey, setReloadKey] = useState<number>(0);

		useEffect(() => {
			let isMounted = true;
			const load = async () => {
				try {
					setLoading(true);
					setError(null);
					const raw = decodeURIComponent(String(title || '')).trim();
					if (!raw) throw new Error('Invalid guide identifier');

					// 1) Try direct by-username fetch
					try {
						const res = await ListingService.getGuideByUsername(raw);
						if (isMounted) setDetails(res.data);
						return;
					} catch {}

					// 2) Fallback: search list by name/username and resolve a username
					const norm = (s: string) => (s || '').toLowerCase().trim();
					const full = norm(raw);
					const parts = full.split(/\s+/).filter(Boolean);

					const tryPickFrom = (items: any[]) => {
            const candidates = items || [];
            return (
              candidates.find((g: any) => {
                const uname = norm(g.username);
                const fname = norm(g.guideDetails?.firstName || g.details?.firstName || '');
                const lname = norm(g.guideDetails?.lastName || g.details?.lastName || '');
                const fullname = `${fname} ${lname}`.trim();
                return uname === full || fullname === full;
              }) ||
              candidates.find((g: any) => {
                const uname = norm(g.username);
                return uname.includes(full);
              }) ||
              candidates[0]
            );
          };

					// First, try with full query
					let list = await ListingService.listGuides({ q: raw, limit: 10 });
					let pick = tryPickFrom(list.data || []);

					// If not found or missing username, try first and last tokens separately
					if (!pick?.username && parts.length) {
						list = await ListingService.listGuides({ q: parts[0], limit: 10 });
						pick = tryPickFrom(list.data || []);
					}
					if (!pick?.username && parts.length > 1) {
						list = await ListingService.listGuides({ q: parts[parts.length - 1], limit: 10 });
						pick = tryPickFrom(list.data || []);
					}

					// Final fallback: grab a broader list and search client-side
					if (!pick?.username) {
						list = await ListingService.listGuides({ limit: 50 });
						pick = tryPickFrom(list.data || []);
					}

					if (!pick?.username) throw new Error('Guide not found');
					const res2 = await ListingService.getGuideByUsername(pick.username);
					if (isMounted) setDetails(res2.data);
				} catch (e: any) {
					console.error('Guide details load failed:', e);
					if (isMounted) setError(e?.message || 'Failed to load guide');
				} finally {
					if (isMounted) {
						setLoading(false);
						setRefreshing(false);
					}
				}
			};
			load();
			return () => { isMounted = false; };
		}, [title, reloadKey]);

		// Load packages for this guide once details (with _id) are available
		useEffect(() => {
			let isMounted = true;
			const fetchPackages = async () => {
				try {
					if (!details?._id) return;
					setPackagesLoading(true);
					const res = await GuideService.listPackages({ limit: 20, isActive: true, guideId: String(details._id) });
					if (isMounted) setPackages(res?.data || []);
				} catch (e) {
					console.warn('Failed to load guide packages:', e);
					if (isMounted) setPackages([]);
				} finally {
					if (isMounted) setPackagesLoading(false);
				}
			};
			fetchPackages();
			return () => { isMounted = false; };
		}, [details?._id, reloadKey]);

	function getNext14Days() {
		const days = [];
		const today = new Date();
		for (let i = 0; i < 14; i++) {
			const d = new Date(today);
			d.setDate(today.getDate() + i);
			days.push({
				date: d.toISOString().slice(0, 10),
				day: d.toLocaleDateString('en-US', { weekday: 'short' }),
				num: d.getDate(),
			});
		}
		return days;
	}

		if (loading) {
			return (
				<SafeAreaView style={styles.container}>
					<View style={styles.centerPhotoSection}><ThemedText>Loading...</ThemedText></View>
				</SafeAreaView>
			);
		}

		if (error || !details) {
			return (
				<SafeAreaView style={styles.container}>
					<View style={styles.centerPhotoSection}><ThemedText>{error || 'Guide not found'}</ThemedText></View>
				</SafeAreaView>
			);
		}

		const fullName = `${details?.guideDetails?.firstName || details?.details?.firstName || ''} ${details?.guideDetails?.lastName || details?.details?.lastName || ''}`.trim() || details?.username;
		const avatarRaw = details?.guideDetails?.avatar || details?.details?.avatar || details?.avatar || details?.reviews?.[0]?.profileImage || '';
		const avatar = avatarRaw ? toAbsoluteImageUrl(avatarRaw) : 'https://images.unsplash.com/photo-1517841905240-472988babdf9';
		const languages: string[] = details?.guideDetails?.languages || [];
		const expertise: string[] = details?.guideDetails?.expertise || [];
		const bio: string = details?.guideDetails?.bio || 'Local tour guide.';

		const availableDates: string[] = details?.availability || [];
	const next14Days = getNext14Days();
	const bookedDates = next14Days.map(d => d.date).filter(date => !availableDates.includes(date));

	return (
		<SafeAreaView style={styles.container}>
			<TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
				<Ionicons name="arrow-back" size={24} color={Colors.primary300} />
			</TouchableOpacity>
			<ScrollView
				contentContainerStyle={styles.scrollContent}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={() => {
							setRefreshing(true);
							setReloadKey(k => k + 1);
						}}
					/>
				}
			>
				{/* Profile Card */}
				<View style={styles.profileCard}>
					<View style={styles.centerPhotoSection}>
						<Image
							source={{ uri: avatar }}
							style={styles.guidePhoto}
							onError={(e) => console.warn('Guide avatar failed to load:', avatarRaw, e.nativeEvent?.error)}
						/>
					</View>
					<View style={styles.infoRow}>
						<View style={styles.nameAddressCol}>
							<ThemedText variant="title" style={styles.title}>{fullName}</ThemedText>
							<View style={styles.locationRow}>
								<Ionicons name="location-outline" size={16} color={Colors.primary600} />
								<Text style={styles.city}>{details.city || 'Sri Lanka'}</Text>
							</View>
						</View>
						<View style={styles.ratingRow}>
							<Ionicons name="star" size={16} color={Colors.warning || '#FFD700'} />
							<Text style={styles.rating}>{details.rating ?? '5.0'}</Text>
						</View>
					</View>
				</View>

				{/* Languages */}
				{languages.length > 0 && (
					<View style={styles.sectionCard}>
						<View style={styles.sectionHeaderRow}>
							<ThemedText variant="subtitle" style={styles.sectionTitle}>Languages</ThemedText>
						</View>
						<View style={[styles.sectionBody, styles.chipRow]}>
							{languages.map((lang, i) => (
								<View key={i} style={styles.chip}><Text style={styles.chipText}>{lang}</Text></View>
							))}
						</View>
					</View>
				)}

				{/* Expertise */}
				{expertise.length > 0 && (
					<View style={styles.sectionCard}>
						<View style={styles.sectionHeaderRow}>
							<ThemedText variant="subtitle" style={styles.sectionTitle}>Expertise</ThemedText>
						</View>
						<View style={[styles.sectionBody, styles.chipRow]}>
							{expertise.map((exp, i) => (
								<View key={i} style={styles.chip}><Text style={styles.chipText}>{exp}</Text></View>
							))}
						</View>
					</View>
				)}

				{/* Packages by this guide */}
				<View style={styles.sectionCard}>
					<View style={styles.sectionHeaderRow}>
						<ThemedText variant="subtitle" style={styles.sectionTitle}>Tour Packages</ThemedText>
						{packages.length > 0 && (
							<TouchableOpacity onPress={() => router.push({ pathname: '/tour_guides/packages', params: { guideId: String(details._id || ''), username: details.username || '', title: details.username || '' } })}>
								<Text style={styles.sectionLink}>View all</Text>
							</TouchableOpacity>
						)}
					</View>
					{packagesLoading ? (
						<View style={{ paddingVertical: 12 }}>
							<ActivityIndicator />
						</View>
					) : packages.length === 0 ? (
						<Text style={[styles.description, { fontStyle: 'italic', marginHorizontal: 0 }]}>No active packages yet.</Text>
					) : (
						<ScrollView horizontal showsHorizontalScrollIndicator={false}>
							{packages.map((pkg) => {
								const imgRaw = (pkg as any).coverImage || (pkg.images && pkg.images[0]) || '';
								const img = imgRaw ? toAbsoluteImageUrl(imgRaw) : '';
								return (
									<TouchableOpacity key={String(pkg._id || pkg.slug)} style={styles.pkgCard} activeOpacity={0.9} onPress={() => router.push({ pathname: '/packages/[slug]', params: { slug: String(pkg.slug || pkg._id) } })}>
										{img ? (
											<Image
												source={{ uri: img }}
												style={styles.pkgImage}
												onError={(e) => console.warn('Package image failed:', imgRaw, e.nativeEvent?.error)}
											/>
										) : (
											<View style={[styles.pkgImage, { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.secondary200 }]}> 
												<Ionicons name="image" size={22} color={Colors.secondary500} />
											</View>
										)}
										<Text style={styles.pkgTitle} numberOfLines={2}>{pkg.title}</Text>
										<View style={styles.pkgMetaRow}>
											<View style={styles.pkgMetaItem}>
												<Ionicons name="time" size={14} color={Colors.secondary600} />
												<Text style={styles.pkgMetaText}>{pkg.durationDays} days</Text>
											</View>
											<View style={styles.pkgMetaItem}>
												<Ionicons name="pricetag" size={14} color={Colors.primary600} />
												<Text style={styles.pkgMetaText}>{(pkg.pricing?.currency || 'LKR')} {(pkg.pricing?.amount || 0).toLocaleString()}</Text>
											</View>
										</View>
										<Text style={styles.pkgUnit}>{pkg.pricing?.perPerson ? 'per person' : 'per group'}</Text>
									</TouchableOpacity>
								);
							})}
						</ScrollView>
					)}
				</View>

				{/* About */}
				<View style={styles.sectionCard}>
					<View style={styles.sectionHeaderRow}>
						<ThemedText variant="subtitle" style={styles.sectionTitle}>About</ThemedText>
					</View>
					<Text style={[styles.description, { marginHorizontal: 0 }]}>{bio}</Text>
				</View>

				{/* Availability */}
				<View style={styles.sectionCard}>
					<View style={styles.sectionHeaderRow}>
						<ThemedText variant="subtitle" style={styles.sectionTitle}>Availability</ThemedText>
						<TouchableOpacity onPress={() => setCalendarVisible(true)}>
							<Text style={styles.sectionLink}>See calendar</Text>
						</TouchableOpacity>
					</View>
					<Text style={styles.availCaption}>Next 14 days</Text>
					<View style={[styles.availList, { paddingLeft: 0, paddingRight: 0 }]}>
						<ScrollView horizontal showsHorizontalScrollIndicator={false}>
							{next14Days.map(item => {
								const isAvailable = availableDates.includes(item.date);
								const isBooked = !isAvailable;
								let borderColor: string = Colors.secondary200;
								if (isAvailable) borderColor = Colors.success;
								else if (isBooked) borderColor = Colors.error;
								let borderWidth = 4;
								return (
									<View
										key={item.date}
										style={[
											styles.dateChip,
											{ borderBottomColor: borderColor, borderBottomWidth: borderWidth },
										]}
									>
										<Text style={styles.dateChipDay}>{item.day}</Text>
										<Text style={styles.dateChipNum}>{item.num}</Text>
									</View>
								);
							})}
						</ScrollView>
					</View>
					<View style={styles.availLegendRow}>
						<View style={[styles.legendChip, { borderBottomColor: Colors.success, borderBottomWidth: 3 }]} />
						<Text style={styles.legendText}>Available</Text>
						<View style={[styles.legendChip, { borderBottomColor: Colors.error, borderBottomWidth: 3 }]} />
						<Text style={styles.legendText}>Booked</Text>
					</View>
				</View>

				{/* Calendar Modal (simple placeholder) */}
				{calendarVisible && (
					<View style={styles.calendarModalOverlay}>
						<View style={styles.calendarModalContainer}>
							<ThemedText variant= 'subtitle' style={styles.calendarModalTitle}>Availability Calendar</ThemedText>
							<Calendar
								onDayPress={(day) => {
									setSelectedDate(day.dateString);
									setCalendarVisible(false);
								}}
								markedDates={{
									...bookedDates.reduce((acc: Record<string, any>, date) => {
										acc[date] = {
											selected: true,
											selectedColor: 'rgba(255, 0, 0, 0.7)', 
											dotColor: Colors.error,
										};
										return acc;
									}, {}),
									...(selectedDate ? {
										[selectedDate]: {
											selected: true,
											selectedColor: Colors.primary600,
											dotColor: Colors.success,
											marked: true,
										}
									} : {})
								}}
								theme={{
									selectedDayBackgroundColor: Colors.primary600,
									todayTextColor: Colors.primary500,
									textDayFontSize: 12,
									arrowColor: Colors.primary600,
									textMonthFontSize: 14,          
									textMonthFontWeight: 'bold',    
									monthTextColor: Colors.primary800, 
								}}
							/>
							<CustomButton title="Close" variant="outline" onPress={() => setCalendarVisible(false)} style={{ marginTop: 12 }} />
						</View>
					</View>
				)}

				{/* Reviews */}
				<View style={styles.sectionCard}>
					<View style={styles.sectionHeaderRow}>
						<ThemedText variant="subtitle" style={styles.sectionTitle}>Reviews</ThemedText>
					</View>
					<View style={[styles.reviewsList, { paddingHorizontal: 0, marginBottom: 0 }]}>
						{(details.reviews || defaultReviews).slice(0, 3).map((r: any, i: number) => (
							<UserReview
								key={i}
								name={r.name}
								rating={r.rating}
								review={r.review}
								profileImage={r.profileImage}
							/>
						))}
						{(details.reviews || defaultReviews).length > 2 && (
							<TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 8 }} onPress={() => router.push({ pathname: '/tour_guides/reviews', params: { title: details.title } })}>
								<Text style={{ color: Colors.primary600, fontWeight: '600', fontSize: 15 }}>See more reviews</Text>
							</TouchableOpacity>
						)}
					</View>
				</View>

				<View style={{ height: 80 }} />
			</ScrollView>
			<View style={styles.bottomBar}>
				<CustomButton
					title="Book Now"
					variant="primary"
					size="large"
					style={styles.bookBtn}
					disabled={false}
				/>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.secondary50,
	},
	backBtn: {
		position: 'absolute',
		top: 50,
		left: 20,
		backgroundColor: Colors.primary700,
		borderRadius: 20,
		padding: 6,
		zIndex: 2,
	},
	scrollContent: {
		paddingBottom: 40,
		backgroundColor: Colors.secondary50,
	},
	centerPhotoSection: {
		alignItems: 'center',
		marginTop: 16,
		marginBottom: 4,
	},
	guidePhoto: {
		width: 110,
		height: 110,
		borderRadius: 55,
		backgroundColor: Colors.secondary200,
		marginBottom: 10,
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 10,
		marginHorizontal: 16,
		marginBottom: 6,
	},
	nameAddressCol: {
		flex: 1,
	},
	title: {
		fontSize: 24,
		fontWeight: '700',
		color: Colors.primary800,
		marginBottom: 6,
		textAlign: 'left',
	},
	locationRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	city: {
		fontSize: 15,
		color: Colors.primary700,
		marginLeft: 2,
		fontWeight: '500',
	},
	ratingRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		marginLeft: 12,
	},
	rating: {
		fontSize: 15,
		color: Colors.primary700,
		marginLeft: 2,
		fontWeight: '500',
	},
	price: {
		fontSize: 22,
		color: Colors.primary600,
		fontWeight: '700',
		marginBottom: 18,
		textAlign: 'left',
		marginHorizontal: 16,
	},
	profileCard: {
		backgroundColor: Colors.white,
		marginHorizontal: 16,
		marginTop: 70,
		marginBottom: 8,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: Colors.secondary200,
		paddingVertical: 12,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 1,
	},
	sectionHeading: {
		fontSize: 24,
		fontWeight: '600',
		color: Colors.primary800,
		marginTop: 14,
		marginBottom: 8,
		alignSelf: 'flex-start',
		marginLeft: 16,
	},
	sectionCard: {
		backgroundColor: Colors.white,
		marginHorizontal: 16,
		marginTop: 12,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: Colors.secondary200,
		paddingVertical: 12,
		paddingHorizontal: 12,
		shadowColor: '#000',
		shadowOpacity: 0.05,
		shadowRadius: 8,
		shadowOffset: { width: 0, height: 2 },
		elevation: 1,
	},
	sectionHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	sectionTitle: {
		fontSize: 20,
		fontWeight: '700',
		color: Colors.primary800,
	},
	sectionBody: {
		marginTop: 4,
	},
	sectionLink: {
		color: Colors.primary600,
		fontWeight: '600',
		fontSize: 14,
	},
	chipRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		marginBottom: 8,
		marginLeft: 16,
	},
	chip: {
		backgroundColor: Colors.primary100,
		borderRadius: 12,
		paddingHorizontal: 10,
		paddingVertical: 4,
		marginBottom: 4,
	},
	chipText: {
		color: Colors.primary800,
		fontWeight: '600',
		fontSize: 13,
	},
	description: {
		fontSize: 15,
		color: Colors.primary700,
		marginBottom: 10,
		marginHorizontal: 16,
		textAlign: 'left',
	},
	availCaption: {
		fontSize: 13,
		color: Colors.primary700,
		marginLeft: 16,
		marginBottom: 4,
	},
	availList: {
		paddingLeft: 16,
		paddingRight: 8,
		marginBottom: 8,
	},
	dateChip: {
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 10,
		marginRight: 8,
		marginBottom: 4,
		minWidth: 54,
		backgroundColor: Colors.secondary200,
	},
	dateChipSelected: {
		shadowColor: Colors.primary800,
		shadowOpacity: 0.18,
		shadowRadius: 4,
		borderBottomWidth: 3,
	},
	dateChipDay: {
		color: Colors.primary700,
		fontWeight: '600',
		fontSize: 13,
		marginBottom: 2,
	},
	dateChipNum: {
		color: Colors.primary700,
		fontWeight: '700',
		fontSize: 16,
	},
	availLegendRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginLeft: 16,
		marginBottom: 8,
		gap: 8,
	},
	legendChip: {
		width: 18,
		height: 18,
		borderRadius: 9,
		marginRight: 4,
		borderWidth: 0,
		backgroundColor: Colors.secondary50,
	},
	legendText: {
		fontSize: 13,
		color: Colors.primary700,
		marginRight: 12,
	},
	reviewsList: {
		width: '100%',
		paddingHorizontal: 16,
		marginBottom: 24,
	},
	bottomBar: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: Colors.secondary50,
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderTopWidth: 1,
		borderTopColor: '#eee',
		alignItems: 'center',
		zIndex: 10,
	},
	bookBtn: {
		width: '100%',
		borderRadius: 16,
	},
	seeCalendarBtn: {
		alignSelf: 'flex-end',
		marginRight: 16,
		marginBottom: 8,
		paddingVertical: 4,
		paddingHorizontal: 10,
	},
	seeCalendarText: {
		color: Colors.primary600,
		fontWeight: '600',
		fontSize: 15,
	},
	calendarModalOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 100,
	},
	calendarModalContainer: {
		width: '80%',
		backgroundColor: Colors.white,
		borderRadius: 20,
		padding: 20,
	},
	calendarModalTitle: {
		fontSize: 20,
		marginBottom: 5,
		color: Colors.primary800,
		textAlign: 'center',
	},

		// Packages section styles
		pkgCard: {
			width: 200,
			padding: 10,
			borderRadius: 12,
			backgroundColor: Colors.white,
			marginRight: 12,
			borderWidth: 1,
			borderColor: Colors.secondary200,
		},
		pkgImage: {
			width: '100%',
			height: 120,
			borderRadius: 10,
			backgroundColor: Colors.secondary100,
			marginBottom: 8,
		},
			pkgTitle: {
			fontSize: 14,
			fontWeight: '700',
				color: Colors.primary800,
			marginBottom: 6,
		},
		pkgMetaRow: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: 4,
		},
		pkgMetaItem: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: 4,
		},
		pkgMetaText: {
			fontSize: 12,
			color: Colors.secondary700,
			fontWeight: '500',
		},
		pkgUnit: {
			fontSize: 11,
			color: Colors.secondary500,
			fontStyle: 'italic',
		},
});
