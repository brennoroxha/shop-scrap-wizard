import { useEffect, useRef, type CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedLogoProps {
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  style?: CSSProperties;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const CANVAS_WIDTH = 200;
const CANVAS_HEIGHT = 60;

const ProtectedLogo = ({ alt = "Logo", className, style }: ProtectedLogoProps) => {
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
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
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
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className={className}
      style={{
        width: "200px",
        height: "60px",
        display: "block",
        userSelect: "none",
        WebkitUserSelect: "none",
        ...style,
      }}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    />
  );
};

export default ProtectedLogo;
