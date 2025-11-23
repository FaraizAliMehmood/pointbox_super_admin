import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Edit, Trash2, X, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { Employee, Permission } from '../types';
import apiService from '../services/api';

const Employees = () => {
  const { t } = useLanguage();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    companyName: '',
    permissions: [] as string[],
  });

  const availablePermissions: Permission[] = [
    { id: 'manageCustomers', name: 'Manage Customers', description: 'Can create and edit customers' },
    { id: 'manageTransactions', name: 'Manage Transactions', description: 'Can view all transactions' },
    { id: 'manageQueries', name: 'Manage Queries', description: 'Can manage customer queries' },
    { id: 'manageBanners', name: 'Manage Banners', description: 'Can upload/edit/delete banners' },
    { id: 'manageNotifications', name: 'Manage Notifications', description: 'Can send notifications' },
  ];

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiService.getEmployees();
      if (response.success && response.data) {
        // Map API response to Employee type
        const mappedEmployees: Employee[] = response.data.map((emp: any) => {
          // Handle permissions mapping more robustly
          // Database uses camelCase (manageEmployees, manageCompanies, etc.)
          let permissions: Permission[] = [];
          if (emp.permissions && typeof emp.permissions === 'object') {
            try {
              permissions = Object.entries(emp.permissions)
                .filter(([_, value]) => value === true)
                .map(([key]) => {
                  // Find permission by matching the database field name (camelCase)
                  const found = availablePermissions.find(p => p.id === key);
                  return found;
                })
                .filter((perm): perm is Permission => perm !== undefined);
            } catch (error) {
              console.error('Error mapping permissions for employee:', emp.username, error);
              permissions = [];
            }
          }
          
          return {
            id: emp._id || emp.id,
            username: emp.name || emp.username,
            email: emp.email,
            role: 'employee' as const,
            isActive: emp.isActive !== false,
            createdAt: emp.createdAt || new Date().toISOString(),
            companyId: emp.company?._id || emp.company?.id || emp.company || '',
            companyName: emp.company?.companyName || emp.companyName || 'N/A',
            permissions,
          };
        });
        setEmployees(mappedEmployees);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (employee: Employee) => {
    // Find the latest employee data from the employees array to ensure we have the most up-to-date permissions
    const latestEmployee = employees.find(e => e.id === employee.id) || employee;
    setViewingEmployee(latestEmployee);
    setShowViewModal(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      username: employee.username,
      email: employee.email,
      companyName: employee.companyName,
      permissions: employee.permissions?.map(p => p.id) || [],
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    try {
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

      const updateData: any = {
        name: formData.username,
        email: formData.email,
        permissions: permissionsObj,
      };

      const response = await apiService.updateEmployee(editingEmployee.id, updateData);
      if (response.success) {
        await loadEmployees();
        setShowEditModal(false);
        setEditingEmployee(null);
        setFormData({ username: '', email: '', companyName: '', permissions: [] });
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Failed to save employee. Please try again.');
    }
  };

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const handleDelete = async (_id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      // Note: Employee deletion might not be available in the API
      // This is a placeholder - you may need to implement this in the backend
      alert('Employee deletion is not yet implemented in the API');
    }
  };

  const toggleStatus = async (id: string) => {
    try {
      setTogglingStatus(id);
      const employee = employees.find(emp => emp.id === id);
      if (!employee) return;

      const newStatus = !employee.isActive;
      const response = await apiService.toggleEmployeeStatus(id, newStatus);
      if (response.success) {
        await loadEmployees();
      }
    } catch (error) {
      console.error('Error toggling employee status:', error);
      alert('Failed to update employee status. Please try again.');
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
        <h1 className="text-3xl font-bold text-gray-800">{t('employees.title')}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permissions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employee.companyName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {employee.permissions && employee.permissions.length > 0 ? (
                          employee.permissions.map((p) => (
                            <span
                              key={p.id}
                              className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                            >
                              {p.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">No permissions</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          employee.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {employee.isActive ? t('employees.active') : t('employees.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(employee)}
                          className="text-green-600 hover:text-green-800"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(employee)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={() => toggleStatus(employee.id)}
                          disabled={togglingStatus === employee.id}
                          className={`px-2 py-1 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            employee.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          title={employee.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {togglingStatus === employee.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : employee.isActive ? (
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
          {employees.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">{t('common.noData')}</div>
          ) : (
            employees.map((employee) => (
              <div key={employee.id} className="p-4 hover:bg-gray-50">
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-1">{employee.username}</h3>
                  <p className="text-sm text-gray-500 mb-1">{employee.email}</p>
                  <p className="text-sm text-gray-500 mb-2">{employee.companyName}</p>
                  <div className="flex flex-wrap gap-1">
                    {employee.permissions && employee.permissions.length > 0 ? (
                      employee.permissions.map((p) => (
                        <span
                          key={p.id}
                          className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                        >
                          {p.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-xs">No permissions</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      employee.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {employee.isActive ? t('employees.active') : t('employees.inactive')}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleView(employee)}
                      className="text-green-600 hover:text-green-800 p-1"
                      title="View"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(employee)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={() => toggleStatus(employee.id)}
                      disabled={togglingStatus === employee.id}
                      className={`p-1 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        employee.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      title={employee.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {togglingStatus === employee.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : employee.isActive ? (
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

      {showViewModal && viewingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Employee Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900">{viewingEmployee.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{viewingEmployee.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <p className="text-gray-900">{viewingEmployee.companyName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  viewingEmployee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {viewingEmployee.isActive ? t('employees.active') : t('employees.inactive')}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-gray-900">{new Date(viewingEmployee.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {viewingEmployee.permissions && viewingEmployee.permissions.length > 0 ? (
                    viewingEmployee.permissions.map((p) => (
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
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingEmployee);
                  }}
                  className="flex-1 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Edit Employee
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

      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Edit Employee</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admins.selectPermissions') || 'Select Permissions'}</label>
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
                  className="flex-1 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;

