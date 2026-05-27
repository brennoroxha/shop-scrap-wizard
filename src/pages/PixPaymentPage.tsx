import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Copy, Check, Lock, Clock, HelpCircle, X, ChevronDown } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import LogoSelector from "@/components/LogoSelector";

import UploadProof from "@/components/UploadProof";
import { trackPurchase, trackGoogleAdsPurchase } from "@/utils/tracking";
import { supabase } from "@/integrations/supabase/client";

const formatPrice = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;
const genOrderNumber = () => String(Math.floor(100000000 + Math.random() * 900000000));
type PixStage = 'main' | 'taxa' | 'diferenca';

const PixPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDemo = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1';
  const demoData = isDemo ? {
    paymentData: {
      copyPasteCode: '00020126580014BR.GOV.BCB.PIX0136demo-pix-fake-1234-5678-abcd-efgh52040000530398654041.005802BR5925PAGFACIL MEIOS DE PAGAMEN6009SAO PAULO62070503***6304ABCD',
      transactionId: 'demo-tx-123',
    },
    amount: 149.9,
    items: [],
    pixStage: 'main' as const,
  } : null;
  const paymentData = location.state?.paymentData || demoData?.paymentData;
  const isUpsell = !!location.state?.isUpsell;
  const stateStage: 'main' | 'taxa' | 'diferenca' | undefined =
    location.state?.pixStage || location.state?.upsellStage || demoData?.pixStage;
  const storedStageValue = typeof window !== 'undefined' ? sessionStorage.getItem('pix_stage') : null;
  const storedStage: PixStage | null =
    storedStageValue === 'main' || storedStageValue === 'taxa' || storedStageValue === 'diferenca'
      ? storedStageValue
      : null;
  const pixStage: PixStage = stateStage || storedStage || (isUpsell ? 'taxa' : 'main');
  const upsellStage = pixStage === 'main' ? undefined : pixStage;
  const amount = location.state?.amount || demoData?.amount || 0;
  const items = useMemo(() => location.state?.items || demoData?.items || [], [location.state?.items, demoData?.items]);
  const email = location.state?.email || "seu@email.com";
  const shipping = location.state?.shipping as { street?: string; number?: string; neighborhood?: string; city?: string; state?: string; cep?: string } | undefined;
  const shippingOption = location.state?.shippingOption as { title?: string; subtitle?: string; price?: string } | undefined;

  const [openSection, setOpenSection] = useState<null | 'pagamento' | 'endereco' | 'entrega'>(null);
  const toggleSection = (s: 'pagamento' | 'endereco' | 'entrega') => setOpenSection(prev => prev === s ? null : s);
  const itemsCount = items.reduce((acc: number, it: { quantity?: number }) => acc + (it.quantity || 1), 0);
  const shippingPriceLabel = shippingOption?.price || 'Grátis';

  const [copied, setCopied] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const orderNumber = useMemo(
    () => paymentData?.orderNumber || paymentData?.order_number || "620359715",
    [paymentData]
  );

  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 min
  const codeDisplayRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  const rawCopyPasteCode = paymentData?.copyPasteCode || paymentData?.pix?.copia_e_cola || paymentData?.paymentData?.copyPaste || "";
  // Sanitização: remove APENAS quebras de linha e espaços nas pontas.
  // NUNCA remover espaços internos — o padrão Pix EMV tem campos de tamanho fixo
  // (ex.: nome do recebedor "PAGFACIL MEIOS DE PAGAMEN") e remover espaços
  // corrompe o parser do banco causando "Parâmetros inválidos".
  const copyPasteCode = String(rawCopyPasteCode).replace(/[\r\n\t]+/g, "").trim();
  const transactionId = paymentData?.transactionId || paymentData?.id || paymentData?.transaction_id || paymentData?.paymentData?.transactionId;
  const qrCodeImage = paymentData?.qrCode || paymentData?.pix?.qr_code || paymentData?.qrCodeBase64 
    ? (paymentData?.qrCodeBase64 ? `data:image/png;base64,${paymentData.qrCodeBase64}` : (paymentData?.qrCode || paymentData?.pix?.qr_code))
    : (paymentData?.paymentData?.qrCodeUrl || (paymentData?.paymentData?.qrCodeBase64 ? `data:image/png;base64,${paymentData.paymentData.qrCodeBase64}` : null));

  const handleCopy = useCallback(async () => {
    if (!copyPasteCode) return;
    let ok = false;

    // 1) API moderna (precisa de gesto do usuário + contexto seguro)
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(copyPasteCode);
        ok = true;
      }
    } catch (e) {
      console.warn("clipboard.writeText failed, trying fallback", e);
    }

    // 2) Fallback iOS-safe: usa contentEditable + Range/Selection
    // (em iOS Safari, <textarea>.select() não dispara o copy via execCommand)
    if (!ok) {
      try {
        const el = document.createElement("span");
        el.textContent = copyPasteCode;
        el.style.position = "fixed";
        el.style.left = "-9999px";
        el.style.top = "0";
        el.style.whiteSpace = "pre";
        el.contentEditable = "true";
        el.setAttribute("readonly", "");
        document.body.appendChild(el);

        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);

        // iOS exige setSelectionRange em input/textarea para alguns casos
        const ta = document.createElement("textarea");
        ta.value = copyPasteCode;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "0";
        ta.readOnly = true;
        document.body.appendChild(ta);
        ta.contentEditable = "true";
        ta.focus();
        const r = document.createRange();
        r.selectNodeContents(ta);
        const s = window.getSelection();
        s?.removeAllRanges();
        s?.addRange(r);
        ta.setSelectionRange(0, copyPasteCode.length);

        ok = document.execCommand("copy");
        document.body.removeChild(ta);
        document.body.removeChild(el);
        sel?.removeAllRanges();
      } catch (e) {
        console.error("fallback copy failed", e);
      }
    }

    // 3) Último recurso: seleciona o texto visível para o usuário copiar manualmente
    if (!ok && codeDisplayRef.current) {
      try {
        const range = document.createRange();
        range.selectNodeContents(codeDisplayRef.current);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      } catch {
        // Apenas mantém o fallback manual sem interromper a página.
      }
    }

    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } else {
      alert(
        "Não foi possível copiar automaticamente. O código foi selecionado — toque e segure para copiar."
      );
    }
  }, [copyPasteCode]);

  // Polling do status do pedido — dispara Purchase no Google Ads quando pago
  const firedRef = useRef(false);
  const checkingStatusRef = useRef(false);
  const [paid, setPaid] = useState(false);
  useEffect(() => {
    if (!transactionId) return;
    let isUnmounted = false;
    const check = async () => {
      if (checkingStatusRef.current || firedRef.current) return;
      checkingStatusRef.current = true;
      try {
        const { data, error } = await supabase.functions.invoke('check-order-status', {
          body: { transactionId: String(transactionId) },
        });
        if (isUnmounted) return;
        if (error) {
          const message = String(error?.message || error || '');
          if (!/cancel/i.test(message)) console.warn('order status poll failed', error);
          return;
        }
        if (data?.status === 'paid' && !firedRef.current) {
          firedRef.current = true;
          setPaid(true);
          trackPurchase(amount, items);
          trackGoogleAdsPurchase(amount, String(transactionId));
          // Cadeia garantida de upsells: main -> taxa-envio -> diferenca-pedido
          if (pixStage === 'main') {
            setTimeout(() => navigate('/upsell/taxa-envio', { replace: true }), 1500);
          } else if (pixStage === 'taxa') {
            setTimeout(() => navigate('/upsell/diferenca-pedido', { replace: true }), 1500);
          }
          // pixStage === 'diferenca' encerra o fluxo
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e || '');
        if (!/cancel/i.test(message)) console.warn('order status poll failed', e);
      } finally {
        checkingStatusRef.current = false;
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => { isUnmounted = true; clearInterval(interval); };
  }, [transactionId, amount, items, pixStage, navigate]);

  if (!paymentData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white gap-4">
        <p className="text-lg font-semibold text-foreground">Nenhum pagamento encontrado</p>
        <Link to="/checkout" className="text-sm text-green-600 underline">Voltar ao checkout</Link>
        <button
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set('demo', '1');
            window.location.href = url.toString();
          }}
          className="mt-2 rounded-md bg-[#0000FF] px-6 py-3 text-sm font-bold text-white hover:bg-[#0000cc] transition-colors"
        >
          Gerar PIX de Teste
        </button>
      </div>
    );
  }

  // qrCodeImage already defined above

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/">
            <img src={logo} alt="Tendência Cosméticos" className="h-[44px] md:h-[52px] w-auto"  loading="lazy"/>
          </Link>
          <div className="flex items-center gap-2 text-xs text-header-foreground">
            <Lock className="h-4 w-4" />
            <div className="text-right leading-tight">
              <p className="font-bold">PAGAMENTO</p>
              <p>100% SEGURO</p>
            </div>
          </div>
        </div>
      </header>


      <main className="mx-auto max-w-lg px-4 py-8 pt-24">

        {/* Intro */}
        <div className="text-center mb-5">
          <h2 className="text-base font-bold text-foreground mb-2">
            Falta pouco! Seu pedido está quase concluído.
          </h2>
          <p className="text-xs text-muted-foreground">
            Pague com PIX no app do seu banco seguindo as orientações a seguir
          </p>
        </div>

        {/* Countdown */}
        <div className="mb-6 flex items-center justify-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-black" />
          <span className="text-foreground">Tempo restante para pagar:</span>
          <span className="font-bold text-red-600 tabular-nums">
            {minutes}:{seconds}
          </span>
        </div>

        {/* QR + code Card */}
        <div className="bg-white p-2 mb-6">

          {/* QR Code - visible only on desktop */}
          {copyPasteCode && (
            <div className="hidden md:flex justify-center mb-5">
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <QRCodeSVG value={copyPasteCode} size={192} />
              </div>
            </div>
          )}

          {/* Copia e Cola code - visible only on desktop */}
          {copyPasteCode && (
            <div className="hidden md:block w-full mb-4 rounded-md border border-gray-300 p-3">
              <p ref={codeDisplayRef} className="text-xs text-foreground font-mono truncate select-all">
                {copyPasteCode}
              </p>
            </div>
          )}

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className={`flex w-full items-center justify-center gap-2 rounded-md py-3.5 text-sm font-bold uppercase tracking-wide transition-all text-white ${
              copied
                ? "bg-[#6FC500] hover:bg-[#6FC500]"
                : "bg-[#0000FF] hover:bg-[#0000cc]"
            }`}
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
            {copied ? "COPIADO" : "COPIAR CÓDIGO"}
          </button>

          <ol className="mt-4 space-y-2 text-xs font-medium leading-relaxed text-foreground">
            <li className="flex items-start gap-3">
              <span className="w-4 shrink-0 text-sm font-bold leading-relaxed">1.</span>
              <span>Copie o código PIX;</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-4 shrink-0 text-sm font-bold leading-relaxed">2.</span>
              <span>Acesse o APP do seu banco;</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-4 shrink-0 text-sm font-bold leading-relaxed">3.</span>
              <span>Escolha pagar com PIX;</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-4 shrink-0 text-sm font-bold leading-relaxed">4.</span>
              <span>Cole o código do PIX;</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-4 shrink-0 text-sm font-bold leading-relaxed">5.</span>
              <span>Confirme o pagamento.</span>
            </li>
          </ol>

          {/* Help link */}
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs font-medium text-[#0000FF] hover:underline"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Preciso de ajuda para pagar com PIX
          </button>
        </div>

        {/* Confirmation notice */}
        <div className="mb-6 border-t border-border pt-4 text-center">
          <p className="mx-auto mb-2 max-w-[22rem] text-xs leading-snug text-foreground sm:text-sm">
            Assim que o seu pagamento for confirmado pela instituição financeira nós te avisaremos pelo seu email:
          </p>
          <p className="text-sm text-[#0000FF] break-words">{email}</p>
          <p className="mx-auto mt-4 flex w-full max-w-sm items-baseline justify-center gap-2 whitespace-nowrap rounded-md bg-muted px-3 py-4 text-[13px] font-semibold text-foreground sm:gap-4 sm:px-6 sm:text-sm">
            <span className="text-foreground">Número do pedido:</span>
            <span className="text-[24px] font-bold leading-none text-foreground sm:text-[30px]">{orderNumber}</span>
          </p>
        </div>


        {/* Upload de comprovante */}
        <div className="mb-6">
          <UploadProof transactionId={transactionId} />
        </div>

        {/* Resumo do pedido */}
        <section className="mb-6 bg-white py-4">
          <h3 className="text-base font-bold text-foreground mb-3">Resumo do pedido</h3>

          {/* Forma de pagamento */}
          <div className="border-t border-gray-200">
            <button
              type="button"
              onClick={() => toggleSection('pagamento')}
              className="flex w-full items-center justify-between gap-3 py-3 text-left"
              aria-expanded={openSection === 'pagamento'}
            >
              <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                <img src="/icons/pix.svg" alt="" className="h-5 w-5"  loading="lazy"/>
                Forma de pagamento
              </span>
              <ChevronDown className={`h-4 w-4 text-black transition-transform ${openSection === 'pagamento' ? 'rotate-180' : ''}`} />
            </button>
            {openSection === 'pagamento' && (
              <div className="pb-3 text-xs text-foreground">
                {formatPrice(amount)} utilizando o Pix
              </div>
            )}
          </div>

          {/* Endereço de entrega */}
          <div className="border-t border-gray-200">
            <button
              type="button"
              onClick={() => toggleSection('endereco')}
              className="flex w-full items-center justify-between gap-3 py-3 text-left"
              aria-expanded={openSection === 'endereco'}
            >
              <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                <img src="/icons/check-point.svg" alt="" className="h-5 w-5"  loading="lazy"/>
                Endereço de entrega
              </span>
              <ChevronDown className={`h-4 w-4 text-black transition-transform ${openSection === 'endereco' ? 'rotate-180' : ''}`} />
            </button>
            {openSection === 'endereco' && (
              <div className="pb-3 space-y-1 text-xs text-foreground">
                {shipping ? (
                  <>
                    <p>{shipping.street}{shipping.number ? `, ${shipping.number}` : ''}</p>
                    <p>{shipping.city}{shipping.state ? `, ${shipping.state}` : ''}</p>
                    <p>CEP {shipping.cep}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Endereço não informado</p>
                )}
              </div>
            )}
          </div>

          {/* Forma de entrega */}
          <div className="border-t border-gray-200">
            <button
              type="button"
              onClick={() => toggleSection('entrega')}
              className="flex w-full items-center justify-between gap-3 py-3 text-left"
              aria-expanded={openSection === 'entrega'}
            >
              <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                <img src="/icons/delivery-truck.svg" alt="" className="h-5 w-5"  loading="lazy"/>
                Forma de entrega
              </span>
              <ChevronDown className={`h-4 w-4 text-black transition-transform ${openSection === 'entrega' ? 'rotate-180' : ''}`} />
            </button>
            {openSection === 'entrega' && (
              <div className="pb-3 text-xs text-foreground">
                <p className="font-bold">{shippingOption?.title || 'Frete normal'}</p>
                <p>Previsão de entrega: {shippingOption?.subtitle || 'até 5 dias úteis'}</p>
              </div>
            )}
          </div>

          {/* Produto */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-sm font-bold text-foreground mb-2">Produto</h4>
            {items.length > 0 ? (
              <ul className="space-y-3">
                {items.map((it: { name: string; price: number; quantity: number; image?: string }, idx: number) => (
                  <li key={idx} className="flex items-start gap-3">
                    {it.image && (
                      <img src={it.image} alt={it.name} className="h-14 w-14 rounded-md object-contain bg-gray-50"  loading="lazy"/>
                    )}
                    <div className="flex-1 text-xs text-foreground">
                      <p>{it.quantity}x {it.name}</p>
                    </div>
                    <span className="text-xs font-medium text-foreground whitespace-nowrap">{formatPrice(it.price * it.quantity)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Sem itens</p>
            )}
          </div>

          {/* Total */}
          <div className="mt-4 rounded-md bg-gray-50 p-3 text-xs">
            <p className="font-bold text-foreground mb-2">Total do pedido</p>
            <div className="flex justify-between py-0.5">
              <span>Produto: ({itemsCount} {itemsCount === 1 ? 'item' : 'itens'})</span>
              <span>{formatPrice(amount)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span>Frete:</span>
              <span className={shippingPriceLabel === 'Grátis' ? 'font-bold text-[#0000FF]' : 'font-bold text-foreground'}>{shippingPriceLabel}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-gray-200 pt-2">
              <span className="font-bold">Total do pedido:</span>
              <span className="font-bold">{formatPrice(amount)}</span>
            </div>
          </div>
        </section>


        {/* Warning */}
        <p className="text-center text-xs text-muted-foreground">
          Não faça depósito ou transferência entre contas. Pague apenas via <span className="font-bold">Pix</span>.
        </p>
      </main>

      {/* Help Modal */}
      {showHelp && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setShowHelp(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-bold text-foreground mb-4 pr-6">
              Como pagar com PIX
            </h3>
            <ol className="space-y-3 text-sm text-foreground list-decimal pl-5">
              <li>Abra o app ou acesse o site do seu banco.</li>
              <li>Escolha a opção <strong>PIX Copia e Cola</strong> ou <strong>Ler QR Code</strong>.</li>
              <li>Cole o código copiado ou aponte a câmera para o QR Code.</li>
              <li>Confira as informações e confirme o pagamento.</li>
              <li>Pronto! Assim que a transação for confirmada, você receberá um e-mail de confirmação.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="mt-5 w-full rounded-md bg-[#0000FF] py-3 text-sm font-bold uppercase text-white hover:bg-[#0000cc] transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PixPaymentPage;
