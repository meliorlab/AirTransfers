import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin users
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({
  id: true,
  createdAt: true,
});

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;

// Drivers
export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  vehicleClass: text("vehicle_class").notNull(), // standard, luxury, minivan
  vehicleDetails: text("vehicle_details"), // e.g., "Black Toyota Camry"
  vehicleNumber: text("vehicle_number"), // License plate or vehicle number
  vehiclePhotoUrl: text("vehicle_photo_url"),
  driverPhotoUrl: text("driver_photo_url"),
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  bankAddress: text("bank_address"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  createdAt: true,
});

export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

// Hotels
export const hotels = pgTable("hotels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  zone: text("zone"), // Legacy field - deprecated in favor of zoneId
  zoneId: varchar("zone_id").references(() => zones.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHotelSchema = createInsertSchema(hotels).omit({
  id: true,
  createdAt: true,
});

export type InsertHotel = z.infer<typeof insertHotelSchema>;
export type Hotel = typeof hotels.$inferSelect;

// Zones
export const zones = pgTable("zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertZoneSchema = createInsertSchema(zones).omit({
  id: true,
  createdAt: true,
});

export type InsertZone = z.infer<typeof insertZoneSchema>;
export type Zone = typeof zones.$inferSelect;

// Zone Routes (zone-to-zone pricing)
export const zoneRoutes = pgTable("zone_routes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originZoneId: varchar("origin_zone_id").notNull().references(() => zones.id, { onDelete: "cascade" }),
  destinationZoneId: varchar("destination_zone_id").notNull().references(() => zones.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertZoneRouteSchema = createInsertSchema(zoneRoutes).omit({
  id: true,
  createdAt: true,
});

export type InsertZoneRoute = z.infer<typeof insertZoneRouteSchema>;
export type ZoneRoute = typeof zoneRoutes.$inferSelect;

// Rates (base rates by vehicle class and party size)
export const rates = pgTable("rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  zoneId: varchar("zone_id").notNull().references(() => zones.id, { onDelete: "cascade" }),
  vehicleClass: text("vehicle_class").notNull(), // standard, luxury, minivan
  minPartySize: integer("min_party_size").notNull(),
  maxPartySize: integer("max_party_size").notNull(),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  driverFee: decimal("driver_fee", { precision: 10, scale: 2 }).notNull().default("30.00"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRateSchema = createInsertSchema(rates).omit({
  id: true,
  createdAt: true,
});

export type InsertRate = z.infer<typeof insertRateSchema>;
export type Rate = typeof rates.$inferSelect;

// Pricing rules (seasonal, time-based modifiers)
export const pricingRules = pgTable("pricing_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  vehicleClass: text("vehicle_class"), // null means applies to all
  zoneId: varchar("zone_id").references(() => zones.id, { onDelete: "cascade" }), // null means applies to all
  multiplier: decimal("multiplier", { precision: 5, scale: 2 }).notNull().default("1.00"),
  fixedAmount: decimal("fixed_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  daysOfWeek: text("days_of_week").array(), // null or ['monday', 'tuesday', ...]
  startTime: text("start_time"), // HH:mm format
  endTime: text("end_time"), // HH:mm format
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPricingRuleSchema = createInsertSchema(pricingRules).omit({
  id: true,
  createdAt: true,
});

export type InsertPricingRule = z.infer<typeof insertPricingRuleSchema>;
export type PricingRule = typeof pricingRules.$inferSelect;

// Bookings
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referenceNumber: text("reference_number").notNull().unique(),
  
  // Booking type: "hotel" or "destination"
  bookingType: text("booking_type").notNull().default("hotel"),
  
  // Customer info
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  
  // Booking details
  pickupLocation: text("pickup_location").notNull(),
  dropoffLocation: text("dropoff_location").notNull(),
  accommodation: text("accommodation"),
  hotelId: varchar("hotel_id").references(() => hotels.id), // For hotel tab
  destinationLink: text("destination_link"), // For destination link tab (Airbnb/Google Maps)
  arrivalPortId: varchar("arrival_port_id"), // Port of arrival (airport/ferry terminal)
  pickupDate: timestamp("pickup_date").notNull(),
  partySize: integer("party_size").notNull(),
  
  // Flight info
  flightNumber: text("flight_number").notNull(),
  
  // Vehicle
  vehicleClass: text("vehicle_class").notNull(),
  
  // Pricing
  bookingFee: decimal("booking_fee", { precision: 10, scale: 2 }),
  driverFee: decimal("driver_fee", { precision: 10, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  balanceDueToDriver: decimal("balance_due_to_driver", { precision: 10, scale: 2 }),
  pricingSet: boolean("pricing_set").notNull().default(false),
  paymentLinkSent: boolean("payment_link_sent").notNull().default(false),
  paymentLinkSentAt: timestamp("payment_link_sent_at"),
  
  // Stripe
  stripeSessionId: text("stripe_session_id"),
  
  // Status
  status: text("status").notNull().default("new"), // new, paid_fee, driver_assigned, completed, canceled
  
  // Driver assignment
  driverId: varchar("driver_id").references(() => drivers.id),
  assignedAt: timestamp("assigned_at"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  referenceNumber: true,
  bookingType: true,
  hotelId: true,
  destinationLink: true,
  accommodation: true,
  arrivalPortId: true,
  status: true,
  bookingFee: true,
  driverFee: true,
  totalAmount: true,
  balanceDueToDriver: true,
  pricingSet: true,
  paymentLinkSent: true,
  paymentLinkSentAt: true,
  driverId: true,
  assignedAt: true,
  stripeSessionId: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Ports (airports and ferry terminals)
export const ports = pgTable("ports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // UVF, SLU, PORT_CASTRIES
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPortSchema = createInsertSchema(ports).omit({
  id: true,
  createdAt: true,
});

export type InsertPort = z.infer<typeof insertPortSchema>;
export type Port = typeof ports.$inferSelect;

// Port to Hotel Rates
export const portHotelRates = pgTable("port_hotel_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portId: varchar("port_id").notNull().references(() => ports.id, { onDelete: "cascade" }),
  hotelId: varchar("hotel_id").notNull().references(() => hotels.id, { onDelete: "cascade" }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPortHotelRateSchema = createInsertSchema(portHotelRates).omit({
  id: true,
  createdAt: true,
});

export type InsertPortHotelRate = z.infer<typeof insertPortHotelRateSchema>;
export type PortHotelRate = typeof portHotelRates.$inferSelect;

// Settings (configurable values)
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;

// Keep legacy users table for backward compatibility
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
