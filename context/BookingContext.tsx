import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Types
interface Booking {
  id: string;
  type: 'accommodation' | 'transport' | 'guide';
  totalPrice: number;
  destination: string;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

interface BookingState {
  accommodation: Booking[];
  transport: Booking[];
  guides: Booking[];
}

interface BookingContextType {
  bookings: BookingState;
  addBooking: (booking: Booking) => Promise<void>;
  removeBooking: (bookingId: string, type: 'accommodation' | 'transport' | 'guides') => Promise<void>;
  clearAllBookings: () => Promise<void>;
  clearBookingsForNewSession: () => Promise<void>;
  getTotalAmount: () => number;
  getAccommodationTotal: () => number;
  getTransportTotal: () => number;
  getGuidesTotal: () => number;
  isLoading: boolean;
}

// Create context
const BookingContext = createContext<BookingContextType | undefined>(undefined);

// Storage key
const BOOKING_STORAGE_KEY = '@wanderlanka_bookings';

// Provider component
export const BookingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<BookingState>({
    accommodation: [],
    transport: [],
    guides: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load bookings from AsyncStorage on mount
  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const savedBookings = await AsyncStorage.getItem(BOOKING_STORAGE_KEY);
      if (savedBookings) {
        const parsedBookings = JSON.parse(savedBookings);
        setBookings(parsedBookings);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveBookings = async (bookingsToSave: BookingState) => {
    try {
      await AsyncStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(bookingsToSave));
    } catch (error) {
      console.error('Error saving bookings:', error);
    }
  };

  const addBooking = async (booking: Booking) => {
    setBookings(prev => {
      let updatedBookings = { ...prev };
      
      if (booking.type === 'accommodation') {
        const existingBooking = prev.accommodation.find(
          (existingBooking: any) => 
            existingBooking.hotelId === booking.hotelId &&
            existingBooking.checkInDate === booking.checkInDate &&
            existingBooking.numberOfRooms === booking.numberOfRooms &&
            existingBooking.numberOfGuests === booking.numberOfGuests
        );
        
        if (existingBooking) {
          return prev;
        }
        
        updatedBookings.accommodation = [...prev.accommodation, booking];
        
      } else if (booking.type === 'transport') {
        const existingBooking = prev.transport.find(
          (existingBooking: any) => 
            existingBooking.transportId === booking.transportId &&
            existingBooking.startDate === booking.startDate &&
            existingBooking.endDate === booking.endDate &&
            existingBooking.pickupLocation === booking.pickupLocation
        );
        
        if (existingBooking) {
          return prev;
        }
        
        updatedBookings.transport = [...prev.transport, booking];
        
      } else if (booking.type === 'guide') {
        const existingBooking = prev.guides.find(
          (existingBooking: any) => 
            existingBooking.guideId === booking.guideId &&
            existingBooking.startDate === booking.startDate &&
            existingBooking.endDate === booking.endDate &&
            existingBooking.tourType === booking.tourType
        );
        
        if (existingBooking) {
          return prev;
        }
        
        updatedBookings.guides = [...prev.guides, booking];
      }
      
      saveBookings(updatedBookings);
      return updatedBookings;
    });
  };

  const removeBooking = async (bookingId: string, type: 'accommodation' | 'transport' | 'guides') => {
    setBookings(prev => {
      const updatedBookings = {
        ...prev,
        [type]: prev[type].filter((booking: any) => booking.id !== bookingId)
      };
      
      saveBookings(updatedBookings);
      return updatedBookings;
    });
  };

  const clearAllBookings = async () => {
    const emptyBookings = {
      accommodation: [],
      transport: [],
      guides: [],
    };
    
    setBookings(emptyBookings);
    await saveBookings(emptyBookings);
  };

  const clearBookingsForNewSession = async () => {
    const emptyBookings = {
      accommodation: [],
      transport: [],
      guides: [],
    };
    
    setBookings(emptyBookings);
    await saveBookings(emptyBookings);
  };

  const getTotalAmount = () => {
    return [...bookings.accommodation, ...bookings.transport, ...bookings.guides]
      .reduce((sum: number, booking: any) => sum + (booking.totalPrice || 0), 0);
  };

  const getAccommodationTotal = () => {
    return bookings.accommodation.reduce((sum: number, booking: any) => sum + (booking.totalPrice || 0), 0);
  };

  const getTransportTotal = () => {
    return bookings.transport.reduce((sum: number, booking: any) => sum + (booking.totalPrice || 0), 0);
  };

  const getGuidesTotal = () => {
    return bookings.guides.reduce((sum: number, booking: any) => sum + (booking.totalPrice || 0), 0);
  };

  const value: BookingContextType = {
    bookings,
    addBooking,
    removeBooking,
    clearAllBookings,
    clearBookingsForNewSession,
    getTotalAmount,
    getAccommodationTotal,
    getTransportTotal,
    getGuidesTotal,
    isLoading,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

// Hook to use the context
export const useBooking = (): BookingContextType => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export default BookingContext;
