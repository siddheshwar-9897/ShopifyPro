import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCartItemSchema, searchParamsSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express) {
  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const params = searchParamsSchema.parse({
        query: req.query.q,
        category: req.query.category,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      });

      const { data, total } = await storage.getProducts(params);
      res.json({
        data,
        pagination: {
          total,
          page: params.page,
          limit: params.limit,
          totalPages: Math.ceil(total / params.limit),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ 
          message: "Invalid query parameters", 
          details: validationError.message 
        });
      } else {
        res.status(500).json({ 
          message: "Failed to fetch products",
          details: error instanceof Error ? error.message : "Unknown error"
        });
      }
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

  app.patch("/api/products/:id/inventory", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const { inventory } = z.object({
        inventory: z.number()
          .int("Inventory must be a whole number")
          .min(0, "Inventory cannot be negative")
      }).parse(req.body);

      const updated = await storage.updateProductInventory(id, inventory);
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
          message: "Failed to update product inventory",
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
      const params = insertCartItemSchema.parse(req.body);
      const product = await storage.getProduct(params.productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.inventory < params.quantity) {
        return res.status(400).json({ message: "Not enough inventory" });
      }

      const created = await storage.addToCart({
        productId: params.productId,
        quantity: params.quantity
      });

      res.json({
        id: created.id,
        productId: created.productId,
        quantity: created.quantity,
        product: product
      });
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