import { getStripeSync, getUncachableStripeClient } from './stripeClient';
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

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    // Parse the event to handle custom logic
    try {
      const stripe = await getUncachableStripeClient();
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );

      // Handle successful payment
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const bookingId = session.metadata?.bookingId;
        
        if (bookingId) {
          const booking = await storage.getBooking(bookingId);
          
          if (booking) {
            // Update booking status to paid
            await storage.updateBookingStatus(bookingId, 'paid_fee');
            
            // Send payment confirmation email
            try {
              await emailService.sendPaymentConfirmation({
                customerEmail: booking.customerEmail,
                customerName: booking.customerName,
                referenceNumber: booking.referenceNumber,
                pickupDate: booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString() : '',
                pickupLocation: booking.pickupLocation,
                dropoffLocation: booking.dropoffLocation,
                totalAmount: booking.totalAmount || "0",
              });
              console.log(`Payment confirmation email sent for booking ${booking.referenceNumber}`);
            } catch (emailError) {
              console.error('Failed to send payment confirmation email:', emailError);
            }
          }
        }
      }
    } catch (webhookError) {
      console.error('Error processing custom webhook logic:', webhookError);
      // Don't throw - the sync already processed the webhook
    }
  }
}
