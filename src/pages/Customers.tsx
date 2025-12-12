import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Eye, EyeOff, Loader2, AlertCircle, Download } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { Customer } from '../types';
import apiService from '../services/api';

const Customers = () => {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
    address: '',
    country: '',
    googleSignUp: false,
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCustomers();
      if (response.success && response.data) {
        const mappedCustomers: Customer[] = response.data.map((cust: any) => ({
          id: cust._id || cust.id,
          username: cust.username,
          email: cust.email,
          phoneNumber: cust.phone || cust.phoneNumber || '',
          address: cust.address || '',
          country: cust.country || '',
          googleSignUp: cust.isGoogleSignup || cust.googleSignUp || false,
          createdAt: cust.createdAt || new Date().toISOString(),
          deviceToken: cust.deviceToken || cust.device_token || '',
        }));
        setCustomers(mappedCustomers);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (!editingCustomer) {
        // Create customer
        const response = await apiService.createCustomer({
          username: formData.username,
          email: formData.email,
          password: formData.password && formData.password.trim() ? formData.password : undefined,
          phone: formData.phoneNumber,
          address: formData.address,
          country: formData.country,
          isGoogleSignup: formData.googleSignUp,
        });
        if (response.success) {
          await loadCustomers();
          setShowModal(false);
          setShowPassword(false);
          setFormData({
            username: '',
            email: '',
            password: '',
            phoneNumber: '',
            address: '',
            country: '',
            googleSignUp: false,
          });
        } else {
          throw new Error(response.message || 'Failed to create customer');
        }
      } else {
        // Update customer
        const updateData: any = {
          username: formData.username,
          email: formData.email,
          phone: formData.phoneNumber,
          address: formData.address,
          country: formData.country,
          isGoogleSignup: formData.googleSignUp,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        const response = await apiService.updateCustomer(editingCustomer.id, updateData);
        if (response.success) {
          await loadCustomers();
          setShowModal(false);
          setShowPassword(false);
          setEditingCustomer(null);
          setFormData({
            username: '',
            email: '',
            password: '',
            phoneNumber: '',
            address: '',
            country: '',
            googleSignUp: false,
          });
        } else {
          throw new Error(response.message || 'Failed to update customer');
        }
      }
    } catch (error: any) {
      console.error('Error saving customer:', error);
      const errorMsg = error?.response?.message || error?.message || 'Failed to save customer. Please try again.';
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = (customer: Customer) => {
    setViewingCustomer(customer);
    setShowViewModal(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      username: customer.username,
      email: customer.email,
      password: '',
      phoneNumber: customer.phoneNumber,
      address: customer.address,
      country: customer.country,
      googleSignUp: customer.googleSignUp,
    });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    
    try {
      setDeleting(customerToDelete.id);
      const response = await apiService.deleteCustomer(customerToDelete.id);
      if (response.success) {
        await loadCustomers();
        setShowDeleteModal(false);
        setCustomerToDelete(null);
      }
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      const errorMsg = error?.response?.message || error?.message || 'Failed to delete customer. Please try again.';
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setCustomerToDelete(null);
  };

  const exportToCSV = () => {
    if (customers.length === 0) {
      alert('No customers to export');
      return;
    }

    // Define CSV headers
    const headers = ['Username', 'Email', 'Phone', 'Address', 'Country', 'Google Sign Up', 'Created At'];
    
    // Convert customers data to CSV rows
    const csvRows = [
      headers.join(','),
      ...customers.map(customer => {
        const row = [
          `"${customer.username || ''}"`,
          `"${customer.email || ''}"`,
          `"${customer.phoneNumber || ''}"`,
          `"${(customer.address || '').replace(/"/g, '""')}"`,
          `"${customer.country || ''}"`,
          `"${customer.googleSignUp ? 'Yes' : 'No'}"`,
          `"${new Date(customer.createdAt).toLocaleString()}"`
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
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const countries = [ 'UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain',
    'Oman', 'Jordan', 'Lebanon', 'Egypt', 'Iraq','Syria'];

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
        <h1 className="text-3xl font-bold text-gray-800">{t('customers.title')}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            disabled={customers.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export to CSV"
          >
            <Download size={20} />
            Export CSV
          </button>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setFormData({
                username: '',
                email: '',
                password: '',
                phoneNumber: '',
                address: '',
                country: '',
                googleSignUp: false,
              });
              setShowPassword(false);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            {t('customers.createCustomer')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Country</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Google Sign Up</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {customer.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phoneNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.country}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.googleSignUp ? t('customers.yes') : t('customers.no')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(customer)}
                          className="text-green-600 hover:text-green-800"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(customer)}
                          disabled={deleting === customer.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          {deleting === customer.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
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
          {customers.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">{t('common.noData')}</div>
          ) : (
            customers.map((customer) => (
              <div key={customer.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{customer.username}</h3>
                    <p className="text-sm text-gray-500 mb-1">{customer.email}</p>
                    <div className="space-y-1 mt-2">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Phone:</span> {customer.phoneNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Country:</span> {customer.country}
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Google Sign Up:</span>{' '}
                        {customer.googleSignUp ? t('customers.yes') : t('customers.no')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleView(customer)}
                      className="text-green-600 hover:text-green-800 p-1"
                      title="View"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(customer)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(customer)}
                      disabled={deleting === customer.id}
                      className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete"
                    >
                      {deleting === customer.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingCustomer ? t('customers.editCustomer') || 'Edit Customer' : t('customers.createCustomer')}
              </h2>
              <button onClick={() => {
                setShowModal(false);
                setShowPassword(false);
              }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('customers.username')}</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.email')}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                {!editingCustomer && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.password')}</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('customers.phoneNumber')}</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('customers.address')}</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('customers.country')}</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.googleSignUp}
                    onChange={(e) => setFormData({ ...formData, googleSignUp: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">{t('customers.googleSignUp')}</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {t('common.saving') || 'Saving...'}
                    </>
                  ) : (
                    t('common.save')
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setShowPassword(false);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewingCustomer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Customer Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('customers.username')}</label>
                  <p className="text-gray-900">{viewingCustomer.username}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
                  <p className="text-gray-900">{viewingCustomer.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('customers.phoneNumber')}</label>
                  <p className="text-gray-900">{viewingCustomer.phoneNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('customers.country')}</label>
                  <p className="text-gray-900">{viewingCustomer.country}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('customers.address')}</label>
                  <p className="text-gray-900">{viewingCustomer.address}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('customers.googleSignUp')}</label>
                  <p className="text-gray-900">{viewingCustomer.googleSignUp ? t('customers.yes') : t('customers.no')}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-gray-900">{new Date(viewingCustomer.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingCustomer);
                  }}
                  className="flex-1 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Edit Customer
                </button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && customerToDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Delete Customer</h2>
              <button 
                onClick={handleDeleteCancel}
                className="text-gray-400 hover:text-gray-600"
                disabled={deleting === customerToDelete.id}
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                  <Trash2 className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-gray-700 text-center mb-2">
                  Are you sure you want to delete this customer?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <p className="text-sm font-medium text-gray-900">Customer Details:</p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Name:</span> {customerToDelete.username}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {customerToDelete.email}
                  </p>
                </div>
                <p className="text-sm text-red-600 text-center mt-4">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleting === customerToDelete.id}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting === customerToDelete.id}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting === customerToDelete.id ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Customer'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Error</h2>
              <button 
                onClick={() => setShowErrorModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-gray-700 text-center">
                  {errorMessage}
                </p>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
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

export default Customers;

