import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ConfirmedBooking {
  id: string;
  bookingId: string;
  tripName: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  paymentDate: string;
  transactionId: string;
  email: string;
  status: 'confirmed' | 'upcoming' | 'completed' | 'cancelled';
  accommodation: any[];
  transport: any[];
  guides: any[];
  createdAt: string;
}

/**
 * Manages the lifecycle of booking data in AsyncStorage
 * Handles moving expired trips from upcoming to past bookings
 */
export class BookingDataManager {
  
  /**
   * Get upcoming bookings and automatically filter out expired ones
   */
  static async getUpcomingBookings(): Promise<ConfirmedBooking[]> {
    try {
      const [upcomingStr, pastStr] = await Promise.all([
        AsyncStorage.getItem('upcomingBookings'),
        AsyncStorage.getItem('pastBookings')
      ]);
      
      const upcomingBookings = upcomingStr ? JSON.parse(upcomingStr) : [];
      const pastBookings = pastStr ? JSON.parse(pastStr) : [];
      
      const currentDate = new Date();
      const stillUpcoming: ConfirmedBooking[] = [];
      const newlyPast: ConfirmedBooking[] = [];
      
      upcomingBookings.forEach((booking: ConfirmedBooking) => {
        const tripEndDate = new Date(booking.endDate);
        if (tripEndDate < currentDate) {
          // Mark as completed and move to past
          const completedBooking = { ...booking, status: 'completed' as const };
          newlyPast.push(completedBooking);
        } else {
          stillUpcoming.push(booking);
        }
      });
      
      // Update storage if any trips were moved
      if (newlyPast.length > 0) {
        const updatedPastBookings = [...pastBookings, ...newlyPast];
        
        await Promise.all([
          AsyncStorage.setItem('upcomingBookings', JSON.stringify(stillUpcoming)),
          AsyncStorage.setItem('pastBookings', JSON.stringify(updatedPastBookings))
        ]);
        
        console.log(`📅 BookingDataManager: Moved ${newlyPast.length} expired trips to past bookings`);
      }
      
      return stillUpcoming.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error in getUpcomingBookings:', error);
      return [];
    }
  }
  
  /**
   * Get past/completed bookings
   */
  static async getPastBookings(): Promise<ConfirmedBooking[]> {
    try {
      const pastStr = await AsyncStorage.getItem('pastBookings');
      const pastBookings = pastStr ? JSON.parse(pastStr) : [];
      
      return pastBookings.sort((a: ConfirmedBooking, b: ConfirmedBooking) => 
        new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
      );
    } catch (error) {
      console.error('Error in getPastBookings:', error);
      return [];
    }
  }
  
  /**
   * Add new bookings to upcoming list
   */
  static async addToUpcomingBookings(bookings: ConfirmedBooking[]): Promise<void> {
    try {
      // First clean up any expired bookings
      const currentUpcoming = await this.getUpcomingBookings();
      
      // Add new bookings
      const updatedBookings = [...currentUpcoming, ...bookings];
      
      await AsyncStorage.setItem('upcomingBookings', JSON.stringify(updatedBookings));
      console.log(`✅ BookingDataManager: Added ${bookings.length} new bookings`);
    } catch (error) {
      console.error('Error in addToUpcomingBookings:', error);
      throw error;
    }
  }
  
  /**
   * Clear all temporary booking data used during trip planning
   */
  static async clearTemporaryData(): Promise<void> {
    try {
      const temporaryKeys = [
        '@wanderlanka_bookings', // BookingContext temporary storage
        'tripPlanningData',
        'bookingDetails',
        'selectedAccommodations',
        'selectedTransport', 
        'selectedGuides',
        'tempTripData',
        'draftBooking'
      ];
      
      await Promise.all(
        temporaryKeys.map(key => 
          AsyncStorage.removeItem(key).catch(err => 
            console.warn(`Failed to clear ${key}:`, err)
          )
        )
      );
      
      console.log('🧹 BookingDataManager: Cleared all temporary booking data');
    } catch (error) {
      console.error('Error in clearTemporaryData:', error);
    }
  }
  
  /**
   * Get booking statistics
   */
  static async getBookingStats(): Promise<{
    upcomingCount: number;
    pastCount: number;
    totalSpent: number;
  }> {
    try {
      const [upcoming, past] = await Promise.all([
        this.getUpcomingBookings(),
        this.getPastBookings()
      ]);
      
      const totalSpent = [...upcoming, ...past].reduce((sum, booking) => 
        sum + booking.totalAmount, 0
      );
      
      return {
        upcomingCount: upcoming.length,
        pastCount: past.length,
        totalSpent
      };
    } catch (error) {
      console.error('Error in getBookingStats:', error);
      return { upcomingCount: 0, pastCount: 0, totalSpent: 0 };
    }
  }
}
