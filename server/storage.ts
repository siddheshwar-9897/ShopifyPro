import { 
  type Product, 
  type InsertProduct,
  type CartItem,
  type InsertCartItem,
  type SearchParams,
  products,
  cartItems,
  cartItemsRelations
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
    let baseQuery = db.select().from(products);
    let countQuery = db.select({ count: sql<number>`cast(count(*) as integer)` }).from(products);

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
        const whereClause = and(...conditions);
        baseQuery = baseQuery.where(whereClause);
        countQuery = countQuery.where(whereClause);
      }

      // Apply sorting
      if (params.sortBy) {
        const orderDirection = params.sortOrder === 'desc' ? 'desc' : 'asc';
        baseQuery = baseQuery.orderBy(products[params.sortBy], orderDirection);
      }

      // Apply pagination
      const offset = (params.page - 1) * params.limit;
      baseQuery = baseQuery.limit(params.limit).offset(offset);
    }

    const [data, [{ count }]] = await Promise.all([
      baseQuery,
      countQuery
    ]);

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
    const items = await db.query.cartItems.findMany({
      with: {
        product: true
      }
    });

    return items;
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, item.productId));

    if (!product) {
      throw new Error("Product not found");
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
      id: newItem.id,
      productId: newItem.productId,
      quantity: newItem.quantity,
      product
    };
  }

  async removeFromCart(id: number): Promise<void> {
    const cartItem = await db.query.cartItems.findFirst({
      where: eq(cartItems.id, id),
      with: {
        product: true
      }
    });

    if (cartItem) {
      // Restore inventory
      await this.updateProductInventory(
        cartItem.product.id,
        cartItem.product.inventory + cartItem.quantity
      );
    }

    await db.delete(cartItems).where(eq(cartItems.id, id));
  }

  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem> {
    const cartItem = await db.query.cartItems.findFirst({
      where: eq(cartItems.id, id),
      with: {
        product: true
      }
    });

    if (!cartItem) {
      throw new Error("Cart item not found");
    }

    // Calculate inventory change
    const inventoryChange = cartItem.quantity - quantity;
    const newInventory = cartItem.product.inventory + inventoryChange;

    if (newInventory < 0) {
      throw new Error("Insufficient inventory for requested quantity");
    }

    // Update inventory first
    await this.updateProductInventory(cartItem.product.id, newInventory);

    // Then update cart item
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();

    return {
      ...updatedItem,
      product: cartItem.product
    };
  }
}

export const storage = new DatabaseStorage();