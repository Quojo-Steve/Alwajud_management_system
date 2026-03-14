import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { axiosService } from '@/utils/axiosServices';
import {
  ArrowLeft, Calendar, Package, DollarSign, User,
  RefreshCcw, Printer, Receipt as ReceiptIcon, Check,
  MapPin, Phone, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const receiptRef = useRef<HTMLDivElement>(null);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState({
    paymentMethod: 'Cash',
    amountPaid: '',
    transportCost: '0',
  });

  const fetchOrder = async () => {
    try {
      const data = await axiosService('get', `/orders/${id}`);
      setOrder(data);
    } catch {
      toast({ title: "Error", description: "Failed to load order.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleMarkComplete = async () => {
    try {
      await axiosService('put', `/order/${id}/status`, new URLSearchParams({ status: 'Completed' }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      toast({ title: "Order Completed", description: "Order marked as completed." });
      fetchOrder();
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.detail || "Failed to update status.", variant: "destructive" });
    }
  };

  const handleGenerateReceipt = async () => {
    setIsSubmitting(true);
    try {
      const orderTotal = Number(order.total_weight_kg) * Number(order.price_per_kg);
      const transportCost = parseFloat(receiptData.transportCost) || 0;
      const amountPaid = parseFloat(receiptData.amountPaid) || orderTotal + transportCost;
      const balance = (orderTotal + transportCost) - amountPaid;

      await axiosService('post', '/receipt', {
        order_id: order.id,
        payment_method: receiptData.paymentMethod,
        amount_paid: amountPaid,
        transport_cost: transportCost,
        balance: Math.max(0, balance),
      });

      toast({ title: "Receipt Generated", description: "Receipt has been created." });
      setShowReceiptDialog(false);
      await fetchOrder();
      setShowPrintView(true);
    } catch (err: any) {
      toast({ title: "Error", description: err?.response?.data?.detail || "Failed to generate receipt.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!order) return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-semibold mb-4">Order not found</h2>
      <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
    </div>
  );

  const orderTotal = Number(order.total_weight_kg) * Number(order.price_per_kg);
  const receipt = order.receipt;
  const transportCost = receipt ? Number(receipt.transport_cost) : 0;
  const grandTotal = orderTotal + transportCost;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Print View Overlay */}
      {showPrintView && receipt && (
        <div className="fixed inset-0 bg-background z-50 overflow-auto no-print">
          <div className="max-w-md mx-auto p-4">
            <div className="flex gap-2 mb-4 sticky top-0 bg-background py-2">
              <Button onClick={() => window.print()} size="lg" className="flex-1">
                <Printer className="w-5 h-5 mr-2" /> Print Receipt
              </Button>
              <Button variant="outline" onClick={() => setShowPrintView(false)} size="lg">Close</Button>
            </div>

            <div ref={receiptRef} className="receipt border rounded-lg print:border-0 p-6 font-mono text-sm">
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold">ALWAJUD VENTURES</h1>
                <p className="text-gray-600">Rubber Roll Factory</p>
                <p className="text-gray-400 text-xs">{'='.repeat(40)}</p>
              </div>

              <div className="space-y-1 mb-4">
                <p><strong>Receipt No:</strong> {receipt.receipt_number}</p>
                <p><strong>Date:</strong> {new Date(receipt.createdate).toLocaleDateString()}</p>
                <p><strong>Client:</strong> {order.client_name}</p>
                <p><strong>Location:</strong> {order.client_location}</p>
              </div>

              <p className="text-gray-400">{'─'.repeat(40)}</p>
              <p className="font-bold my-2">ORDER DETAILS:</p>
              <p className="font-semibold mb-1">Individual Rolls:</p>
              {order.rolls?.map((roll: any) => (
                <p key={roll.id} className="pl-4">Roll {roll.roll_number}: {roll.weight_kg} kg</p>
              ))}
              <p className="text-gray-400 mt-2">{'─'.repeat(40)}</p>

              <div className="space-y-1 my-3">
                <div className="flex justify-between"><span>Total Weight:</span><span>{order.total_weight_kg} kg</span></div>
                <div className="flex justify-between"><span>Price per kg:</span><span>GH₵ {order.price_per_kg}</span></div>
                <div className="flex justify-between"><span>Subtotal:</span><span>GH₵ {orderTotal.toLocaleString()}</span></div>
                {transportCost > 0 && (
                  <div className="flex justify-between"><span>Transport:</span><span>GH₵ {transportCost.toLocaleString()}</span></div>
                )}
              </div>

              <p className="text-gray-400">{'─'.repeat(40)}</p>
              <div className="flex justify-between font-bold text-base my-2">
                <span>TOTAL AMOUNT:</span>
                <span>GH₵ {grandTotal.toLocaleString()}</span>
              </div>
              <p className="text-gray-400">{'─'.repeat(40)}</p>

              <div className="space-y-1 my-3">
                <p className="font-bold">PAYMENT:</p>
                <div className="flex justify-between"><span>Method:</span><span>{receipt.payment_method}</span></div>
                <div className="flex justify-between"><span>Amount Paid:</span><span>GH₵ {Number(receipt.amount_paid).toLocaleString()}</span></div>
                <div className="flex justify-between font-semibold"><span>Balance Due:</span><span>GH₵ {Math.max(0, Number(receipt.balance)).toLocaleString()}</span></div>
              </div>

              <p className="text-gray-400">{'='.repeat(40)}</p>
              <div className="text-center mt-4 text-gray-600">
                <p>Thank you for your business!</p>
                {order.client_phone && <p>Contact: {order.client_phone}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <Button variant="ghost" onClick={() => navigate('/orders')} className="mb-2">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Orders
          </Button>
          <h1 className="text-3xl font-display font-bold">Order Details</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className={
              order.status === 'Completed' ? 'status-open' :
              order.status === 'Pending' ? 'status-pending' : 'status-closed'
            }>
              {order.status}
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(order.order_date).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-2 no-print">
          {order.status !== 'Completed' && !receipt && (
            <Button variant="outline" onClick={handleMarkComplete}>
              <Check className="w-5 h-5 mr-2" /> Mark Complete
            </Button>
          )}
          {receipt ? (
            <Button onClick={() => setShowPrintView(true)}>
              <Printer className="w-5 h-5 mr-2" /> Print Receipt
            </Button>
          ) : (
            <Button onClick={() => setShowReceiptDialog(true)}>
              <ReceiptIcon className="w-5 h-5 mr-2" /> Generate Receipt
            </Button>
          )}
        </div>
      </div>

      {/* Client & Cycle */}
      <div className="grid md:grid-cols-2 gap-6 no-print">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Client Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link to={`/clients/${order.client_id}`} className="block hover:bg-muted p-3 rounded-lg -m-3">
              <p className="text-xl font-semibold">{order.client_name}</p>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" /> {order.client_location}
              </p>
              {order.client_phone && (
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <Phone className="w-4 h-4" /> {order.client_phone}
                </p>
              )}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCcw className="w-5 h-5 text-primary" /> Source Cycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link to={`/cycles/${order.cycle_id}`} className="block hover:bg-muted p-3 rounded-lg -m-3">
              <p className="text-xl font-semibold">Cycle #{order.cycle_id}</p>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="w-4 h-4" />
                Started {new Date(order.cycle_start).toLocaleDateString()}
              </p>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Order Summary */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-6 mb-6">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Total Weight</p>
              <p className="text-2xl font-bold">{order.total_weight_kg} kg</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Price per kg</p>
              <p className="text-2xl font-bold">GH₵ {order.price_per_kg}</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-primary">GH₵ {orderTotal.toLocaleString()}</p>
            </div>
          </div>

          <h4 className="font-semibold mb-3">Roll Breakdown ({order.rolls?.length} rolls)</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {order.rolls?.map((roll: any) => (
              <div key={roll.id} className="p-3 rounded-lg border text-center">
                <p className="text-sm text-muted-foreground">Roll {roll.roll_number}</p>
                <p className="text-lg font-semibold">{roll.weight_kg} kg</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Receipt Summary */}
      {receipt && (
        <Card className="no-print border-success">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <ReceiptIcon className="w-5 h-5" /> Receipt Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Receipt Number</p>
                <p className="font-semibold">{receipt.receipt_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-semibold">{receipt.payment_method}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount Paid</p>
                <p className="font-semibold text-success">GH₵ {Number(receipt.amount_paid).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className={`font-semibold ${Number(receipt.balance) > 0 ? 'text-destructive' : 'text-success'}`}>
                  GH₵ {Number(receipt.balance).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Receipt</DialogTitle>
            <DialogDescription>Enter payment details to generate the receipt.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="form-label">Payment Method</label>
              <Select value={receiptData.paymentMethod} onValueChange={(v) => setReceiptData(p => ({ ...p, paymentMethod: v }))}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="form-label">Transport Cost (GH₵)</label>
              <Input
                type="number" min="0" step="0.01"
                value={receiptData.transportCost}
                onChange={(e) => setReceiptData(p => ({ ...p, transportCost: e.target.value }))}
                className="h-12"
              />
            </div>
            <div>
              <label className="form-label">Amount Paid (GH₵)</label>
              <Input
                type="number" min="0" step="0.01"
                value={receiptData.amountPaid}
                onChange={(e) => setReceiptData(p => ({ ...p, amountPaid: e.target.value }))}
                placeholder={String(orderTotal + (parseFloat(receiptData.transportCost) || 0))}
                className="h-12"
              />
            </div>
            <div className="p-4 rounded-lg bg-muted text-sm space-y-1">
              <div className="flex justify-between">
                <span>Order Total</span><span>GH₵ {orderTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Transport</span><span>GH₵ {parseFloat(receiptData.transportCost) || 0}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Grand Total</span>
                <span>GH₵ {(orderTotal + (parseFloat(receiptData.transportCost) || 0)).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>Cancel</Button>
            <Button onClick={handleGenerateReceipt} disabled={isSubmitting}>
              {isSubmitting ? 'Generating...' : 'Generate & Print'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}