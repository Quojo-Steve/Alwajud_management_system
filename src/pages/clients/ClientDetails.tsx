import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { axiosService } from '@/utils/axiosServices';
import {
  ArrowLeft, MapPin, Phone, Calendar, ShoppingCart, Package,
  TrendingUp, FileText, Loader2, Plus, Wallet, Trash2,
  ChevronDown, ChevronRight, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import { toast } from '@/hooks/use-toast';

const Url = import.meta.env.VITE_ROUTE;

// ── Helpers ──────────────────────────────────────────────
const toMonthKey = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
const formatMonthKey = (key: string) => {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
};

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
        {open
          ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-3 space-y-2">{children}</div>}
    </div>
  );
}

export default function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'Cash',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchClient = async () => {
    try {
      const data = await axiosService('get', `/clients/${id}`);
      setClient(data);
    } catch {
      toast({ title: "Error", description: "Failed to load client.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClient(); }, [id]);

  // ── Month logic ───────────────────────────────────────
  const allMonths = useMemo(() => {
    if (!client) return [];
    const keys = new Set<string>();
    client.orders?.forEach((o: any) => keys.add(toMonthKey(o.order_date)));
    client.payments?.forEach((p: any) => keys.add(toMonthKey(p.payment_date)));
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [client]);

  const filteredOrders = useMemo(() => {
    if (!client?.orders) return [];
    if (selectedMonth === 'all') return client.orders;
    return client.orders.filter((o: any) => toMonthKey(o.order_date) === selectedMonth);
  }, [client, selectedMonth]);

  const filteredPayments = useMemo(() => {
    if (!client?.payments) return [];
    if (selectedMonth === 'all') return client.payments;
    return client.payments.filter((p: any) => toMonthKey(p.payment_date) === selectedMonth);
  }, [client, selectedMonth]);

  const monthStats = useMemo(() => {
    const revenue = filteredOrders.reduce((s: number, o: any) =>
      s + Number(o.total_weight_kg) * Number(o.price_per_kg), 0);
    const paid = filteredPayments.reduce((s: number, p: any) => s + Number(p.amount), 0);
    return { revenue, paid, balance: revenue - paid };
  }, [filteredOrders, filteredPayments]);

  // Group orders by month
  const groupedOrders = useMemo(() => {
    return filteredOrders.reduce((acc: Record<string, any[]>, o: any) => {
      const k = toMonthKey(o.order_date);
      if (!acc[k]) acc[k] = [];
      acc[k].push(o);
      return acc;
    }, {});
  }, [filteredOrders]);

  const groupedPayments = useMemo(() => {
    return filteredPayments.reduce((acc: Record<string, any[]>, p: any) => {
      const k = toMonthKey(p.payment_date);
      if (!acc[k]) acc[k] = [];
      acc[k].push(p);
      return acc;
    }, {});
  }, [filteredPayments]);

  // Month-on-month trend
  const monthlyTrend = useMemo(() => {
    if (!client) return [];
    const map: Record<string, { month: string; revenue: number; paid: number }> = {};
    client.orders?.forEach((o: any) => {
      const k = toMonthKey(o.order_date);
      if (!map[k]) map[k] = { month: formatMonthKey(k), revenue: 0, paid: 0 };
      map[k].revenue += Number(o.total_weight_kg) * Number(o.price_per_kg);
    });
    client.payments?.forEach((p: any) => {
      const k = toMonthKey(p.payment_date);
      if (!map[k]) map[k] = { month: formatMonthKey(k), revenue: 0, paid: 0 };
      map[k].paid += Number(p.amount);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [client]);

  // ── Actions ───────────────────────────────────────────
  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axiosService('post', '/client/payment', {
        client_id: Number(id),
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        payment_date: paymentForm.payment_date,
        notes: paymentForm.notes || null,
      });
      toast({ title: "Payment Recorded", description: "Payment saved successfully." });
      setShowPaymentModal(false);
      setPaymentForm({ amount: '', payment_method: 'Cash', payment_date: new Date().toISOString().split('T')[0], notes: '' });
      fetchClient();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.detail || "Failed to record payment.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    try {
      await axiosService('delete', `/client/payment/${paymentId}`);
      toast({ title: "Deleted", description: "Payment removed." });
      fetchClient();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.detail || "Failed to delete.", variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!client) return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-semibold mb-4">Client not found</h2>
      <Button onClick={() => navigate('/clients')}>Back to Clients</Button>
    </div>
  );

  const getInitials = (name: string) =>
    name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const totalRevenue = Number(client.stats?.total_revenue ?? 0);
  const totalPaid = Number(client.total_paid ?? 0);
  const totalBalance = totalRevenue - totalPaid;
  const paidPercent = totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0;
  const isFiltered = selectedMonth !== 'all';

  const orderMonthKeys = Object.keys(groupedOrders).sort((a, b) => b.localeCompare(a));
  const paymentMonthKeys = Object.keys(groupedPayments).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Button variant="ghost" onClick={() => navigate('/clients')} className="mb-2">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Clients
          </Button>
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              {client.logo
                ? <AvatarImage src={`${Url}/uploads/logos/${client.logo}`} />
                : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                {getInitials(client.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-display font-bold">{client.name}</h1>
              <div className="flex flex-wrap gap-3 mt-1 text-muted-foreground text-sm">
                {client.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{client.location}</span>}
                {client.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{client.phone}</span>}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Since {new Date(client.createdate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/orders/new?clientId=${client.id}`}>
            <Button variant="outline">
              <ShoppingCart className="w-4 h-4 mr-2" /> New Order
            </Button>
          </Link>
          <Button onClick={() => setShowPaymentModal(true)}>
            <Wallet className="w-4 h-4 mr-2" /> Record Payment
          </Button>
        </div>
      </div>

      {/* Notes */}
      {client.description && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
              <p className="text-muted-foreground text-sm">{client.description}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month Filter */}
      {allMonths.length > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium text-muted-foreground">Filter by month:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedMonth('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedMonth === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  All Time
                </button>
                {allMonths.map(m => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedMonth === m
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: isFiltered ? 'Orders (Month)' : 'Total Orders',
            value: isFiltered ? filteredOrders.length : (client.stats?.total_orders ?? 0),
            icon: ShoppingCart, color: 'bg-primary/10', iconColor: 'text-primary',
            format: (v: number) => v,
          },
          {
            label: isFiltered ? 'Revenue (Month)' : 'Total Revenue',
            value: isFiltered ? monthStats.revenue : totalRevenue,
            icon: TrendingUp, color: 'bg-accent/10', iconColor: 'text-accent',
            format: (v: number) => `GH₵ ${v.toLocaleString()}`,
          },
          {
            label: isFiltered ? 'Paid (Month)' : 'Total Paid',
            value: isFiltered ? monthStats.paid : totalPaid,
            icon: Wallet, color: 'bg-success/10', iconColor: 'text-success',
            format: (v: number) => `GH₵ ${v.toLocaleString()}`,
          },
          {
            label: 'Balance Due',
            value: isFiltered ? monthStats.balance : totalBalance,
            icon: Package, color: 'bg-warning/10', iconColor: 'text-warning',
            format: (v: number) => `GH₵ ${v.toLocaleString()}`,
            valueColor: (isFiltered ? monthStats.balance : totalBalance) > 0 ? 'text-destructive' : 'text-success',
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${s.color}`}>
                  <s.icon className={`w-6 h-6 ${s.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className={`text-2xl font-bold ${(s as any).valueColor || ''}`}>
                    {s.format(s.value as number)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Progress (all time only) */}
      {!isFiltered && totalRevenue > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Overall Payment Progress</span>
              <span className="text-muted-foreground">{paidPercent.toFixed(1)}% paid</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  paidPercent < 40 ? 'bg-red-500' : paidPercent < 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(Math.max(paidPercent, 0), 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>GH₵ 0</span>
              <span>GH₵ {totalRevenue.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month-on-month trend (all time only) */}
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
                <Line type="monotone" dataKey="revenue" stroke="#1e3a8a" strokeWidth={2} dot={{ r: 4 }} name="Revenue" />
                <Line type="monotone" dataKey="paid" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Paid" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Monthly bar chart (filtered view) */}
      {isFiltered && filteredOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Revenue — <span className="text-muted-foreground font-normal text-sm">{formatMonthKey(selectedMonth)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={filteredOrders.map((o: any) => ({
                date: new Date(o.order_date).toLocaleDateString(),
                revenue: Number(o.total_weight_kg) * Number(o.price_per_kg),
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `GH₵ ${v.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Orders + Payments side by side */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Order History
              {isFiltered && <span className="text-sm font-normal text-muted-foreground ml-2">({formatMonthKey(selectedMonth)})</span>}
            </CardTitle>
            <Link to={`/orders/new?clientId=${client.id}`}>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" /> New
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {filteredOrders.length > 0 ? (
              <div className="space-y-2">
                {isFiltered
                  ? filteredOrders.map((o: any) => <OrderRow key={o.id} order={o} />)
                  : orderMonthKeys.map((mk, i) => (
                      <MonthSection key={mk} monthKey={mk} defaultOpen={i === 0}>
                        {groupedOrders[mk].map((o: any) => <OrderRow key={o.id} order={o} />)}
                      </MonthSection>
                    ))
                }
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No orders for this period.</p>
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
              <p className="text-center text-muted-foreground py-8">No payments recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Record Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment from {client.name}.
              Balance due: <span className="font-bold text-destructive">GH₵ {totalBalance.toLocaleString()}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPayment} className="space-y-4 pt-2">
            <div>
              <label className="form-label">Amount (GH₵)</label>
              <Input
                type="number" step="0.01" min="0"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                placeholder={`e.g., ${totalBalance.toLocaleString()}`}
                required
              />
            </div>
            <div>
              <label className="form-label">Payment Method</label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm(p => ({ ...p, payment_method: e.target.value }))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {['Cash', 'Mobile Money', 'Bank Transfer'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Payment Date</label>
              <Input
                type="date"
                value={paymentForm.payment_date}
                onChange={(e) => setPaymentForm(p => ({ ...p, payment_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="form-label">Notes (optional)</label>
              <Input
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="e.g., Partial payment for order #12"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Row Components ────────────────────────────────────────
function OrderRow({ order }: { order: any }) {
  const total = Number(order.total_weight_kg) * Number(order.price_per_kg);
  return (
    <Link
      to={`/orders/${order.id}`}
      className="flex items-center justify-between p-3 rounded-lg bg-muted hover:bg-muted/70 transition-colors"
    >
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm">Order #{order.id}</p>
          {order.receipt_number && (
            <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
              {order.receipt_number}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {order.total_weight_kg} kg × GH₵ {order.price_per_kg}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(order.order_date).toLocaleDateString()}
        </p>
      </div>
      <div className="text-right">
        <p className="font-bold text-primary">GH₵ {total.toLocaleString()}</p>
        <span className={
          order.status === 'Completed' ? 'status-open' :
          order.status === 'Pending' ? 'status-pending' : 'status-closed'
        }>
          {order.status}
        </span>
      </div>
    </Link>
  );
}

function PaymentRow({ p, onDelete }: { p: any; onDelete: (id: number) => void }) {
  return (
    <div className="flex items-start justify-between p-3 rounded-lg bg-muted">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-bold text-success">GH₵ {Number(p.amount).toLocaleString()}</p>
          {/* Show source badge */}
          {p.source === 'receipt' ? (
            <Link to={`/orders/${p.order_id}`}>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                From Receipt
              </span>
            </Link>
          ) : (
            <span className="text-xs bg-muted-foreground/10 text-muted-foreground px-2 py-0.5 rounded-full">
              Manual
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{p.payment_method}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(p.payment_date).toLocaleDateString()}
        </p>
        {p.notes && (
          <p className="text-xs text-muted-foreground italic mt-0.5">{p.notes}</p>
        )}
      </div>
      {/* Only manual payments can be deleted */}
      {p.source === 'manual' && (
        <button
          onClick={() => onDelete(p.id)}
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}