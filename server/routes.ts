import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertDriverSchema,
  insertHotelSchema,
  insertZoneSchema,
  insertZoneRouteSchema,
  insertRateSchema,
  insertPricingRuleSchema,
  insertBookingSchema,
} from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { getUncachableStripeClient } from "./stripeClient";
import { emailService } from "./emailService";

// Helper to generate unique reference numbers
function generateReferenceNumber(): string {
  const prefix = "BK";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  const PgSession = connectPgSimple(session);
  
  app.use(session({
    store: new PgSession({
      conString: process.env.DATABASE_URL,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    }
  }));

  // Admin authentication
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      
      const admin = await storage.getAdminUserByUsername(username);
      
      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const validPassword = await bcrypt.compare(password, admin.password);
      
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Store admin session
      (req.session as any).adminId = admin.id;
      (req.session as any).isAdmin = true;
      
      res.json({ 
        success: true, 
        admin: { 
          id: admin.id, 
          username: admin.username,
          email: admin.email 
        } 
      });
    } catch (error) {
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/admin/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/admin/me", async (req: Request, res: Response) => {
    const adminId = (req.session as any).adminId;
    
    if (!adminId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    const admin = await storage.getAdminUser(adminId);
    
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }
    
    res.json({ 
      id: admin.id, 
      username: admin.username,
      email: admin.email 
    });
  });

  // Middleware to check admin authentication
  const requireAdmin = (req: Request, res: Response, next: any) => {
    if (!(req.session as any).isAdmin) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  // Drivers API
  app.get("/api/admin/drivers", requireAdmin, async (req: Request, res: Response) => {
    const drivers = await storage.getAllDrivers();
    res.json(drivers);
  });

  app.get("/api/admin/drivers/:id", requireAdmin, async (req: Request, res: Response) => {
    const driver = await storage.getDriver(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: "Driver not found" });
    }
    res.json(driver);
  });

  app.post("/api/admin/drivers", requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertDriverSchema.parse(req.body);
      const driver = await storage.createDriver(data);
      res.json(driver);
    } catch (error) {
      res.status(400).json({ error: "Invalid driver data" });
    }
  });

  app.patch("/api/admin/drivers/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const driver = await storage.updateDriver(req.params.id, req.body);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      res.status(400).json({ error: "Invalid driver data" });
    }
  });

  app.delete("/api/admin/drivers/:id", requireAdmin, async (req: Request, res: Response) => {
    const success = await storage.deleteDriver(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Driver not found" });
    }
    res.json({ success: true });
  });

  // Hotels API (Admin)
  app.get("/api/admin/hotels", requireAdmin, async (req: Request, res: Response) => {
    const hotels = await storage.getAllHotels();
    res.json(hotels);
  });

  app.get("/api/admin/hotels/:id", requireAdmin, async (req: Request, res: Response) => {
    const hotel = await storage.getHotel(req.params.id);
    if (!hotel) {
      return res.status(404).json({ error: "Hotel not found" });
    }
    res.json(hotel);
  });

  app.post("/api/admin/hotels", requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertHotelSchema.parse(req.body);
      const hotel = await storage.createHotel(data);
      res.json(hotel);
    } catch (error) {
      res.status(400).json({ error: "Invalid hotel data" });
    }
  });

  app.patch("/api/admin/hotels/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const hotel = await storage.updateHotel(req.params.id, req.body);
      if (!hotel) {
        return res.status(404).json({ error: "Hotel not found" });
      }
      res.json(hotel);
    } catch (error) {
      res.status(400).json({ error: "Invalid hotel data" });
    }
  });

  app.delete("/api/admin/hotels/:id", requireAdmin, async (req: Request, res: Response) => {
    const success = await storage.deleteHotel(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Hotel not found" });
    }
    res.json({ success: true });
  });

  // Public Hotels API (for booking form)
  app.get("/api/hotels", async (req: Request, res: Response) => {
    const hotels = await storage.getActiveHotels();
    res.json(hotels);
  });

  // Zones API
  app.get("/api/admin/zones", requireAdmin, async (req: Request, res: Response) => {
    const zones = await storage.getAllZones();
    res.json(zones);
  });

  app.get("/api/admin/zones/:id", requireAdmin, async (req: Request, res: Response) => {
    const zone = await storage.getZone(req.params.id);
    if (!zone) {
      return res.status(404).json({ error: "Zone not found" });
    }
    res.json(zone);
  });

  app.post("/api/admin/zones", requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertZoneSchema.parse(req.body);
      const zone = await storage.createZone(data);
      res.json(zone);
    } catch (error) {
      res.status(400).json({ error: "Invalid zone data" });
    }
  });

  app.patch("/api/admin/zones/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const zone = await storage.updateZone(req.params.id, req.body);
      if (!zone) {
        return res.status(404).json({ error: "Zone not found" });
      }
      res.json(zone);
    } catch (error) {
      res.status(400).json({ error: "Invalid zone data" });
    }
  });

  app.delete("/api/admin/zones/:id", requireAdmin, async (req: Request, res: Response) => {
    const success = await storage.deleteZone(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Zone not found" });
    }
    res.json({ success: true });
  });

  // Public Zones API (for booking form and hotel assignment)
  app.get("/api/zones", async (req: Request, res: Response) => {
    const zones = await storage.getActiveZones();
    res.json(zones);
  });

  // Seed St. Lucia zones
  app.post("/api/admin/zones/seed", requireAdmin, async (req: Request, res: Response) => {
    const stLuciaZones = [
      "Gros Islet",
      "Babonneau",
      "Castries North",
      "Castries East",
      "Castries Central",
      "Castries South",
      "Anse-La-Raye/Canaries",
      "Soufriere",
      "Choiseul",
      "Laborie",
      "Vieux-Fort South",
      "Vieux-Fort North",
      "Micoud South",
      "Micoud North",
      "Dennery South",
      "Dennery North",
      "Castries South East",
    ];

    const createdZones = [];
    const skippedZones = [];

    for (const zoneName of stLuciaZones) {
      const existing = await storage.getZoneByName(zoneName);
      if (existing) {
        skippedZones.push(zoneName);
        continue;
      }
      const zone = await storage.createZone({ name: zoneName, isActive: true });
      createdZones.push(zone);
    }

    res.json({ 
      success: true, 
      created: createdZones.length, 
      skipped: skippedZones.length,
      message: `Created ${createdZones.length} zones, skipped ${skippedZones.length} existing zones` 
    });
  });

  // Zone Routes API (zone-to-zone pricing)
  app.get("/api/admin/zone-routes", requireAdmin, async (req: Request, res: Response) => {
    const routes = await storage.getAllZoneRoutes();
    res.json(routes);
  });

  app.get("/api/admin/zone-routes/:id", requireAdmin, async (req: Request, res: Response) => {
    const route = await storage.getZoneRouteById(req.params.id);
    if (!route) {
      return res.status(404).json({ error: "Zone route not found" });
    }
    res.json(route);
  });

  app.post("/api/admin/zone-routes", requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertZoneRouteSchema.parse(req.body);
      const route = await storage.upsertZoneRoute(data);
      res.json(route);
    } catch (error) {
      res.status(400).json({ error: "Invalid zone route data" });
    }
  });

  app.patch("/api/admin/zone-routes/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const route = await storage.updateZoneRoute(req.params.id, req.body);
      if (!route) {
        return res.status(404).json({ error: "Zone route not found" });
      }
      res.json(route);
    } catch (error) {
      res.status(400).json({ error: "Invalid zone route data" });
    }
  });

  app.delete("/api/admin/zone-routes/:id", requireAdmin, async (req: Request, res: Response) => {
    const success = await storage.deleteZoneRoute(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Zone route not found" });
    }
    res.json({ success: true });
  });

  // Rates API
  app.get("/api/admin/rates", requireAdmin, async (req: Request, res: Response) => {
    const rates = await storage.getAllRates();
    res.json(rates);
  });

  app.get("/api/admin/rates/zone/:zoneId", requireAdmin, async (req: Request, res: Response) => {
    const rates = await storage.getRatesByZone(req.params.zoneId);
    res.json(rates);
  });

  app.post("/api/admin/rates", requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertRateSchema.parse(req.body);
      const rate = await storage.createRate(data);
      res.json(rate);
    } catch (error) {
      res.status(400).json({ error: "Invalid rate data" });
    }
  });

  app.patch("/api/admin/rates/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const rate = await storage.updateRate(req.params.id, req.body);
      if (!rate) {
        return res.status(404).json({ error: "Rate not found" });
      }
      res.json(rate);
    } catch (error) {
      res.status(400).json({ error: "Invalid rate data" });
    }
  });

  app.delete("/api/admin/rates/:id", requireAdmin, async (req: Request, res: Response) => {
    const success = await storage.deleteRate(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Rate not found" });
    }
    res.json({ success: true });
  });

  // Pricing Rules API
  app.get("/api/admin/pricing-rules", requireAdmin, async (req: Request, res: Response) => {
    const rules = await storage.getAllPricingRules();
    res.json(rules);
  });

  app.post("/api/admin/pricing-rules", requireAdmin, async (req: Request, res: Response) => {
    try {
      const data = insertPricingRuleSchema.parse(req.body);
      const rule = await storage.createPricingRule(data);
      res.json(rule);
    } catch (error) {
      res.status(400).json({ error: "Invalid pricing rule data" });
    }
  });

  app.patch("/api/admin/pricing-rules/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const rule = await storage.updatePricingRule(req.params.id, req.body);
      if (!rule) {
        return res.status(404).json({ error: "Pricing rule not found" });
      }
      res.json(rule);
    } catch (error) {
      res.status(400).json({ error: "Invalid pricing rule data" });
    }
  });

  app.delete("/api/admin/pricing-rules/:id", requireAdmin, async (req: Request, res: Response) => {
    const success = await storage.deletePricingRule(req.params.id);
    if (!success) {
      return res.status(404).json({ error: "Pricing rule not found" });
    }
    res.json({ success: true });
  });

  // Bookings API
  app.get("/api/admin/bookings", requireAdmin, async (req: Request, res: Response) => {
    const { status, search } = req.query;
    const bookings = await storage.getAllBookings({
      status: status as string,
      search: search as string,
    });
    res.json(bookings);
  });

  app.get("/api/admin/bookings/:id", requireAdmin, async (req: Request, res: Response) => {
    const booking = await storage.getBooking(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    res.json(booking);
  });

  app.patch("/api/admin/bookings/:id/status", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      const booking = await storage.updateBookingStatus(req.params.id, status);
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(400).json({ error: "Invalid status" });
    }
  });

  app.post("/api/admin/bookings/:id/assign-driver", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { driverId } = req.body;
      
      if (!driverId) {
        return res.status(400).json({ error: "Driver ID required" });
      }
      
      const booking = await storage.assignDriver(req.params.id, driverId);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      const driver = await storage.getDriver(driverId);
      
      // Here we would send emails to guest, driver, and admin
      // This will be implemented when email integration is set up
      
      res.json({ 
        booking, 
        driver,
        message: "Driver assigned successfully. Email notifications would be sent here." 
      });
    } catch (error) {
      res.status(400).json({ error: "Failed to assign driver" });
    }
  });

  // Update booking pricing (admin only)
  app.patch("/api/admin/bookings/:id/pricing", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { bookingFee, driverFee, totalAmount, balanceDueToDriver } = req.body;
      
      const booking = await storage.updateBookingPricing(req.params.id, {
        bookingFee,
        driverFee,
        totalAmount,
        balanceDueToDriver,
        pricingSet: true,
      });
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking pricing:", error);
      res.status(400).json({ error: "Failed to update pricing" });
    }
  });

  // Send payment link to customer (admin only)
  app.post("/api/admin/bookings/:id/send-payment-link", requireAdmin, async (req: Request, res: Response) => {
    try {
      const booking = await storage.getBooking(req.params.id);
      
      if (!booking) {
        return res.status(404).json({ error: "Booking not found" });
      }
      
      if (!booking.pricingSet) {
        return res.status(400).json({ error: "Pricing must be set before sending payment link" });
      }

      const totalAmountCents = Math.round(parseFloat(booking.totalAmount || "0") * 100);
      
      const stripe = await getUncachableStripeClient();
      
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Airport Transfer - ${booking.referenceNumber}`,
                description: `Transfer from ${booking.pickupLocation} to ${booking.dropoffLocation}`,
              },
              unit_amount: totalAmountCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          bookingId: booking.id,
          referenceNumber: booking.referenceNumber,
        },
      });

      try {
        await emailService.sendPaymentLink({
          customerEmail: booking.customerEmail,
          customerName: booking.customerName,
          referenceNumber: booking.referenceNumber,
          totalAmount: booking.totalAmount || "0",
          paymentLink: paymentLink.url,
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
      
      const updatedBooking = await storage.markPaymentLinkSent(req.params.id);
      
      res.json({ 
        booking: updatedBooking,
        paymentLink: paymentLink.url,
        message: `Payment link sent to ${booking.customerEmail}. Total amount: $${booking.totalAmount}` 
      });
    } catch (error) {
      console.error("Error sending payment link:", error);
      res.status(400).json({ error: "Failed to send payment link" });
    }
  });

  // Public booking creation endpoint (for customer form)
  app.post("/api/bookings", async (req: Request, res: Response) => {
    try {
      // Convert pickupDate string to Date object
      const pickupDate = req.body.pickupDate ? new Date(req.body.pickupDate) : undefined;
      const isDestinationBooking = req.body.bookingType === "destination";
      
      // For hotel bookings, set fixed pricing; for destination bookings, leave pricing null (pending quote)
      const bookingData = {
        ...req.body,
        pickupDate,
        referenceNumber: generateReferenceNumber(),
        status: "new",
        // Only set pricing for hotel bookings
        bookingFee: isDestinationBooking ? null : "30.00",
        driverFee: isDestinationBooking ? null : "30.00",
        totalAmount: isDestinationBooking ? null : "30.00",
        balanceDueToDriver: isDestinationBooking ? null : "30.00",
        pricingSet: !isDestinationBooking, // Hotel bookings have pricing set, destination bookings need manual pricing
      };
      
      const data = insertBookingSchema.parse(bookingData);
      const booking = await storage.createBooking(data);
      res.json(booking);
    } catch (error) {
      console.error("Booking creation error:", error);
      res.status(400).json({ error: "Invalid booking data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
