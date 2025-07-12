import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CustomButton } from '../../components/CustomButton';
import { ThemedText } from '../../components/ThemedText';
import { UserReview } from '../../components/UserReview';
import { Colors } from '../../constants/Colors';

const mockGuides = [
	{
		title: 'Samantha Perera',
		city: 'Colombo',
		rating: 4.9,
		price: '$25/hr',
		languages: ['English', 'Sinhala'],
		expertise: ['History', 'Culture'],
		bio: 'Expert in Sri Lankan history and culture. Passionate about sharing local stories and hidden gems with travelers.',
		reviews: [
			{ name: 'John D.', rating: 5, review: 'Amazing guide! Very knowledgeable.', profileImage: 'https://randomuser.me/api/portraits/men/1.jpg' },
			{ name: 'Priya S.', rating: 4.8, review: 'Great experience, highly recommend.', profileImage: 'https://randomuser.me/api/portraits/women/2.jpg' },
		],
		availability: ['2025-07-15', '2025-07-16', '2025-07-18'],
	},
	{
		title: 'Ravi Fernando',
		city: 'Kandy',
		rating: 4.8,
		price: '$30/hr',
		languages: ['English', 'Tamil'],
		expertise: ['Nature', 'Wildlife'],
		bio: 'Nature and wildlife specialist. Loves showing travelers the best of Sri Lanka’s outdoors.',
		reviews: [
			{ name: 'Alex T.', rating: 4.7, review: 'Saw so many animals! Ravi is awesome.', profileImage: 'https://randomuser.me/api/portraits/men/2.jpg' },
		],
		availability: ['2025-07-17', '2025-07-19'],
	},
];

export default function GuideDetailScreen() {
	const { title } = useLocalSearchParams();
	const details = mockGuides.find(item => item.title === title) || mockGuides[0];
	const [selectedDate, setSelectedDate] = useState('');
	const [calendarVisible, setCalendarVisible] = useState(false);

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

	const availableDates = details.availability;
	const next14Days = getNext14Days();
	const bookedDates = next14Days.map(d => d.date).filter(date => !availableDates.includes(date));

	return (
		<SafeAreaView style={styles.container}>
			<TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
				<Ionicons name="arrow-back" size={24} color={Colors.primary300} />
			</TouchableOpacity>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.centerPhotoSection}>
					<Image
						source={{ uri: details.reviews[0]?.profileImage }}
						style={styles.guidePhoto}
					/>
				</View>
				<View style={styles.infoRow}>
					<View style={styles.nameAddressCol}>
						<ThemedText variant="title" style={styles.title}>{details.title}</ThemedText>
						<View style={styles.locationRow}>
							<Ionicons name="location-outline" size={16} color={Colors.primary600} />
							<Text style={styles.city}>{details.city}</Text>
						</View>
					</View>
					<View style={styles.ratingRow}>
						<Ionicons name="star" size={16} color={Colors.warning || '#FFD700'} />
						<Text style={styles.rating}>{details.rating}</Text>
					</View>
				</View>
				<Text style={styles.price}>{details.price}</Text>
				<ThemedText variant="subtitle" style={styles.sectionHeading}>Languages</ThemedText>
				<View style={styles.chipRow}>
					{details.languages.map((lang, i) => (
						<View key={i} style={styles.chip}><Text style={styles.chipText}>{lang}</Text></View>
					))}
				</View>
				<ThemedText variant="subtitle" style={styles.sectionHeading}>Expertise</ThemedText>
				<View style={styles.chipRow}>
					{details.expertise.map((exp, i) => (
						<View key={i} style={styles.chip}><Text style={styles.chipText}>{exp}</Text></View>
					))}
				</View>
				<ThemedText variant="subtitle" style={styles.sectionHeading}>About</ThemedText>
				<Text style={styles.description}>{details.bio}</Text>
				<ThemedText variant="subtitle" style={styles.sectionHeading}>Availability</ThemedText>
				<Text style={styles.availCaption}>Next 14 days</Text>
				<View style={styles.availList}>
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
				<TouchableOpacity style={styles.seeCalendarBtn} onPress={() => setCalendarVisible(true)}>
					<Text style={styles.seeCalendarText}>See Full Calendar</Text>
				</TouchableOpacity>
				{/* Calendar Modal (simple placeholder) */}
				{calendarVisible && (
					<View style={styles.calendarModalOverlay}>
						<View style={styles.calendarModalContainer}>
							<Text style={styles.calendarModalTitle}>Full Calendar (Coming Soon)</Text>
							<CustomButton title="Close" variant="secondary" onPress={() => setCalendarVisible(false)} />
						</View>
					</View>
				)}
				<ThemedText variant="subtitle" style={styles.sectionHeading}>Reviews</ThemedText>
				<View style={styles.reviewsList}>
					{details.reviews.map((r, i) => (
						<UserReview
							key={i}
							name={r.name}
							rating={r.rating}
							review={r.review}
							profileImage={r.profileImage}
						/>
					))}
				</View>
				<View style={{ height: 80 }} />
			</ScrollView>
			<View style={styles.bottomBar}>
				<CustomButton
					title={selectedDate ? `Book for ${selectedDate}` : 'Select a date to book'}
					variant="primary"
					size="large"
					style={styles.bookBtn}
					disabled={!selectedDate}
					onPress={() => {/* booking logic here */}}
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
		marginTop: 70,
		marginBottom: 10,
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
	sectionHeading: {
		fontSize: 24,
		fontWeight: '600',
		color: Colors.primary800,
		marginTop: 14,
		marginBottom: 8,
		alignSelf: 'flex-start',
		marginLeft: 16,
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
		borderBottomWidth: 2,
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
		backgroundColor: 'rgba(0,0,0,0.3)',
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 100,
	},
	calendarModalContainer: {
		width: '90%',
		backgroundColor: Colors.white,
		borderRadius: 20,
		padding: 24,
		alignItems: 'center',
	},
	calendarModalTitle: {
		fontSize: 20,
		fontWeight: '700',
		marginBottom: 18,
		color: Colors.primary800,
		textAlign: 'center',
	},
});
