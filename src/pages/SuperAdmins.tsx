import { useState, useEffect } from 'react';
import { Loader2, Eye, Key, X, EyeOff, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import apiService from '../services/api';

interface SuperAdmin {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

const SuperAdmins = () => {
  const { t } = useLanguage();
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [viewingAdmin, setViewingAdmin] = useState<SuperAdmin | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  useEffect(() => {
    loadSuperAdmins();
  }, []);

  const loadSuperAdmins = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSuperAdmins();
      if (response.success && response.data) {
        // Map API response to SuperAdmin type
        const mappedSuperAdmins: SuperAdmin[] = response.data.map((admin: any) => ({
          id: admin._id || admin.id,
          username: admin.username,
          email: admin.email,
          isActive: admin.isActive !== false,
          createdAt: admin.createdAt || new Date().toISOString(),
        }));
        setSuperAdmins(mappedSuperAdmins);
      }
    } catch (error) {
      console.error('Error loading super admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const handleView = (admin: SuperAdmin) => {
    setViewingAdmin(admin);
    setShowViewModal(true);
  };

  const handleChangePassword = (admin: SuperAdmin) => {
    setViewingAdmin(admin);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setPasswordError(null);
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!viewingAdmin) return;

    // Set loading state immediately on button click to show spinner
    setChangingPassword(true);
    setPasswordError(null);

    // Small delay to ensure spinner is visible
    await new Promise(resolve => setTimeout(resolve, 100));

    // Validate passwords
    if (passwordForm.newPassword.length < 6) {
      setPasswordError(t('superAdmins.passwordMinLength') || 'Password must be at least 6 characters long');
      setChangingPassword(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('superAdmins.passwordMismatch') || 'New password and confirm password do not match');
      setChangingPassword(false);
      return;
    }

    // Validate current password is provided
    if (!passwordForm.currentPassword) {
      setPasswordError(t('superAdmins.currentPasswordRequired') || 'Current password is required');
      setChangingPassword(false);
      return;
    }

    try {
      const response = await apiService.updateSuperAdminPassword(
        viewingAdmin.id,
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      if (response.success) {
        // Show custom success popup
        setSuccessMessage(t('superAdmins.passwordUpdated') || 'Password updated successfully');
        setShowSuccessPopup(true);
        setShowPasswordModal(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setPasswordError(null);
        
        // Auto-close success popup after 3 seconds
        setTimeout(() => {
          setShowSuccessPopup(false);
        }, 3000);
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      setPasswordError(error.message || t('superAdmins.passwordUpdateError') || 'Failed to update password. Please check your current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">{t('superAdmins.title')}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('superAdmins.username')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('superAdmins.email')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('superAdmins.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('superAdmins.createdAt')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('superAdmins.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {superAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                superAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{admin.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{admin.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          admin.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {admin.isActive ? t('superAdmins.active') : t('superAdmins.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(admin.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(admin)}
                          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
                          title={t('superAdmins.viewDetails') || 'View Details'}
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleChangePassword(admin)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                          title={t('superAdmins.changePassword') || 'Change Password'}
                        >
                          <Key size={18} />
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
          {superAdmins.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">{t('common.noData')}</div>
          ) : (
            superAdmins.map((admin) => (
              <div key={admin.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{admin.username}</h3>
                    <p className="text-sm text-gray-500 mb-2">{admin.email}</p>
                    <p className="text-xs text-gray-400">{formatDate(admin.createdAt)}</p>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      admin.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {admin.isActive ? t('superAdmins.active') : t('superAdmins.inactive')}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleView(admin)}
                    className="flex items-center gap-1 px-3 py-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                  >
                    <Eye size={14} />
                    {t('superAdmins.view') || 'View'}
                  </button>
                  <button
                    onClick={() => handleChangePassword(admin)}
                    className="flex items-center gap-1 px-3 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Key size={14} />
                    {t('superAdmins.changePassword') || 'Change Password'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* View Details Modal */}
      {showViewModal && viewingAdmin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">{t('superAdmins.viewDetails') || 'Super Admin Details'}</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('superAdmins.username')}</label>
                <p className="text-gray-900">{viewingAdmin.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('superAdmins.email')}</label>
                <p className="text-gray-900">{viewingAdmin.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('superAdmins.status')}</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  viewingAdmin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {viewingAdmin.isActive ? t('superAdmins.active') : t('superAdmins.inactive')}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('superAdmins.createdAt')}</label>
                <p className="text-gray-900">{formatDateTime(viewingAdmin.createdAt)}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleChangePassword(viewingAdmin);
                  }}
                  className="flex items-center justify-center gap-2 flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  <Key size={18} />
                  {t('superAdmins.changePassword') || 'Change Password'}
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  {t('common.close') || 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && viewingAdmin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">{t('superAdmins.changePassword') || 'Change Password'}</h2>
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError(null);
                }} 
                className="text-gray-400 hover:text-gray-600"
                disabled={changingPassword}
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  {t('superAdmins.changePasswordFor') || 'Changing password for'}: <span className="font-semibold">{viewingAdmin.username}</span>
                </p>
              </div>
              
              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('superAdmins.currentPassword') || 'Current Password'}</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    disabled={changingPassword}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none pr-10 disabled:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('superAdmins.newPassword') || 'New Password'}</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    disabled={changingPassword}
                    minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none pr-10 disabled:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('superAdmins.passwordMinLength') || 'Must be at least 6 characters long'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('superAdmins.confirmPassword') || 'Confirm New Password'}</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    disabled={changingPassword}
                    minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none pr-10 disabled:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="flex-1 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {changingPassword ? (
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
                    setShowPasswordModal(false);
                    setPasswordError(null);
                  }}
                  disabled={changingPassword}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Success Popup */}
      {showSuccessPopup && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn"
          onClick={() => setShowSuccessPopup(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
                {t('common.success') || 'Success!'}
              </h3>
              <p className="text-gray-600 text-center mb-6 text-lg">
                {successMessage}
              </p>
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="w-full bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105"
              >
                {t('common.close') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdmins;

