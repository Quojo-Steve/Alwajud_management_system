import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { axiosService } from '@/utils/axiosServices';
import {
  Search, Receipt as ReceiptIcon, Calendar, Printer, ArrowRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function ReceiptsList() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    axiosService('get', '/receipts')
      .then(setReceipts)
      .catch(() => toast({ title: "Error", description: "Failed to load receipts.", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = receipts
    .filter(r =>
      r.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdate).getTime() - new Date(a.createdate).getTime());

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Receipts</h1>
          <p className="text-muted-foreground mt-1">View and reprint past receipts</p>
        </div>
        {/* Summary strip */}
        {receipts.length > 0 && (
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{receipts.length}</p>
              <p className="text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                GH₵ {receipts.reduce((s, r) => s + Number(r.amount_paid), 0).toLocaleString()}
              </p>
              <p className="text-muted-foreground">Collected</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">
                GH₵ {receipts.reduce((s, r) => s + Number(r.balance), 0).toLocaleString()}
              </p>
              <p className="text-muted-foreground">Outstanding</p>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search by receipt number or client name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 text-lg"
        />
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Location</th>
                    <th>Order Total</th>
                    <th>Transport</th>
                    <th>Grand Total</th>
                    <th>Paid</th>
                    <th>Payment</th>
                    <th>Balance</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((receipt) => {
                    const orderTotal = Number(receipt.total_weight_kg) * Number(receipt.price_per_kg);
                    const transport = Number(receipt.transport_cost);
                    const grandTotal = orderTotal + transport;

                    return (
                      <tr key={receipt.id}>
                        <td>
                          <span className="font-mono font-semibold text-primary">
                            {receipt.receipt_number}
                          </span>
                        </td>
                        <td>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(receipt.createdate).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/clients/${receipt.order_id}`}
                            className="font-semibold text-foreground hover:text-primary hover:underline"
                          >
                            {receipt.client_name}
                          </Link>
                        </td>
                        <td className="text-muted-foreground text-sm">{receipt.client_location}</td>
                        <td>GH₵ {orderTotal.toLocaleString()}</td>
                        <td>{transport > 0 ? `GH₵ ${transport.toLocaleString()}` : '—'}</td>
                        <td className="font-semibold">GH₵ {grandTotal.toLocaleString()}</td>
                        <td className="text-success font-semibold">
                          GH₵ {Number(receipt.amount_paid).toLocaleString()}
                        </td>
                        <td>{receipt.payment_method}</td>
                        <td>
                          <span className={Number(receipt.balance) > 0 ? 'text-destructive font-semibold' : 'text-success'}>
                            GH₵ {Number(receipt.balance).toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <Link to={`/orders/${receipt.order_id}`}>
                            <Button size="sm" variant="ghost">
                              <Printer className="w-4 h-4 mr-1" /> View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <ReceiptIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No receipts found</h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? 'Try adjusting your search'
                : 'Receipts will appear here once you generate them from orders'}
            </p>
            <Link to="/orders">
              <Button>View Orders <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}