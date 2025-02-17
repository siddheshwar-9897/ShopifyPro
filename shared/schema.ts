import { pgTable, text, serial, numeric, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image").notNull(),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
});

// Enhanced validation schema for products
export const insertProductSchema = createInsertSchema(products)
  .pick({
    name: true,
    price: true,
    image: true,
  })
  .extend({
    name: z.string()
      .min(3, "Product name must be at least 3 characters")
      .max(100, "Product name cannot exceed 100 characters")
      .regex(/^[a-zA-Z0-9\s\-_]+$/, "Product name can only contain letters, numbers, spaces, hyphens, and underscores"),
    price: z.string()
      .regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number with up to 2 decimal places")
      .transform((val) => {
        const num = parseFloat(val);
        return num >= 0.01 && num <= 999999.99 ? val : "0";
      })
      .refine((val) => parseFloat(val) >= 0.01 && parseFloat(val) <= 999999.99, {
        message: "Price must be between $0.01 and $999,999.99",
      }),
    image: z.string()
      .url("Please enter a valid URL")
      .startsWith("https://", "Image URL must start with https:// for security")
      .min(5, "Image URL is too short")
      .max(500, "Image URL is too long"),
  });

// Enhanced validation schema for cart items
export const insertCartItemSchema = createInsertSchema(cartItems)
  .pick({
    productId: true,
    quantity: true,
  })
  .extend({
    quantity: z.number()
      .int("Quantity must be a whole number")
      .min(1, "Quantity must be at least 1")
      .max(100, "Maximum quantity per item is 100"),
  });

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;