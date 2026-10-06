import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Printer, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Receipt, 
  Copy, 
  Eye, 
  Edit3, 
  Save, 
  ArrowLeft,
  Building,
  Calendar,
  Layers,
  Send,
  Mail,
  MessageSquare,
  Check,
  History,
  PhoneCall,
  X,
  CreditCard,
  QrCode
} from 'lucide-react';

const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR - ₹)' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD - $)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR - €)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP - £)' }
];

const INITIAL_COMPANY_DETAILS = {
  name: 'Sree Maruthi Traders',
  email: 'sreemaruthitraders@gmail.com',
  phone: '9042042454',
  taxId: '33AABCS1234F1Z8', // Tamil Nadu GST (State code 33)
  address: 'No. 59, SPH Road, Manavala Nagar, Tiruvallur - 602002',
  upiId: '9042042454@upi',
  bankInfo: 'Bank: State Bank of India\nA/C No: 394820194821\nIFSC: SBIN0001234\nBranch: Tiruvallur SPH Road',
  currency: 'INR'
};

const DEFAULT_INVOICES = [
  {
    id: 'inv_101',
    invoiceNumber: 'SMT-2026-001',
    date: '2026-10-05',
    dueDate: '2026-10-19',
    status: 'Paid',
    currency: 'INR',
    client: {
      name: 'Balaji Hardware & Electricals',
      email: 'balajihardware.tvl@gmail.com',
      phone: '9840123456',
      address: 'Main Bazaar Road, Tiruvallur'
    },
    items: [
      { id: '1', description: 'UltraTech Cement (50kg Bag)', hsn: '2523', quantity: 60, unitPrice: 380, taxRate: 18, discount: 2 },
      { id: '2', description: 'TMT Steel Rods 12mm (Bundle)', hsn: '7214', quantity: 20, unitPrice: 1850, taxRate: 18, discount: 0 }
    ],
    shipping: 400,
    notes: 'Thank you for your order! All goods supplied as per Tamil Nadu GST regulations.',
    terms: 'Payment due within 14 days. Goods once sold will not be taken back.',
    dispatches: [
      { channel: 'WhatsApp', recipient: '9840123456', timestamp: '05/10/2026, 11:20 AM' }
    ]
  },
  {
    id: 'inv_102',
    invoiceNumber: 'SMT-2026-002',
    date: '2026-10-06',
    dueDate: '2026-10-20',
    status: 'Pending',
    currency: 'INR',
    client: {
      name: 'Karthik Construction & Co',
      email: 'karthikbuilder@gmail.com',
      phone: '9444556677',
      address: 'Near Collectorate, Master Plan Complex, Tiruvallur'
    },
    items: [
      { id: '1', description: 'PVC Conduit Pipes 25mm (Bundle)', hsn: '3917', quantity: 15, unitPrice: 520, taxRate: 18, discount: 5 },
      { id: '2', description: 'Brass Ball Valve 1 inch', hsn: '8481', quantity: 30, unitPrice: 240, taxRate: 18, discount: 0 }
    ],
    shipping: 150,
    notes: 'Please scan the UPI QR code or pay to 9042042454@upi upon delivery.',
    terms: 'Interest @ 18% p.a. charged after due date.',
    dispatches: []
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [invoices, setInvoices] = useState(() => {
    try {
      const saved = localStorage.getItem('smt_billing_invoices_v1');
      return saved ? JSON.parse(saved) : DEFAULT_INVOICES;
    } catch {
      return DEFAULT_INVOICES;
    }
  });

  const [companyProfile, setCompanyProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('smt_billing_company_v1');
      return saved ? JSON.parse(saved) : INITIAL_COMPANY_DETAILS;
    } catch {
      return INITIAL_COMPANY_DETAILS;
    }
  });

  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchTargetInvoice, setDispatchTargetInvoice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedStatus, setCopiedStatus] = useState(false);

  useEffect(() => {
    localStorage.setItem('smt_billing_invoices_v1', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('smt_billing_company_v1', JSON.stringify(companyProfile));
  }, [companyProfile]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getCurrencySymbol = (code = 'INR') => {
    const match = CURRENCIES.find(c => c.code === code);
    return match ? match.symbol : '₹';
  };

  const formatCurrency = (val, code = 'INR') => {
    const num = Number(val) || 0;
    const sym = getCurrencySymbol(code);
    return `${sym}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const calculateItemTotal = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const discount = parseFloat(item.discount) || 0;
    const taxRate = parseFloat(item.taxRate) || 0;

    const baseAmount = qty * price;
    const discountVal = (baseAmount * discount) / 100;
    const taxableAmount = baseAmount - discountVal;
    const taxVal = (taxableAmount * taxRate) / 100;
    return taxableAmount + taxVal;
  };

  const computeInvoiceTotals = (invoice) => {
    if (!invoice || !invoice.items) {
      return { subtotal: 0, totalDiscount: 0, taxableValue: 0, totalTax: 0, cgst: 0, sgst: 0, shipping: 0, grandTotal: 0 };
    }
    
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    invoice.items.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const disc = parseFloat(item.discount) || 0;
      const tax = parseFloat(item.taxRate) || 0;

      const lineBase = qty * price;
      const lineDisc = (lineBase * disc) / 100;
      const lineTaxable = lineBase - lineDisc;
      const lineTax = (lineTaxable * tax) / 100;

      subtotal += lineBase;
      totalDiscount += lineDisc;
      totalTax += lineTax;
    });

    const taxableValue = subtotal - totalDiscount;
    const shipping = parseFloat(invoice.shipping) || 0;
    const grandTotal = taxableValue + totalTax + shipping;
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;

    return {
      subtotal,
      totalDiscount,
      taxableValue,
      totalTax,
      cgst,
      sgst,
      shipping,
      grandTotal
    };
  };

  const createNewBlankInvoice = () => {
    const nextNum = `SMT-2026-00${invoices.length + 1}`;
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return {
      id: 'inv_' + Date.now(),
      invoiceNumber: nextNum,
      date: today,
      dueDate: due,
      status: 'Pending',
      currency: 'INR',
      client: {
        name: '',
        email: '',
        phone: '',
        address: ''
      },
      items: [
        { id: '1', description: 'Cement / Building Materials', hsn: '2523', quantity: 1, unitPrice: 380, taxRate: 18, discount: 0 }
      ],
      shipping: 0,
      notes: 'Thank you for shopping with Sree Maruthi Traders! We appreciate your business.',
      terms: 'All disputes subject to Tiruvallur jurisdiction. Immediate settlement requested.',
      dispatches: []
    };
  };

  const generateFormattedMessage = (invoice) => {
    if (!invoice) return '';
    const totals = computeInvoiceTotals(invoice);
    const sym = getCurrencySymbol(invoice.currency);

    const itemsText = invoice.items.map((it, idx) => {
      const lineTotal = calculateItemTotal(it);
      return `${idx + 1}. *${it.description || 'Item'}* ${it.hsn ? `(HSN: ${it.hsn})` : ''}
   Qty: ${it.quantity} | Rate: ${sym}${it.unitPrice} | GST: ${it.taxRate}%${it.discount > 0 ? ` | Disc: ${it.discount}%` : ''}
   Total: ${sym}${lineTotal.toFixed(2)}`;
    }).join('\n\n');

    return `*TAX INVOICE / BILL DETAILS*
*${companyProfile.name.toUpperCase()}*
${companyProfile.address}
Contact: ${companyProfile.phone} | GSTIN: ${companyProfile.taxId}
---------------------------------
Invoice No: *${invoice.invoiceNumber}*
Date: ${invoice.date} | Due: ${invoice.dueDate}
Customer: *${invoice.client.name || 'Valued Customer'}*
Address: ${invoice.client.address || 'Local Delivery'}

*PRODUCT BREAKDOWN:*
${itemsText}

---------------------------------
*BILL SUMMARY:*
• Taxable Subtotal: ${sym}${totals.taxableValue.toFixed(2)}
• CGST (9%): ${sym}${totals.cgst.toFixed(2)}
• SGST (9%): ${sym}${totals.sgst.toFixed(2)}
${totals.shipping > 0 ? `• Transport/Delivery: +${sym}${totals.shipping.toFixed(2)}\n` : ''}👉 *GRAND TOTAL: ${sym}${totals.grandTotal.toFixed(2)}*
Status: *${invoice.status.toUpperCase()}*

*PAYMENT OPTIONS:*
• UPI ID: *${companyProfile.upiId}*
• Phone: *${companyProfile.phone}*
${companyProfile.bankInfo}

${invoice.notes}
_Thank you for choosing Sree Maruthi Traders!_`;
  };

  const recordDispatch = (invoiceId, channel, recipient) => {
    const timestamp = new Date().toLocaleString('en-IN');
    const newEntry = { channel, recipient, timestamp };

    setInvoices(prev => prev.map(inv => {
      if (inv.id === invoiceId) {
        return { ...inv, dispatches: [newEntry, ...(inv.dispatches || [])] };
      }
      return inv;
    }));

    if (currentInvoice && currentInvoice.id === invoiceId) {
      setCurrentInvoice(prev => ({
        ...prev,
        dispatches: [newEntry, ...(prev.dispatches || [])]
      }));
    }
  };

  const handleSendViaWhatsApp = (inv) => {
    const target = inv || currentInvoice;
    let rawPhone = target.client.phone ? target.client.phone.replace(/[^0-9]/g, '') : '';
    
    if (!rawPhone) {
      showToast('⚠️ Customer phone number is required to send via WhatsApp.');
      return;
    }

    // Default to Indian country code +91 if 10-digit number is provided
    if (rawPhone.length === 10) {
      rawPhone = '91' + rawPhone;
    }

    const text = encodeURIComponent(generateFormattedMessage(target));
    window.open(`https://wa.me/${rawPhone}?text=${text}`, '_blank');
    recordDispatch(target.id, 'WhatsApp', target.client.phone);
    showToast(`WhatsApp chat opened for ${target.client.name || target.client.phone}`);
  };

  const handleSendViaEmail = (inv) => {
    const target = inv || currentInvoice;
    if (!target.client.email) {
      showToast('⚠️ Customer email is required for email dispatch.');
      return;
    }
    const subject = encodeURIComponent(`Tax Invoice #${target.invoiceNumber} - Sree Maruthi Traders`);
    const body = encodeURIComponent(generateFormattedMessage(target));
    window.open(`mailto:${target.client.email}?subject=${subject}&body=${body}`, '_blank');
    recordDispatch(target.id, 'Email', target.client.email);
    showToast(`Email draft generated for ${target.client.email}`);
  };

  const handleCopySummary = (inv) => {
    const target = inv || currentInvoice;
    const text = generateFormattedMessage(target);
    navigator.clipboard.writeText(text);
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
    showToast('Invoice & Product details copied to clipboard!');
  };

  const handleSaveInvoice = (e, shouldOpenDispatch = false) => {
    if (e) e.preventDefault();
    if (!currentInvoice.client.name.trim()) {
      showToast('Please enter the Buyer / Customer Name before saving.');
      return;
    }

    const existingIndex = invoices.findIndex(i => i.id === currentInvoice.id);
    let updatedList = [...invoices];
    if (existingIndex >= 0) {
      updatedList[existingIndex] = currentInvoice;
      setInvoices(updatedList);
      showToast(`Bill #${currentInvoice.invoiceNumber} updated!`);
    } else {
      updatedList = [currentInvoice, ...invoices];
      setInvoices(updatedList);
      showToast(`Bill #${currentInvoice.invoiceNumber} saved!`);
    }

    if (shouldOpenDispatch) {
      setDispatchTargetInvoice(currentInvoice);
      setIsDispatchModalOpen(true);
    } else {
      setActiveTab('invoices');
    }
  };

  const dashboardStats = useMemo(() => {
    let totalRevenue = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    invoices.forEach(inv => {
      const totals = computeInvoiceTotals(inv);
      if (inv.status === 'Paid') {
        totalRevenue += totals.grandTotal;
        paidCount++;
      } else if (inv.status === 'Pending') {
        pendingAmount += totals.grandTotal;
        pendingCount++;
      } else if (inv.status === 'Overdue') {
        overdueAmount += totals.grandTotal;
        overdueCount++;
      }
    });

    return {
      totalRevenue,
      pendingAmount,
      overdueAmount,
      paidCount,
      pendingCount,
      overdueCount,
      totalInvoices: invoices.length
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = 
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.client.phone && inv.client.phone.includes(searchQuery)) ||
        (inv.client.email && inv.client.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'All' ? true : inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-slate-700 animate-bounce">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Top Header */}
      {}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between py-2">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-200">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                  {companyProfile.name}
                </span>
                <span className="hidden md:inline-block px-2.5 py-0.5 text-[11px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                  GST Billing
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                No. 59, SPH Road, Manavala Nagar, Tiruvallur • Ph: {companyProfile.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setCurrentInvoice(createNewBlankInvoice());
                setActiveTab('create');
              }}
              className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-700 active:scale-95 transition text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-amber-200"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Bill</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 flex space-x-6">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
            { id: 'invoices', label: 'Invoices & Bills', icon: FileText },
            { id: 'create', label: currentInvoice ? 'Bill Editor' : 'New Bill', icon: Edit3 },
            { id: 'settings', label: 'Business Profile', icon: Building }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'create' && !currentInvoice) {
                    setCurrentInvoice(createNewBlankInvoice());
                  }
                  setActiveTab(tab.id);
                }}
                className={`flex items-center space-x-2 py-3 border-b-2 text-sm font-semibold transition ${
                  isActive 
                    ? 'border-amber-600 text-amber-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* DASHBOARD TAB */}
        {}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-500/30">
                  <Send className="w-3.5 h-3.5" />
                  <span>Buyer Dispatch & WhatsApp Notification Ready</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{companyProfile.name}</h1>
                <p className="mt-1 text-slate-300 text-sm sm:text-base max-w-xl">
                  {companyProfile.address} • Contact: {companyProfile.phone}
                </p>
                <p className="mt-1 text-xs text-amber-200">
                  GSTIN: {companyProfile.taxId} | UPI Remittance: {companyProfile.upiId}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCurrentInvoice(createNewBlankInvoice());
                    setActiveTab('create');
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow transition text-sm flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate Bill</span>
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Total Settled</p>
                    <p className="text-2xl font-black text-slate-900 mt-2">{formatCurrency(dashboardStats.totalRevenue)}</p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-emerald-700 font-semibold">
                  {dashboardStats.paidCount} paid orders
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Outstanding</p>
                    <p className="text-2xl font-black text-amber-600 mt-2">{formatCurrency(dashboardStats.pendingAmount)}</p>
                  </div>
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-amber-700 font-semibold">
                  {dashboardStats.pendingCount} bills pending payment
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Overdue Invoices</p>
                    <p className="text-2xl font-black text-rose-600 mt-2">{formatCurrency(dashboardStats.overdueAmount)}</p>
                  </div>
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-rose-600 font-semibold">
                  {dashboardStats.overdueCount} require reminder
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Total Invoices</p>
                    <p className="text-2xl font-black text-indigo-600 mt-2">{dashboardStats.totalInvoices}</p>
                  </div>
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 text-xs text-indigo-600 font-semibold">
                  Recorded in Tiruvallur branch
                </div>
              </div>
            </div>

            {/* Quick Dispatch List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Recent Bills & Buyer Dispatch</h3>
                  <p className="text-slate-500 text-xs">Verify buyer delivery logs and quick-send product specifications</p>
                </div>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className="text-amber-700 hover:text-amber-800 text-sm font-bold hover:underline"
                >
                  View All Bills &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-wider">
                      <th className="pb-3 px-3">Bill #</th>
                      <th className="pb-3 px-3">Buyer / Customer</th>
                      <th className="pb-3 px-3">Amount</th>
                      <th className="pb-3 px-3">Dispatch Status</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Instant Send</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.slice(0, 5).map(inv => {
                      const totals = computeInvoiceTotals(inv);
                      const lastDispatch = inv.dispatches && inv.dispatches[0];
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-3 font-bold text-amber-700">{inv.invoiceNumber}</td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-800">{inv.client.name || 'Walk-in Customer'}</div>
                            <div className="text-xs text-slate-400">{inv.client.phone || inv.client.email || 'No phone'}</div>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900">
                            {formatCurrency(totals.grandTotal, inv.currency)}
                          </td>
                          <td className="py-3 px-3">
                            {lastDispatch ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Sent via {lastDispatch.channel}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                <span>Pending Send</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              inv.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : inv.status === 'Pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => {
                                setDispatchTargetInvoice(inv);
                                setIsDispatchModalOpen(true);
                              }}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition border border-amber-200"
                            >
                              <Send className="w-3.5 h-3.5 text-amber-700" />
                              <span>Dispatch</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ALL BILLS TAB */}
        {}
        {activeTab === 'invoices' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Invoices & Bills Directory</h1>
                <p className="text-slate-500 text-sm">Sree Maruthi Traders • No 59 SPH Road, Tiruvallur</p>
              </div>
              <button
                onClick={() => {
                  setCurrentInvoice(createNewBlankInvoice());
                  setActiveTab('create');
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm flex items-center space-x-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Bill</span>
              </button>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search bill #, buyer name, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase">Status:</span>
                {['All', 'Paid', 'Pending', 'Overdue'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      statusFilter === status 
                        ? 'bg-amber-600 text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Bills Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Bill No</th>
                      <th className="py-3.5 px-4">Customer Details</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Total Amount</th>
                      <th className="py-3.5 px-4">Buyer Notified?</th>
                      <th className="py-3.5 px-4">Payment</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredInvoices.map(inv => {
                      const totals = computeInvoiceTotals(inv);
                      const hasDispatches = inv.dispatches && inv.dispatches.length > 0;
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50 transition">
                          <td className="py-4 px-4 font-black text-amber-700">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-slate-800">{inv.client.name || 'Customer'}</p>
                            <p className="text-xs text-slate-500">
                              {inv.client.phone ? `Ph: ${inv.client.phone}` : 'No Phone'} {inv.client.address && `• ${inv.client.address.slice(0, 20)}...`}
                            </p>
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-600">{inv.date}</td>
                          <td className="py-4 px-4 font-black text-slate-900">
                            {formatCurrency(totals.grandTotal, inv.currency)}
                          </td>
                          <td className="py-4 px-4">
                            {hasDispatches ? (
                              <div>
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Sent to Buyer</span>
                                </span>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  Via {inv.dispatches[0].channel}
                                </p>
                              </div>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                <span>Not Sent</span>
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              inv.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : inv.status === 'Pending'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => {
                                  setDispatchTargetInvoice(inv);
                                  setIsDispatchModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold flex items-center space-x-1 transition"
                                title="Send details to Buyer"
                              >
                                <Send className="w-3.5 h-3.5 text-amber-700" />
                                <span>Notify</span>
                              </button>
                              <button
                                onClick={() => {
                                  setCurrentInvoice(inv);
                                  setIsPreviewOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title="Tax Invoice Print / PDF"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setCurrentInvoice(JSON.parse(JSON.stringify(inv)));
                                  setActiveTab('create');
                                }}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setInvoices(prev => prev.filter(i => i.id !== inv.id));
                                  showToast('Invoice removed');
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* BILL CREATOR / EDITOR TAB */}
        {}
        {activeTab === 'create' && currentInvoice && (
          <form onSubmit={(e) => handleSaveInvoice(e, false)} className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('invoices')}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {invoices.some(i => i.id === currentInvoice.id) ? 'Edit Tax Invoice' : 'Create Tax Invoice'}
                  </h2>
                  <p className="text-xs text-slate-500">Sree Maruthi Traders • Products will be dispatched directly to buyer</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-sm flex items-center space-x-1.5 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>GST Bill Preview</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveInvoice(e, true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center space-x-2 shadow-sm transition"
                >
                  <Send className="w-4 h-4" />
                  <span>Save & Notify Buyer</span>
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm flex items-center space-x-2 shadow-sm transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Bill</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Col (2 Columns): Line items and Bill Meta */}
              <div className="lg:col-span-2 space-y-6">
                {/* Meta details card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                    <Receipt className="w-4 h-4 text-amber-600" />
                    <span>Bill Metadata</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Invoice / Bill #</label>
                      <input
                        type="text"
                        required
                        value={currentInvoice.invoiceNumber}
                        onChange={(e) => setCurrentInvoice({ ...currentInvoice, invoiceNumber: e.target.value })}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white font-bold text-amber-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Invoice Date</label>
                      <input
                        type="date"
                        required
                        value={currentInvoice.date}
                        onChange={(e) => setCurrentInvoice({ ...currentInvoice, date: e.target.value })}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Payment Due Date</label>
                      <input
                        type="date"
                        required
                        value={currentInvoice.dueDate}
                        onChange={(e) => setCurrentInvoice({ ...currentInvoice, dueDate: e.target.value })}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Billing Currency</label>
                      <select
                        value={currentInvoice.currency}
                        onChange={(e) => setCurrentInvoice({ ...currentInvoice, currency: e.target.value })}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white font-semibold"
                      >
                        {CURRENCIES.map(curr => (
                          <option key={curr.code} value={curr.code}>{curr.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Payment Status</label>
                      <select
                        value={currentInvoice.status}
                        onChange={(e) => setCurrentInvoice({ ...currentInvoice, status: e.target.value })}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white font-semibold"
                      >
                        <option value="Pending">Pending / Unpaid</option>
                        <option value="Paid">Paid / Settled</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Line Items & Products */}
                {}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                        <Layers className="w-4 h-4 text-amber-600" />
                        <span>Products & Items (Dispatched to Buyer)</span>
                      </h3>
                      <p className="text-xs text-slate-400">Specify items, HSN/SAC codes, and GST rates</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newItem = {
                          id: Date.now().toString(),
                          description: '',
                          hsn: '2523',
                          quantity: 1,
                          unitPrice: 0,
                          taxRate: 18,
                          discount: 0
                        };
                        setCurrentInvoice({
                          ...currentInvoice,
                          items: [...currentInvoice.items, newItem]
                        });
                      }}
                      className="px-3 py-1.5 bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 rounded-xl text-xs font-bold flex items-center space-x-1 transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-700" />
                      <span>Add Product</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase font-bold">
                          <th className="pb-2 min-w-[200px]">Item Description</th>
                          <th className="pb-2 w-20">HSN</th>
                          <th className="pb-2 w-16">Qty</th>
                          <th className="pb-2 w-24">Rate ({getCurrencySymbol(currentInvoice.currency)})</th>
                          <th className="pb-2 w-16">GST%</th>
                          <th className="pb-2 w-16">Disc%</th>
                          <th className="pb-2 w-24 text-right">Total</th>
                          <th className="pb-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentInvoice.items.map((item, index) => {
                          const lineTotal = calculateItemTotal(item);
                          return (
                            <tr key={item.id}>
                              <td className="py-2.5 pr-2">
                                <input
                                  type="text"
                                  placeholder="e.g. UltraTech Cement / TMT Rods"
                                  required
                                  value={item.description}
                                  onChange={(e) => {
                                    const updated = [...currentInvoice.items];
                                    updated[index].description = e.target.value;
                                    setCurrentInvoice({ ...currentInvoice, items: updated });
                                  }}
                                  className="w-full text-sm px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500 font-medium"
                                />
                              </td>
                              <td className="py-2.5 pr-2">
                                <input
                                  type="text"
                                  placeholder="HSN"
                                  value={item.hsn || ''}
                                  onChange={(e) => {
                                    const updated = [...currentInvoice.items];
                                    updated[index].hsn = e.target.value;
                                    setCurrentInvoice({ ...currentInvoice, items: updated });
                                  }}
                                  className="w-full text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white font-mono"
                                />
                              </td>
                              <td className="py-2.5 pr-2">
                                <input
                                  type="number"
                                  min="1"
                                  step="any"
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const updated = [...currentInvoice.items];
                                    updated[index].quantity = parseFloat(e.target.value) || 0;
                                    setCurrentInvoice({ ...currentInvoice, items: updated });
                                  }}
                                  className="w-full text-sm px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                                />
                              </td>
                              <td className="py-2.5 pr-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={item.unitPrice}
                                  onChange={(e) => {
                                    const updated = [...currentInvoice.items];
                                    updated[index].unitPrice = parseFloat(e.target.value) || 0;
                                    setCurrentInvoice({ ...currentInvoice, items: updated });
                                  }}
                                  className="w-full text-sm px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white font-semibold"
                                />
                              </td>
                              <td className="py-2.5 pr-2">
                                <select
                                  value={item.taxRate}
                                  onChange={(e) => {
                                    const updated = [...currentInvoice.items];
                                    updated[index].taxRate = parseFloat(e.target.value) || 0;
                                    setCurrentInvoice({ ...currentInvoice, items: updated });
                                  }}
                                  className="w-full text-xs px-1 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white font-bold"
                                >
                                  <option value="0">0%</option>
                                  <option value="5">5%</option>
                                  <option value="12">12%</option>
                                  <option value="18">18%</option>
                                  <option value="28">28%</option>
                                </select>
                              </td>
                              <td className="py-2.5 pr-2">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="any"
                                  value={item.discount}
                                  onChange={(e) => {
                                    const updated = [...currentInvoice.items];
                                    updated[index].discount = parseFloat(e.target.value) || 0;
                                    setCurrentInvoice({ ...currentInvoice, items: updated });
                                  }}
                                  className="w-full text-sm px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white"
                                />
                              </td>
                              <td className="py-2.5 px-2 text-right font-black text-slate-800">
                                {formatCurrency(lineTotal, currentInvoice.currency)}
                              </td>
                              <td className="py-2.5 text-center">
                                {currentInvoice.items.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = currentInvoice.items.filter((_, idx) => idx !== index);
                                      setCurrentInvoice({ ...currentInvoice, items: updated });
                                    }}
                                    className="text-slate-400 hover:text-rose-600 transition p-1"
                                    title="Remove item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes and Terms */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Customer / Order Notes</label>
                      <textarea
                        rows="3"
                        value={currentInvoice.notes}
                        onChange={(e) => setCurrentInvoice({ ...currentInvoice, notes: e.target.value })}
                        className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Terms & Conditions</label>
                      <textarea
                        rows="3"
                        value={currentInvoice.terms}
                        onChange={(e) => setCurrentInvoice({ ...currentInvoice, terms: e.target.value })}
                        className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Dispatch Audit History */}
                {currentInvoice.dispatches && currentInvoice.dispatches.length > 0 && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2 mb-3">
                      <History className="w-4 h-4 text-emerald-600" />
                      <span>Buyer Notification Audit Log</span>
                    </h3>
                    <div className="space-y-2">
                      {currentInvoice.dispatches.map((log, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-amber-800">{log.channel}</span>
                            <span className="text-slate-400">&rarr;</span>
                            <span className="text-slate-700 font-medium">{log.recipient}</span>
                          </div>
                          <span className="text-slate-500">{log.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Col: Buyer Contact and Totals Summary */}
              {}
              <div className="space-y-6">
                {/* Buyer / Customer Box */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                      <Users className="w-4 h-4 text-amber-600" />
                      <span>Buyer / Customer Details</span>
                    </h3>
                    <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                      Notification Target
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Customer / Firm Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Balaji Hardware or Mr. Sundaram"
                        value={currentInvoice.client.name}
                        onChange={(e) => setCurrentInvoice({
                          ...currentInvoice,
                          client: { ...currentInvoice.client, name: e.target.value }
                        })}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center space-x-1">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Customer WhatsApp / Mobile (10 digits)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9840123456"
                        value={currentInvoice.client.phone}
                        onChange={(e) => setCurrentInvoice({
                          ...currentInvoice,
                          client: { ...currentInvoice.client, phone: e.target.value }
                        })}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center space-x-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>Customer Email</span>
                      </label>
                      <input
                        type="email"
                        placeholder="customer@email.com"
                        value={currentInvoice.client.email}
                        onChange={(e) => setCurrentInvoice({
                          ...currentInvoice,
                          client: { ...currentInvoice.client, email: e.target.value }
                        })}
                        className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Delivery / Site Address</label>
                      <textarea
                        rows="2"
                        placeholder="Site delivery address, Tiruvallur"
                        value={currentInvoice.client.address}
                        onChange={(e) => setCurrentInvoice({
                          ...currentInvoice,
                          client: { ...currentInvoice.client, address: e.target.value }
                        })}
                        className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Calculation Summary Box */}
                {(() => {
                  const totals = computeInvoiceTotals(currentInvoice);
                  return (
                    <div className="bg-gradient-to-b from-white to-amber-50/50 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <h3 className="font-bold text-slate-900 text-base">Tax & Bill Summary</h3>
                      <div className="space-y-2 text-sm pt-2">
                        <div className="flex justify-between text-slate-600">
                          <span>Gross Value</span>
                          <span className="font-semibold">{formatCurrency(totals.subtotal, currentInvoice.currency)}</span>
                        </div>
                        {totals.totalDiscount > 0 && (
                          <div className="flex justify-between text-slate-600">
                            <span>Discount Given</span>
                            <span className="font-semibold text-rose-600">-{formatCurrency(totals.totalDiscount, currentInvoice.currency)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-slate-700 font-semibold border-t border-slate-200 pt-2">
                          <span>Taxable Value</span>
                          <span>{formatCurrency(totals.taxableValue, currentInvoice.currency)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-xs">
                          <span>CGST (Central GST)</span>
                          <span className="font-semibold text-emerald-800">+{formatCurrency(totals.cgst, currentInvoice.currency)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 text-xs">
                          <span>SGST (Tamil Nadu GST)</span>
                          <span className="font-semibold text-emerald-800">+{formatCurrency(totals.sgst, currentInvoice.currency)}</span>
                        </div>

                        <div className="flex justify-between items-center pt-1 pb-1">
                          <span className="text-slate-600">Transport / Freight</span>
                          <div className="w-28">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={currentInvoice.shipping}
                              onChange={(e) => setCurrentInvoice({ ...currentInvoice, shipping: parseFloat(e.target.value) || 0 })}
                              className="w-full text-right text-sm px-2 py-1 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500 font-bold"
                            />
                          </div>
                        </div>

                        <div className="border-t-2 border-slate-900 pt-3 flex justify-between items-baseline">
                          <span className="text-base font-black text-slate-900">Total Payable</span>
                          <span className="text-2xl font-black text-amber-700">
                            {formatCurrency(totals.grandTotal, currentInvoice.currency)}
                          </span>
                        </div>
                      </div>

                      {/* Primary Action Buttons */}
                      <div className="pt-4 space-y-2">
                        <button
                          type="button"
                          onClick={(e) => handleSaveInvoice(e, true)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md shadow-emerald-200 transition flex items-center justify-center space-x-2"
                        >
                          <Send className="w-4 h-4" />
                          <span>Save & Notify Buyer Directly</span>
                        </button>

                        <button
                          type="submit"
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition flex items-center justify-center space-x-2 text-sm"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save Bill</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </form>
        )}

        {/* SETTINGS / BUSINESS PROFILE TAB */}
        {}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Sree Maruthi Traders Profile</h2>
                <p className="text-slate-500 text-sm">
                  These business details, contact numbers, and bank details are printed on all bills and transmitted to buyers.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Company / Firm Name</label>
                  <input
                    type="text"
                    value={companyProfile.name}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, name: e.target.value })}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white font-bold text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Contact Number (Primary)</label>
                    <input
                      type="text"
                      value={companyProfile.phone}
                      onChange={(e) => setCompanyProfile({ ...companyProfile, phone: e.target.value })}
                      className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={companyProfile.email}
                      onChange={(e) => setCompanyProfile({ ...companyProfile, email: e.target.value })}
                      className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">GSTIN Number (Tamil Nadu State: 33)</label>
                    <input
                      type="text"
                      value={companyProfile.taxId}
                      onChange={(e) => setCompanyProfile({ ...companyProfile, taxId: e.target.value })}
                      className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">UPI ID for Direct Customer Payment</label>
                    <input
                      type="text"
                      value={companyProfile.upiId}
                      onChange={(e) => setCompanyProfile({ ...companyProfile, upiId: e.target.value })}
                      className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Shop Address</label>
                  <textarea
                    rows="2"
                    value={companyProfile.address}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, address: e.target.value })}
                    className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Bank Remittance Instructions</label>
                  <textarea
                    rows="4"
                    value={companyProfile.bankInfo}
                    onChange={(e) => setCompanyProfile({ ...companyProfile, bankInfo: e.target.value })}
                    className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white font-mono text-xs"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => showToast('Profile details updated!')}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-sm transition"
                  >
                    Save Business Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* BUYER NOTIFICATION & DISPATCH MODAL */}
      {}
      {isDispatchModalOpen && dispatchTargetInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 to-amber-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-base">Send Bill & Product Breakdown to Buyer</span>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Buyer Contact Details Quick Update */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Customer / Buyer</span>
                  <span className="text-sm font-bold text-slate-900">{dispatchTargetInvoice.client.name || 'Customer'}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block">Invoice No</span>
                  <span className="text-sm font-black text-amber-700">{dispatchTargetInvoice.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block flex items-center space-x-1">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp / Mobile Number</span>
                  </span>
                  <input
                    type="text"
                    value={dispatchTargetInvoice.client.phone}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDispatchTargetInvoice(prev => ({
                        ...prev,
                        client: { ...prev.client, phone: val }
                      }));
                    }}
                    placeholder="e.g. 9840123456"
                    className="text-xs w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 mt-0.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase block flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Customer Email</span>
                  </span>
                  <input
                    type="email"
                    value={dispatchTargetInvoice.client.email}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDispatchTargetInvoice(prev => ({
                        ...prev,
                        client: { ...prev.client, email: val }
                      }));
                    }}
                    placeholder="Enter email address"
                    className="text-xs w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 mt-0.5"
                  />
                </div>
              </div>

              {/* Formatted Message Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex justify-between items-center">
                  <span>Message & Bill Preview</span>
                  <span className="text-xs text-slate-400 lowercase font-normal">sent to customer</span>
                </label>
                <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 text-xs font-mono whitespace-pre-wrap max-h-52 overflow-y-auto border border-slate-800 leading-relaxed select-all">
                  {generateFormattedMessage(dispatchTargetInvoice)}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleSendViaWhatsApp(dispatchTargetInvoice)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-3 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-200 transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendViaEmail(dispatchTargetInvoice)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-3 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md shadow-amber-200 transition"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send via Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopySummary(dispatchTargetInvoice)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-3 rounded-xl text-xs flex items-center justify-center space-x-2 transition border border-slate-200"
                >
                  {copiedStatus ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedStatus ? 'Copied Details!' : 'Copy Summary'}</span>
                </button>
              </div>

              {dispatchTargetInvoice.dispatches && dispatchTargetInvoice.dispatches.length > 0 && (
                <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center space-x-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Previously sent on {dispatchTargetInvoice.dispatches[0].timestamp} via {dispatchTargetInvoice.dispatches[0].channel} ({dispatchTargetInvoice.dispatches[0].recipient})
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE GST TAX INVOICE PREVIEW MODAL */}
      {}
      {isPreviewOpen && currentInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:static">
          <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:rounded-none">
            {/* Modal Bar */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm sm:text-base">Tax Invoice Preview — {currentInvoice.invoiceNumber}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setDispatchTargetInvoice(currentInvoice);
                    setIsDispatchModalOpen(true);
                  }}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 transition"
                >
                  <Send className="w-4 h-4" />
                  <span>Notify Buyer</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center space-x-2 transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Tax Invoice</span>
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs sm:text-sm transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Tax Invoice Paper */}
            <div className="p-8 sm:p-12 bg-white text-slate-800 print:p-0 print:m-0" id="tax-invoice-sheet">
              {/* Header */}
              <div className="text-center pb-4 border-b border-slate-300">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Tax Invoice / Commercial Bill</p>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">{companyProfile.name}</h1>
                <p className="text-sm font-semibold text-slate-700 mt-1">{companyProfile.address}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Phone: <span className="font-bold text-slate-900">{companyProfile.phone}</span> | Email: {companyProfile.email}
                </p>
                <div className="mt-2 inline-block px-3 py-1 bg-slate-100 rounded-md border border-slate-200">
                  <span className="text-xs font-mono font-bold text-slate-900">GSTIN: {companyProfile.taxId} (State Code 33 - Tamil Nadu)</span>
                </div>
              </div>

              {/* Invoice & Buyer meta row */}
              <div className="my-6 grid grid-cols-2 gap-6 text-xs sm:text-sm">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">Buyer (Billed To)</h4>
                  <p className="text-base font-bold text-slate-900 mt-1">{currentInvoice.client.name || 'Valued Customer'}</p>
                  <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                    {currentInvoice.client.address || 'Address not specified'}
                  </p>
                  <p className="text-xs font-semibold text-slate-700 mt-2">
                    {currentInvoice.client.phone && `Mobile: ${currentInvoice.client.phone}`}
                    {currentInvoice.client.email && ` • ${currentInvoice.client.email}`}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400">Bill Details</h4>
                    <div className="mt-1 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Invoice No:</span>
                        <span className="font-black text-amber-800">{currentInvoice.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Invoice Date:</span>
                        <span className="font-semibold text-slate-800">{currentInvoice.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Payment Due:</span>
                        <span className="font-semibold text-slate-800">{currentInvoice.dueDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-slate-500 text-xs">Payment State:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      currentInvoice.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : currentInvoice.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {currentInvoice.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border border-slate-300">
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-slate-300 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">Description of Goods</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 text-center w-16">HSN</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 text-center w-14">Qty</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 text-right w-20">Rate</th>
                      <th className="py-2.5 px-3 border-r border-slate-300 text-center w-14">GST%</th>
                      <th className="py-2.5 px-3 text-right w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentInvoice.items.map((item, i) => {
                      const total = calculateItemTotal(item);
                      return (
                        <tr key={i} className="text-slate-700">
                          <td className="py-2.5 px-3 border-r border-slate-300 text-center font-semibold">{i + 1}</td>
                          <td className="py-2.5 px-3 border-r border-slate-300">
                            <span className="font-bold text-slate-900">{item.description || 'Product / Material'}</span>
                            {item.discount > 0 && (
                              <span className="ml-2 text-xs text-rose-600 font-medium">({item.discount}% Disc)</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 border-r border-slate-300 text-center font-mono text-xs">{item.hsn || '-'}</td>
                          <td className="py-2.5 px-3 border-r border-slate-300 text-center font-semibold">{item.quantity}</td>
                          <td className="py-2.5 px-3 border-r border-slate-300 text-right">{formatCurrency(item.unitPrice, currentInvoice.currency)}</td>
                          <td className="py-2.5 px-3 border-r border-slate-300 text-center font-medium">{item.taxRate}%</td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900">
                            {formatCurrency(total, currentInvoice.currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals and Bank section */}
              {(() => {
                const totals = computeInvoiceTotals(currentInvoice);
                return (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div className="text-xs text-slate-600 space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                        <CreditCard className="w-4 h-4 text-amber-600" />
                        <span>Remittance & Payment Options:</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">UPI ID for Google Pay / PhonePe:</span>
                        <p className="font-mono text-amber-800 font-bold">{companyProfile.upiId}</p>
                      </div>
                      <div className="whitespace-pre-line font-mono text-[11px] leading-relaxed">
                        {companyProfile.bankInfo}
                      </div>
                      {currentInvoice.notes && (
                        <div className="pt-2 border-t border-slate-200">
                          <span className="font-semibold text-slate-700">Customer Notes: </span>
                          <span>{currentInvoice.notes}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>Taxable Amount:</span>
                        <span className="font-semibold">{formatCurrency(totals.taxableValue, currentInvoice.currency)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>CGST (Central Tax):</span>
                        <span className="font-semibold text-emerald-800">+{formatCurrency(totals.cgst, currentInvoice.currency)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>SGST (Tamil Nadu Tax):</span>
                        <span className="font-semibold text-emerald-800">+{formatCurrency(totals.sgst, currentInvoice.currency)}</span>
                      </div>
                      {totals.shipping > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Freight / Transport:</span>
                          <span className="font-semibold">+{formatCurrency(totals.shipping, currentInvoice.currency)}</span>
                        </div>
                      )}
                      <div className="border-t-2 border-slate-900 pt-2 flex justify-between font-black text-base text-slate-900">
                        <span>Grand Total Payable:</span>
                        <span className="text-amber-800">{formatCurrency(totals.grandTotal, currentInvoice.currency)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Signatures */}
              <div className="mt-12 pt-8 flex justify-between items-end text-xs text-slate-500">
                <div>
                  <p>Customer Signature</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">For {companyProfile.name}</p>
                  <div className="h-12"></div>
                  <p className="border-t border-slate-300 pt-1 font-semibold">Authorised Signatory</p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
                Sree Maruthi Traders • No 59 SPH Road, Manavala Nagar, Tiruvallur • Ph: {companyProfile.phone}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}