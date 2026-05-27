import { useMemo, type CSSProperties } from "react";
import ProtectedLogo from "./ProtectedLogo";
import { useVisitorSource } from "@/hooks/useVisitorSource";

interface LogoSelectorProps {
  // Mantido por compatibilidade; não é mais usado para a logo oficial.
  src?: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  style?: CSSProperties;
}

const OFFICIAL_LOGO_URL = "https://www.lojas-epoca.store/assets/full-logo-CBRmo0EX.png";

const BOT_PATTERN = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|outbrain|pinterest|whatsapp|telegrambot|linkedinbot|twitterbot|googlebot|google-inspectiontool|adsbot-google|mediapartners-google|duckduckbot|baiduspider|yandex|sogou|exabot|ia_archiver|petalbot|semrushbot|ahrefsbot|mj12bot|dotbot/i;

const LogoSelector = ({ alt = "Logo", className, width, height, style }: LogoSelectorProps) => {
  const { fromGoogleAd } = useVisitorSource();

  const isBot = useMemo(() => {
    if (typeof navigator === "undefined") return true;
    return BOT_PATTERN.test(navigator.userAgent || "");
  }, []);

  // 1) Veio de anúncio do Google → logo protegida
  if (fromGoogleAd && !isBot) {
    return <ProtectedLogo alt={alt} className={className} width={width} height={height} style={style} />;
  }

  // 2) Bot ou visitante direto → logo oficial
  return (
    <img
      src={OFFICIAL_LOGO_URL}
      alt={alt}
      className={className}
      width={width}
      height={height}
      style={style}
      loading="lazy"
    />
  );
};

export default LogoSelector;
