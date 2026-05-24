import type { Product } from "./products";

export const GIFT_THRESHOLD = 50;

export const GIFT_PRODUCT: Product = {
  id: "epoca-brinde-full-size-vult-esmalte-5-free-amour-surpreender-8ml",
  ean: "7899852003931",
  name: "Brinde Full Size Vult Esmalte 5 Free Amour Surpreender 8ml",
  image: "/products/7899852025766_ddde4fb2.jpg",
  images: ["/products/7899852025766_ddde4fb2.jpg"],
  price: 0.01,
  installment: "R$ 0,0",
  hasVariants: false,
  category: "cosmeticos-ganhe-brindes-brinde",
};

export const isGiftProductId = (id: string) => id === GIFT_PRODUCT.id;
