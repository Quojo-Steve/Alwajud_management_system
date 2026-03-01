import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
export interface ProductionCycle {
  id: string;
  startDate: string;
  endDate?: string;
  totalWeightKg: number;
  costPerKg: number;
  supplierName?: string;
  status: 'open' | 'closed';
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  location: string;
  phone?: string;
  imagePath?: string;
  notes?: string;
  createdAt: string;
}

export interface OrderRoll {
  id: string;
  rollNumber: number;
  weightKg: number;
}

export interface Order {
  id: string;
  clientId: string;
  cycleId: string;
  totalWeightKg: number;
  pricePerKg: number;
  rolls: OrderRoll[];
  orderDate: string;
  deliveryDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface Receipt {
  id: string;
  orderId: string;
  receiptNumber: string;
  paymentMethod: 'cash' | 'mobile_money' | 'bank_transfer';
  amountPaid: number;
  transportCost: number;
  balance: number;
  createdAt: string;
}

interface DataContextType {
  cycles: ProductionCycle[];
  clients: Client[];
  orders: Order[];
  receipts: Receipt[];
  addCycle: (cycle: Omit<ProductionCycle, 'id' | 'createdAt'>) => ProductionCycle;
  updateCycle: (id: string, updates: Partial<ProductionCycle>) => void;
  closeCycle: (id: string) => void;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Order;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  addReceipt: (receipt: Omit<Receipt, 'id' | 'createdAt'>) => Receipt;
  getClientById: (id: string) => Client | undefined;
  getCycleById: (id: string) => ProductionCycle | undefined;
  getOrderById: (id: string) => Order | undefined;
  getReceiptByOrderId: (orderId: string) => Receipt | undefined;
  getOrdersByClient: (clientId: string) => Order[];
  getOrdersByCycle: (cycleId: string) => Order[];
  getRemainingWeight: (cycleId: string) => number;
  getTotalRevenue: (startDate?: string, endDate?: string) => number;
  getClientRevenue: (clientId: string) => number;
  getClientTotalWeight: (clientId: string) => number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to generate unique IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Sample data
const sampleCycles: ProductionCycle[] = [
  {
    id: 'cycle1',
    startDate: '2024-01-15',
    totalWeightKg: 500,
    costPerKg: 5,
    supplierName: 'ABC Suppliers',
    status: 'open',
    createdAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 'cycle2',
    startDate: '2024-01-20',
    totalWeightKg: 750,
    costPerKg: 4.5,
    supplierName: 'XYZ Trading',
    status: 'open',
    createdAt: '2024-01-20T10:00:00Z'
  }
];

const sampleClients: Client[] = [
  {
    id: 'client1',
    name: 'Kumasi Rubber Works',
    location: 'Kumasi, Ashanti Region',
    phone: '+233 24 123 4567',
    notes: 'Premium customer, always pays on time',
    createdAt: '2024-01-01T08:00:00Z'
  },
  {
    id: 'client2',
    name: 'Accra Industrial Ltd',
    location: 'Tema, Greater Accra',
    phone: '+233 20 987 6543',
    createdAt: '2024-01-05T09:00:00Z'
  },
  {
    id: 'client3',
    name: 'Northern Traders',
    location: 'Tamale, Northern Region',
    phone: '+233 26 555 1234',
    notes: 'New client, requires delivery',
    createdAt: '2024-01-10T11:00:00Z'
  }
];

const sampleOrders: Order[] = [
  {
    id: 'order1',
    clientId: 'client1',
    cycleId: 'cycle1',
    totalWeightKg: 100,
    pricePerKg: 8,
    rolls: [
      { id: 'roll1', rollNumber: 1, weightKg: 25 },
      { id: 'roll2', rollNumber: 2, weightKg: 25 },
      { id: 'roll3', rollNumber: 3, weightKg: 25 },
      { id: 'roll4', rollNumber: 4, weightKg: 25 }
    ],
    orderDate: '2024-01-16',
    status: 'completed',
    createdAt: '2024-01-16T14:00:00Z'
  },
  {
    id: 'order2',
    clientId: 'client2',
    cycleId: 'cycle1',
    totalWeightKg: 75,
    pricePerKg: 7.5,
    rolls: [
      { id: 'roll5', rollNumber: 1, weightKg: 25 },
      { id: 'roll6', rollNumber: 2, weightKg: 25 },
      { id: 'roll7', rollNumber: 3, weightKg: 25 }
    ],
    orderDate: '2024-01-17',
    status: 'completed',
    createdAt: '2024-01-17T10:00:00Z'
  },
  {
    id: 'order3',
    clientId: 'client3',
    cycleId: 'cycle2',
    totalWeightKg: 150,
    pricePerKg: 8.5,
    rolls: [
      { id: 'roll8', rollNumber: 1, weightKg: 30 },
      { id: 'roll9', rollNumber: 2, weightKg: 30 },
      { id: 'roll10', rollNumber: 3, weightKg: 30 },
      { id: 'roll11', rollNumber: 4, weightKg: 30 },
      { id: 'roll12', rollNumber: 5, weightKg: 30 }
    ],
    orderDate: '2024-01-21',
    status: 'pending',
    createdAt: '2024-01-21T09:00:00Z'
  }
];

const sampleReceipts: Receipt[] = [
  {
    id: 'receipt1',
    orderId: 'order1',
    receiptNumber: 'AV-2024-001',
    paymentMethod: 'mobile_money',
    amountPaid: 800,
    transportCost: 50,
    balance: 0,
    createdAt: '2024-01-16T15:00:00Z'
  },
  {
    id: 'receipt2',
    orderId: 'order2',
    receiptNumber: 'AV-2024-002',
    paymentMethod: 'cash',
    amountPaid: 562.5,
    transportCost: 0,
    balance: 0,
    createdAt: '2024-01-17T11:00:00Z'
  }
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [cycles, setCycles] = useState<ProductionCycle[]>(sampleCycles);
  const [clients, setClients] = useState<Client[]>(sampleClients);
  const [orders, setOrders] = useState<Order[]>(sampleOrders);
  const [receipts, setReceipts] = useState<Receipt[]>(sampleReceipts);

  const addCycle = (cycleData: Omit<ProductionCycle, 'id' | 'createdAt'>): ProductionCycle => {
    const newCycle: ProductionCycle = {
      ...cycleData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setCycles(prev => [...prev, newCycle]);
    return newCycle;
  };

  const updateCycle = (id: string, updates: Partial<ProductionCycle>) => {
    setCycles(prev => prev.map(cycle => 
      cycle.id === id ? { ...cycle, ...updates } : cycle
    ));
  };

  const closeCycle = (id: string) => {
    setCycles(prev => prev.map(cycle => 
      cycle.id === id ? { ...cycle, status: 'closed', endDate: new Date().toISOString().split('T')[0] } : cycle
    ));
  };

  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setClients(prev => [...prev, newClient]);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(client => 
      client.id === id ? { ...client, ...updates } : client
    ));
  };

  const addOrder = (orderData: Omit<Order, 'id' | 'createdAt'>): Order => {
    const newOrder: Order = {
      ...orderData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setOrders(prev => [...prev, newOrder]);
    return newOrder;
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(order => 
      order.id === id ? { ...order, ...updates } : order
    ));
  };

  const addReceipt = (receiptData: Omit<Receipt, 'id' | 'createdAt'>): Receipt => {
    const newReceipt: Receipt = {
      ...receiptData,
      id: generateId(),
      createdAt: new Date().toISOString()
    };
    setReceipts(prev => [...prev, newReceipt]);
    return newReceipt;
  };

  const getClientById = (id: string) => clients.find(c => c.id === id);
  const getCycleById = (id: string) => cycles.find(c => c.id === id);
  const getOrderById = (id: string) => orders.find(o => o.id === id);
  const getReceiptByOrderId = (orderId: string) => receipts.find(r => r.orderId === orderId);
  const getOrdersByClient = (clientId: string) => orders.filter(o => o.clientId === clientId);
  const getOrdersByCycle = (cycleId: string) => orders.filter(o => o.cycleId === cycleId);

  const getRemainingWeight = (cycleId: string): number => {
    const cycle = getCycleById(cycleId);
    if (!cycle) return 0;
    const usedWeight = orders
      .filter(o => o.cycleId === cycleId)
      .reduce((sum, o) => sum + o.totalWeightKg, 0);
    return cycle.totalWeightKg - usedWeight;
  };

  const getTotalRevenue = (startDate?: string, endDate?: string): number => {
    let filteredOrders = orders;
    if (startDate) {
      filteredOrders = filteredOrders.filter(o => o.orderDate >= startDate);
    }
    if (endDate) {
      filteredOrders = filteredOrders.filter(o => o.orderDate <= endDate);
    }
    return filteredOrders.reduce((sum, o) => sum + (o.totalWeightKg * o.pricePerKg), 0);
  };

  const getClientRevenue = (clientId: string): number => {
    return orders
      .filter(o => o.clientId === clientId)
      .reduce((sum, o) => sum + (o.totalWeightKg * o.pricePerKg), 0);
  };

  const getClientTotalWeight = (clientId: string): number => {
    return orders
      .filter(o => o.clientId === clientId)
      .reduce((sum, o) => sum + o.totalWeightKg, 0);
  };

  return (
    <DataContext.Provider value={{
      cycles, clients, orders, receipts,
      addCycle, updateCycle, closeCycle,
      addClient, updateClient,
      addOrder, updateOrder,
      addReceipt,
      getClientById, getCycleById, getOrderById, getReceiptByOrderId,
      getOrdersByClient, getOrdersByCycle,
      getRemainingWeight, getTotalRevenue,
      getClientRevenue, getClientTotalWeight
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
