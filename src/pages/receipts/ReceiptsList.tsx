import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { 
  Search, 
  Receipt as ReceiptIcon,
  Calendar,
  Printer,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function ReceiptsList() {
  const { receipts, orders, clients, getOrderById, getClientById } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReceipts = receipts
    .filter(receipt => {
      const order = getOrderById(receipt.orderId);
      const client = order ? getClientById(order.clientId) : null;
      return receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Receipts
          </h1>
          <p className="text-muted-foreground mt-1">
            View and reprint past receipts
          </p>
        </div>
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

      {/* Receipts Table */}
      {filteredReceipts.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Balance</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map((receipt) => {
                    const order = getOrderById(receipt.orderId);
                    const client = order ? getClientById(order.clientId) : null;
                    const orderTotal = order ? order.totalWeightKg * order.pricePerKg : 0;

                    return (
                      <tr key={receipt.id}>
                        <td>
                          <span className="font-mono font-semibold text-primary">
                            {receipt.receiptNumber}
                          </span>
                        </td>
                        <td>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(receipt.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <Link 
                            to={`/clients/${order?.clientId}`}
                            className="font-semibold text-foreground hover:text-primary hover:underline"
                          >
                            {client?.name || 'Unknown'}
                          </Link>
                        </td>
                        <td className="font-semibold">
                          GH₵ {(orderTotal + receipt.transportCost).toLocaleString()}
                        </td>
                        <td>
                          <span className="capitalize">{receipt.paymentMethod.replace('_', ' ')}</span>
                        </td>
                        <td>
                          <span className={receipt.balance > 0 ? 'text-destructive font-semibold' : 'text-success'}>
                            GH₵ {receipt.balance.toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <Link to={`/orders/${receipt.orderId}`}>
                            <Button size="sm" variant="ghost">
                              <Printer className="w-4 h-4 mr-1" />
                              View
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
                : 'Receipts will appear here once you generate them from orders'
              }
            </p>
            <Link to="/orders">
              <Button>
                View Orders <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
