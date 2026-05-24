import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Lock, ShieldCheck, Clock, Check, Loader2, Calculator, FileWarning } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/full-logo.png";
import UploadProof from "@/components/UploadProof";

const BACKEND_URL = (import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const BACKEND_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const formatPrice = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

type StoredCustomer = {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  shipping?: any;
};

const UpsellDiferencaPedido = () => {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<StoredCustomer | null>(null);
  const [orderTotal, setOrderTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("checkout_customer");
      if (raw) setCustomer(JSON.parse(raw));
      const rawTotal = sessionStorage.getItem("checkout_order_total");
      if (rawTotal) setOrderTotal(Number(rawTotal) || 0);
    } catch {}
  }, []);

  const diferenca = useMemo(() => Math.max(0.01, +(orderTotal * 0.10).toFixed(2)), [orderTotal]);
  const totalCorreto = useMemo(() => +(orderTotal + diferenca).toFixed(2), [orderTotal, diferenca]);

  const handlePay = async () => {
    if (!customer) {
      toast.error("Dados do pedido não encontrados. Refaça o checkout.");
      return;
    }
    if (diferenca <= 0) {
      toast.error("Não foi possível calcular a diferença do pedido.");
      return;
    }
    setLoading(true);
    try {
      const items = [
        {
          name: "Ajuste de valor do pedido",
          price: diferenca,
          quantity: 1,
          category: "adjustment",
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
          amount: diferenca,
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
      try { sessionStorage.setItem('pix_stage', 'diferenca'); } catch {}
      navigate("/checkout/pix", {
        state: { paymentData: data, amount: diferenca, items, isUpsell: true, upsellStage: 'diferenca', pixStage: 'diferenca' },
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
      disabled={loading || diferenca <= 0}
      className="w-full rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold py-4 text-base shadow-lg transition-all flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Gerando Pix...
        </>
      ) : (
        <>REALIZAR PAGAMENTO DA DIFERENÇA</>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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
        {/* Success badge taxa */}
        <div className="mb-5 flex items-center justify-center">
          <div className="flex items-center gap-2 rounded-full bg-green-50 border border-green-200 px-4 py-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">Taxa de envio confirmada</span>
          </div>
        </div>

        {/* Alert */}
        <div className="p-5 mb-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
              <FileWarning className="h-5 w-5 text-amber-700" />
            </div>
            <div className="flex-1">
              <h1 className="text-base md:text-lg font-extrabold text-red-600 mb-1">
                Atenção: identificamos uma divergência no valor do seu pedido
              </h1>
              <p className="text-sm text-black leading-relaxed">
                Durante a auditoria do seu pedido, nosso sistema detectou que o valor cobrado
                ficou <strong className="text-red-600">10% abaixo do valor correto</strong> da
                tabela atualizada de preços. Para liberar o despacho dos produtos, precisamos
                regularizar essa diferença.
              </p>
            </div>
          </div>
        </div>

        {/* CTA topo */}
        <div className="mb-5">
          <PayButton />
        </div>

        {/* Resumo do pedido */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 mb-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-5 w-5 text-foreground" />
            <h3 className="text-sm font-bold text-foreground">Resumo do ajuste</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Valor pago no pedido</span>
              <span className="font-semibold text-foreground">{formatPrice(orderTotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Valor correto do pedido</span>
              <span className="font-semibold text-foreground">{formatPrice(totalCorreto)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-600 font-semibold">Diferença a regularizar (10%)</span>
              <span className="text-red-600 font-extrabold">{formatPrice(diferenca)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-foreground text-base">
              <span>Total a pagar agora</span>
              <span>{formatPrice(diferenca)}</span>
            </div>
          </div>
        </div>

        {/* Explicação */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 mb-5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed">
              A diferença corresponde ao reajuste de preços aplicado pelos fabricantes e ainda não
              refletido no checkout no momento da sua compra. Ao quitar a diferença, seu pedido é
              imediatamente liberado para separação e envio.
            </p>
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
            <Check className="h-5 w-5 text-pink-600" />
            <span className="text-[11px] font-semibold text-muted-foreground">Pedido garantido</span>
          </div>
        </div>

        {/* Upload de comprovante */}
        <div className="mt-5">
          <UploadProof />
        </div>

        <p className="text-center text-xs font-semibold text-red-600 mt-5">
          Atenção: o não pagamento da diferença implicará no não envio do produto.
        </p>
      </main>
    </div>
  );
};

export default UpsellDiferencaPedido;
