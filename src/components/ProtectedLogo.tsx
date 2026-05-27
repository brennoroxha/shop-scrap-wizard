import { useEffect, useRef } from "react";
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

  const loadOnce = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("logo-token");
      if (error || !data?.token) return;

      const url = `${SUPABASE_URL}/functions/v1/logo-serve?token=${encodeURIComponent(data.token)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        // Bitmap nas dimensões naturais (DPR) — o tamanho visual vem do CSS/className.
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(img.naturalWidth * dpr);
        canvas.height = Math.round(img.naturalHeight * dpr);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
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
    <canvas
      ref={canvasRef}
      aria-label={alt}
      role="img"
      width={width}
      height={height}
      className={className}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        maxWidth: "100%",
        userSelect: "none",
        WebkitUserSelect: "none",
        ...({ WebkitUserDrag: "none" } as any),
      }}
    />
  );
};

export default ProtectedLogo;
