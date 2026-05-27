import { useState, useCallback, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Minus, Plus, Star, CreditCard, ChevronDown, ChevronUp, Truck, Check, CheckCircle2, User, QrCode, Trash2 } from "lucide-react";
import cartBlueIcon from "@/assets/cart-blue-icon.svg";
import truckBlueIcon from "@/assets/truck-blue-icon.svg";
import { useCart } from "@/contexts/CartContext";
import logo from "@/assets/full-logo.png";
import logoCheckout from "@/assets/logo-checkout.png";
import pixIcon from "@/assets/pix-icon.png";
import checkoutBanner from "@/assets/checkout-banner.png";
import pixBadgeIcon from "@/assets/pix-badge-icon.png";
import mercadoPagoImg from "@/assets/mercado-pago.png";
import correiosLogo2 from "@/assets/correios-logo-2.png";
import coqueteleirasImg from "@/assets/coqueteleiras-brinde.png";
import fullLogo2 from "@/assets/full-logo-2.png";
import drogalCross from "@/assets/drogal-cross.svg";
import iconPayment from "@/assets/icon-payment.svg";
import iconDelivery from "@/assets/icon-delivery.svg";
import iconUser from "@/assets/icon-user.svg";
import iconSummary from "@/assets/icon-summary.svg";
import { maskCPF, maskPhone, maskCEP, isValidCPF, isValidPhone, isValidCEP, fetchAddressByCEP } from "@/utils/checkout-utils";
import { isDrogalCity } from "@/data/drogalCities";
import { Store, Zap } from "lucide-react";
import { trackInitiateCheckout, trackPurchase } from "@/utils/tracking";
import { toast } from "sonner";
import AnnouncementBar from "@/components/AnnouncementBar";
import StoreHeader from "@/components/StoreHeader";
import CheckoutSteps from "@/components/CheckoutSteps";


const formatPrice = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;

type PaymentMethod = "pix" | "credit";

const BACKEND_URL = (import.meta.env.VITE_SUPABASE_URL || "https://kxfwndstzhzlfnzvixez.supabase.co").replace(/\/$/, "");
const BACKEND_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Imt4ZnduZHN0emh6bGZuenZpeGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzE5MzYsImV4cCI6MjA4Nzc0NzkzNn0.qL-Hmea02-wm1lw0dPuK8-kwmdrltG-rTMJC6yadygA";

const createPixPayment = async (payload: Record<string, unknown>) => {
  const response = await fetch(`${BACKEND_URL}/functions/v1/create-pix-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: BACKEND_ANON_KEY,
      Authorization: `Bearer ${BACKEND_ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let data: { ok?: boolean; error?: string; message?: string } | null = null;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch {
    throw new Error("Não foi possível ler a resposta do pagamento");
  }

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || data?.message || "Não foi possível gerar o Pix");
  }

  return data;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, updateQuantity, removeItem, setIsOpen } = useCart();
  const [step, setStep] = useState(0);
  const [cartCep, setCartCep] = useState("");
  const [cartCepLoading, setCartCepLoading] = useState(false);
  const [cartCepError, setCartCepError] = useState("");
  const [cartShippingOptions, setCartShippingOptions] = useState<null | {
    city: string;
    isDrogal: boolean;
  }>(null);
  const [cartShippingMethod, setCartShippingMethod] = useState<string>("");
  const [coupon, setCoupon] = useState("");

  const handleCartCepCalc = useCallback(async () => {
    setCartCepError("");
    setCartShippingOptions(null);
    if (!isValidCEP(cartCep)) {
      setCartCepError("CEP inválido");
      return;
    }
    setCartCepLoading(true);
    const result = await fetchAddressByCEP(cartCep);
    setCartCepLoading(false);
    if (!result) {
      setCartCepError("CEP não encontrado");
      return;
    }
    const drogal = isDrogalCity(result.localidade);
    setCartShippingOptions({ city: `${result.localidade}/${result.uf}`, isDrogal: drogal });
    setCartShippingMethod(drogal ? "retira" : "correios");
  }, [cartCep]);

  const [email, setEmail] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  
  const [deliveryMode, setDeliveryMode] = useState<"receber" | "retirar">("receber");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cpfError, setCpfError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [shippingMethod, setShippingMethod] = useState<"normal">("normal");
  const [cepValid, setCepValid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [addressEditing, setAddressEditing] = useState(false);

  const pixDiscount = 0;
  const pixTotal = totalPrice;
  const hasTrackedInitCheckout = useRef(false);

  // Disable pinch/double-tap zoom on checkout
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    const original = meta?.getAttribute("content") || "width=device-width, initial-scale=1.0";
    meta?.setAttribute(
      "content",
      "width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no"
    );
    return () => {
      meta?.setAttribute("content", original);
    };
  }, []);

  useEffect(() => {
    if (!hasTrackedInitCheckout.current && items.length > 0) {
      hasTrackedInitCheckout.current = true;
      trackInitiateCheckout(
        pixTotal,
        items.map(i => ({ name: i.product.name, quantity: i.quantity, price: i.product.price }))
      );
    }
  }, [items, pixTotal]);

  // Prefill CEP and city from the cart's shipping calculator when entering the address step
  useEffect(() => {
    if (step >= 3) {
      if (!cep && cartCep) {
        handleCepChange(cartCep);
      } else if (!city && cartShippingOptions?.city) {
        const [c, uf] = cartShippingOptions.city.split("/");
        if (c) setCity(c);
        if (uf) setState(uf);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const getTrackingParameters = () => {
    const params = new URLSearchParams(window.location.search);
    return {
      src: params.get('src'),
      sck: params.get('sck'),
      utm_source: params.get('utm_source'),
      utm_campaign: params.get('utm_campaign'),
      utm_medium: params.get('utm_medium'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
    };
  };

  const handleFinalizarPedido = async () => {
    setIsProcessing(true);
    try {
      const cartItems = items.map((item) => ({
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        category: (item.product as any).category || '',
      }));
      const data = await createPixPayment({
        amount: pixTotal,
        customer: { name, email, cpf, phone },
        items: cartItems,
        shipping: { street, number, complement, neighborhood, city, state, cep },
        trackingParameters: getTrackingParameters(),
      });
      console.log('PIX payment created:', data);
      // Purchase event só é disparado quando o PIX é confirmado pago (PixPaymentPage)

      // Persist customer info for upsell flow after payment
      try {
        sessionStorage.setItem('checkout_customer', JSON.stringify({
          name, email, cpf, phone,
          shipping: { street, number, complement, neighborhood, city, state, cep },
        }));
        sessionStorage.setItem('checkout_order_total', String(pixTotal));
        sessionStorage.setItem('pix_stage', 'main');
      } catch {}

      const shippingOptionsAll = [
        { id: "correios", title: "Correios", subtitle: "2 a 4 dias úteis", price: "Grátis" },
        { id: "economica", title: "Econômica", subtitle: "Em até 6 Horas", price: "R$ 4,90" },
        { id: "expressa", title: "Expressa", subtitle: "Em até 3 Horas", price: "R$ 6,90" },
      ];
      const selShip = shippingOptionsAll.find(o => o.id === cartShippingMethod) || shippingOptionsAll[0];
      navigate('/checkout/pix', { state: {
        paymentData: data,
        amount: pixTotal,
        items: cartItems,
        pixStage: 'main',
        email,
        shipping: { street, number, complement, neighborhood, city, state, cep },
        shippingOption: selShip,
      } });
    } catch (err) {
      console.error('Error creating PIX:', err);
      toast.error(err instanceof Error ? err.message : "Erro ao finalizar o pedido");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePersonalContinue = () => {
    const current = (emailRef.current?.value || email).trim();
    if (current && current !== email) setEmail(current);
    
    const errors: Record<string, boolean> = {};
    if (!current || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(current)) errors.email = true;
    if (!name.trim()) errors.name = true;
    
    let cpfValid = isValidCPF(cpf);
    if (!cpfValid) {
      errors.cpf = true;
      setCpfError("CPF inválido");
    } else {
      setCpfError("");
    }
    
    let phoneValid = isValidPhone(phone);
    if (!phoneValid) {
      errors.phone = true;
      setPhoneError("Telefone inválido");
    } else {
      setPhoneError("");
    }
    
    setFormErrors(prev => ({ ...prev, ...errors }));
    
    if (Object.keys(errors).length === 0) {
      setStep(3);
    }
  };


  const handleCepChange = useCallback(async (value: string) => {
    const masked = maskCEP(value);
    setCep(masked);
    setCepError("");
    setCepValid(false);
    if (formErrors.cep) {
      setFormErrors(prev => ({ ...prev, cep: false }));
    }
    if (isValidCEP(masked)) {
      setCepLoading(true);
      const result = await fetchAddressByCEP(masked);
      setCepLoading(false);
      if (result) {
        setStreet(result.logradouro);
        setNeighborhood(result.bairro);
        setCity(result.localidade);
        setState(result.uf);
        if (result.complemento) setComplement(result.complemento);
        setCepValid(true);
        const drogal = isDrogalCity(result.localidade);
        setCartShippingOptions({ city: `${result.localidade}/${result.uf}`, isDrogal: drogal });
        setCartShippingMethod(drogal ? "retira" : "correios");
        setFormErrors(prev => ({ ...prev, street: false, neighborhood: false, city: false, state: false }));
      } else {
        setCartShippingOptions(null);
        setCepError("CEP não encontrado");
      }
    }
  }, [formErrors]);


  const handleAddressContinue = () => {
    const errors: Record<string, boolean> = {};
    if (!cep.trim()) errors.cep = true;
    if (!street.trim()) errors.street = true;
    if (!number.trim()) errors.number = true;
    if (!neighborhood.trim()) errors.neighborhood = true;
    if (!city.trim()) errors.city = true;
    if (!state.trim()) errors.state = true;
    
    setFormErrors(prev => ({ ...prev, ...errors }));
    
    if (Object.keys(errors).length === 0) {
      setStep(4);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#fafafa]">
        <p className="text-lg font-semibold text-foreground">Seu carrinho está vazio</p>
        <Link to="/" className="rounded-md bg-primary px-6 py-3 text-sm font-bold text-primary-foreground no-underline hover:bg-primary/90">
          Voltar para a loja
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] relative pb-24 lg:pb-0">
      {/* Loading overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white px-4">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-100 border-t-[#29ABE2]"></div>
            <p className="text-base text-foreground">Aguarde, estamos preparando o pagamento</p>
          </div>
        </div>
      )}
      {/* Header simplificado do checkout */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/">
            <LogoSelector alt="Tendência Cosméticos" className="h-[44px] md:h-[52px] w-auto" />
          </Link>
          {/* Desktop: barra de progresso no header */}
          <div className="hidden md:block flex-1 max-w-md">
            <CheckoutSteps currentStep={step >= 4 ? 2 : step === 0 ? 0 : 1} />
          </div>
          <div className="flex items-center gap-2 text-xs text-header-foreground md:hidden">
            <Lock className="h-4 w-4" />
            <div className="text-right leading-tight">
              <p className="font-bold">PAGAMENTO</p>
              <p>100% SEGURO</p>
            </div>
          </div>
        </div>
      </header>


      {/* Steps bar (mobile: below header, white bg) */}
      <div className="bg-white shadow-sm md:hidden">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <CheckoutSteps currentStep={step >= 4 ? 2 : step === 0 ? 0 : 1} />

        </div>
      </div>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {step >= 1 && step <= 3 ? (
          <button
            type="button"
            onClick={() => setStep(0)}
            className="mb-4 flex items-center gap-1.5 text-sm text-[#2d9ed1] hover:underline"
          >
            <span className="text-base">←</span> Voltar para o carrinho
          </button>
        ) : step >= 4 ? (
          <button
            type="button"
            onClick={() => setStep(0)}
            className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <span className="text-base">←</span> Voltar para carrinho
          </button>
        ) : (
          <button
            type="button"
            onClick={() => { setIsOpen(true); navigate("/"); }}
            className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <span className="text-base">←</span> Voltar para a loja
          </button>
        )}





        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Mobile: Cart summary first */}
          {step !== 0 && (
          <div className={`hidden lg:block lg:order-2 lg:col-span-1 ${step === 4 ? "hidden lg:block" : ""}`}>
            <CartSummary
              items={items}
              totalItems={totalItems}
              totalPrice={totalPrice}
              pixDiscount={pixDiscount}
              pixTotal={pixTotal}
              cartOpen={cartOpen}
              setCartOpen={setCartOpen}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
              alwaysOpen={true}
              onFinalizar={step >= 4 ? handleFinalizarPedido : undefined}
              isProcessing={isProcessing}
            />
          </div>
          )}

          {/* Forms */}
          <div className={`space-y-6 lg:order-1 ${step === 0 ? "lg:col-span-3" : "lg:col-span-2"}`}>
            {/* Step 0 - Carrinho */}
            {step === 0 && (
              <CartStep
                items={items}
                totalItems={totalItems}
                totalPrice={totalPrice}
                pixTotal={pixTotal}
                cartCep={cartCep}
                setCartCep={setCartCep}
                cartCepLoading={cartCepLoading}
                cartCepError={cartCepError}
                cartShippingOptions={cartShippingOptions}
                cartShippingMethod={cartShippingMethod}
                setCartShippingMethod={setCartShippingMethod}
                onCalcCep={handleCartCepCalc}
                coupon={coupon}
                setCoupon={setCoupon}
                updateQuantity={updateQuantity}
                removeItem={removeItem}
                onAvancar={() => setStep(1)}
              />
            )}


            {/* Step 1 - Dados pessoais */}
            {step >= 1 && step < 3 && (
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-bold text-[#1a4d6e]">
                <img src={iconUser} alt="" className="h-5 w-5"  loading="lazy"/>
                Dados pessoais
              </h2>
              <p className="mt-1 text-[11px] font-normal text-[#1a4d6e]">
                Solicitamos apenas as informações essenciais para a realização da compra.
              </p>

              <form
                className="mt-5 space-y-4"
                onSubmit={(e) => { e.preventDefault(); handlePersonalContinue(); }}
              >
                <div>
                  <label htmlFor="checkout-email" className="mb-1 block text-xs font-medium text-black">
                    Email
                  </label>
                  <input
                    id="checkout-email"
                    ref={emailRef}
                    type="email"
                    name="email"
                    autoComplete="off"
                    inputMode="email"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formErrors.email) setFormErrors(prev => ({ ...prev, email: false }));
                    }}
                    onBlur={(e) => setEmail(e.target.value.trim())}
                    placeholder="seuemail@email.com"
                    className={`w-full rounded-full border px-5 py-3 text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4FB8B0] ${formErrors.email ? "border-red-500" : "border-gray-300"}`}
                  />
                  {formErrors.email && <p className="mt-1 text-xs text-red-500">Campo obrigatório.</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-black">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: false }));
                    }}
                    className={`w-full rounded-full border px-5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#4FB8B0] ${formErrors.name ? "border-red-500" : "border-gray-300"}`}
                  />
                  {formErrors.name && <p className="mt-1 text-xs text-red-500">Campo obrigatório.</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-black">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => { 
                      setCpf(maskCPF(e.target.value)); 
                      setCpfError(""); 
                      if (formErrors.cpf) setFormErrors(prev => ({ ...prev, cpf: false }));
                    }}
                    placeholder="999.999.999-99"
                    className={`w-full rounded-full border bg-white px-5 py-2.5 text-xs text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4FB8B0] ${cpfError || formErrors.cpf ? "border-red-500" : "border-gray-300"}`}
                  />
                  {(cpfError || formErrors.cpf) && <p className="mt-1 text-xs text-red-500">{cpf.trim() === "" ? "Campo obrigatório." : (cpfError || "Campo obrigatório.")}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-black">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => { 
                      setPhone(maskPhone(e.target.value)); 
                      setPhoneError(""); 
                      if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: false }));
                    }}
                    placeholder="11 99999-9999"
                    className={`w-full rounded-full border bg-white px-5 py-2.5 text-xs text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4FB8B0] ${phoneError || formErrors.phone ? "border-red-500" : "border-gray-300"}`}
                  />
                  {(phoneError || formErrors.phone) && <p className="mt-1 text-xs text-red-500">{phone.trim() === "" ? "Campo obrigatório." : (phoneError || "Campo obrigatório.")}</p>}
                </div>
                {(() => {
                  const personalValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && name.trim() !== "" && isValidCPF(cpf) && isValidPhone(phone);
                  return (
                    <button
                      type="submit"
                      disabled={!personalValid}
                      className="mt-2 w-full rounded-full bg-[#4FB8B0] py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#3FA8A0] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#4FB8B0]"
                    >
                      Avançar para a entrega
                    </button>
                  );
                })()}
              </form>
            </div>
            )}

            {/* Resumo dos dados pessoais quando avança */}
            {step >= 3 && (
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <img src={iconUser} alt="" className="h-4 w-4"  loading="lazy"/>
                  <h3 className="text-sm font-bold text-[#1a4d6e]">Dados pessoais</h3>
                </div>
                <div className="mt-2 space-y-0.5 text-xs">
                  <p className="flex items-center justify-between text-foreground">
                    <span>{email}</span>
                    <button onClick={() => setStep(1)} className="text-[#2d9ed1] hover:underline">Não é você? Sair</button>
                  </p>
                  <p className="text-foreground"><span className="font-semibold">Nome:</span> {name}</p>
                  <p className="text-foreground"><span className="font-semibold">Telefone:</span> {phone}</p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 py-2 text-xs font-medium text-[#1a4d6e] hover:bg-gray-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Alterar meus dados
                </button>
              </div>
            )}



            {/* Step 2 - Address */}
            {step >= 3 && (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#1a4d6e]">
                <img src={iconDelivery} alt="" className="h-5 w-5"  loading="lazy"/>
                Entrega
              </h2>

              {step === 3 ? (
                <div className="mt-1 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-black">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#2d9ed1] ${cepError || formErrors.cep ? "border-red-500" : "border-gray-300"}`}
                    />
                    <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-block text-xs font-medium text-[#2d9ed1] hover:underline">
                      Não sei meu CEP
                    </a>
                    {cepLoading && <p className="mt-1 text-xs text-[#2d9ed1]">Buscando endereço...</p>}
                    {cepError && <p className="mt-1 text-xs text-red-500">{cepError}</p>}
                    {!cepError && formErrors.cep && <p className="mt-1 text-xs text-red-500">Campo obrigatório.</p>}
                  </div>


                  {cepValid && !addressEditing ? (
                    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-5 w-5 flex-shrink-0"><path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5z"/></svg>
                      <div className="text-sm leading-tight">
                        <p className="font-bold text-black">{street}</p>
                        <p className="text-gray-600">{neighborhood} - {city} - {state}{" "}</p>
                        <button type="button" onClick={() => setAddressEditing(true)} className="text-[#2d9ed1] hover:underline">Alterar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-black">
                          Endereço
                        </label>
                        <input
                          type="text"
                          value={street}
                          onChange={(e) => {
                            setStreet(e.target.value);
                            if (formErrors.street) setFormErrors(prev => ({ ...prev, street: false }));
                          }}
                          placeholder="Endereço"
                          className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2d9ed1] ${formErrors.street ? "border-red-500" : "border-gray-300"}`}
                        />
                        {formErrors.street && <p className="mt-1 text-xs text-red-500">Campo obrigatório.</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-black">
                          Bairro
                        </label>
                        <input
                          type="text"
                          value={neighborhood}
                          onChange={(e) => {
                            setNeighborhood(e.target.value);
                            if (formErrors.neighborhood) setFormErrors(prev => ({ ...prev, neighborhood: false }));
                          }}
                          className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2d9ed1] ${formErrors.neighborhood ? "border-red-500" : "border-gray-300"}`}
                        />
                        {formErrors.neighborhood && <p className="mt-1 text-xs text-red-500">Campo obrigatório.</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-black">Cidade</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            if (formErrors.city) setFormErrors(prev => ({ ...prev, city: false }));
                          }}
                          className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2d9ed1] ${formErrors.city ? "border-red-500" : "border-gray-300"}`}
                        />
                        {formErrors.city && <p className="mt-1 text-xs text-red-500">Campo obrigatório.</p>}
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-black">Estado</label>
                        <input
                          type="text"
                          value={state}
                          maxLength={2}
                          onChange={(e) => {
                            setState(e.target.value.toUpperCase());
                            if (formErrors.state) setFormErrors(prev => ({ ...prev, state: false }));
                          }}
                          className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm uppercase text-foreground focus:outline-none focus:ring-2 focus:ring-[#2d9ed1] ${formErrors.state ? "border-red-500" : "border-gray-300"}`}
                        />
                        {formErrors.state && <p className="mt-1 text-xs text-red-500">Campo obrigatório.</p>}
                      </div>
                    </>
                  )}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-black">
                      Número
                    </label>
                    <input
                      type="text"
                      value={number}
                      onChange={(e) => {
                        setNumber(e.target.value);
                        if (formErrors.number) setFormErrors(prev => ({ ...prev, number: false }));
                      }}
                      className={`w-full rounded-xl border bg-white px-4 py-3.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#2d9ed1] ${formErrors.number ? "border-red-500" : "border-gray-300"}`}
                    />
                    {formErrors.number && <p className="mt-1 text-xs text-red-500">Campo obrigatório.</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-black">Complemento e referência</label>
                    <input
                      type="text"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      placeholder="Complemento"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm text-foreground placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2d9ed1]"
                    />
                  </div>


                  {isValidCEP(cep) && cepValid && (city || cartShippingOptions?.city) && (() => {
                    const cityName = city || cartShippingOptions?.city?.split("/")[0] || "";
                    const isDrogal = cartShippingOptions?.isDrogal ?? isDrogalCity(cityName);
                    const options = isDrogal
                      ? [
                          { id: "economica", title: "Econômica", subtitle: "6 Horas", price: "R$ 4,90" },
                          { id: "expressa", title: "Expressa", subtitle: "3 Horas", price: "R$ 6,90" },
                        ]
                      : [
                          { id: "correios", title: "Correios", subtitle: "2 a 4 dias úteis", price: "Grátis" },
                        ];
                    return (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-black">Selecione a forma de entrega</p>
                        <div className="rounded-xl bg-[#f7f7f7] p-2">
                          {options.map((opt, idx) => {
                            const selected = cartShippingMethod === opt.id;
                            return (
                              <button
                                type="button"
                                key={opt.id}
                                onClick={() => setCartShippingMethod(opt.id)}
                                className={`flex w-full items-center gap-3 bg-transparent px-2 py-3 text-left ${idx > 0 ? "border-t border-gray-200" : ""}`}
                              >
                                <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-[#29ABE2]" : "border-gray-300"}`}>
                                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#29ABE2]" />}
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-foreground">{opt.title}</p>
                                  <p className="text-xs text-muted-foreground">{opt.subtitle}</p>
                                </div>
                                <span className={`text-sm font-bold ${opt.price === "Grátis" ? "text-green-600" : "text-foreground"}`}>{opt.price}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}


                  {(() => {
                    const addressValid = isValidCEP(cep) && cepValid && street.trim() !== "" && number.trim() !== "" && neighborhood.trim() !== "" && city.trim() !== "" && state.trim() !== "" && !!cartShippingMethod;
                    return (
                      <button
                        onClick={handleAddressContinue}
                        disabled={!addressValid}
                        className="w-full rounded-full bg-[#4FB8B0] py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#3FA8A0] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#4FB8B0]"
                      >
                        Avançar para o pagamento
                      </button>
                    );
                  })()}
                </div>
              ) : (() => {
                const allOpts = [
                  { id: "correios", title: "Correios", subtitle: "2 a 4 dias úteis", price: "Grátis" },
                  { id: "economica", title: "Econômica", subtitle: "Em até 6 Horas", price: "R$ 4,90" },
                  { id: "expressa", title: "Expressa", subtitle: "Em até 3 Horas", price: "R$ 6,90" },
                ];
                const sel = allOpts.find(o => o.id === cartShippingMethod) || allOpts[0];
                return (
                  <div className="mt-2">
                    <div className="flex items-stretch gap-4">
                      <div className="flex-1 space-y-0.5 text-xs text-foreground">
                        <p className="font-semibold uppercase">Receber</p>
                        <p>{street}{number ? `, ${number}` : ""}</p>
                        <p>{neighborhood} - {city} - {state}</p>
                        <p>{cep}</p>
                        <p>Brasil</p>
                        <p>{sel.subtitle}</p>
                      </div>
                      <div className="flex items-center border-l border-gray-200 pl-4">
                        <span className={`text-sm font-semibold ${sel.price === "Grátis" ? "text-green-600" : "text-foreground"}`}>{sel.price}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setStep(3)}
                      className="mt-4 w-full rounded-xl bg-[#eef7fc] py-3 text-xs font-semibold text-[#2d9ed1] hover:bg-[#e1f0fa]"
                    >
                      Alterar opções de entrega
                    </button>
                  </div>
                );
              })()}
            </div>
            )}

            {/* Step 3 - Payment */}
            {step >= 4 && (
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#1a4d6e]">
                <img src={iconPayment} alt="" className="h-5 w-5"  loading="lazy"/>
                Pagamento
              </h2>

              <div className="mt-2 space-y-4">
                  {/* Pix only - selected */}
                  <div className="overflow-hidden rounded-xl border-2 border-[#2d9ed1]">
                    <div className="flex items-center gap-2 bg-[#eef7fc] px-4 py-2.5">
                      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#2d9ed1]">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#2d9ed1]" />
                      </span>
                      <span className="text-sm font-semibold text-[#2d9ed1]">Pix</span>
                    </div>
                    <div className="flex flex-col items-center gap-4 bg-white px-4 py-6">
                      <img src="/products/payment-pix-head_96b8dd83.svg" alt="Pix" className="h-10"  loading="lazy"/>
                      {/* Mobile: mensagem simples */}
                      <div className="lg:hidden flex flex-col items-center gap-4">
                        <p className="text-center text-xs font-bold whitespace-nowrap text-foreground">
                          Para pagar, finalize sua compra abaixo
                        </p>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted-foreground"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                      </div>
                      {/* Desktop: passos 1 e 2 */}
                      <div className="hidden lg:flex w-full max-w-md items-start justify-center gap-4 pt-2">
                        <div className="flex flex-1 flex-col items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#2d9ed1] text-sm font-bold text-[#2d9ed1]">1</span>
                          <p className="text-center text-xs font-bold text-foreground leading-snug">
                            Aperte em Finalizar compra para gerar o código QR
                          </p>
                        </div>
                        <div className="mt-4 h-px flex-1 border-t-2 border-dashed border-[#2d9ed1]" />
                        <div className="flex flex-1 flex-col items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#2d9ed1] text-sm font-bold text-[#2d9ed1]">2</span>
                          <p className="text-center text-xs font-bold text-foreground leading-snug">
                            Confira os dados e realize o pagamento pelo app do seu banco
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Mobile: botão fixo no rodapé */}
                  <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
                    <button
                      onClick={handleFinalizarPedido}
                      disabled={isProcessing}
                      className="w-full bg-[#4ab9a5] py-4 text-lg text-white transition-colors hover:bg-[#3FA8A0] disabled:opacity-50"
                    >
                      Finalizar Compra
                    </button>
                  </div>
              </div>
            </div>
            )}

          </div>

          {/* Mobile: Resumo do pedido sempre aberto abaixo do conteúdo */}
          {step !== 0 && (
            <div className="lg:hidden">
              <CartSummary
                items={items}
                totalItems={totalItems}
                totalPrice={totalPrice}
                pixDiscount={pixDiscount}
                pixTotal={pixTotal}
                cartOpen={true}
                setCartOpen={() => {}}
                updateQuantity={updateQuantity}
                removeItem={removeItem}
                alwaysOpen={true}
              />
            </div>
          )}

          {/* Desktop: trust badges below cart on right col - handled inside CartSummary on mobile */}
        </div>

        {/* Trust badges - full width */}
        <div className="mt-6 space-y-3">
          <TrustBadges />
        </div>
      </main>

      {/* Rodapé legal do checkout */}
      <footer className="mt-8 bg-header py-6">
        <div className="mx-auto max-w-7xl px-4">
          <p className="text-[11px] leading-relaxed text-gray-400 text-center">
            Tendência Cosméticos | CNPJ: 22.556.253/0002-60
          </p>
        </div>
      </footer>
    </div>
  );
};

/* Cart Summary */
const CartSummary = ({
  items,
  totalItems,
  totalPrice,
  pixDiscount,
  pixTotal,
  cartOpen,
  setCartOpen,
  updateQuantity,
  removeItem,
  alwaysOpen = false,
  onFinalizar,
  isProcessing = false,
}: {
  items: ReturnType<typeof useCart>["items"];
  totalItems: number;
  totalPrice: number;
  pixDiscount: number;
  pixTotal: number;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  updateQuantity: (id: string, q: number, v?: string) => void;
  removeItem: (id: string, v?: string) => void;
  alwaysOpen?: boolean;
  onFinalizar?: () => void;
  isProcessing?: boolean;
}) => (
  <div className="rounded-2xl bg-white p-5 shadow-sm">
    {alwaysOpen ? (
      <div className="mb-5 flex items-center gap-2">
        <img src={iconSummary} alt="" className="h-[17px] w-auto"  loading="lazy"/>
        <span className="text-base font-bold text-[#1a4d6e]">Resumo do pedido</span>
      </div>
    ) : (
      <button
        onClick={() => setCartOpen(!cartOpen)}
        className="flex w-full items-center justify-between"
      >
        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold text-foreground uppercase tracking-wide">Resumo do pedido</span>
          <span className="text-xs text-muted-foreground">
            {totalItems} {totalItems === 1 ? "item" : "itens"} · <span className="font-semibold text-foreground">{formatPrice(pixTotal)}</span>
          </span>
        </div>
        {cartOpen ? <ChevronUp className="h-5 w-5 text-[#29ABE2]" /> : <ChevronDown className="h-5 w-5 text-[#29ABE2]" />}
      </button>
    )}

    {(alwaysOpen || cartOpen) && (
      <div className={`space-y-4 ${alwaysOpen ? "" : "mt-5"}`}>
        {items.map((item) => (
          <div key={`${item.product.id}__${item.variant || ""}`} className="space-y-1">
            <div className="flex gap-3">
              <div className="relative flex h-[56px] w-[56px] flex-shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#f59e0b] text-[10px] font-bold text-white">
                  {item.quantity}
                </span>
                <img src={item.product.image} alt={item.product.name} className="h-full w-full object-contain"  loading="lazy"/>
              </div>
              <p className="flex-1 text-xs text-foreground leading-snug">{item.product.name}</p>
            </div>
            <p className="text-xs font-semibold text-foreground">{formatPrice(item.product.price)} Un.</p>
          </div>
        ))}

        <hr className="border-gray-200" />

        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-black">Subtotal</span>
            <span className="font-semibold text-black">{formatPrice(totalPrice)}</span>
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#2d9ed1]">Total</span>
            <span className="text-base font-bold text-[#2d9ed1]">{formatPrice(pixTotal)}</span>
          </div>
        </div>

        {onFinalizar && (
          <button
            onClick={onFinalizar}
            disabled={isProcessing}
            className="mt-2 w-full rounded-full bg-[#4ab9a5] py-3.5 text-base text-white shadow-sm transition-colors hover:bg-[#3FA8A0] disabled:opacity-50"
          >
            Finalizar Compra
          </button>
        )}
      </div>
    )}
  </div>
);

/* Trust Badges */
const TrustBadges = () => (
  <div className="space-y-3">
    {/* Compre com confiança */}
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-center gap-1.5 pb-3">
        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-600" />
        <p className="whitespace-nowrap text-[11px] font-medium text-foreground">
          Garantia de Devolução do Dinheiro em <span className="font-bold">14 dias</span>
        </p>
      </div>
      <hr className="border-gray-200" />
      <p className="mt-4 text-xs font-bold text-foreground">Compre com confiança!</p>
      <ul className="mt-2 space-y-1 text-xs text-foreground">
        {[
          "Garantia de Devolução de 100% do Dinheiro",
          "Devoluções Sem Complicações",
          "Transações Seguras",
          "Atendimento ao Cliente 24/7",
        ].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <Check className="h-4 w-4 flex-shrink-0 text-green-600" strokeWidth={3} />
            <span>{t}</span>
          </li>
        ))}
      </ul>
      <hr className="my-4 border-gray-200" />
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-foreground">5000+ Avaliações de Clientes</p>
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <span className="text-xs font-bold text-foreground">5/5</span>
        </div>
      </div>
      <p className="mt-2 text-xs italic text-muted-foreground">
        "Fiquei encantada com o atendimento! A entrega foi rápida e o processo de compra, super fácil. Recomendo a todos!"
      </p>
      <p className="mt-1 text-xs font-semibold text-foreground">— Isabela Marcondes</p>
    </div>

  </div>
);

/* Checkout Footer */
const CheckoutFooter = () => (
  <div className="rounded-2xl bg-white p-5 pt-4 text-center shadow-sm">
    <p className="text-xs text-gray-500">Tendência Cosméticos</p>
    <p className="text-xs text-gray-500">CNPJ: 22.556.253/0002-60</p>
    <div className="mt-4 flex items-center justify-center gap-6">
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="h-5 w-5 text-foreground" />
        <div className="text-left">
          <p className="text-[10px] font-bold text-foreground uppercase">Seguro</p>
          <p className="text-[9px] text-muted-foreground uppercase">Certificado SSL</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Lock className="h-5 w-5 text-foreground" />
        <div className="text-left">
          <p className="text-[10px] font-bold text-foreground uppercase">Pagamentos</p>
          <p className="text-[9px] text-muted-foreground uppercase">Seguros</p>
        </div>
      </div>
    </div>
  </div>
);

/* Cart Step (matches Growth screenshots) */
const CartStep = ({
  items,
  totalItems,
  totalPrice,
  pixTotal,
  cartCep,
  setCartCep,
  cartCepLoading,
  cartCepError,
  cartShippingOptions,
  cartShippingMethod,
  setCartShippingMethod,
  onCalcCep,
  coupon,
  setCoupon,
  updateQuantity,
  removeItem,
  onAvancar,
}: {
  items: ReturnType<typeof useCart>["items"];
  totalItems: number;
  totalPrice: number;
  pixTotal: number;
  cartCep: string;
  setCartCep: (v: string) => void;
  cartCepLoading: boolean;
  cartCepError: string;
  cartShippingOptions: null | { city: string; isDrogal: boolean };
  cartShippingMethod: string;
  setCartShippingMethod: (v: string) => void;
  onCalcCep: () => void;
  coupon: string;
  setCoupon: (v: string) => void;
  updateQuantity: (id: string, q: number, v?: string) => void;
  removeItem: (id: string, v?: string) => void;
  onAvancar: () => void;
}) => (

  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
    {/* Left column: Carrinho card + Calcular Frete */}
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <img src={cartBlueIcon} alt="" className="h-5 w-5"  loading="lazy"/>
          <h2 className="text-sm font-bold text-[#447097]">Carrinho</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {items.map((item) => (
            <div
              key={`${item.product.id}__${item.variant || ""}`}
              className="py-4 first:pt-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#f7f7f7] p-1.5">
                  <img src={item.product.image} alt={item.product.name} className="h-full w-full object-contain"  loading="lazy"/>
                </div>
                <p className="flex-1 text-sm font-semibold text-foreground leading-snug">
                  {item.product.name}
                </p>
                <div className="hidden sm:flex items-center rounded-full border border-gray-200">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant)}
                    className="flex h-7 w-7 items-center justify-center text-foreground hover:bg-gray-50 rounded-l-full"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="flex h-7 w-8 items-center justify-center text-sm font-semibold text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant)}
                    className="flex h-7 w-7 items-center justify-center text-foreground hover:bg-gray-50 rounded-r-full"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="hidden sm:inline text-sm font-bold text-foreground whitespace-nowrap">{formatPrice(item.product.price * item.quantity)}</span>
                <button
                  onClick={() => removeItem(item.product.id, item.variant)}
                  aria-label="Remover"
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile-only second row: qty + price */}
              <div className="mt-3 flex items-center gap-3 pl-[60px] sm:hidden">
                <div className="flex items-center rounded-full border border-gray-200">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant)}
                    className="flex h-7 w-7 items-center justify-center text-foreground hover:bg-gray-50 rounded-l-full"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="flex h-7 w-8 items-center justify-center text-sm font-semibold text-foreground">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant)}
                    className="flex h-7 w-7 items-center justify-center text-foreground hover:bg-gray-50 rounded-r-full"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-sm font-bold text-foreground whitespace-nowrap">{formatPrice(item.product.price * item.quantity)}</span>
              </div>
            </div>

          ))}
        </div>

      </div>

    </div>

    {/* Right column: Cupom + totais + Avançar */}
    <div className="space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="space-y-2">

          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">Subtotal</span>
            <span className="font-semibold text-foreground">{formatPrice(totalPrice)}</span>
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-foreground">Total</span>
            <span className="text-lg font-bold text-[#29ABE2]">{formatPrice(pixTotal)}</span>
          </div>
        </div>

        <button
          onClick={onAvancar}
          className="mt-5 w-full rounded-full bg-[#3CC8B4] py-3.5 text-base font-bold text-white shadow-md transition-colors hover:bg-[#34b3a1]"
        >
          Avançar
        </button>
      </div>
    </div>
  </div>
);

export default CheckoutPage;
