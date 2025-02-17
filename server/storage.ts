import { 
  type Product, 
  type InsertProduct,
  type CartItem,
  type InsertCartItem,
  products,
  cartItems
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Product operations
  getProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  // Cart operations
  getCartItems(): Promise<CartItem[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  updateCartItemQuantity(id: number, quantity: number): Promise<CartItem>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
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

  async getCartItems(): Promise<CartItem[]> {
    const items = await db.select().from(cartItems);
    const productsList = await this.getProducts();

    // Enrich cart items with product details
    return items.map(item => {
      const product = productsList.find(p => p.id === item.productId);
      return {
        ...item,
        product: product!
      };
    });
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Check if product exists
    const [product] = await db.select().from(products).where(eq(products.id, item.productId));
    if (!product) {
      throw new Error("Product not found");
    }

    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.productId, item.productId));

    if (existingItem) {
      return this.updateCartItemQuantity(
        existingItem.id,
        existingItem.quantity + (item.quantity || 1)
      );
    }

    // Create new cart item
    const [newItem] = await db
      .insert(cartItems)
      .values({
        productId: item.productId,
        quantity: item.quantity || 1
      })
      .returning();

    return {
      ...newItem,
      product
    };
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();

    if (!updatedItem) {
      throw new Error("Cart item not found");
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, updatedItem.productId));

    return {
      ...updatedItem,
      product
    };
  }
}

// Export an instance of DatabaseStorage
export const storage = new DatabaseStorage();