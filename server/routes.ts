import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCartItemSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express) {
  // Product routes
  app.get("/api/products", async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post("/api/products", async (req, res) => {
    try {
      const product = insertProductSchema.parse(req.body);
      const created = await storage.createProduct(product);
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Cart routes
  app.get("/api/cart", async (_req, res) => {
    const cartItems = await storage.getCartItems();
    const products = await storage.getProducts();
    
    // Enrich cart items with product details
    const enrichedItems = cartItems.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        ...item,
        product
      };
    });
    
    res.json(enrichedItems);
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const item = insertCartItemSchema.parse(req.body);
      const created = await storage.addToCart(item);
      res.json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeFromCart(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/cart/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = z.object({ quantity: z.number().min(1) }).parse(req.body);
      const updated = await storage.updateCartItemQuantity(id, quantity);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  return createServer(app);
}
