export interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  tourType: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  amount: number;
  status: 'booked' | 'pending';
  groupSize: number;
  specialRequests?: string;
}

export interface CalendarProps {
  bookings: Booking[];
  onClose: () => void;
  onDaySelect: (day: Date, bookings: Booking[]) => void;
}