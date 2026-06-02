'use client';

import { useState } from 'react';
import RegistrationForm from '@/components/RegistrationForm';
import SuccessScreen from '@/components/SuccessScreen';

export interface BookingResult {
  bookingId: string;
  paymentId: string;
  name: string;
  email: string;
  registrationType: string;
  amount: number;
}

export default function Home() {
  const [booking, setBooking] = useState<BookingResult | null>(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center p-4">
      {booking ? (
        <SuccessScreen booking={booking} />
      ) : (
        <RegistrationForm onSuccess={setBooking} />
      )}
    </main>
  );
}
