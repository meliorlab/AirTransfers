import { getStripeSync } from './stripeClient';
import { emailService } from './emailService';
import { storage } from './storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    // Keep a copy of the payload string before sync processes it
    const payloadString = payload.toString();

    // Let the sync library process and VERIFY the webhook signature first
    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    // Only process custom business logic AFTER successful signature verification
    // (If sync.processWebhook throws, we won't reach here)
    try {
      const event = JSON.parse(payloadString);
      await this.handleCustomEvents(event);
    } catch (error) {
      console.error('Error processing custom webhook logic:', error);
      // Don't throw - sync already processed successfully
    }
  }

  private static async handleCustomEvents(event: any): Promise<void> {
    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;
      const bookingId = session?.metadata?.bookingId;
      
      if (bookingId) {
        console.log(`Processing payment for booking ${bookingId}`);
        const booking = await storage.getBooking(bookingId);
        
        if (booking) {
          // Update booking status to paid
          await storage.updateBookingStatus(bookingId, 'paid_fee');
          console.log(`Booking ${booking.referenceNumber} status updated to paid_fee`);
          
          // Send booking confirmation email (this is the main confirmation for hotel bookings)
          try {
            await emailService.sendBookingConfirmation({
              customerEmail: booking.customerEmail,
              customerName: booking.customerName,
              referenceNumber: booking.referenceNumber,
              bookingType: booking.bookingType,
              pickupDate: booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString() : '',
              pickupTime: '',
              pickupLocation: booking.pickupLocation,
              dropoffLocation: booking.dropoffLocation,
              passengers: booking.partySize,
              totalAmount: booking.totalAmount || undefined,
            });
            console.log(`Booking confirmation email sent for booking ${booking.referenceNumber}`);
          } catch (emailError) {
            console.error('Failed to send booking confirmation email:', emailError);
          }
        }
      }
    }
  }
}
