import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { 
  ArrowLeft, 
  Calendar, 
  Package, 
  DollarSign, 
  User, 
  RefreshCcw,
  Printer,
  Receipt as ReceiptIcon,
  Check,
  MapPin,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getOrderById, getClientById, getCycleById, getReceiptByOrderId, updateOrder, addReceipt } = useData();
  const receiptRef = useRef<HTMLDivElement>(null);

  const order = getOrderById(id || '');
  const client = order ? getClientById(order.clientId) : null;
  const cycle = order ? getCycleById(order.cycleId) : null;
  const existingReceipt = order ? getReceiptByOrderId(order.id) : null;

  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [receiptData, setReceiptData] = useState({
    paymentMethod: 'cash' as 'cash' | 'mobile_money' | 'bank_transfer',
    amountPaid: '',
    transportCost: '0',
  });

  if (!order || !client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-4">Order not found</h2>
        <Button onClick={() => navigate('/orders')}>Back to Orders</Button>
      </div>
    );
  }

  const orderTotal = order.totalWeightKg * order.pricePerKg;
  const receipt = existingReceipt;

  const handleGenerateReceipt = () => {
    const amountPaid = parseFloat(receiptData.amountPaid) || orderTotal;
    const transportCost = parseFloat(receiptData.transportCost) || 0;
    const total = orderTotal + transportCost;
    const balance = total - amountPaid;

    const receiptNumber = `AV-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
    
    addReceipt({
      orderId: order.id,
      receiptNumber,
      paymentMethod: receiptData.paymentMethod,
      amountPaid,
      transportCost,
      balance,
    });

    updateOrder(order.id, { status: 'completed' });
    
    setShowReceiptDialog(false);
    setShowPrintView(true);
    
    toast({
      title: "Receipt Generated",
      description: `Receipt ${receiptNumber} has been created.`,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleMarkComplete = () => {
    updateOrder(order.id, { status: 'completed' });
    toast({
      title: "Order Completed",
      description: "The order has been marked as completed.",
    });
  };

  const currentReceipt = receipt || {
    receiptNumber: `AV-${new Date().getFullYear()}-PREVIEW`,
    paymentMethod: receiptData.paymentMethod,
    amountPaid: parseFloat(receiptData.amountPaid) || orderTotal,
    transportCost: parseFloat(receiptData.transportCost) || 0,
    balance: (orderTotal + (parseFloat(receiptData.transportCost) || 0)) - (parseFloat(receiptData.amountPaid) || orderTotal),
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Print-only receipt view */}
      {showPrintView && (
        <div className="fixed inset-0 bg-background z-50 overflow-auto no-print">
          <div className="max-w-md mx-auto p-4">
            <div className="flex gap-2 mb-4 sticky top-0 bg-background py-2">
              <Button onClick={handlePrint} size="lg" className="flex-1">
                <Printer className="w-5 h-5 mr-2" />
                Print Receipt
              </Button>
              <Button variant="outline" onClick={() => setShowPrintView(false)} size="lg">
                Close
              </Button>
            </div>
            
            {/* Receipt */}
            <div ref={receiptRef} className="receipt border rounded-lg print:border-0">
              <div className="receipt-header">
                <h1 className="text-2xl font-bold">ALWAJUD VENTURES</h1>
                <p className="text-sm text-gray-600">Rubber Roll Factory</p>
              </div>
              
              <div className="space-y-1 text-sm">
                <p><strong>Receipt No:</strong> {currentReceipt.receiptNumber}</p>
                <p><strong>Date:</strong> {new Date(currentReceipt.createdAt).toLocaleDateString()}</p>
                <p><strong>Client:</strong> {client.name}</p>
                <p><strong>Location:</strong> {client.location}</p>
              </div>

              <div className="receipt-divider" />

              <div>
                <p className="font-bold mb-2">ORDER DETAILS:</p>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">Individual Rolls:</p>
                  {order.rolls.map((roll) => (
                    <p key={roll.id} className="pl-4">Roll {roll.rollNumber}: {roll.weightKg} kg</p>
                  ))}
                </div>
              </div>

              <div className="receipt-divider" />

              <div className="space-y-1 text-sm">
                <div className="receipt-row">
                  <span>Total Weight:</span>
                  <span>{order.totalWeightKg} kg</span>
                </div>
                <div className="receipt-row">
                  <span>Price per kg:</span>
                  <span>GH₵ {order.pricePerKg}</span>
                </div>
                <div className="receipt-row">
                  <span>Subtotal:</span>
                  <span>GH₵ {orderTotal.toLocaleString()}</span>
                </div>
                {currentReceipt.transportCost > 0 && (
                  <div className="receipt-row">
                    <span>Transport:</span>
                    <span>GH₵ {currentReceipt.transportCost.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="receipt-total">
                <div className="receipt-row">
                  <span>TOTAL AMOUNT:</span>
                  <span>GH₵ {(orderTotal + currentReceipt.transportCost).toLocaleString()}</span>
                </div>
              </div>

              <div className="receipt-divider" />

              <div className="space-y-1 text-sm">
                <p className="font-bold">PAYMENT:</p>
                <div className="receipt-row">
                  <span>Payment Method:</span>
                  <span className="capitalize">{currentReceipt.paymentMethod.replace('_', ' ')}</span>
                </div>
                <div className="receipt-row">
                  <span>Amount Paid:</span>
                  <span>GH₵ {currentReceipt.amountPaid.toLocaleString()}</span>
                </div>
                <div className="receipt-row font-semibold">
                  <span>Balance Due:</span>
                  <span>GH₵ {Math.max(0, currentReceipt.balance).toLocaleString()}</span>
                </div>
              </div>

              <div className="receipt-divider" />

              <div className="text-center text-sm text-gray-600 mt-4">
                <p>Thank you for your business!</p>
                {client.phone && <p>Contact: {client.phone}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/orders')}
            className="mb-2"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Orders
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Order Details
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <span className={
              order.status === 'completed' ? 'status-open' :
              order.status === 'pending' ? 'status-pending' :
              'status-closed'
            }>
              {order.status.replace('_', ' ')}
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(order.orderDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {order.status !== 'completed' && !receipt && (
            <Button variant="outline" onClick={handleMarkComplete}>
              <Check className="w-5 h-5 mr-2" />
              Mark Complete
            </Button>
          )}
          {receipt ? (
            <Button onClick={() => setShowPrintView(true)}>
              <Printer className="w-5 h-5 mr-2" />
              Print Receipt
            </Button>
          ) : (
            <Button onClick={() => setShowReceiptDialog(true)}>
              <ReceiptIcon className="w-5 h-5 mr-2" />
              Generate Receipt
            </Button>
          )}
        </div>
      </div>

      {/* Client & Cycle Info */}
      <div className="grid md:grid-cols-2 gap-6 no-print">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to={`/clients/${client.id}`} className="block hover:bg-muted p-3 rounded-lg -m-3">
              <p className="text-xl font-semibold text-foreground">{client.name}</p>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {client.location}
              </p>
              {client.phone && (
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <Phone className="w-4 h-4" />
                  {client.phone}
                </p>
              )}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCcw className="w-5 h-5 text-primary" />
              Source Cycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link to={`/cycles/${cycle?.id}`} className="block hover:bg-muted p-3 rounded-lg -m-3">
              <p className="text-xl font-semibold text-foreground">
                {cycle?.supplierName || `Cycle ${cycle?.id.slice(0, 6)}`}
              </p>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="w-4 h-4" />
                Started {new Date(cycle?.startDate || '').toLocaleDateString()}
              </p>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Order Summary */}
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-6 mb-6">
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Total Weight</p>
              <p className="text-2xl font-bold">{order.totalWeightKg} kg</p>
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Price per kg</p>
              <p className="text-2xl font-bold">GH₵ {order.pricePerKg}</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-primary">GH₵ {orderTotal.toLocaleString()}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Roll Breakdown ({order.rolls.length} rolls)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {order.rolls.map((roll) => (
                <div key={roll.id} className="p-3 rounded-lg border text-center">
                  <p className="text-sm text-muted-foreground">Roll {roll.rollNumber}</p>
                  <p className="text-lg font-semibold">{roll.weightKg} kg</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Info */}
      {receipt && (
        <Card className="no-print border-success">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <ReceiptIcon className="w-5 h-5" />
              Receipt Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Receipt Number</p>
                <p className="font-semibold">{receipt.receiptNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-semibold capitalize">{receipt.paymentMethod.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Amount Paid</p>
                <p className="font-semibold text-success">GH₵ {receipt.amountPaid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className={`font-semibold ${receipt.balance > 0 ? 'text-destructive' : 'text-success'}`}>
                  GH₵ {receipt.balance.toLocaleString()}
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
            <DialogDescription>
              Enter payment details to generate the receipt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="form-label">Payment Method</label>
              <Select 
                value={receiptData.paymentMethod} 
                onValueChange={(v) => setReceiptData(prev => ({ ...prev, paymentMethod: v as any }))}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="form-label">Transport Cost (GH₵)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={receiptData.transportCost}
                onChange={(e) => setReceiptData(prev => ({ ...prev, transportCost: e.target.value }))}
                className="h-12"
              />
            </div>
            <div>
              <label className="form-label">Amount Paid (GH₵)</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={receiptData.amountPaid}
                onChange={(e) => setReceiptData(prev => ({ ...prev, amountPaid: e.target.value }))}
                placeholder={orderTotal.toString()}
                className="h-12"
              />
            </div>
            <div className="p-4 rounded-lg bg-muted">
              <div className="flex justify-between mb-1">
                <span>Order Total</span>
                <span>GH₵ {orderTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Transport</span>
                <span>GH₵ {parseFloat(receiptData.transportCost) || 0}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Grand Total</span>
                <span>GH₵ {(orderTotal + (parseFloat(receiptData.transportCost) || 0)).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateReceipt}>
              Generate & Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
