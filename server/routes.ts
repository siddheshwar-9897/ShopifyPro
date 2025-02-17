import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCartItemSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express) {
  // Product routes
  app.get("/api/products", async (_req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch products",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const product = insertProductSchema.parse(req.body);
      const created = await storage.createProduct(product);
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: "Validation failed", 
          details: validationError.message 
        });
      } else {
        res.status(500).json({ 
          message: "Failed to create product",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      await storage.deleteProduct(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to delete product",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Cart routes
  app.get("/api/cart", async (_req, res) => {
    try {
      const cartItems = await storage.getCartItems();
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to fetch cart items",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const item = insertCartItemSchema.parse(req.body);
      const created = await storage.addToCart(item);
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: "Validation failed", 
          details: validationError.message 
        });
      } else {
        res.status(500).json({ 
          message: "Failed to add item to cart",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }
      await storage.removeFromCart(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to remove item from cart",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.patch("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid cart item ID" });
      }

      const { quantity } = z.object({ 
        quantity: z.number()
          .int("Quantity must be a whole number")
          .min(1, "Quantity must be at least 1")
          .max(100, "Maximum quantity per item is 100")
      }).parse(req.body);

      const updated = await storage.updateCartItemQuantity(id, quantity);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: "Validation failed", 
          details: validationError.message 
        });
      } else {
        res.status(500).json({ 
          message: "Failed to update cart item quantity",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  });

  return createServer(app);
}