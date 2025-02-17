import { 
  type Product, 
  type InsertProduct,
  type CartItem,
  type InsertCartItem,
  type SearchParams,
  products,
  cartItems
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, gte, lte, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // Product operations
  getProducts(params?: SearchParams): Promise<{ data: Product[], total: number }>;
  createProduct(product: InsertProduct): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  updateProductInventory(id: number, quantity: number): Promise<Product>;

  // Cart operations
  getCartItems(): Promise<CartItem[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  updateCartItemQuantity(id: number, quantity: number): Promise<CartItem>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(params?: SearchParams): Promise<{ data: Product[], total: number }> {
    let query = db.select().from(products);

    // Apply filters
    if (params) {
      const conditions = [];

      if (params.query) {
        conditions.push(or(
          ilike(products.name, `%${params.query}%`),
          ilike(products.description || '', `%${params.query}%`)
        ));
      }

      if (params.category) {
        conditions.push(eq(products.category, params.category));
      }

      if (params.minPrice !== undefined) {
        conditions.push(gte(products.price, params.minPrice.toString()));
      }

      if (params.maxPrice !== undefined) {
        conditions.push(lte(products.price, params.maxPrice.toString()));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      if (params.sortBy) {
        const order = params.sortOrder === 'desc' ? sql`DESC` : sql`ASC`;
        query = query.orderBy(sql`${products[params.sortBy]} ${order}`);
      }

      // Apply pagination
      const offset = (params.page - 1) * params.limit;
      query = query.limit(params.limit).offset(offset);
    }

    const data = await query;
    const [{ count }] = await db.select({ 
      count: sql<number>`count(*)`.mapWith(Number)
    }).from(products);

    return { data, total: count };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    // First delete any cart items containing this product
    await db.delete(cartItems).where(eq(cartItems.productId, id));
    // Then delete the product
    await db.delete(products).where(eq(products.id, id));
  }

  async updateProductInventory(id: number, quantity: number): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ inventory: quantity })
      .where(eq(products.id, id))
      .returning();

    if (!product) {
      throw new Error("Product not found");
    }

    return product;
  }

  async getCartItems(): Promise<CartItem[]> {
    const items = await db.select().from(cartItems);
    const productsList = await this.getProducts();

    // Enrich cart items with product details
    return items.map(item => {
      const product = productsList.data.find(p => p.id === item.productId);
      if (!product) {
        throw new Error(`Product not found for cart item ${item.id}`);
      }
      return {
        ...item,
        product
      };
    });
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Check if product exists and has sufficient inventory
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, item.productId));

    if (!product) {
      throw new Error("Product not found");
    }

    if (product.inventory < item.quantity) {
      throw new Error("Insufficient inventory");
    }

    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.productId, item.productId));

    if (existingItem) {
      const newQuantity = existingItem.quantity + (item.quantity || 1);
      if (product.inventory < newQuantity) {
        throw new Error("Insufficient inventory for requested quantity");
      }
      return this.updateCartItemQuantity(existingItem.id, newQuantity);
    }

    // Create new cart item and update inventory
    const [newItem] = await db
      .insert(cartItems)
      .values({
        productId: item.productId,
        quantity: item.quantity || 1
      })
      .returning();

    await this.updateProductInventory(
      product.id,
      product.inventory - (item.quantity || 1)
    );

    return {
      ...newItem,
      product
    };
  }

  async removeFromCart(id: number): Promise<void> {
    // Get the cart item and restore inventory
    const [item] = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.id, id));

    if (item) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId));

      if (product) {
        await this.updateProductInventory(
          product.id,
          product.inventory + item.quantity
        );
      }
    }

    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem> {
    const [cartItem] = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.id, id));

    if (!cartItem) {
      throw new Error("Cart item not found");
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, cartItem.productId));

    if (!product) {
      throw new Error("Product not found");
    }

    // Calculate inventory change
    const inventoryChange = cartItem.quantity - quantity;
    const newInventory = product.inventory + inventoryChange;

    if (newInventory < 0) {
      throw new Error("Insufficient inventory for requested quantity");
    }

    // Update inventory first
    await this.updateProductInventory(product.id, newInventory);

    // Then update cart item
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();

    return {
      ...updatedItem,
      product
    };
  }
}

// Export an instance of DatabaseStorage
export const storage = new DatabaseStorage();