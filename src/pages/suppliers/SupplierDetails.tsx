import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { axiosService } from "@/utils/axiosServices";
import {
  ArrowLeft, MapPin, Phone, FileText, Plus, Wallet,
  TrendingDown, Package, Loader2, RefreshCcw, Trash2,
  ChevronDown, ChevronRight, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, Legend
} from "recharts";

const COLORS = ["#1e3a8a", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];

// ── Helpers ──────────────────────────────────────────────
const toMonthKey = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};
const formatMonthKey = (key: string) => {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("default", { month: "long", year: "numeric" });
};
const groupByMonth = <T extends { purchase_date?: string; payment_date?: string }>(
  items: T[], dateField: "purchase_date" | "payment_date"
): Record<string, T[]> => {
  return items.reduce((acc, item) => {
    const key = toMonthKey(item[dateField] as string);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};

// ── Collapsible Month Section ─────────────────────────────
function MonthSection({ monthKey, children, defaultOpen = false }: {
  monthKey: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors text-left"
      >
        <span className="font-semibold text-sm">{formatMonthKey(monthKey)}</span>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-3 space-y-2">{children}</div>}
    </div>
  );
}

export default function SupplierDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const [purchaseForm, setPurchaseForm] = useState({
    item_name: "", quantity: "", unit: "kg", unit_cost: "",
    purchase_date: new Date().toISOString().split("T")[0], notes: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    amount: "", payment_method: "Cash",
    payment_date: new Date().toISOString().split("T")[0], notes: "",
  });

  const fetchSupplier = async () => {
    try {
      const data = await axiosService("get", `/suppliers/${id}`);
      setSupplier(data);
    } catch {
      toast({ title: "Error", description: "Failed to load supplier.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSupplier(); }, [id]);

  // ── Derived month data ────────────────────────────────
  const allMonths = useMemo(() => {
    if (!supplier) return [];
    const keys = new Set<string>();
    supplier.purchases?.forEach((p: any) => keys.add(toMonthKey(p.purchase_date)));
    supplier.payments?.forEach((p: any) => keys.add(toMonthKey(p.payment_date)));
    return Array.from(keys).sort((a, b) => b.localeCompare(a)); // newest first
  }, [supplier]);

  const monthlyTrend = useMemo(() => {
    if (!supplier) return [];
    const map: Record<string, { month: string; purchased: number; paid: number }> = {};
    supplier.purchases?.forEach((p: any) => {
      const k = toMonthKey(p.purchase_date);
      if (!map[k]) map[k] = { month: formatMonthKey(k), purchased: 0, paid: 0 };
      map[k].purchased += Number(p.total_cost);
    });
    supplier.payments?.forEach((p: any) => {
      const k = toMonthKey(p.payment_date);
      if (!map[k]) map[k] = { month: formatMonthKey(k), purchased: 0, paid: 0 };
      map[k].paid += Number(p.amount);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [supplier]);

  // Filter purchases/payments by selected month
  const filteredPurchases = useMemo(() => {
    if (!supplier?.purchases) return [];
    if (selectedMonth === "all") return supplier.purchases;
    return supplier.purchases.filter((p: any) => toMonthKey(p.purchase_date) === selectedMonth);
  }, [supplier, selectedMonth]);

  const filteredPayments = useMemo(() => {
    if (!supplier?.payments) return [];
    if (selectedMonth === "all") return supplier.payments;
    return supplier.payments.filter((p: any) => toMonthKey(p.payment_date) === selectedMonth);
  }, [supplier, selectedMonth]);

  // Stats for selected month
  const monthStats = useMemo(() => {
    const purchased = filteredPurchases.reduce((s: number, p: any) => s + Number(p.total_cost), 0);
    const paid = filteredPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);
    return { purchased, paid, balance: purchased - paid };
  }, [filteredPurchases, filteredPayments]);

  // Grouped by month (for "all" view)
  const groupedPurchases = useMemo(() => groupByMonth(filteredPurchases, "purchase_date"), [filteredPurchases]);
  const groupedPayments = useMemo(() => groupByMonth(filteredPayments, "payment_date"), [filteredPayments]);
  const purchaseMonthKeys = Object.keys(groupedPurchases).sort((a, b) => b.localeCompare(a));
  const paymentMonthKeys = Object.keys(groupedPayments).sort((a, b) => b.localeCompare(a));

  // ── Actions ───────────────────────────────────────────
  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axiosService("post", "/supplier/purchase", {
        supplier_id: Number(id),
        item_name: purchaseForm.item_name,
        quantity: parseFloat(purchaseForm.quantity),
        unit: purchaseForm.unit,
        unit_cost: parseFloat(purchaseForm.unit_cost),
        purchase_date: purchaseForm.purchase_date,
        notes: purchaseForm.notes || null,
      });
      toast({ title: "Purchase Added", description: "Purchase recorded successfully." });
      setShowPurchaseModal(false);
      setPurchaseForm({ item_name: "", quantity: "", unit: "kg", unit_cost: "", purchase_date: new Date().toISOString().split("T")[0], notes: "" });
      fetchSupplier();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.detail || "Failed to add purchase.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axiosService("post", "/supplier/payment", {
        supplier_id: Number(id),
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        payment_date: paymentForm.payment_date,
        notes: paymentForm.notes || null,
      });
      toast({ title: "Payment Recorded", description: "Payment saved successfully." });
      setShowPaymentModal(false);
      setPaymentForm({ amount: "", payment_method: "Cash", payment_date: new Date().toISOString().split("T")[0], notes: "" });
      fetchSupplier();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.detail || "Failed to record payment.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePurchase = async (purchaseId: number) => {
    try {
      await axiosService("delete", `/supplier/purchase/${purchaseId}`);
      toast({ title: "Deleted", description: "Purchase removed." });
      fetchSupplier();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.detail || "Failed to delete.", variant: "destructive" });
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    try {
      await axiosService("delete", `/supplier/payment/${paymentId}`);
      toast({ title: "Deleted", description: "Payment removed." });
      fetchSupplier();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.detail || "Failed to delete.", variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!supplier) return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-semibold mb-4">Supplier not found</h2>
      <Button onClick={() => navigate("/suppliers")}>Back to Suppliers</Button>
    </div>
  );

  const totalPurchased = Number(supplier.stats?.total_purchased || 0);
  const totalPaid = Number(supplier.stats?.total_paid || 0);
  const totalBalance = Number(supplier.stats?.balance_due || 0);
  const paidPercent = totalPurchased > 0 ? (totalPaid / totalPurchased) * 100 : 0;

  const isFiltered = selectedMonth !== "all";
  const displayPurchased = isFiltered ? monthStats.purchased : totalPurchased;
  const displayPaid = isFiltered ? monthStats.paid : totalPaid;
  const displayBalance = isFiltered ? monthStats.balance : totalBalance;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Button variant="ghost" onClick={() => navigate("/suppliers")} className="mb-2">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Suppliers
          </Button>
          <h1 className="text-3xl font-display font-bold">{supplier.name}</h1>
          <div className="flex flex-wrap gap-3 mt-2 text-muted-foreground text-sm">
            {supplier.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{supplier.location}</span>}
            {supplier.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{supplier.phone}</span>}
            {supplier.notes && <span className="flex items-center gap-1"><FileText className="w-4 h-4" />{supplier.notes}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPurchaseModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Purchase
          </Button>
          <Button onClick={() => setShowPaymentModal(true)}>
            <Wallet className="w-4 h-4 mr-2" /> Record Payment
          </Button>
        </div>
      </div>

      {/* Month Filter */}
      {allMonths.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-muted-foreground">Filter by month:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedMonth("all")}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedMonth === "all"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  }`}
                >
                  All Time
                </button>
                {allMonths.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedMonth === m
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    }`}
                  >
                    {formatMonthKey(m)}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats — update based on filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: isFiltered ? "Purchased (Month)" : "Total Purchased", value: displayPurchased, icon: TrendingDown, color: "bg-destructive/10", iconColor: "text-destructive", textColor: "" },
          { label: isFiltered ? "Paid (Month)" : "Total Paid", value: displayPaid, icon: Wallet, color: "bg-success/10", iconColor: "text-success", textColor: "text-success" },
          { label: "Balance Due", value: displayBalance, icon: Package, color: "bg-warning/10", iconColor: "text-warning", textColor: displayBalance > 0 ? "text-destructive" : "text-success" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${s.color}`}>
                  <s.icon className={`w-6 h-6 ${s.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.textColor}`}>GH₵ {s.value.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Progress (all time only) */}
      {!isFiltered && totalPurchased > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Overall Payment Progress</span>
              <span className="text-muted-foreground">{paidPercent.toFixed(1)}% paid</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  paidPercent < 40 ? "bg-red-500" : paidPercent < 70 ? "bg-yellow-500" : "bg-green-500"
                }`}
                style={{ width: `${Math.min(Math.max(paidPercent, 0), 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>GH₵ 0</span>
              <span>GH₵ {totalPurchased.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trend Chart (all time only) */}
      {!isFiltered && monthlyTrend.length > 1 && (
        <Card>
          <CardHeader><CardTitle>Month-on-Month Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyTrend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `GH₵${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `GH₵ ${v.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="purchased" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Purchased" />
                <Line type="monotone" dataKey="paid" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Paid" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Item Breakdown Chart */}
      {supplier.item_breakdown?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Purchases by Item Type {isFiltered && <span className="text-sm font-normal text-muted-foreground ml-2">({formatMonthKey(selectedMonth)})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={
                  isFiltered
                    ? Object.values(
                        filteredPurchases.reduce((acc: any, p: any) => {
                          if (!acc[p.item_name]) acc[p.item_name] = { item_name: p.item_name, total_cost: 0 };
                          acc[p.item_name].total_cost += Number(p.total_cost);
                          return acc;
                        }, {})
                      )
                    : supplier.item_breakdown
                }
                margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
              >
                <XAxis dataKey="item_name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `GH₵ ${v.toLocaleString()}`} />
                <Bar dataKey="total_cost" radius={[4, 4, 0, 0]}>
                  {supplier.item_breakdown.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Purchases + Payments */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Purchases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Purchase History
              {isFiltered && <span className="text-sm font-normal text-muted-foreground ml-2">({formatMonthKey(selectedMonth)})</span>}
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowPurchaseModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            {filteredPurchases.length > 0 ? (
              <div className="space-y-2">
                {isFiltered
                  // Flat list when a specific month is selected
                  ? filteredPurchases.map((p: any) => (
                      <PurchaseRow key={p.id} p={p} onDelete={handleDeletePurchase} />
                    ))
                  // Grouped by month for "all time"
                  : purchaseMonthKeys.map((mk, i) => (
                      <MonthSection key={mk} monthKey={mk} defaultOpen={i === 0}>
                        {groupedPurchases[mk].map((p: any) => (
                          <PurchaseRow key={p.id} p={p} onDelete={handleDeletePurchase} />
                        ))}
                      </MonthSection>
                    ))
                }
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No purchases for this period.</p>
            )}
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Payment History
              {isFiltered && <span className="text-sm font-normal text-muted-foreground ml-2">({formatMonthKey(selectedMonth)})</span>}
            </CardTitle>
            <Button size="sm" onClick={() => setShowPaymentModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> Pay
            </Button>
          </CardHeader>
          <CardContent>
            {filteredPayments.length > 0 ? (
              <div className="space-y-2">
                {isFiltered
                  ? filteredPayments.map((p: any) => (
                      <PaymentRow key={p.id} p={p} onDelete={handleDeletePayment} />
                    ))
                  : paymentMonthKeys.map((mk, i) => (
                      <MonthSection key={mk} monthKey={mk} defaultOpen={i === 0}>
                        {groupedPayments[mk].map((p: any) => (
                          <PaymentRow key={p.id} p={p} onDelete={handleDeletePayment} />
                        ))}
                      </MonthSection>
                    ))
                }
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No payments for this period.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Purchase Modal */}
      <Dialog open={showPurchaseModal} onOpenChange={setShowPurchaseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Purchase</DialogTitle>
            <DialogDescription>Record a new item purchased from {supplier.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPurchase} className="space-y-4 pt-2">
            <div>
              <label className="form-label">Item Name</label>
              <Input value={purchaseForm.item_name} onChange={(e) => setPurchaseForm(p => ({ ...p, item_name: e.target.value }))} placeholder="e.g., Ink, Tape, Cones" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Quantity</label>
                <Input type="number" step="0.01" min="0" value={purchaseForm.quantity} onChange={(e) => setPurchaseForm(p => ({ ...p, quantity: e.target.value }))} placeholder="e.g., 50" required />
              </div>
              <div>
                <label className="form-label">Unit</label>
                <select value={purchaseForm.unit} onChange={(e) => setPurchaseForm(p => ({ ...p, unit: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {["kg", "pcs", "rolls", "litres", "boxes", "bags"].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Unit Cost (GH₵)</label>
              <Input type="number" step="0.01" min="0" value={purchaseForm.unit_cost} onChange={(e) => setPurchaseForm(p => ({ ...p, unit_cost: e.target.value }))} placeholder="e.g., 12.00" required />
            </div>
            {purchaseForm.quantity && purchaseForm.unit_cost && (
              <div className="p-3 rounded-lg bg-muted text-sm">
                Total: <span className="font-bold text-primary">GH₵ {(parseFloat(purchaseForm.quantity) * parseFloat(purchaseForm.unit_cost)).toLocaleString()}</span>
              </div>
            )}
            <div>
              <label className="form-label">Purchase Date</label>
              <Input type="date" value={purchaseForm.purchase_date} onChange={(e) => setPurchaseForm(p => ({ ...p, purchase_date: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Notes (optional)</label>
              <Input value={purchaseForm.notes} onChange={(e) => setPurchaseForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any additional notes..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPurchaseModal(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Add Purchase"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment to {supplier.name}. Balance due: <span className="font-bold text-destructive">GH₵ {totalBalance.toLocaleString()}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPayment} className="space-y-4 pt-2">
            <div>
              <label className="form-label">Amount (GH₵)</label>
              <Input type="number" step="0.01" min="0" value={paymentForm.amount} onChange={(e) => setPaymentForm(p => ({ ...p, amount: e.target.value }))} placeholder={`e.g., ${totalBalance.toLocaleString()}`} required />
            </div>
            <div>
              <label className="form-label">Payment Method</label>
              <select value={paymentForm.payment_method} onChange={(e) => setPaymentForm(p => ({ ...p, payment_method: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {["Cash", "Mobile Money", "Bank Transfer"].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Payment Date</label>
              <Input type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm(p => ({ ...p, payment_date: e.target.value }))} required />
            </div>
            <div>
              <label className="form-label">Notes (optional)</label>
              <Input value={paymentForm.notes} onChange={(e) => setPaymentForm(p => ({ ...p, notes: e.target.value }))} placeholder="e.g., Partial payment for cycle #3" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Record Payment"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Extracted Row Components ──────────────────────────────
function PurchaseRow({ p, onDelete }: { p: any; onDelete: (id: number) => void }) {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg bg-muted">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold">{p.item_name}</p>
          {p.reference_type === "cycle" && (
            <Link to={`/cycles/${p.reference_id}`}>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                <RefreshCcw className="w-3 h-3" /> {p.cycle_ref}
              </span>
            </Link>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {p.quantity} {p.unit} × GH₵ {p.unit_cost} ={" "}
          <span className="font-medium text-foreground">GH₵ {Number(p.total_cost).toLocaleString()}</span>
        </p>
        <p className="text-xs text-muted-foreground">{new Date(p.purchase_date).toLocaleDateString()}</p>
        {p.notes && <p className="text-xs text-muted-foreground italic mt-0.5">{p.notes}</p>}
      </div>
      {p.reference_type !== "cycle" && (
        <button onClick={() => onDelete(p.id)} className="ml-2 text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function PaymentRow({ p, onDelete }: { p: any; onDelete: (id: number) => void }) {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg bg-muted">
      <div>
        <p className="font-bold text-success">GH₵ {Number(p.amount).toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">{p.payment_method}</p>
        <p className="text-xs text-muted-foreground">{new Date(p.payment_date).toLocaleDateString()}</p>
        {p.notes && <p className="text-xs text-muted-foreground italic mt-0.5">{p.notes}</p>}
      </div>
      <button onClick={() => onDelete(p.id)} className="text-muted-foreground hover:text-destructive transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}