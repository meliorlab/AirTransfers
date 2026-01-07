import { db } from "./db";
import { 
  type AdminUser, 
  type InsertAdminUser,
  type Driver,
  type InsertDriver,
  type Hotel,
  type InsertHotel,
  type Zone,
  type InsertZone,
  type Rate,
  type InsertRate,
  type PricingRule,
  type InsertPricingRule,
  type Booking,
  type InsertBooking,
  adminUsers,
  drivers,
  hotels,
  zones,
  rates,
  pricingRules,
  bookings,
} from "@shared/schema";
import { eq, and, desc, or, like, sql } from "drizzle-orm";

export interface IStorage {
  // Admin users
  getAdminUser(id: string): Promise<AdminUser | undefined>;
  getAdminUserByUsername(username: string): Promise<AdminUser | undefined>;
  createAdminUser(user: InsertAdminUser): Promise<AdminUser>;
  
  // Drivers
  getAllDrivers(): Promise<Driver[]>;
  getDriver(id: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver | undefined>;
  deleteDriver(id: string): Promise<boolean>;
  
  // Hotels
  getAllHotels(): Promise<Hotel[]>;
  getActiveHotels(): Promise<Hotel[]>;
  getHotel(id: string): Promise<Hotel | undefined>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  updateHotel(id: string, hotel: Partial<InsertHotel>): Promise<Hotel | undefined>;
  deleteHotel(id: string): Promise<boolean>;
  
  // Zones
  getAllZones(): Promise<Zone[]>;
  getZone(id: string): Promise<Zone | undefined>;
  createZone(zone: InsertZone): Promise<Zone>;
  updateZone(id: string, zone: Partial<InsertZone>): Promise<Zone | undefined>;
  deleteZone(id: string): Promise<boolean>;
  
  // Rates
  getAllRates(): Promise<Rate[]>;
  getRatesByZone(zoneId: string): Promise<Rate[]>;
  getRate(id: string): Promise<Rate | undefined>;
  createRate(rate: InsertRate): Promise<Rate>;
  updateRate(id: string, rate: Partial<InsertRate>): Promise<Rate | undefined>;
  deleteRate(id: string): Promise<boolean>;
  
  // Pricing rules
  getAllPricingRules(): Promise<PricingRule[]>;
  getPricingRule(id: string): Promise<PricingRule | undefined>;
  createPricingRule(rule: InsertPricingRule): Promise<PricingRule>;
  updatePricingRule(id: string, rule: Partial<InsertPricingRule>): Promise<PricingRule | undefined>;
  deletePricingRule(id: string): Promise<boolean>;
  
  // Bookings
  getAllBookings(filters?: { status?: string; search?: string }): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingByReference(referenceNumber: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  assignDriver(bookingId: string, driverId: string): Promise<Booking | undefined>;
  updateBookingStatus(id: string, status: string): Promise<Booking | undefined>;
  updateBookingPricing(id: string, pricing: { bookingFee?: string; driverFee?: string; totalAmount?: string; balanceDueToDriver?: string; pricingSet?: boolean }): Promise<Booking | undefined>;
  markPaymentLinkSent(id: string): Promise<Booking | undefined>;
}

export class DbStorage implements IStorage {
  // Admin users
  async getAdminUser(id: string): Promise<AdminUser | undefined> {
    const result = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return result[0];
  }

  async getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
    const result = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return result[0];
  }

  async createAdminUser(user: InsertAdminUser): Promise<AdminUser> {
    const result = await db.insert(adminUsers).values(user).returning();
    return result[0];
  }

  // Drivers
  async getAllDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers).orderBy(desc(drivers.createdAt));
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    const result = await db.select().from(drivers).where(eq(drivers.id, id));
    return result[0];
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const result = await db.insert(drivers).values(driver).returning();
    return result[0];
  }

  async updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver | undefined> {
    const result = await db.update(drivers).set(driver).where(eq(drivers.id, id)).returning();
    return result[0];
  }

  async deleteDriver(id: string): Promise<boolean> {
    const result = await db.delete(drivers).where(eq(drivers.id, id)).returning();
    return result.length > 0;
  }

  // Hotels
  async getAllHotels(): Promise<Hotel[]> {
    return await db.select().from(hotels).orderBy(desc(hotels.createdAt));
  }

  async getActiveHotels(): Promise<Hotel[]> {
    return await db.select().from(hotels).where(eq(hotels.isActive, true)).orderBy(hotels.name);
  }

  async getHotel(id: string): Promise<Hotel | undefined> {
    const result = await db.select().from(hotels).where(eq(hotels.id, id));
    return result[0];
  }

  async createHotel(hotel: InsertHotel): Promise<Hotel> {
    const result = await db.insert(hotels).values(hotel).returning();
    return result[0];
  }

  async updateHotel(id: string, hotel: Partial<InsertHotel>): Promise<Hotel | undefined> {
    const result = await db.update(hotels).set(hotel).where(eq(hotels.id, id)).returning();
    return result[0];
  }

  async deleteHotel(id: string): Promise<boolean> {
    const result = await db.delete(hotels).where(eq(hotels.id, id)).returning();
    return result.length > 0;
  }

  // Zones
  async getAllZones(): Promise<Zone[]> {
    return await db.select().from(zones).orderBy(desc(zones.createdAt));
  }

  async getZone(id: string): Promise<Zone | undefined> {
    const result = await db.select().from(zones).where(eq(zones.id, id));
    return result[0];
  }

  async createZone(zone: InsertZone): Promise<Zone> {
    const result = await db.insert(zones).values(zone).returning();
    return result[0];
  }

  async updateZone(id: string, zone: Partial<InsertZone>): Promise<Zone | undefined> {
    const result = await db.update(zones).set(zone).where(eq(zones.id, id)).returning();
    return result[0];
  }

  async deleteZone(id: string): Promise<boolean> {
    const result = await db.delete(zones).where(eq(zones.id, id)).returning();
    return result.length > 0;
  }

  // Rates
  async getAllRates(): Promise<Rate[]> {
    return await db.select().from(rates).orderBy(desc(rates.createdAt));
  }

  async getRatesByZone(zoneId: string): Promise<Rate[]> {
    return await db.select().from(rates).where(eq(rates.zoneId, zoneId));
  }

  async getRate(id: string): Promise<Rate | undefined> {
    const result = await db.select().from(rates).where(eq(rates.id, id));
    return result[0];
  }

  async createRate(rate: InsertRate): Promise<Rate> {
    const result = await db.insert(rates).values(rate).returning();
    return result[0];
  }

  async updateRate(id: string, rate: Partial<InsertRate>): Promise<Rate | undefined> {
    const result = await db.update(rates).set(rate).where(eq(rates.id, id)).returning();
    return result[0];
  }

  async deleteRate(id: string): Promise<boolean> {
    const result = await db.delete(rates).where(eq(rates.id, id)).returning();
    return result.length > 0;
  }

  // Pricing rules
  async getAllPricingRules(): Promise<PricingRule[]> {
    return await db.select().from(pricingRules).orderBy(desc(pricingRules.priority), desc(pricingRules.createdAt));
  }

  async getPricingRule(id: string): Promise<PricingRule | undefined> {
    const result = await db.select().from(pricingRules).where(eq(pricingRules.id, id));
    return result[0];
  }

  async createPricingRule(rule: InsertPricingRule): Promise<PricingRule> {
    const result = await db.insert(pricingRules).values(rule).returning();
    return result[0];
  }

  async updatePricingRule(id: string, rule: Partial<InsertPricingRule>): Promise<PricingRule | undefined> {
    const result = await db.update(pricingRules).set(rule).where(eq(pricingRules.id, id)).returning();
    return result[0];
  }

  async deletePricingRule(id: string): Promise<boolean> {
    const result = await db.delete(pricingRules).where(eq(pricingRules.id, id)).returning();
    return result.length > 0;
  }

  // Bookings
  async getAllBookings(filters?: { status?: string; search?: string }): Promise<Booking[]> {
    let query = db.select().from(bookings);
    
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(bookings.status, filters.status));
    }
    
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      conditions.push(
        or(
          like(bookings.referenceNumber, searchPattern),
          like(bookings.customerName, searchPattern),
          like(bookings.customerEmail, searchPattern),
          like(bookings.flightNumber, searchPattern)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(bookings.createdAt));
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id));
    return result[0];
  }

  async getBookingByReference(referenceNumber: string): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.referenceNumber, referenceNumber));
    return result[0];
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const result = await db.insert(bookings).values(booking).returning();
    return result[0];
  }

  async updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const result = await db.update(bookings)
      .set({ ...booking, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return result[0];
  }

  async assignDriver(bookingId: string, driverId: string): Promise<Booking | undefined> {
    const result = await db.update(bookings)
      .set({
        driverId,
        assignedAt: new Date(),
        status: "driver_assigned",
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId))
      .returning();
    return result[0];
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking | undefined> {
    const result = await db.update(bookings)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return result[0];
  }

  async updateBookingPricing(id: string, pricing: { bookingFee?: string; driverFee?: string; totalAmount?: string; balanceDueToDriver?: string; pricingSet?: boolean }): Promise<Booking | undefined> {
    const result = await db.update(bookings)
      .set({ 
        ...pricing,
        updatedAt: new Date() 
      })
      .where(eq(bookings.id, id))
      .returning();
    return result[0];
  }

  async markPaymentLinkSent(id: string): Promise<Booking | undefined> {
    const result = await db.update(bookings)
      .set({ 
        paymentLinkSent: true,
        paymentLinkSentAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(bookings.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new DbStorage();
