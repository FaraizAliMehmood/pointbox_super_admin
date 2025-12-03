import { useState, useEffect } from 'react';
import { Search, CheckCircle, Eye, X, Download, AlertCircle, Filter, XCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { Transaction } from '../types';
import apiService from '../services/api';

const Transactions = () => {
  const { t } = useLanguage();
  const [_transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [showNoDataModal, setShowNoDataModal] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    transactionId: '',
    customerName: '',
    customerEmail: '',
    companyName: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
  });
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Load transactions when transaction ID filter is used for API call
    if (filters.transactionId.trim()) {
      loadTransactions(filters.transactionId);
    } else {
      loadTransactions();
    }
  }, [filters.transactionId]);

  useEffect(() => {
    // Apply filters whenever transactions or filters change
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_transactions, filters.transactionId, filters.customerName, filters.customerEmail, filters.companyName, filters.startDate, filters.endDate, filters.startTime, filters.endTime]);

  const loadTransactions = async (transactionId?: string) => {
    try {
      setLoading(true);
      const response = await apiService.getTransactions(transactionId);
      if (response.success && response.data) {
        const mappedTransactions: Transaction[] = response.data.map((t: any) => ({
          id: t.transactionId || t._id || t.id,
          customerId: t.customer?._id || t.customer || '',
          customerName: t.customer?.username || t.customer?.name || 'Unknown',
          customerEmail: t.customer?.email || '',
          companyName: t.company?.companyName || t.company?.name || t.brand || '',
          amount:
            typeof t.redeem_points === 'number'
              ? t.redeem_points
              : t.amount ?? t.points ?? 0,
          type: t.type === 'redeem' ? 'redeem' : 'earn',
          status: t.status || 'completed',
          description: t.description || t.notes || '',
          createdAt: t.createdAt || new Date().toISOString(),
        }));
        setTransactions(mappedTransactions);
        // Apply filters after loading
        setTimeout(() => applyFilters(), 0);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [..._transactions];
    
    // If no transactions loaded yet, don't filter
    if (filtered.length === 0) {
      setFilteredTransactions([]);
      return;
    }

    // Filter by Transaction ID
    if (filters.transactionId.trim()) {
      filtered = filtered.filter((t) =>
        t.id.toLowerCase().includes(filters.transactionId.toLowerCase().trim())
      );
    }

    // Filter by Customer Name
    if (filters.customerName.trim()) {
      filtered = filtered.filter((t) =>
        t.customerName.toLowerCase().includes(filters.customerName.toLowerCase().trim())
      );
    }

    // Filter by Customer Email
    if (filters.customerEmail.trim()) {
      filtered = filtered.filter((t) =>
        t.customerEmail?.toLowerCase().includes(filters.customerEmail.toLowerCase().trim())
      );
    }

    // Filter by Company Name
    if (filters.companyName.trim()) {
      filtered = filtered.filter((t) =>
        (t.companyName || '').toLowerCase().includes(filters.companyName.toLowerCase().trim())
      );
    }

    // Filter by Date Range
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.createdAt);
        const startDateTime = filters.startDate
          ? new Date(
              `${filters.startDate}T${filters.startTime || '00:00'}:00`
            )
          : null;
        const endDateTime = filters.endDate
          ? new Date(
              `${filters.endDate}T${filters.endTime || '23:59'}:59`
            )
          : null;

        if (startDateTime && transactionDate < startDateTime) {
          return false;
        }
        if (endDateTime && transactionDate > endDateTime) {
          return false;
        }
        return true;
      });
    }

    setFilteredTransactions(filtered);
  };

  const clearFilters = () => {
    setFilters({
      transactionId: '',
      customerName: '',
      customerEmail: '',
      companyName: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.transactionId.trim() ||
      filters.customerName.trim() ||
      filters.customerEmail.trim() ||
      filters.companyName.trim() ||
      filters.startDate ||
      filters.endDate
    );
  };

  const handleView = (transaction: Transaction) => {
    setViewingTransaction(transaction);
    setShowViewModal(true);
  };

  const handleRedeem = (_id: string) => {
    // Note: Transaction status update might not be available in the API
    alert('Transaction status update is not yet implemented in the API');
  };

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      setShowNoDataModal(true);
      return;
    }

    // Define CSV headers
    const headers = [
      'Transaction ID',
      'Customer Name',
      'Company Name',
      'Amount',
      'Type',
      'Status',
      'Description',
      'Created At'
    ];
    
    // Convert transactions data to CSV rows
    const csvRows = [
      headers.join(','),
      ...filteredTransactions.map(transaction => {
        const row = [
          `"${transaction.id || ''}"`,
          `"${(transaction.customerName || '').replace(/"/g, '""')}"`,
          `"${(transaction.companyName || 'N/A').replace(/"/g, '""')}"`,
          `"${transaction.amount || 0}"`,
          `"${transaction.type === 'earn' ? 'Earn' : 'Redeem'}"`,
          `"${transaction.status || ''}"`,
          `"${(transaction.description || '').replace(/"/g, '""')}"`,
          `"${new Date(transaction.createdAt).toLocaleString()}"`
        ];
        return row.join(',');
      })
    ];

    // Create CSV content
    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">{t('transactions.title')}</h1>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:shadow-lg transition-all"
          title="Export to CSV"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6 space-y-4">
          {/* Filter Toggle Button */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
            >
              <Filter size={18} />
              {t('transactions.filters') || 'Filters'}
              {hasActiveFilters() && (
                <span className="bg-white text-purple-600 rounded-full px-2 py-0.5 text-xs font-semibold">
                  {[filters.transactionId, filters.customerName, filters.customerEmail, filters.companyName, filters.startDate, filters.endDate].filter(Boolean).length}
                </span>
              )}
            </button>
            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
              >
                <XCircle size={18} />
                {t('transactions.clearFilters') || 'Clear Filters'}
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              {/* Transaction ID Filter */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={filters.transactionId}
                  onChange={(e) => setFilters({ ...filters, transactionId: e.target.value })}
                  placeholder={t('transactions.searchById') || 'Search by Transaction ID'}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                />
              </div>

              {/* Customer Name Filter */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={filters.customerName}
                  onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
                  placeholder={t('transactions.searchByCustomerName') || 'Search by Customer Name'}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                />
              </div>

              {/* Customer Email Filter */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={filters.customerEmail}
                  onChange={(e) => setFilters({ ...filters, customerEmail: e.target.value })}
                  placeholder={t('transactions.searchByEmail') || 'Search by Customer Email'}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                />
              </div>

              {/* Company Name Filter */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={filters.companyName}
                  onChange={(e) => setFilters({ ...filters, companyName: e.target.value })}
                  placeholder={t('transactions.searchByCompanyName') || 'Search by Company Name'}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                />
              </div>

              {/* Start Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('transactions.startDate') || 'Start Date'}
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                />
              </div>

              {/* Start Time Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('transactions.startTime') || 'Start Time'}
                </label>
                <input
                  type="time"
                  value={filters.startTime}
                  onChange={(e) => setFilters({ ...filters, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                  disabled={!filters.startDate}
                />
              </div>

              {/* End Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('transactions.endDate') || 'End Date'}
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                  min={filters.startDate}
                />
              </div>

              {/* End Time Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('transactions.endTime') || 'End Time'}
                </label>
                <input
                  type="time"
                  value={filters.endTime}
                  onChange={(e) => setFilters({ ...filters, endTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                  disabled={!filters.endDate}
                />
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('transactions.transactionId')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('transactions.customer')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('transactions.companyName') || 'Company Name'}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('transactions.amount')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('transactions.type')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('transactions.status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.companyName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === 'earn'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {transaction.type === 'earn' ? t('transactions.earn') : t('transactions.redeem')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {transaction.status === 'completed'
                          ? t('transactions.completed')
                          : transaction.status === 'pending'
                          ? t('transactions.pending')
                          : t('transactions.failed')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{transaction.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(transaction)}
                          className="text-green-600 hover:text-green-800"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        {transaction.status === 'pending' && transaction.type === 'redeem' && (
                          <button
                            onClick={() => handleRedeem(transaction.id)}
                            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            <CheckCircle size={16} />
                            {t('transactions.redeemTransaction')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-200">
          {filteredTransactions.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">{t('common.noData')}</div>
          ) : (
            filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-gray-50">
                <div className="mb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{transaction.id}</h3>
                      <p className="text-sm text-gray-500 mt-1">{transaction.customerName}</p>
                      {transaction.companyName && (
                        <p className="text-sm text-gray-400 mt-0.5">{transaction.companyName}</p>
                      )}
                    </div>
                    <span className="text-lg font-bold text-gray-900">{transaction.amount}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{transaction.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'earn'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {transaction.type === 'earn' ? t('transactions.earn') : t('transactions.redeem')}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {transaction.status === 'completed'
                        ? t('transactions.completed')
                        : transaction.status === 'pending'
                        ? t('transactions.pending')
                        : t('transactions.failed')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleView(transaction)}
                    className="text-green-600 hover:text-green-800 p-1"
                    title="View"
                  >
                    <Eye size={18} />
                  </button>
                  {transaction.status === 'pending' && transaction.type === 'redeem' && (
                    <button
                      onClick={() => handleRedeem(transaction.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                    >
                      <CheckCircle size={16} />
                      {t('transactions.redeemTransaction')}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showViewModal && viewingTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Transaction Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('transactions.transactionId')}</label>
                <p className="text-gray-900 font-mono">{viewingTransaction.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('transactions.customer')}</label>
                <p className="text-gray-900">{viewingTransaction.customerName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('transactions.companyName') || 'Company Name'}</label>
                <p className="text-gray-900">{viewingTransaction.companyName || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('transactions.amount')}</label>
                <p className="text-gray-900 text-lg font-semibold">{viewingTransaction.amount}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('transactions.type')}</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  viewingTransaction.type === 'earn'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {viewingTransaction.type === 'earn' ? t('transactions.earn') : t('transactions.redeem')}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('transactions.status')}</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  viewingTransaction.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : viewingTransaction.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {viewingTransaction.status === 'completed'
                    ? t('transactions.completed')
                    : viewingTransaction.status === 'pending'
                    ? t('transactions.pending')
                    : t('transactions.failed')}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <p className="text-gray-900">{viewingTransaction.description}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-gray-900">{new Date(viewingTransaction.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-3 pt-4">
                {viewingTransaction.status === 'pending' && viewingTransaction.type === 'redeem' && (
                  <button
                    onClick={() => {
                      handleRedeem(viewingTransaction.id);
                      setShowViewModal(false);
                    }}
                    className="flex-1 bg-gradient-to-br from-green-600 to-green-700 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                  >
                    Redeem Transaction
                  </button>
                )}
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Data Modal */}
      {showNoDataModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">No Data Available</h2>
              <button 
                onClick={() => setShowNoDataModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full">
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                </div>
                <p className="text-gray-700 text-center">
                  No transaction data is available to export. Please ensure there are transactions in the system before attempting to export.
                </p>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => setShowNoDataModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;

