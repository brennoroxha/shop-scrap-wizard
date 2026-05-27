import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedLogoProps {
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const ProtectedLogo = ({ alt = "Logo", className, width, height }: ProtectedLogoProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);

  const loadOnce = async () => {
    try {
      // 1) Pegar token fresco
      const { data, error } = await supabase.functions.invoke("logo-token");
      if (error || !data?.token) return;

      // 2) Buscar a imagem com o token
      const url = `${SUPABASE_URL}/functions/v1/logo-serve?token=${encodeURIComponent(data.token)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      // 3) Desenhar no canvas
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        const dpr = window.devicePixelRatio || 1;
        const w = width || img.naturalWidth;
        const h = height || img.naturalHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = () => URL.revokeObjectURL(objectUrl);
      img.src = objectUrl;
    } catch {
      /* swallow */
    }
  };

  useEffect(() => {
    loadOnce();
    const interval = setInterval(loadOnce, 25 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: "inline-block",
        userSelect: "none",
        WebkitUserSelect: "none",
        lineHeight: 0,
      }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      aria-label={alt}
      role="img"
    >
      <canvas
        ref={canvasRef}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        style={{
          display: "block",
          pointerEvents: "none",
          userSelect: "none",
          ...({ WebkitUserDrag: "none" } as any),
        }}
      />
      {/* Overlay transparente para bloquear interação direta */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "transparent",
          cursor: "default",
        }}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      />
    </div>
  );
};

export default ProtectedLogo;
