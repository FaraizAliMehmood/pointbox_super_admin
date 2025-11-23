import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { Admin, Permission } from '../types';
import apiService from '../services/api';

const Admins = () => {
  const { t } = useLanguage();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [viewingAdmin, setViewingAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    permissions: [] as string[],
  });

  const availablePermissions: Permission[] = [
    { id: 'manageEmployees', name: 'Manage Employees', description: 'Can activate/deactivate employees' },
    { id: 'manageCompanies', name: 'Manage Companies', description: 'Can create and edit companies' },
    { id: 'manageCustomers', name: 'Manage Customers', description: 'Can create and edit customers' },
    { id: 'manageTransactions', name: 'Manage Transactions', description: 'Can view all transactions' },
    { id: 'manageQueries', name: 'Manage Queries', description: 'Can manage customer queries' },
    { id: 'manageBanners', name: 'Manage Banners', description: 'Can upload/edit/delete banners' },
    { id: 'manageNotifications', name: 'Manage Notifications', description: 'Can send notifications' },
    { id: 'manageFaqs', name: 'Manage FAQs', description: 'Can create, edit, and delete frequently asked questions' },
    { id: 'manageNewsletter', name: 'Manage Newsletter', description: 'Can manage newsletter subscriptions and send newsletters' },
    { id: 'manageContactUs', name: 'Manage Contact Us', description: 'Can view and manage contact us submissions' }
  ];

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAdmins();
      if (response.success && response.data) {
        // Map API response to Admin type
        const mappedAdmins: Admin[] = response.data.map((admin: any) => {
          // Handle permissions mapping more robustly
          // Database uses camelCase (manageEmployees, manageCompanies, etc.)
          let permissions: Permission[] = [];
          if (admin.permissions && typeof admin.permissions === 'object') {
            try {
              permissions = Object.entries(admin.permissions)
                .filter(([_, value]) => value === true)
                .map(([key]) => {
                  // Find permission by matching the database field name (camelCase)
                  const found = availablePermissions.find(p => p.id === key);
                  return found;
                })
                .filter((perm): perm is Permission => perm !== undefined);
            } catch (error) {
              console.error('Error mapping permissions for admin:', admin.username, error);
              permissions = [];
            }
          }
          
          return {
            id: admin._id || admin.id,
            username: admin.username,
            email: admin.email,
            role: 'admin' as const,
            isActive: admin.isActive !== false,
            createdAt: admin.createdAt || new Date().toISOString(),
            permissions,
          };
        });
        setAdmins(mappedAdmins);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      // Convert permissions array to object format expected by API
      // Database expects camelCase field names (manageEmployees, manageCompanies, etc.)
      // Initialize all permissions to false first
      const permissionsObj: Record<string, boolean> = {};
      availablePermissions.forEach(perm => {
        permissionsObj[perm.id] = false;
      });
      // Set selected permissions to true (using camelCase IDs that match database schema)
      formData.permissions.forEach(permId => {
        permissionsObj[permId] = true;
      });

      if (editingAdmin) {
        // Update admin
        const updateData: any = {
          username: formData.username,
          email: formData.email,
          permissions: permissionsObj,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        const response = await apiService.updateAdmin(editingAdmin.id, updateData);
        if (response.success) {
          await loadAdmins();
          setShowModal(false);
          setEditingAdmin(null);
          setFormData({ username: '', email: '', password: '', permissions: [] });
          setShowPassword(false);
        }
      } else {
        console.log(formData);
        // Create admin
        const response = await apiService.createAdmin({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          permissions: permissionsObj,
        });
        if (response.success) {
          await loadAdmins();
          setShowModal(false);
          setFormData({ username: '', email: '', password: '', permissions: [] });
          setShowPassword(false);
        }
      }
    } catch (error) {
      console.error('Error saving admin:', error);
      alert('Failed to save admin. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = (admin: Admin) => {
    // Find the latest admin data from the admins array to ensure we have the most up-to-date permissions
    const latestAdmin = admins.find(a => a.id === admin.id) || admin;
    setViewingAdmin(latestAdmin);
    setShowViewModal(true);
  };

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      username: admin.username,
      email: admin.email,
      password: '',
      permissions: admin.permissions.map(p => p.id),
    });
    setShowPassword(false);
    setShowModal(true);
  };

  const handleDeleteClick = (admin: Admin) => {
    setAdminToDelete(admin);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!adminToDelete) return;
    
    try {
      setDeleting(adminToDelete.id);
      const response = await apiService.deleteAdmin(adminToDelete.id);
      if (response.success) {
        await loadAdmins();
        setShowDeleteModal(false);
        setAdminToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('Failed to delete admin. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setAdminToDelete(null);
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
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
        <h1 className="text-3xl font-bold text-gray-800">{t('admins.title')}</h1>
        <button
          onClick={() => {
            setEditingAdmin(null);
            setFormData({ username: '', email: '', password: '', permissions: [] });
            setShowPassword(false);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          {t('admins.createAdmin')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permissions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {admin.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admin.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {admin.permissions.map((p) => (
                          <span
                            key={p.id}
                            className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                          >
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(admin)}
                          className="text-green-600 hover:text-green-800"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(admin)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                    <button
                      onClick={() => handleDeleteClick(admin)}
                      disabled={deleting === admin.id}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete"
                    >
                      {deleting === admin.id ? (
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
          {admins.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">{t('common.noData')}</div>
          ) : (
            admins.map((admin) => (
              <div key={admin.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{admin.username}</h3>
                    <p className="text-sm text-gray-500">{admin.email}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleView(admin)}
                      className="text-green-600 hover:text-green-800 p-1"
                      title="View"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(admin)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(admin)}
                      disabled={deleting === admin.id}
                      className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete"
                    >
                      {deleting === admin.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {admin.permissions.map((p) => (
                    <span
                      key={p.id}
                      className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40  flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingAdmin ? t('admins.editAdmin') : t('admins.createAdmin')}
              </h2>
              <button onClick={() => {
                setShowModal(false);
                setShowPassword(false);
              }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admins.name')}</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admins.email')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              {!editingAdmin ? (
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
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.password')} <span className="text-gray-500 text-xs">(Leave blank to keep current password)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="Enter new password"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admins.selectPermissions')}</label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {availablePermissions.map((permission) => (
                    <label key={permission.id} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{permission.name}</div>
                        <div className="text-sm text-gray-500">{permission.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
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

      {showViewModal && viewingAdmin && (
        <div className="fixed inset-0 bg-black/40  flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Admin Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admins.name')}</label>
                <p className="text-gray-900">{viewingAdmin.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admins.email')}</label>
                <p className="text-gray-900">{viewingAdmin.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <p className="text-gray-900 capitalize">{viewingAdmin.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  viewingAdmin.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {viewingAdmin.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admins.permissions')}</label>
                <div className="flex flex-wrap gap-2">
                  {viewingAdmin.permissions && viewingAdmin.permissions.length > 0 ? (
                    viewingAdmin.permissions.map((p) => (
                      <span
                        key={p.id}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm"
                      >
                        {p.name}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No permissions assigned</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-gray-900">{new Date(viewingAdmin.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingAdmin);
                  }}
                  className="flex-1 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Edit Admin
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
      {showDeleteModal && adminToDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Delete Admin</h2>
              <button 
                onClick={handleDeleteCancel}
                className="text-gray-400 hover:text-gray-600"
                disabled={deleting === adminToDelete.id}
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
                  Are you sure you want to delete this admin?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <p className="text-sm font-medium text-gray-900">Admin Details:</p>
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Name:</span> {adminToDelete.username}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {adminToDelete.email}
                  </p>
                </div>
                <p className="text-sm text-red-600 text-center mt-4">
                  This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleting === adminToDelete.id}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting === adminToDelete.id}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting === adminToDelete.id ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Admin'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admins;

