import { useState } from "react";
import { Link } from "react-router-dom";
import type { Product } from "@/data/products";
import { ArrowDown, Minus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  product: Product;
  fullWidth?: boolean;
}

const ProductCard = ({ product, fullWidth = false }: ProductCardProps) => {
  const { addItem, setIsOpen } = useCart();
  const [qty, setQty] = useState(1);
  const formatPrice = (value: number) =>
    `R$ ${value.toFixed(2).replace(".", ",")}`;

  const handleBuy = () => {
    addItem(product, qty);
    setIsOpen(true);
  };

  return (
    <div
      className={`product-card-hover group relative flex flex-shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 ${fullWidth ? "w-full" : "w-[200px] md:w-[220px]"}`}
    >

      {/* Image */}
      <Link
        to={`/produtos/${product.id}`}
        className="flex aspect-square items-center justify-center overflow-hidden bg-white p-4 no-underline"
      >
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3 text-center">
        <Link
          to={`/produtos/${product.id}`}
          className="mb-2 line-clamp-2 text-xs font-semibold leading-tight text-card-foreground no-underline hover:underline"
        >
          {product.name}
        </Link>

        <div className="mt-auto">


        <div className="mt-auto">
          <div className="mb-3 flex items-baseline justify-center gap-2">
            <span className="text-lg font-bold text-[#29ABE2]">
              {formatPrice(product.price)}
            </span>
          </div>

          {/* Quantity + cart action */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-shrink-0 items-center rounded-full border border-border bg-card">
              <button
                type="button"
                aria-label="Diminuir"
                onClick={(e) => {
                  e.preventDefault();
                  setQty((q) => Math.max(1, q - 1));
                }}
                className="flex h-8 w-7 items-center justify-center text-foreground hover:text-[#29ABE2]"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[16px] text-center text-sm font-medium text-foreground">{qty}</span>
              <button
                type="button"
                aria-label="Aumentar"
                onClick={(e) => {
                  e.preventDefault();
                  setQty((q) => q + 1);
                }}
                className="flex h-8 w-7 items-center justify-center text-foreground hover:text-[#29ABE2]"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              type="button"
              aria-label="Comprar"
              onClick={(e) => {
                e.preventDefault();
                handleBuy();
              }}
              className="flex h-8 min-w-0 flex-1 items-center justify-center gap-1 rounded-full bg-[#2bb5a0] px-2 text-xs font-semibold text-white transition-colors hover:bg-[#249e8b]"
            >
              <span className="hidden md:inline">Comprar</span>
              <ShoppingCart className="h-3.5 w-3.5 flex-shrink-0" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
