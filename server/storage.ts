import { 
  type Product, 
  type InsertProduct,
  type CartItem,
  type InsertCartItem 
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private products: Map<number, Product>;
  private cartItems: Map<number, CartItem>;
  private currentProductId: number;
  private currentCartItemId: number;

  constructor() {
    this.products = new Map();
    this.cartItems = new Map();
    this.currentProductId = 1;
    this.currentCartItemId = 1;

    // Add some sample products
    const sampleProducts: InsertProduct[] = [
      {
        name: "Premium Watch",
        price: "199.99",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
      },
      {
        name: "Wireless Headphones",
        price: "159.99",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
      },
      {
        name: "Smart Watch",
        price: "299.99",
        image: "https://images.unsplash.com/photo-1596460107916-430662021049",
      },
      {
        name: "Coffee Maker",
        price: "79.99",
        image: "https://images.unsplash.com/photo-1615615228002-890bb61cac6e",
      }
    ];

    sampleProducts.forEach(product => this.createProduct(product));
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.currentProductId++;
    const newProduct = { ...product, id };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async deleteProduct(id: number): Promise<void> {
    this.products.delete(id);
    // Remove any cart items containing this product
    const cartItemsToDelete = Array.from(this.cartItems.entries())
      .filter(([_, item]) => item.productId === id)
      .map(([id]) => id);

    cartItemsToDelete.forEach(id => this.cartItems.delete(id));
  }

  async getCartItems(): Promise<CartItem[]> {
    return Array.from(this.cartItems.values());
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Check if product exists first
    if (!this.products.has(item.productId)) {
      throw new Error("Product not found");
    }

    // Check if item already exists in cart
    const existingItem = Array.from(this.cartItems.values()).find(
      cartItem => cartItem.productId === item.productId
    );

    if (existingItem) {
      return this.updateCartItemQuantity(
        existingItem.id, 
        existingItem.quantity + (item.quantity || 1)
      );
    }

    const id = this.currentCartItemId++;
    const newItem = {
      id,
      productId: item.productId,
      quantity: item.quantity || 1,
    };
    this.cartItems.set(id, newItem);
    return newItem;
  }

  async removeFromCart(id: number): Promise<void> {
    this.cartItems.delete(id);
  }

  async updateCartItemQuantity(id: number, quantity: number): Promise<CartItem> {
    const item = this.cartItems.get(id);
    if (!item) {
      throw new Error("Cart item not found");
    }

    const updatedItem = { ...item, quantity };
    this.cartItems.set(id, updatedItem);
    return updatedItem;
  }
}

export const storage = new MemStorage();