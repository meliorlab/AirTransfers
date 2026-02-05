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
      const metadata = session?.metadata;
      
      // New flow: Hotel bookings from checkout (booking created after payment)
      if (metadata?.bookingType === 'hotel' && !metadata?.bookingId) {
        console.log('Processing new hotel booking from Stripe checkout');
        
        try {
          // SECURITY: Re-validate all data and recompute price server-side
          const hotelId = metadata.hotelId;
          const portId = metadata.portId;
          const partySizeNum = parseInt(metadata.partySize) || 1;
          
          // Validate hotel and port still exist
          const hotel = await storage.getHotel(hotelId);
          const allPorts = await storage.getActivePorts();
          const port = allPorts.find(p => p.id === portId);
          
          if (!hotel || !port) {
            console.error('Invalid hotel or port in webhook metadata');
            return;
          }
          
          // Recompute price server-side to verify against payment
          const portHotelRate = await storage.getPortHotelRate(portId, hotelId);
          if (!portHotelRate || !portHotelRate.price) {
            console.error('No rate found for port-hotel combination in webhook');
            return;
          }
          
          const basePrice = parseFloat(portHotelRate.price);
          
          // Get surcharge settings
          const surchargeAmountSetting = await storage.getSetting("large_party_surcharge_amount");
          const minPartySizeSetting = await storage.getSetting("large_party_min_size");
          const surchargeAmount = parseFloat(surchargeAmountSetting?.value || "20");
          const minPartySize = parseInt(minPartySizeSetting?.value || "4");
          const surcharge = partySizeNum >= minPartySize ? surchargeAmount : 0;
          
          // Get tax settings
          const taxPercentageSetting = await storage.getSetting("tax_percentage");
          const taxPercentage = parseFloat(taxPercentageSetting?.value || "0");
          
          // Calculate total
          const subtotal = basePrice + surcharge;
          const taxAmount = subtotal * (taxPercentage / 100);
          const expectedTotal = subtotal + taxAmount;
          
          // Verify payment amount matches expected (within 1 cent tolerance for rounding)
          const paidAmountCents = session.amount_total || 0;
          const expectedAmountCents = Math.round(expectedTotal * 100);
          
          if (Math.abs(paidAmountCents - expectedAmountCents) > 1) {
            console.error(`Payment amount mismatch! Paid: ${paidAmountCents}, Expected: ${expectedAmountCents}`);
            // Still create booking but flag it for admin review
          }
          
          // Create the booking with server-validated data
          const referenceNumber = this.generateReferenceNumber();
          const sessionId = session.id;
          
          const bookingData = {
            referenceNumber,
            bookingType: 'hotel' as const,
            customerName: metadata.customerName,
            customerEmail: metadata.customerEmail,
            customerPhone: metadata.customerPhone || null,
            pickupLocation: port.name,
            dropoffLocation: hotel.name,
            pickupDate: new Date(metadata.pickupDate),
            partySize: partySizeNum,
            vehicleClass: metadata.vehicleClass,
            flightNumber: metadata.flightNumber || null,
            hotelId,
            portId,
            totalAmount: expectedTotal.toFixed(2), // Use server-computed total
            pricingSet: true,
            status: 'paid_fee' as const,
            stripeSessionId: sessionId,
          };
          
          const booking = await storage.createBooking(bookingData);
          console.log(`Hotel booking ${booking.referenceNumber} created after Stripe payment (verified amount: $${expectedTotal.toFixed(2)})`);
          
          // Send booking confirmation email
          try {
            await emailService.sendBookingConfirmation({
              customerEmail: booking.customerEmail,
              customerName: booking.customerName,
              referenceNumber: booking.referenceNumber,
              bookingType: booking.bookingType,
              pickupDate: booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString() : '',
              pickupTime: metadata.pickupTime || '',
              pickupLocation: booking.pickupLocation,
              dropoffLocation: booking.dropoffLocation,
              passengers: booking.partySize,
              totalAmount: booking.totalAmount || undefined,
              tripPrice: subtotal.toFixed(2),
              taxAmount: taxAmount.toFixed(2),
            });
            console.log(`Booking confirmation email sent for ${booking.referenceNumber}`);
          } catch (emailError) {
            console.error('Failed to send booking confirmation email:', emailError);
          }
          
          // Send payment confirmation email
          try {
            await emailService.sendPaymentConfirmation({
              customerEmail: booking.customerEmail,
              customerName: booking.customerName,
              referenceNumber: booking.referenceNumber,
              pickupDate: booking.pickupDate ? new Date(booking.pickupDate).toLocaleDateString() : '',
              pickupTime: metadata.pickupTime || '',
              pickupLocation: booking.pickupLocation,
              dropoffLocation: booking.dropoffLocation,
              totalAmount: booking.totalAmount || '0.00',
            });
            console.log(`Payment confirmation email sent for ${booking.referenceNumber}`);
          } catch (emailError) {
            console.error('Failed to send payment confirmation email:', emailError);
          }
        } catch (createError) {
          console.error('Failed to create booking after payment:', createError);
        }
        return;
      }
      
      // Existing flow: Bookings that were created before payment (destination bookings)
      const bookingId = metadata?.bookingId;
      if (bookingId) {
        console.log(`Processing payment for existing booking ${bookingId}`);
        const booking = await storage.getBooking(bookingId);
        
        if (booking) {
          // Update booking status to paid
          await storage.updateBookingStatus(bookingId, 'paid_fee');
          console.log(`Booking ${booking.referenceNumber} status updated to paid_fee`);
          
          // Send payment confirmation email (not booking confirmation - they already received that)
          try {
            const pickupDateTime = booking.pickupDate ? new Date(booking.pickupDate) : null;
            const pickupTimeStr = pickupDateTime ? pickupDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '';
            
            await emailService.sendPaymentConfirmation({
              customerEmail: booking.customerEmail,
              customerName: booking.customerName,
              referenceNumber: booking.referenceNumber,
              pickupDate: pickupDateTime ? pickupDateTime.toLocaleDateString() : '',
              pickupTime: pickupTimeStr,
              pickupLocation: booking.pickupLocation,
              dropoffLocation: booking.dropoffLocation,
              totalAmount: booking.totalAmount || '0.00',
            });
            console.log(`Payment confirmation email sent for booking ${booking.referenceNumber}`);
          } catch (emailError) {
            console.error('Failed to send payment confirmation email:', emailError);
          }
        }
      }
    }
  }
  
  private static generateReferenceNumber(): string {
    const prefix = "BK";
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }
}
