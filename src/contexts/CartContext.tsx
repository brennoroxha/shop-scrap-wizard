import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Product } from "@/data/products";
import { GIFT_PRODUCT, GIFT_THRESHOLD, isGiftProductId } from "@/data/giftProduct";

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: string;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  lastAdded: CartItem | null;
  setLastAdded: (item: CartItem | null) => void;
  addItem: (product: Product, quantity?: number, variant?: string) => void;
  removeItem: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, quantity: number, variant?: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}


const CartContext = createContext<CartContextType | undefined>(undefined);

const itemKey = (id: string, variant?: string) => `${id}__${variant || ""}`;
const STORAGE_KEY = "cart_items_v1";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartItem | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  // Auto-add/remove free gift when non-gift subtotal reaches threshold
  useEffect(() => {
    const nonGiftSubtotal = items
      .filter((i) => !isGiftProductId(i.product.id))
      .reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const hasGift = items.some((i) => isGiftProductId(i.product.id));
    const qualifies = nonGiftSubtotal >= GIFT_THRESHOLD;

    if (qualifies && !hasGift) {
      setItems((prev) => [...prev, { product: GIFT_PRODUCT, quantity: 1 }]);
    } else if (!qualifies && hasGift) {
      setItems((prev) => prev.filter((i) => !isGiftProductId(i.product.id)));
    }
  }, [items]);

  const addItem = useCallback((product: Product, quantity = 1, variant?: string) => {
    setItems((prev) => {
      const key = itemKey(product.id, variant);
      const existing = prev.find((i) => itemKey(i.product.id, i.variant) === key);
      if (existing) {
        return prev.map((i) =>
          itemKey(i.product.id, i.variant) === key
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { product, quantity, variant }];
    });
    setLastAdded({ product, quantity, variant });
    setIsOpen(true);
  }, []);


  const removeItem = useCallback((productId: string, variant?: string) => {
    const key = itemKey(productId, variant);
    setItems((prev) => prev.filter((i) => itemKey(i.product.id, i.variant) !== key));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, variant?: string) => {
    const key = itemKey(productId, variant);
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => itemKey(i.product.id, i.variant) !== key));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (itemKey(i.product.id, i.variant) === key ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, isOpen, setIsOpen, lastAdded, setLastAdded, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >

      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
