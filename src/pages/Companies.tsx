import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, X, Eye, EyeOff, Upload, Image as ImageIcon, MapPin, Globe, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { Company } from '../types';
import apiService from '../services/api';

const Companies = () => {
  const { t } = useLanguage();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<{ id: string; name: string } | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    vatNumber: '',
    logo: '',
    address: '',
    country: '',
    phone: '',
    email: '',
    password: '',
    employeeCount: '',
    isActive: true
  });
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [uploadedLogoFile, setUploadedLogoFile] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // List of countries
  const countries = [
     'UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain',
    'Oman', 'Jordan', 'Lebanon', 'Egypt', 'Iraq','Syria'
  ];

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCompanies();
      if (response.success && response.data) {
        const mappedCompanies: Company[] = response.data.map((comp: any) => ({
          id: comp._id || comp.id,
          name: comp.companyName,
          licenseNumber: comp.licenseNumber || '',
          vatNumber: comp.vatNumber || '',
          logo: comp.logo || comp.companyLogo,
          address: comp.address,
          country: comp.country,
          phone: comp.phone,
          email: comp.email,
          employeeCount: comp.employeeCount,
          createdAt: comp.createdAt || new Date().toISOString(),
          isActive: comp.isActive !== false,
        }));
        setCompanies(mappedCompanies);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }

      setUploadedLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData(prev => ({ ...prev, logo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      // Create FormData
      const formDataToSend = new FormData();
      
      formDataToSend.append('companyName', formData.name);
      formDataToSend.append('licenseNumber', formData.licenseNumber);
      formDataToSend.append('vatNumber', formData.vatNumber);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('country', formData.country);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('email', formData.email);
      if (formData.employeeCount) {
        formDataToSend.append('employeeCount', formData.employeeCount);
      }
      formDataToSend.append('isActive', formData.isActive.toString());
      
      // Append logo file if uploaded
      if (uploadedLogoFile) {
        formDataToSend.append('logo', uploadedLogoFile);
      }
      
      if (editingCompany) {
        // Update company
        // Only include password if it's been changed
        if (formData.password) {
          formDataToSend.append('password', formData.password);
        }
   
        const response = await apiService.updateCompany(editingCompany.id, formDataToSend);
        if (response.success) {
          await loadCompanies();
          setShowModal(false);
          setEditingCompany(null);
          setFormData({ name: '', licenseNumber: '', vatNumber: '', logo: '', address: '', country: '', phone: '', email: '', password: '', employeeCount: '', isActive: true });
          setLogoPreview('');
          setUploadedLogoFile(null);
          setShowPassword(false);
          if (logoFileInputRef.current) {
            logoFileInputRef.current.value = '';
          }
        }
      } else {
        // Create company
        if (!formData.email || !formData.password) {
          alert('Email and password are required to create a company.');
          return;
        }
        formDataToSend.append('password', formData.password);
        const response = await apiService.createCompany(formDataToSend);
        if (response.success) {
          await loadCompanies();
          setShowModal(false);
          setFormData({ name: '', licenseNumber: '', vatNumber: '', logo: '', address: '', country: '', phone: '', email: '', password: '', employeeCount: '', isActive: true });
          setLogoPreview('');
          setUploadedLogoFile(null);
          setShowPassword(false);
          if (logoFileInputRef.current) {
            logoFileInputRef.current.value = '';
          }
        }
      }
    } catch (error) {
      console.error('Error saving company:', error);
      alert('Failed to save company. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = (company: Company) => {
    setViewingCompany(company);
    setShowViewModal(true);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      licenseNumber: company.licenseNumber,
      vatNumber: company.vatNumber,
      logo: company.logo || '',
      address: company.address || '',
      country: company.country || '',
      phone: company.phone || '',
      email: company.email || '',
      password: '',
      employeeCount: company.employeeCount?.toString() || '',
      isActive: company.isActive !== false
    });
    setLogoPreview(company.logo || '');
    setUploadedLogoFile(null);
    setShowPassword(false);
    setShowModal(true);
  };

  const handleDelete = (company: Company) => {
    setCompanyToDelete({ id: company.id, name: company.name });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;
    
    try {
      setDeleting(true);
      const response = await apiService.deleteCompany(companyToDelete.id);
      if (response.success) {
        await loadCompanies();
        setShowDeleteModal(false);
        setCompanyToDelete(null);
      } else {
        alert('Failed to delete company. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Failed to delete company. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      setTogglingStatus(id);
      const company = companies.find(comp => comp.id === id);
      if (!company) return;

      const newStatus = !company.isActive;
      const response = await apiService.toggleCompanyStatus(id, newStatus);
      if (response.success) {
        await loadCompanies();
      }
    } catch (error) {
      console.error('Error toggling company status:', error);
      alert('Failed to update company status. Please try again.');
    } finally {
      setTogglingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">{t('companies.title')}</h1>
        <button
          onClick={() => {
            setEditingCompany(null);
            setFormData({ name: '', licenseNumber: '', vatNumber: '', logo: '', address: '', country: '',phone: '', email: '', password: '', employeeCount: '', isActive: true });
            setLogoPreview('');
            setUploadedLogoFile(null);
            setShowPassword(false);
            if (logoFileInputRef.current) {
              logoFileInputRef.current.value = '';
            }
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          {t('companies.createCompany')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">VAT Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {company.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.licenseNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.vatNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          company.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {company.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(company)}
                          className="text-green-600 hover:text-green-800"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(company)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(company)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={() => toggleStatus(company.id)}
                          disabled={togglingStatus === company.id}
                          className={`px-2 py-1 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            company.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          title={company.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {togglingStatus === company.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : company.isActive ? (
                            <XCircle size={16} />
                          ) : (
                            <CheckCircle size={16} />
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
          {companies.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">{t('common.noData')}</div>
          ) : (
            companies.map((company) => (
              <div key={company.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">{company.name}</h3>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">License:</span> {company.licenseNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">VAT:</span> {company.vatNumber}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      company.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {company.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(company)}
                      className="text-green-600 hover:text-green-800 p-1"
                      title="View"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(company)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(company)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => toggleStatus(company.id)}
                      disabled={togglingStatus === company.id}
                      className={`p-1 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        company.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      title={company.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {togglingStatus === company.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : company.isActive ? (
                        <XCircle size={16} />
                      ) : (
                        <CheckCircle size={16} />
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
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingCompany ? t('companies.editCompany') : t('companies.createCompany')}
              </h2>
              <button onClick={() => {
                setShowModal(false);
                setShowPassword(false);
              }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('companies.companyName')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Email</label>
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingCompany}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder={editingCompany ? "Leave empty to keep current password" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('companies.licenseNumber')}</label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('companies.vatNumber')}</label>
                <input
                  type="text"
                  value={formData.vatNumber}
                  onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Employee Count</label>
                <input
                  type="number"
                  value={formData.employeeCount}
                  onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Enter number of employees"
                />
              </div>
              
              {/* Logo Upload */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <ImageIcon size={16} className="text-purple-600" />
                  {t('companies.logo')}
                </label>
                <div className="space-y-2">
                 
                  <div className="relative">
                    <input
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                      id="company-logo-upload"
                    />
                    <label
                      htmlFor="company-logo-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
                    >
                      <Upload size={18} className="text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {uploadedLogoFile ? uploadedLogoFile.name : t('companies.uploadLogo')}
                      </span>
                    </label>
                  </div>
                  {logoPreview && (
                    <div className="mt-2 p-2 border border-gray-200 rounded-lg">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="max-h-20 max-w-32 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500">{t('companies.logoFileInfo')}</p>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="text-purple-600" />
                  {t('companies.address')}
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-y"
                  placeholder={t('companies.addressPlaceholder')}
                />
              </div>

              {/* Country Selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Globe size={16} className="text-purple-600" />
                  {t('companies.country')}
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">{t('companies.selectCountry')}</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active/Inactive Checkbox */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 cursor-pointer"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                  {formData.isActive ? 'Active' : 'Inactive'}
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
                      <Loader2 className="w-4 h-4 animate-spin" />
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

      {showViewModal && viewingCompany && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Company Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              {viewingCompany.logo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('companies.logo')}</label>
                  <div className="p-2 border border-gray-200 rounded-lg inline-block">
                    <img
                      src={viewingCompany.logo}
                      alt="Company logo"
                      className="max-h-24 max-w-32 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('companies.companyName')}</label>
                <p className="text-gray-900">{viewingCompany.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('companies.licenseNumber')}</label>
                <p className="text-gray-900">{viewingCompany.licenseNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('companies.vatNumber')}</label>
                <p className="text-gray-900">{viewingCompany.vatNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                <p className="text-gray-900">{viewingCompany.phone}</p>
              </div>
              {viewingCompany.employeeCount !== undefined && viewingCompany.employeeCount !== null && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Count</label>
                  <p className="text-gray-900">{viewingCompany.employeeCount}</p>
                </div>
              )}
              {viewingCompany.address && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('companies.address')}</label>
                  <p className="text-gray-900">{viewingCompany.address}</p>
                </div>
              )}
              {viewingCompany.country && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('companies.country')}</label>
                  <p className="text-gray-900">{viewingCompany.country}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  viewingCompany.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {viewingCompany.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-gray-900">{new Date(viewingCompany.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingCompany);
                  }}
                  className="flex-1 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Edit Company
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
      {showDeleteModal && companyToDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Delete Company</h2>
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setCompanyToDelete(null);
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{companyToDelete.name}"</span>? 
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setCompanyToDelete(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;

