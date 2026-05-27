import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import {
  LogOut, DollarSign, Clock, CheckCircle2, ShoppingBag, AlertTriangle,
  Package, Trophy, LayoutDashboard, CreditCard, ListOrdered, Truck, Loader2,
  Ban, ShieldOff, Trash2, Shield,
} from "lucide-react";
import { clearLogoProtectionCache } from "@/hooks/useLogoProtectionSetting";

import AdminProductsTab from "@/components/admin/AdminProductsTab";
import TopProductsTab from "@/components/admin/TopProductsTab";
import ProofViewer from "@/components/ProofViewer";

interface Order {
  id: string;
  transaction_id: string;
  gateway: string;
  status: string;
  amount_cents: number;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_ip?: string | null;
  created_at: string;
  paid_at: string | null;
  proof_url?: string | null;
  items?: any;
  track7_sent_at?: string | null;
}


type Section = "dashboard" | "gateway" | "top" | "products" | "orders" | "blocked" | "logo";

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const NAV: { id: Section; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "gateway", label: "Gateway", icon: CreditCard },
  { id: "top", label: "Top vendidos", icon: Trophy },
  { id: "products", label: "Produtos", icon: Package },
  { id: "orders", label: "Pedidos", icon: ListOrdered },
  { id: "blocked", label: "IPs bloqueados", icon: Ban },
  { id: "logo", label: "Configurações de Logo", icon: Shield },
];


function AdminSidebar({
  section, setSection, onLogout,
}: { section: Section; setSection: (s: Section) => void; onLogout: () => void }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Painel Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={section === item.id}
                    onClick={() => setSection(item.id)}
                    className="cursor-pointer"
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onLogout} className="cursor-pointer">
                  <LogOut className="h-4 w-4" />
                  {!collapsed && <span>Sair</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [gateway, setGateway] = useState<string>("freepay");
  const [savingGateway, setSavingGateway] = useState(false);
  const [section, setSection] = useState<Section>("dashboard");
  const [track7Auto, setTrack7Auto] = useState<{ enabled: boolean; enabled_at: string | null }>({ enabled: false, enabled_at: null });
  const [savingTrack7Auto, setSavingTrack7Auto] = useState(false);
  const [blockedIps, setBlockedIps] = useState<{ id: string; ip: string; reason: string | null; created_at: string }[]>([]);
  const [newBlockIp, setNewBlockIp] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");
  const [logoProtection, setLogoProtection] = useState<boolean>(true);
  const [logoProtectionUpdatedAt, setLogoProtectionUpdatedAt] = useState<string | null>(null);
  const [savingLogoProtection, setSavingLogoProtection] = useState(false);
  const [logoAutoMode, setLogoAutoMode] = useState<boolean>(false);
  const [logoAutoIntervalOn, setLogoAutoIntervalOn] = useState<number>(60);
  const [logoAutoIntervalOff, setLogoAutoIntervalOff] = useState<number>(60);
  const [logoAutoUnitOn, setLogoAutoUnitOn] = useState<"s" | "m">("s");
  const [logoAutoUnitOff, setLogoAutoUnitOff] = useState<"s" | "m">("s");
  const [savingLogoAuto, setSavingLogoAuto] = useState(false);
  const [nowTick, setNowTick] = useState<number>(Date.now());

  const refreshLogoSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value, updated_at")
      .in("key", ["logo_protection_enabled", "logo_auto_mode", "logo_auto_interval_on", "logo_auto_interval_off"]);
    if (!data) return;
    for (const row of data as any[]) {
      if (row.key === "logo_protection_enabled") {
        setLogoProtection(row.value === "true");
        setLogoProtectionUpdatedAt(row.updated_at);
      } else if (row.key === "logo_auto_mode") {
        setLogoAutoMode(row.value === "true");
      } else if (row.key === "logo_auto_interval_on") {
        const sec = parseInt(row.value, 10) || 60;
        if (sec % 60 === 0 && sec >= 60) {
          setLogoAutoIntervalOn(sec / 60);
          setLogoAutoUnitOn("m");
        } else {
          setLogoAutoIntervalOn(sec);
          setLogoAutoUnitOn("s");
        }
      } else if (row.key === "logo_auto_interval_off") {
        const sec = parseInt(row.value, 10) || 60;
        if (sec % 60 === 0 && sec >= 60) {
          setLogoAutoIntervalOff(sec / 60);
          setLogoAutoUnitOff("m");
        } else {
          setLogoAutoIntervalOff(sec);
          setLogoAutoUnitOff("s");
        }
      }
    }
  };

  useEffect(() => {
    refreshLogoSettings();
  }, []);

  // Tick + periodic refresh while auto mode is active, so the countdown reflects
  // updates made by the cron job.
  useEffect(() => {
    if (!logoAutoMode) return;
    const tick = setInterval(() => setNowTick(Date.now()), 1000);
    const poll = setInterval(() => {
      refreshLogoSettings();
    }, 5000);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [logoAutoMode]);

  const toggleLogoProtection = async (next: boolean) => {
    setSavingLogoProtection(true);
    const { data, error } = await supabase
      .from("site_settings")
      .update({ value: next ? "true" : "false", updated_at: new Date().toISOString() })
      .eq("key", "logo_protection_enabled")
      .select("value, updated_at")
      .maybeSingle();
    setSavingLogoProtection(false);
    if (error) {
      toast.error("Erro ao salvar configuração");
      return;
    }
    setLogoProtection(data?.value === "true");
    setLogoProtectionUpdatedAt(data?.updated_at ?? new Date().toISOString());
    clearLogoProtectionCache();
    toast.success(next ? "Proteção de logo ativada" : "Proteção de logo desativada");
  };

  const saveLogoAutoSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from("site_settings")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return false;
    }
    return true;
  };

  const toggleLogoAutoMode = async (next: boolean) => {
    setSavingLogoAuto(true);
    const ok = await saveLogoAutoSetting("logo_auto_mode", next ? "true" : "false");
    setSavingLogoAuto(false);
    if (!ok) return;
    setLogoAutoMode(next);
    clearLogoProtectionCache();
    toast.success(next ? "Modo automático ativado" : "Modo automático desativado");
  };

  const saveAutoIntervalOn = async (val: number, unit: "s" | "m") => {
    const seconds = Math.max(1, Math.floor(val)) * (unit === "m" ? 60 : 1);
    setLogoAutoIntervalOn(val);
    setLogoAutoUnitOn(unit);
    await saveLogoAutoSetting("logo_auto_interval_on", String(seconds));
  };

  const saveAutoIntervalOff = async (val: number, unit: "s" | "m") => {
    const seconds = Math.max(1, Math.floor(val)) * (unit === "m" ? 60 : 1);
    setLogoAutoIntervalOff(val);
    setLogoAutoUnitOff(unit);
    await saveLogoAutoSetting("logo_auto_interval_off", String(seconds));
  };

  const logoAutoIntervalOnSec = Math.max(1, Math.floor(logoAutoIntervalOn)) * (logoAutoUnitOn === "m" ? 60 : 1);
  const logoAutoIntervalOffSec = Math.max(1, Math.floor(logoAutoIntervalOff)) * (logoAutoUnitOff === "m" ? 60 : 1);
  const currentThresholdSec = logoProtection ? logoAutoIntervalOnSec : logoAutoIntervalOffSec;
  const elapsedSec = logoProtectionUpdatedAt
    ? Math.floor((nowTick - new Date(logoProtectionUpdatedAt).getTime()) / 1000)
    : 0;
  const remainingSec = Math.max(0, currentThresholdSec - elapsedSec);



  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login", { replace: true });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      const admin = (roles || []).some((r: any) => r.role === "admin");
      setIsAdmin(admin);
      if (!admin) {
        setLoading(false);
        return;
      }
      await Promise.all([loadOrders(), loadGateway(), loadTrack7Auto(), loadBlockedIps()]);
      setLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/admin/login", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error("Erro ao carregar pedidos");
      return;
    }
    setOrders(data || []);
  };

  const loadGateway = async () => {
    const { data } = await supabase
      .from("app_settings").select("value").eq("key", "active_gateway").maybeSingle();
    if (data?.value) setGateway(String(data.value).replace(/"/g, ""));
  };

  const loadTrack7Auto = async () => {
    const { data } = await supabase
      .from("app_settings").select("value").eq("key", "track7_auto_send").maybeSingle();
    const v: any = data?.value;
    if (v && typeof v === "object") {
      setTrack7Auto({ enabled: !!v.enabled, enabled_at: v.enabled_at || null });
    }
  };

  const toggleTrack7Auto = async (enabled: boolean) => {
    setSavingTrack7Auto(true);
    const value = enabled
      ? { enabled: true, enabled_at: track7Auto.enabled_at || new Date().toISOString() }
      : { enabled: false, enabled_at: track7Auto.enabled_at };
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "track7_auto_send", value: value as any, updated_at: new Date().toISOString() });
    setSavingTrack7Auto(false);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    setTrack7Auto(value);
    toast.success(enabled ? "Envio automático Track7 ativado" : "Envio automático Track7 desativado");
  };

  const loadBlockedIps = async () => {
    const { data } = await (supabase as any)
      .from("blocked_ips").select("*").order("created_at", { ascending: false });
    setBlockedIps(data || []);
  };

  const blockIp = async (ip: string, reason?: string) => {
    const clean = (ip || "").trim();
    if (!clean) {
      toast.error("Informe um IP");
      return;
    }
    const { error } = await (supabase as any)
      .from("blocked_ips")
      .insert({ ip: clean, reason: reason?.trim() || null });
    if (error) {
      if (String(error.message).includes("duplicate")) toast.info("IP já está bloqueado");
      else toast.error("Erro: " + error.message);
      return;
    }
    toast.success(`IP ${clean} bloqueado`);
    setNewBlockIp("");
    setNewBlockReason("");
    await loadBlockedIps();
  };

  const unblockIp = async (id: string) => {
    const { error } = await (supabase as any).from("blocked_ips").delete().eq("id", id);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success("IP desbloqueado");
    await loadBlockedIps();
  };



  const updateGateway = async (newGateway: string) => {
    setSavingGateway(true);
    const { error } = await supabase
      .from("app_settings")
      .upsert({ key: "active_gateway", value: newGateway as any, updated_at: new Date().toISOString() });
    setSavingGateway(false);
    if (error) {
      toast.error("Erro ao salvar gateway: " + error.message);
      return;
    }
    setGateway(newGateway);
    toast.success(`Gateway alterado para ${newGateway}`);
  };


  const markAsPaid = async (id: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Pedido marcado como pago");
    loadOrders();
  };

  const [sendingTrack7, setSendingTrack7] = useState<Record<string, boolean>>({});
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkDay, setBulkDay] = useState<string>("all");
  const [selectedPaidDay, setSelectedPaidDay] = useState<string>("all");

  const sendToTrack7 = async (orderId: string) => {
    setSendingTrack7((p) => ({ ...p, [orderId]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("send-track7-order", {
        body: { orderId },
      });
      if (error) throw error;
      if (data?.ok) {
        toast.success("Pedido enviado para Track7");
        await loadOrders();
      } else {
        const msg = data?.response?.message || data?.response?.error || `HTTP ${data?.status}`;
        toast.error("Track7: " + msg);
      }
    } catch (e: any) {
      toast.error("Erro Track7: " + (e?.message || String(e)));
    } finally {
      setSendingTrack7((p) => ({ ...p, [orderId]: false }));
    }
  };

  const sendAllToTrack7 = async (dayStart?: string, dayEnd?: string) => {
    setBulkSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-track7-order", {
        body: { bulk: true, dayStart, dayEnd },
      });
      if (error) throw error;
      if (data?.total === 0) {
        toast.info("Nenhum pedido pago pendente de envio");
      } else {
        toast.success(`Track7: ${data?.success || 0} enviados, ${data?.failed || 0} falharam (${data?.total} no total)`);
      }
      await loadOrders();
    } catch (e: any) {
      toast.error("Erro Track7: " + (e?.message || String(e)));
    } finally {
      setBulkSending(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Acesso negado</h2>
          <p className="text-muted-foreground mb-4">Sua conta não é administrador.</p>
          <Button onClick={handleLogout} variant="outline">Sair</Button>
        </Card>
      </div>
    );
  }

  // Pedidos que são apenas ajustes internos (taxa/valor) não devem aparecer
  const ADJUSTMENT_PATTERNS = [/ajuste de valor do pedido/i, /ajuste de taxa de envio/i, /taxa de envio/i, /correios/i];
  const isAdjustmentOnly = (o: Order) => {
    const items = Array.isArray(o.items) ? o.items : [];
    if (items.length === 0) return false;
    return items.every((it: any) => {
      const name = String(it?.name || it?.title || it?.product_name || "").trim();
      return name && ADJUSTMENT_PATTERNS.some((re) => re.test(name));
    });
  };
  const paid = orders.filter((o) => o.status === "paid" && !isAdjustmentOnly(o));
  const pending = orders.filter((o) => o.status === "pending");
  const desvios = orders.filter((o) => o.status === "pending" && !!o.proof_url);
  const totalPaid = paid.reduce((s, o) => s + o.amount_cents, 0);
  const totalPending = pending.reduce((s, o) => s + o.amount_cents, 0);

  // Group orders by local day (YYYY-MM-DD) for the dashboard breakdown
  const dayKey = (iso: string) => {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const byDay = new Map<
    string,
    { total: number; paidQty: number; paidAmt: number; pendingQty: number; pendingAmt: number }
  >();
  for (const o of orders) {
    const k = dayKey(o.created_at);
    const entry =
      byDay.get(k) || { total: 0, paidQty: 0, paidAmt: 0, pendingQty: 0, pendingAmt: 0 };
    entry.total += 1;
    if (o.status === "paid") {
      entry.paidQty += 1;
      entry.paidAmt += o.amount_cents;
    } else if (o.status === "pending") {
      entry.pendingQty += 1;
      entry.pendingAmt += o.amount_cents;
    }
    byDay.set(k, entry);
  }
  const days = Array.from(byDay.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));


  const renderTable = (rows: Order[], showMarkPaid = false, showTrack7 = false) => {
    const extraCols = (showMarkPaid ? 1 : 0) + (showTrack7 ? 1 : 0);
    return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>Produtos</TableHead>
            <TableHead>Gateway</TableHead>

            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Comprovante</TableHead>
            {showMarkPaid && <TableHead>Ação</TableHead>}
            {showTrack7 && <TableHead>Track7</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10 + extraCols} className="text-center text-muted-foreground py-8">
                Nenhum pedido
              </TableCell>
            </TableRow>
          ) : rows.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="whitespace-nowrap text-xs">
                {new Date(o.created_at).toLocaleString("pt-BR")}
              </TableCell>
              <TableCell>{o.customer_name || "-"}</TableCell>
              <TableCell className="text-xs">{o.customer_email || "-"}</TableCell>
              <TableCell className="text-xs whitespace-nowrap">{o.customer_phone || "-"}</TableCell>
              <TableCell className="text-xs whitespace-nowrap font-mono">
                {o.customer_ip ? (
                  <div className="flex items-center gap-1">
                    <span>{o.customer_ip}</span>
                    {blockedIps.some((b) => b.ip === o.customer_ip) ? (
                      <Badge variant="destructive" className="text-[10px]">Bloqueado</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1 text-destructive hover:text-destructive"
                        title="Bloquear este IP"
                        onClick={() => blockIp(o.customer_ip!, `Pedido ${o.transaction_id}`)}
                      >
                        <Ban className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ) : "-"}
              </TableCell>


              <TableCell className="text-xs max-w-[260px]">
                {(() => {
                  const excluded = [/ajuste de valor do pedido/i, /ajuste de taxa de envio/i, /taxa de envio/i, /correios/i];
                  const items = Array.isArray(o.items)
                    ? o.items.filter((it: any) => {
                        const name = String(it?.name || it?.title || it?.product_name || "").trim();
                        return !name || !excluded.some((re) => re.test(name));
                      })
                    : [];
                  return items.length > 0 ? (
                    <ul className="space-y-0.5">
                      {items.map((it: any, i: number) => (
                        <li key={i} className="truncate">
                          {(it.quantity || it.qty || 1)}× {it.name || it.title || it.product_name || it.id || "Produto"}
                          {it.variant ? ` (${it.variant})` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  );
                })()}
              </TableCell>
              <TableCell><Badge variant="outline">{o.gateway}</Badge></TableCell>
              <TableCell className="font-medium">{formatBRL(o.amount_cents)}</TableCell>
              <TableCell>
                {o.status === "paid" ? (
                  <Badge variant="default">Pago</Badge>
                ) : o.proof_url ? (
                  <Badge className="bg-red-600 hover:bg-red-700 text-white gap-1">
                    <AlertTriangle className="w-3 h-3" /> Desvio de pagamento
                  </Badge>
                ) : (
                  <Badge variant="secondary">Pendente</Badge>
                )}
              </TableCell>
              <TableCell>
                {o.proof_url ? (
                  <ProofViewer url={o.proof_url} />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              {showMarkPaid && (
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => markAsPaid(o.id)}>
                    Marcar pago
                  </Button>
                </TableCell>
              )}
              {showTrack7 && (
                <TableCell>
                  {o.track7_sent_at ? (
                    <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
                      <CheckCircle2 className="w-3 h-3" /> Enviado
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendToTrack7(o.id)}
                      disabled={!!sendingTrack7[o.id] || o.status !== "paid"}
                      className="gap-1"
                    >
                      {sendingTrack7[o.id] ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Truck className="w-3 h-3" />
                      )}
                      Enviar Track7
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    );
  };

  const sectionTitle = NAV.find((n) => n.id === section)?.label || "";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AdminSidebar section={section} setSection={setSection} onLogout={handleLogout} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 bg-background border-b flex items-center px-4 gap-3 sticky top-0 z-10">
            <SidebarTrigger />
            <h1 className="text-lg font-bold">{sectionTitle}</h1>
          </header>

          <main className="flex-1 p-4 md:p-6 space-y-6">
            {section === "dashboard" && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <ShoppingBag className="w-4 h-4" /> Total pedidos
                    </div>
                    <div className="text-2xl font-bold">{orders.length}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" /> Pagos
                    </div>
                    <div className="text-2xl font-bold">{paid.length}</div>
                    <div className="text-xs text-muted-foreground">{formatBRL(totalPaid)}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <Clock className="w-4 h-4 text-yellow-600" /> Pendentes
                    </div>
                    <div className="text-2xl font-bold">{pending.length}</div>
                    <div className="text-xs text-muted-foreground">{formatBRL(totalPending)}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <DollarSign className="w-4 h-4" /> Conversão
                    </div>
                    <div className="text-2xl font-bold">
                      {orders.length > 0 ? ((paid.length / orders.length) * 100).toFixed(1) : "0"}%
                    </div>
                  </Card>
                </div>

                {desvios.length > 0 && (
                  <Card className="p-4 border-red-300 bg-red-50">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-red-700">
                          {desvios.length} pedido(s) com possível desvio de pagamento
                        </h3>
                        <p className="text-sm text-red-700/80">
                          Cliente enviou comprovante mas o gateway não confirmou — abra a aba Pedidos › Desvios.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                <Card className="p-4">
                  <h2 className="mb-3 font-semibold">Resumo por dia</h2>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Dia</TableHead>
                          <TableHead className="text-right">Pedidos</TableHead>
                          <TableHead className="text-right">Pagos</TableHead>
                          <TableHead className="text-right">R$ Pagos</TableHead>
                          <TableHead className="text-right">Pendentes</TableHead>
                          <TableHead className="text-right">R$ Pendentes</TableHead>
                          <TableHead className="text-right">Conversão</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {days.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                              Sem pedidos
                            </TableCell>
                          </TableRow>
                        ) : days.map(([day, s]) => {
                          const [y, m, d] = day.split("-");
                          const label = `${d}/${m}/${y}`;
                          const conv = s.total > 0 ? ((s.paidQty / s.total) * 100).toFixed(1) : "0";
                          return (
                            <TableRow key={day}>
                              <TableCell className="font-medium">{label}</TableCell>
                              <TableCell className="text-right">{s.total}</TableCell>
                              <TableCell className="text-right text-green-700">{s.paidQty}</TableCell>
                              <TableCell className="text-right">{formatBRL(s.paidAmt)}</TableCell>
                              <TableCell className="text-right text-yellow-700">{s.pendingQty}</TableCell>
                              <TableCell className="text-right">{formatBRL(s.pendingAmt)}</TableCell>
                              <TableCell className="text-right font-medium">{conv}%</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </>
            )}


            {section === "gateway" && (
              <Card className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">Gateway de pagamento ativo</h2>
                    <p className="text-sm text-muted-foreground">Gateway usado para gerar PIX no checkout.</p>
                  </div>
                  <Select value={gateway} onValueChange={updateGateway} disabled={savingGateway}>
                    <SelectTrigger className="w-full md:w-[220px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freepay">FreePay</SelectItem>
                      <SelectItem value="blackcat">BlackCat</SelectItem>
                      <SelectItem value="ironpay">IronPay</SelectItem>
                      <SelectItem value="skalepay">Skale Pay</SelectItem>
                      <SelectItem value="avenpayments">Aven Payments</SelectItem>
                      <SelectItem value="klivopay">KlivoPay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            )}

            {section === "gateway" && (
              <Card className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">Envio automático para Track7</h2>
                    <p className="text-sm text-muted-foreground">
                      Quando ativado, todo pedido pago a partir deste momento é enviado automaticamente para a Track7. Pedidos anteriores não são afetados.
                    </p>
                    {track7Auto.enabled && track7Auto.enabled_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Ativado desde {new Date(track7Auto.enabled_at).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={track7Auto.enabled}
                    disabled={savingTrack7Auto}
                    onCheckedChange={toggleTrack7Auto}
                  />
                </div>
              </Card>
            )}




            {section === "top" && (
              <Card className="p-4">
                <h2 className="mb-3 flex items-center gap-2 font-semibold">
                  <Trophy className="h-4 w-4 text-yellow-600" /> Top 20 produtos mais vendidos
                </h2>
                <TopProductsTab />
              </Card>
            )}

            {section === "products" && (
              <Card className="p-4">
                <AdminProductsTab />
              </Card>
            )}

            {section === "orders" && (() => {
              // dia base do pedido pago: paid_at se existir, senão created_at
              const paidDayKey = (o: Order) => dayKey(o.paid_at || o.created_at);
              const paidDays = Array.from(new Set(paid.map(paidDayKey))).sort((a, b) => (a < b ? 1 : -1));
              const labelDay = (k: string) => {
                const [y, m, d] = k.split("-");
                return `${d}/${m}/${y}`;
              };
              const dayRange = (k: string) => {
                const [y, m, d] = k.split("-").map(Number);
                const start = new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
                const end = new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
                return { start, end };
              };
              const filteredPaid = selectedPaidDay === "all" ? paid : paid.filter((o) => paidDayKey(o) === selectedPaidDay);
              const bulkPool = bulkDay === "all" ? paid : paid.filter((o) => paidDayKey(o) === bulkDay);
              const pendingTrack7 = bulkPool.filter((o) => !o.track7_sent_at).length;

              return (
              <Card className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                  <div className="text-sm text-muted-foreground">
                    {pendingTrack7} pedido(s) pago(s) ainda não enviado(s) para Track7
                    {bulkDay !== "all" && ` em ${labelDay(bulkDay)}`}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={bulkDay} onValueChange={setBulkDay}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Dia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os dias</SelectItem>
                        {paidDays.map((d) => (
                          <SelectItem key={d} value={d}>{labelDay(d)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (bulkDay === "all") sendAllToTrack7();
                        else {
                          const { start, end } = dayRange(bulkDay);
                          sendAllToTrack7(start, end);
                        }
                      }}
                      disabled={bulkSending || pendingTrack7 === 0}
                      className="gap-2"
                    >
                      {bulkSending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Truck className="w-4 h-4" />
                      )}
                      Enviar para Track7 ({pendingTrack7})
                    </Button>
                  </div>
                </div>
                <Tabs defaultValue="all">
                  <TabsList>
                    <TabsTrigger value="all">Todos ({orders.length})</TabsTrigger>
                    <TabsTrigger value="pending">Pendentes ({pending.length})</TabsTrigger>
                    <TabsTrigger value="paid">Pagos ({paid.length})</TabsTrigger>
                    <TabsTrigger value="desvios" className="text-red-600 data-[state=active]:text-red-700">
                      Desvios ({desvios.length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="all" className="mt-4">{renderTable(orders, false, true)}</TabsContent>
                  <TabsContent value="pending" className="mt-4">{renderTable(pending, true)}</TabsContent>
                  <TabsContent value="paid" className="mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-muted-foreground">Filtrar por dia:</span>
                      <Select value={selectedPaidDay} onValueChange={setSelectedPaidDay}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os dias ({paid.length})</SelectItem>
                          {paidDays.map((d) => {
                            const count = paid.filter((o) => paidDayKey(o) === d).length;
                            return (
                              <SelectItem key={d} value={d}>{labelDay(d)} ({count})</SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-muted-foreground ml-auto">
                        Mostrando {filteredPaid.length} pedido(s)
                      </span>
                    </div>
                    {renderTable(filteredPaid, false, true)}
                  </TabsContent>
                  <TabsContent value="desvios" className="mt-4">{renderTable(desvios, true, true)}</TabsContent>
                </Tabs>
              </Card>
              );
            })()}

            {section === "blocked" && (
              <Card className="p-4 space-y-4">
                <div>
                  <h2 className="font-semibold mb-1">Bloquear IP</h2>
                  <p className="text-sm text-muted-foreground mb-3">
                    IPs nesta lista não conseguem gerar novos pedidos no checkout.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Ex: 187.45.12.33"
                      value={newBlockIp}
                      onChange={(e) => setNewBlockIp(e.target.value)}
                      className="sm:w-[220px] font-mono"
                    />
                    <Input
                      placeholder="Motivo (opcional)"
                      value={newBlockReason}
                      onChange={(e) => setNewBlockReason(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={() => blockIp(newBlockIp, newBlockReason)} className="gap-2">
                      <Ban className="w-4 h-4" /> Bloquear
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Bloqueado em</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blockedIps.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            Nenhum IP bloqueado
                          </TableCell>
                        </TableRow>
                      ) : blockedIps.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-mono">{b.ip}</TableCell>
                          <TableCell className="text-sm">{b.reason || "—"}</TableCell>
                          <TableCell className="text-xs">
                            {new Date(b.created_at).toLocaleString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => unblockIp(b.id)}
                              className="gap-1"
                            >
                              <ShieldOff className="w-3 h-3" /> Desbloquear
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}

            {section === "logo" && (
              <Card className="p-6 space-y-4 max-w-2xl">
                <div>
                  <h2 className="font-semibold text-lg mb-1">Configurações de Logo</h2>
                  <p className="text-sm text-muted-foreground">
                    Controle a proteção de logo exibida para visitantes vindos de anúncios.
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
                  <div>
                    <div className="font-medium text-sm">
                      Proteção de logo ativa para visitantes de anúncios
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Quando ativada, visitantes mobile vindos de anúncios verão a logo protegida.
                      {logoAutoMode && (
                        <span className="block mt-1 text-amber-600">
                          Controle manual desabilitado — modo automático está ativo.
                        </span>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={logoProtection}
                    disabled={savingLogoProtection || logoAutoMode}
                    onCheckedChange={toggleLogoProtection}
                  />
                </div>

                <div className="text-sm">
                  Status atual:{" "}
                  <span className="font-medium">
                    {logoProtection ? "✅ Proteção ativa" : "⛔ Proteção desativada"}
                  </span>
                </div>

                {logoProtectionUpdatedAt && (
                  <div className="text-xs text-muted-foreground">
                    Última alteração: {new Date(logoProtectionUpdatedAt).toLocaleString("pt-BR")}
                  </div>
                )}

                <div className="border-t pt-4 mt-2 space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-1">Modo Automático</h3>
                    <p className="text-xs text-muted-foreground">
                      Alterna a proteção de logo automaticamente entre ativa e desativada nos intervalos configurados.
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
                    <div className="font-medium text-sm">Ativar alternância automática</div>
                    <Switch
                      checked={logoAutoMode}
                      disabled={savingLogoAuto}
                      onCheckedChange={toggleLogoAutoMode}
                    />
                  </div>

                  {logoAutoMode && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Tempo com proteção ativa</label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min={1}
                              value={logoAutoIntervalOn}
                              onChange={(e) => setLogoAutoIntervalOn(Number(e.target.value) || 1)}
                              onBlur={() => saveAutoIntervalOn(logoAutoIntervalOn, logoAutoUnitOn)}
                              className="w-full"
                            />
                            <Select
                              value={logoAutoUnitOn}
                              onValueChange={(v) => saveAutoIntervalOn(logoAutoIntervalOn, v as "s" | "m")}
                            >
                              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="s">segundos</SelectItem>
                                <SelectItem value="m">minutos</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium">Tempo com proteção desativada</label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min={1}
                              value={logoAutoIntervalOff}
                              onChange={(e) => setLogoAutoIntervalOff(Number(e.target.value) || 1)}
                              onBlur={() => saveAutoIntervalOff(logoAutoIntervalOff, logoAutoUnitOff)}
                              className="w-full"
                            />
                            <Select
                              value={logoAutoUnitOff}
                              onValueChange={(v) => saveAutoIntervalOff(logoAutoIntervalOff, v as "s" | "m")}
                            >
                              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="s">segundos</SelectItem>
                                <SelectItem value="m">minutos</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg border bg-muted/30 text-sm font-medium">
                        {logoProtection
                          ? `🟢 Proteção ATIVA — troca em ${remainingSec}s`
                          : `⚫ Proteção DESATIVADA — troca em ${remainingSec}s`}
                      </div>
                    </>
                  )}
                </div>
              </Card>
            )}
          </main>


        </div>
      </div>
    </SidebarProvider>
  );
}
