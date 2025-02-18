
export const CART_STORAGE_KEY = 'shopping-cart';

export function saveCartToStorage(cartItems: any[]) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
}

export function loadCartFromStorage(): any[] {
  const stored = localStorage.getItem(CART_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}
