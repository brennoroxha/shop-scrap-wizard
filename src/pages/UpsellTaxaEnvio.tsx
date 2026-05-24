import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Gift, Lock, Truck, ShieldCheck, Clock, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/full-logo.png";
import carmedCopa from "@/assets/carmed-copa.webp";
import UploadProof from "@/components/UploadProof";

const BACKEND_URL = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const BACKEND_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const SHIPPING_FEE = 17.97;

const formatPrice = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

type StoredCustomer = {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  shipping?: any;
};

const UpsellTaxaEnvio = () => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<StoredCustomer | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("checkout_customer");
      if (raw) setCustomer(JSON.parse(raw));
    } catch {}
  }, []);

  const handlePay = async () => {
    if (!customer) {
      toast.error("Dados do pedido não encontrados. Refaça o checkout.");
      return;
    }
    setLoading(true);
    try {
      const items = [
        {
          name: "Ajuste de taxa de envio - Correios",
          price: SHIPPING_FEE,
          quantity: 1,
          category: "shipping",
        },
      ];
      const res = await fetch(`${BACKEND_URL}/functions/v1/create-pix-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: BACKEND_ANON_KEY,
          Authorization: `Bearer ${BACKEND_ANON_KEY}`,
        },
        body: JSON.stringify({
          amount: SHIPPING_FEE,
          customer,
          items,
          shipping: customer.shipping || null,
          trackingParameters: null,
        }),
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.message || "Erro ao gerar Pix");
      }
      try { sessionStorage.setItem('pix_stage', 'taxa'); } catch {}
      navigate("/checkout/pix", {
        state: { paymentData: data, amount: SHIPPING_FEE, items, isUpsell: true, upsellStage: 'taxa', pixStage: 'taxa' },
      });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Erro ao gerar Pix");
    } finally {
      setLoading(false);
    }
  };

  const PayButton = () => (
    <button
      onClick={handlePay}
      disabled={loading}
      className="w-full rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold py-4 text-base shadow-lg transition-all flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Gerando Pix...
        </>
      ) : (
        <>REALIZAR PAGAMENTO DA TAXA</>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-[#1a1a1a] shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/">
            <img src={logo} alt="Tendencia Cosmeticos" className="h-[44px] md:h-[52px] w-auto"  loading="lazy"/>
          </Link>
          <div className="flex items-center gap-2 text-xs text-white">
            <Lock className="h-4 w-4" />
            <div className="text-right leading-tight">
              <p className="font-bold">AMBIENTE</p>
              <p>100% SEGURO</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 md:py-10">
        {/* Success badge */}
        <div className="mb-5 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">Pagamento confirmado</span>
          </div>
        </div>

        {/* Alert */}
        <div className="p-5 mb-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
            </div>
            <div className="flex-1">
              <h1 className="text-base md:text-lg font-extrabold text-red-600 mb-1">
                Ops! Detectamos um erro no cálculo do envio
              </h1>
              <p className="text-sm text-black leading-relaxed">
                Identificamos uma falha no nosso sistema ao calcular o valor do frete para seu CEP.
                Sentimos muito pelo transtorno — para finalizar o despacho do seu pedido, precisamos
                de um pequeno ajuste de <strong className="text-red-600">{formatPrice(SHIPPING_FEE)}</strong> referente à
                taxa correta dos Correios.
              </p>
            </div>
          </div>
        </div>

        {/* CTA topo */}
        <div className="mb-5">
          <PayButton />
        </div>

        {/* Gift card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 mb-5 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-5 w-5 text-pink-600" />
            <h2 className="text-base md:text-lg font-extrabold text-foreground">
              Como pedido de desculpas, um brinde exclusivo
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Vamos enviar junto ao seu pedido <strong>2 Carmed Edição Copa</strong> (hidratante labial),
            totalmente grátis, em agradecimento pela compreensão.
          </p>
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-sky-100 to-blue-50">
            <img
              src={carmedCopa}
              alt="Carmed Edição Copa - brinde exclusivo"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
            <span className="absolute top-3 left-3 rounded-full bg-pink-600 px-3 py-1 text-[11px] font-bold text-white shadow">
              GRÁTIS • 2 UNIDADES
            </span>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 mb-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="h-5 w-5 text-foreground" />
            <h3 className="text-sm font-bold text-foreground">Ajuste de envio</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Taxa correta dos Correios</span>
              <span>{formatPrice(SHIPPING_FEE)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>2x Carmed Edição Copa (brinde)</span>
              <span className="text-green-600 font-semibold">GRÁTIS</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-foreground text-base">
              <span>Total a pagar</span>
              <span>{formatPrice(SHIPPING_FEE)}</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <PayButton />

        {/* Trust */}
        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center gap-1 rounded-lg bg-white border border-gray-200 p-3">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <span className="text-[11px] font-semibold text-muted-foreground">Pagamento seguro</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-white border border-gray-200 p-3">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="text-[11px] font-semibold text-muted-foreground">Liberação imediata</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-lg bg-white border border-gray-200 p-3">
            <Gift className="h-5 w-5 text-pink-600" />
            <span className="text-[11px] font-semibold text-muted-foreground">Brinde garantido</span>
          </div>
        </div>

        {/* Upload de comprovante (caso já tenha pago a taxa por outro meio) */}
        <div className="mt-5">
          <UploadProof />
        </div>

        <p className="text-center text-xs font-semibold text-red-600 mt-5">
          Atenção: o não pagamento da taxa implicará no não envio do produto.
        </p>
      </main>
    </div>
  );
};

export default UpsellTaxaEnvio;
