import { getUncachableResendClient } from './resendClient';
import { storage } from './storage';

function replaceVariables(template: string, variables: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, String(value));
  }
  return result;
}

export class EmailService {
  async sendBookingConfirmation(booking: {
    customerEmail: string;
    customerName: string;
    referenceNumber: string;
    bookingType: string;
    pickupDate: string;
    pickupTime: string;
    pickupLocation: string;
    dropoffLocation: string;
    passengers: number;
    totalAmount?: string;
    tripPrice?: string;
    taxAmount?: string;
  }) {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const isHotelBooking = booking.bookingType === 'hotel';
    
    let priceBreakdown: string;
    if (!isHotelBooking) {
      priceBreakdown = 'Quote pending - we will contact you shortly';
    } else if (booking.tripPrice && booking.taxAmount && parseFloat(booking.taxAmount) > 0) {
      priceBreakdown = `Trip: $${parseFloat(booking.tripPrice).toFixed(2)} + Tax: $${parseFloat(booking.taxAmount).toFixed(2)} = Total: $${parseFloat(booking.totalAmount || '0').toFixed(2)}`;
    } else {
      priceBreakdown = `$${parseFloat(booking.totalAmount || '30.00').toFixed(2)}`;
    }

    const template = await storage.getEmailTemplateByKey('booking_confirmation');
    
    const variables = {
      customerName: booking.customerName,
      referenceNumber: booking.referenceNumber,
      pickupDate: booking.pickupDate,
      pickupTime: booking.pickupTime,
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
      passengers: booking.passengers,
      totalAmount: priceBreakdown,
      tripPrice: booking.tripPrice ? `$${parseFloat(booking.tripPrice).toFixed(2)}` : '',
      taxAmount: booking.taxAmount ? `$${parseFloat(booking.taxAmount).toFixed(2)}` : '$0.00',
    };

    let subject: string;
    let html: string;

    if (template && template.isActive) {
      subject = replaceVariables(template.subject, variables);
      html = replaceVariables(template.body, variables);
      if (!isHotelBooking) {
        html += '<p style="color: #666;">For destination link bookings, our team will review your request and send you a custom quote shortly.</p>';
      }
    } else {
      subject = `Booking Confirmation - ${booking.referenceNumber}`;
      
      const pricingSection = isHotelBooking && booking.tripPrice && booking.taxAmount && parseFloat(booking.taxAmount) > 0
        ? `
            <p><strong>Trip Price:</strong> $${parseFloat(booking.tripPrice).toFixed(2)}</p>
            <p><strong>Tax:</strong> $${parseFloat(booking.taxAmount).toFixed(2)}</p>
            <p style="font-size: 16px;"><strong>Total:</strong> $${parseFloat(booking.totalAmount || '0').toFixed(2)}</p>
          `
        : `<p><strong>Total:</strong> ${priceBreakdown}</p>`;
      
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">Booking Confirmation</h1>
          <p>Dear ${booking.customerName},</p>
          <p>Thank you for booking with AirTransfer! Here are your booking details:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Reference Number:</strong> ${booking.referenceNumber}</p>
            <p><strong>Pickup Date:</strong> ${booking.pickupDate}</p>
            <p><strong>Pickup Time:</strong> ${booking.pickupTime}</p>
            <p><strong>Pickup Location:</strong> ${booking.pickupLocation}</p>
            <p><strong>Dropoff Location:</strong> ${booking.dropoffLocation}</p>
            <p><strong>Passengers:</strong> ${booking.passengers}</p>
            ${pricingSection}
          </div>
          
          ${!isHotelBooking ? `
            <p style="color: #666;">For destination link bookings, our team will review your request and send you a custom quote shortly.</p>
          ` : ''}
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The AirTransfer Team</p>
        </div>
      `;
    }

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: booking.customerEmail,
      subject,
      html,
    });

    if (error) {
      console.error('Failed to send booking confirmation:', error);
      throw error;
    }

    return data;
  }

  async sendPaymentLink(booking: {
    customerEmail: string;
    customerName: string;
    referenceNumber: string;
    totalAmount: string;
    paymentLink: string;
  }) {
    const { client, fromEmail } = await getUncachableResendClient();

    const template = await storage.getEmailTemplateByKey('payment_link');
    
    const variables = {
      customerName: booking.customerName,
      referenceNumber: booking.referenceNumber,
      totalAmount: booking.totalAmount,
      paymentLink: booking.paymentLink,
    };

    let subject: string;
    let html: string;

    if (template && template.isActive) {
      subject = replaceVariables(template.subject, variables);
      html = replaceVariables(template.body, variables);
    } else {
      subject = `Payment Required - Booking ${booking.referenceNumber}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">Payment Required</h1>
          <p>Dear ${booking.customerName},</p>
          <p>Your booking quote is ready! Please complete your payment to confirm your transfer.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Reference Number:</strong> ${booking.referenceNumber}</p>
            <p><strong>Total Amount:</strong> $${booking.totalAmount}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${booking.paymentLink}" style="background: #4f46e5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Pay Now
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">This payment link will expire in 24 hours.</p>
          
          <p>Best regards,<br>The AirTransfer Team</p>
        </div>
      `;
    }

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: booking.customerEmail,
      subject,
      html,
    });

    if (error) {
      console.error('Failed to send payment link:', error);
      throw error;
    }

    return data;
  }

  async sendQuoteNotification(booking: {
    customerEmail: string;
    customerName: string;
    referenceNumber: string;
    bookingFee: string;
    driverFee: string;
    totalAmount: string;
  }) {
    const { client, fromEmail } = await getUncachableResendClient();

    const template = await storage.getEmailTemplateByKey('quote_notification');
    
    const variables = {
      customerName: booking.customerName,
      referenceNumber: booking.referenceNumber,
      bookingFee: booking.bookingFee,
      driverFee: booking.driverFee,
      totalAmount: booking.totalAmount,
    };

    let subject: string;
    let html: string;

    if (template && template.isActive) {
      subject = replaceVariables(template.subject, variables);
      html = replaceVariables(template.body, variables);
    } else {
      subject = `Your Quote is Ready - Booking ${booking.referenceNumber}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">Your Quote is Ready</h1>
          <p>Dear ${booking.customerName},</p>
          <p>Great news! We've prepared a quote for your airport transfer:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Reference Number:</strong> ${booking.referenceNumber}</p>
            <p><strong>Booking Fee:</strong> $${booking.bookingFee}</p>
            <p><strong>Driver Fee:</strong> $${booking.driverFee}</p>
            <p style="font-size: 18px; color: #1a1a2e;"><strong>Total Amount:</strong> $${booking.totalAmount}</p>
          </div>
          
          <p>A payment link will be sent to you shortly to complete your booking.</p>
          
          <p>Best regards,<br>The AirTransfer Team</p>
        </div>
      `;
    }

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: booking.customerEmail,
      subject,
      html,
    });

    if (error) {
      console.error('Failed to send quote notification:', error);
      throw error;
    }

    return data;
  }

  async sendPaymentConfirmation(booking: {
    customerEmail: string;
    customerName: string;
    referenceNumber: string;
    pickupDate: string;
    pickupTime?: string;
    pickupLocation: string;
    dropoffLocation: string;
    totalAmount: string;
  }) {
    const { client, fromEmail } = await getUncachableResendClient();

    const template = await storage.getEmailTemplateByKey('payment_confirmation');
    
    const variables = {
      customerName: booking.customerName,
      referenceNumber: booking.referenceNumber,
      pickupDate: booking.pickupDate,
      pickupTime: booking.pickupTime || '',
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
      totalAmount: booking.totalAmount,
    };

    let subject: string;
    let html: string;

    if (template && template.isActive) {
      subject = replaceVariables(template.subject, variables);
      html = replaceVariables(template.body, variables);
    } else {
      subject = `Payment Confirmed - Booking ${booking.referenceNumber}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">Payment Confirmed!</h1>
          <p>Dear ${booking.customerName},</p>
          <p>Thank you! Your payment has been successfully processed for your airport transfer.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Reference Number:</strong> ${booking.referenceNumber}</p>
            <p><strong>Pickup Date:</strong> ${booking.pickupDate}</p>
            ${booking.pickupTime ? `<p><strong>Pickup Time:</strong> ${booking.pickupTime}</p>` : ''}
            <p><strong>Pickup Location:</strong> ${booking.pickupLocation}</p>
            <p><strong>Dropoff Location:</strong> ${booking.dropoffLocation}</p>
            <p><strong>Amount Paid:</strong> $${booking.totalAmount}</p>
          </div>
          
          <p>Your driver details will be sent to you closer to your pickup date.</p>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The AirTransfer Team</p>
        </div>
      `;
    }

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: booking.customerEmail,
      subject,
      html,
    });

    if (error) {
      console.error('Failed to send payment confirmation:', error);
      throw error;
    }

    return data;
  }

  async sendDriverAssignment(driver: {
    driverEmail: string;
    driverName: string;
  }, booking: {
    referenceNumber: string;
    customerName: string;
    customerPhone: string;
    pickupDate: string;
    pickupTime?: string;
    pickupLocation: string;
    dropoffLocation: string;
    partySize: number;
    flightNumber: string;
    vehicleClass: string;
    driverFee: string;
  }) {
    const { client, fromEmail } = await getUncachableResendClient();

    const template = await storage.getEmailTemplateByKey('driver_assignment');
    
    const variables = {
      driverName: driver.driverName,
      referenceNumber: booking.referenceNumber,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      pickupDate: booking.pickupDate,
      pickupTime: booking.pickupTime || '',
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
      partySize: booking.partySize,
      flightNumber: booking.flightNumber,
      vehicleClass: booking.vehicleClass,
      driverFee: booking.driverFee,
    };

    let subject: string;
    let html: string;

    if (template && template.isActive) {
      subject = replaceVariables(template.subject, variables);
      html = replaceVariables(template.body, variables);
    } else {
      subject = `New Trip Assignment - ${booking.referenceNumber}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">New Trip Assignment</h1>
          <p>Dear ${driver.driverName},</p>
          <p>You have been assigned a new transfer. Please review the details below:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Trip Details</h3>
            <p><strong>Reference Number:</strong> ${booking.referenceNumber}</p>
            <p><strong>Pickup Date:</strong> ${booking.pickupDate}</p>
            ${booking.pickupTime ? `<p><strong>Pickup Time:</strong> ${booking.pickupTime}</p>` : ''}
            <p><strong>Pickup Location:</strong> ${booking.pickupLocation}</p>
            <p><strong>Dropoff Location:</strong> ${booking.dropoffLocation}</p>
            <p><strong>Flight Number:</strong> ${booking.flightNumber}</p>
            <p><strong>Vehicle Class:</strong> ${booking.vehicleClass}</p>
            <p><strong>Party Size:</strong> ${booking.partySize} passenger(s)</p>
          </div>
          
          <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Customer Information</h3>
            <p><strong>Name:</strong> ${booking.customerName}</p>
            <p><strong>Phone:</strong> ${booking.customerPhone}</p>
          </div>
          
          <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 18px; margin: 0;"><strong>Your Fee:</strong> $${booking.driverFee}</p>
          </div>
          
          <p>Please confirm your availability and contact the customer if needed.</p>
          <p>Best regards,<br>The AirTransfer Team</p>
        </div>
      `;
    }

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: driver.driverEmail,
      subject,
      html,
    });

    if (error) {
      console.error('Failed to send driver assignment email:', error);
      throw error;
    }

    return data;
  }

  async sendDriverAssignmentToCustomer(booking: {
    customerEmail: string;
    customerName: string;
    referenceNumber: string;
    driverName: string;
    pickupDate: string;
    pickupLocation: string;
    dropoffLocation: string;
  }) {
    const { client, fromEmail } = await getUncachableResendClient();

    const template = await storage.getEmailTemplateByKey('driver_assigned_customer');
    
    const variables = {
      customerName: booking.customerName,
      referenceNumber: booking.referenceNumber,
      driverName: booking.driverName,
      pickupDate: booking.pickupDate,
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation,
    };

    let subject: string;
    let html: string;

    if (template && template.isActive) {
      subject = replaceVariables(template.subject, variables);
      html = replaceVariables(template.body, variables);
    } else {
      subject = `Driver Assigned - Booking ${booking.referenceNumber}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">Your Driver Has Been Assigned</h1>
          <p>Dear ${booking.customerName},</p>
          <p>Great news! A driver has been assigned to your upcoming transfer.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Reference Number:</strong> ${booking.referenceNumber}</p>
            <p><strong>Driver Name:</strong> ${booking.driverName}</p>
            <p><strong>Pickup Date:</strong> ${booking.pickupDate}</p>
            <p><strong>Pickup Location:</strong> ${booking.pickupLocation}</p>
            <p><strong>Dropoff Location:</strong> ${booking.dropoffLocation}</p>
          </div>
          
          <p>Your driver will meet you at the designated pickup location. Please have your booking reference ready.</p>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>The AirTransfer Team</p>
        </div>
      `;
    }

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: booking.customerEmail,
      subject,
      html,
    });

    if (error) {
      console.error('Failed to send driver assignment notification to customer:', error);
      throw error;
    }

    return data;
  }
}

export const emailService = new EmailService();
