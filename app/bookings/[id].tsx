import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { BookingDataManager, ConfirmedBooking } from '../../utils/BookingDataManager';
import { BookingService, TourPackageBookingItem } from '../../services/booking';
import { ThemedText } from '../../components';

export default function BookingDetailsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const bookingId = (params.id as string) || '';

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<ConfirmedBooking | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [upcoming, past] = await Promise.all([
          BookingDataManager.getUpcomingBookings(),
          BookingDataManager.getPastBookings(),
        ]);
        const all = [...upcoming, ...past];
        let found = all.find(b => String(b.id) === String(bookingId));
        if (!found) {
          // Fallback: fetch from API
          const res = await BookingService.getBooking(String(bookingId));
          const data = (res?.success && (res as any).data) ? (res as any).data as TourPackageBookingItem : undefined;
          if (data) {
            const now = new Date();
            const end = new Date(data.endDate);
            let status: ConfirmedBooking['status'] = 'confirmed';
            if (data.status === 'cancelled') status = 'cancelled';
            else if (end < now) status = 'completed';
            else if (data.status === 'pending') status = 'pending';
            else status = 'upcoming';
            found = {
              id: String(data._id),
              bookingId: String(data._id),
              tripName: data.packageTitle,
              startDate: new Date(data.startDate).toISOString(),
              endDate: new Date(data.endDate).toISOString(),
              totalAmount: Number(data.pricing?.totalAmount || 0),
              paymentDate: new Date(data.createdAt).toISOString(),
              transactionId: (data as any)?.payment?.intentId || '',
              email: '',
              status,
              accommodation: [],
              transport: [],
              guides: [],
              createdAt: new Date(data.createdAt).toISOString(),
            };
          }
        }
        if (mounted) setBooking(found || null);
      } catch (e) {
        console.error('Failed to load booking details:', e);
        if (mounted) setBooking(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [bookingId]);

  const statusBadge = useMemo(() => {
    // Return { containerStyle, textColor }
    switch (booking?.status) {
      case 'pending':
        return { bg: Colors.warning, text: Colors.white };
      case 'approved':
        return { bg: Colors.info, text: Colors.white };
      case 'upcoming':
        return { bg: Colors.success, text: Colors.white };
      case 'confirmed':
        return { bg: Colors.primary600, text: Colors.white };
      case 'completed':
        return { bg: Colors.secondary400, text: Colors.white };
      case 'cancelled':
        return { bg: Colors.error, text: Colors.white };
      default:
        return { bg: Colors.secondary200, text: Colors.secondary700 };
    }
  }, [booking?.status]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.statusBarBackground, { height: insets.top }]} />
        <View style={styles.centerFill}>
          <ActivityIndicator color={Colors.primary600} />
          <ThemedText style={{ marginTop: 8, color: Colors.secondary500 }}>Loading booking…</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.statusBarBackground, { height: insets.top }]} />
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.white} />
            <Text style={styles.headerTitle}>Booking Details</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.centerFill}>
          <ThemedText style={{ fontSize: 16, color: Colors.secondary600 }}>Booking not found</ThemedText>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(travelerTabs)/bookNow')}>
            <Text style={styles.primaryBtnText}>Go to Book Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.white} />
          <Text style={styles.headerTitle}>Booking Details</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Summary Card */}
        <View style={styles.card}>
          <Text style={styles.tripName}>{booking.tripName}</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.dateText}>{formatDate(booking.startDate)} → {formatDate(booking.endDate)}</Text>
            <Text style={styles.amountText}>${booking.totalAmount}</Text>
          </View>
          <View style={styles.badgeRow}>
            <View style={styles.badgePill}>
              <Ionicons name="calendar" size={14} color={Colors.primary700} />
              <Text style={styles.badgeText}>{formatDate(booking.startDate)}</Text>
            </View>
            <View style={styles.badgePill}>
              <Ionicons name="calendar-outline" size={14} color={Colors.primary700} />
              <Text style={styles.badgeText}>{formatDate(booking.endDate)}</Text>
            </View>
            <View style={[styles.badgePill, { backgroundColor: statusBadge.bg }]}>
              <Text style={[styles.statusBadgeText, { color: statusBadge.text }]}>{booking.status}</Text>
            </View>
          </View>
        </View>

        {/* Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Info</Text>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Booking ID</Text><Text style={styles.detailValue}>{booking.bookingId || booking.id}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Transaction</Text><Text style={styles.detailValue}>{booking.transactionId || '-'}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Email</Text><Text style={styles.detailValue}>{booking.email || '-'}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>Created</Text><Text style={styles.detailValue}>{formatDate(booking.createdAt)}</Text></View>
        </View>

        {/* Actions */}
        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(travelerTabs)/bookNow')}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
            <Text style={styles.primaryBtnText}>Back to Book Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.secondary50 },
  statusBarBackground: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: Colors.primary800, zIndex: 10 },
  headerBar: { backgroundColor: Colors.primary800, paddingHorizontal: 16, paddingVertical: 12, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: Colors.white, fontSize: 16, fontWeight: '600', marginLeft: 4 },
  content: { flex: 1, paddingTop: 16 },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },

  card: { backgroundColor: Colors.white, marginHorizontal: 20, marginBottom: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.secondary200, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  tripName: { fontSize: 18, fontWeight: '700', color: Colors.secondary700, marginBottom: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { fontSize: 14, color: Colors.secondary600 },
  amountText: { fontSize: 16, fontWeight: '700', color: Colors.primary700 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  badgePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary100, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: Colors.primary100 },
  badgeText: { color: Colors.primary800, fontSize: 12, fontWeight: '600' },
  statusBadge: { textTransform: 'capitalize', fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, overflow: 'hidden' },

  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.secondary700, marginBottom: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  detailLabel: { fontSize: 14, color: Colors.secondary500 },
  detailValue: { fontSize: 14, color: Colors.secondary700, fontWeight: '600' },

  statusBadgeText: { textTransform: 'capitalize', fontSize: 12, fontWeight: '700' },

  primaryBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: Colors.primary700, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  primaryBtnText: { color: Colors.white, fontSize: 14, fontWeight: '700' },
});
