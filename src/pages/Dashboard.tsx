import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, Building2, Mail, CreditCard, TrendingUp, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import apiService from '../services/api';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAdmins: 0,
    activeAdmins: 0,
    inactiveAdmins: 0,
    totalEmployees: 0,
    activeEmployees: 0,
    inactiveEmployees: 0,
    totalCompanies: 0,
    activeCompanies: 0,
    inactiveCompanies: 0,
    totalCustomers: 0,
    activeCustomers: 0,
    inactiveCustomers: 0,
    pendingQueries: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [adminsRes, employeesRes, companiesRes, customersRes, queriesRes, transactionsRes] = await Promise.all([
        apiService.getAdmins(),
        apiService.getEmployees(),
        apiService.getCompanies(),
        apiService.getCustomers(),
        apiService.getQueries(),
        apiService.getTransactions(),
      ]);

      // Calculate detailed statistics
      const admins = adminsRes.data || [];
      const employees = employeesRes.data || [];
      const companies = companiesRes.data || [];
      const customers = customersRes.data || [];
      const queries = queriesRes.data || [];
      const transactions = transactionsRes.data || [];

      setStats({
        totalAdmins: admins.length,
        activeAdmins: admins.filter((a: any) => a.isActive !== false).length,
        inactiveAdmins: admins.filter((a: any) => a.isActive === false).length,
        totalEmployees: employees.length,
        activeEmployees: employees.filter((e: any) => e.isActive !== false).length,
        inactiveEmployees: employees.filter((e: any) => e.isActive === false).length,
        totalCompanies: companies.length,
        activeCompanies: companies.filter((c: any) => c.isActive !== false).length,
        inactiveCompanies: companies.filter((c: any) => c.isActive === false).length,
        totalCustomers: customers.length,
        activeCustomers: customers.filter((c: any) => c.isActive !== false).length,
        inactiveCustomers: customers.filter((c: any) => c.isActive === false).length,
        pendingQueries: queries.filter((q: any) => q.status === 'pending' || !q.status || q.status === 'unresolved')?.length || 0,
        totalTransactions: transactions.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: t('dashboard.totalCompanies'),
      value: stats.totalCompanies,
      subtitle: `${stats.activeCompanies} ${t('dashboard.active')}, ${stats.inactiveCompanies} ${t('dashboard.inactive')}`,
      icon: Building2,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      route: '/companies',
    },
    {
      title: t('dashboard.totalAdmins'),
      value: stats.totalAdmins,
      subtitle: `${stats.activeAdmins} ${t('dashboard.active')}, ${stats.inactiveAdmins} ${t('dashboard.inactive')}`,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      route: '/admins',
    },
    {
      title: t('dashboard.totalEmployees'),
      value: stats.totalEmployees,
      subtitle: `${stats.activeEmployees} ${t('dashboard.active')}, ${stats.inactiveEmployees} ${t('dashboard.inactive')}`,
      icon: UserCheck,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      route: '/employees',
    },
    {
      title: t('dashboard.totalCustomers'),
      value: stats.totalCustomers,
      subtitle: `${stats.activeCustomers} ${t('dashboard.active')}, ${stats.inactiveCustomers} ${t('dashboard.inactive')}`,
      icon: Users,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      route: '/customers',
    },
    {
      title: t('dashboard.pendingQueries'),
      value: stats.pendingQueries,
      subtitle: t('dashboard.requiresAttention'),
      icon: Mail,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      route: '/queries',
    },
    {
      title: t('dashboard.totalTransactions'),
      value: stats.totalTransactions,
      subtitle: t('dashboard.allTime'),
      icon: CreditCard,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-600',
      route: '/transactions',
    },
  ];

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
        <h1 className="text-3xl font-bold text-gray-800">{t('dashboard.title')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              onClick={() => card.route && navigate(card.route)}
              className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-purple-300 ${
                card.route ? 'hover:scale-105' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                <div className={`bg-gradient-to-br ${card.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={20} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-gray-800">{card.value}</p>
                {card.subtitle && (
                  <p className="text-xs text-gray-500">{card.subtitle}</p>
                )}
              </div>
              {card.route && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-purple-600 font-medium hover:text-purple-700">
                    {t('dashboard.viewDetails')} →
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Total Statistics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">{t('dashboard.statisticsOverview') || 'Statistics Overview'}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              {
                name: t('dashboard.totalCompanies') || 'Companies',
                value: stats.totalCompanies,
                active: stats.activeCompanies,
                inactive: stats.inactiveCompanies,
              },
              {
                name: t('dashboard.totalAdmins') || 'Admins',
                value: stats.totalAdmins,
                active: stats.activeAdmins,
                inactive: stats.inactiveAdmins,
              },
              {
                name: t('dashboard.totalEmployees') || 'Employees',
                value: stats.totalEmployees,
                active: stats.activeEmployees,
                inactive: stats.inactiveEmployees,
              },
              {
                name: t('dashboard.totalCustomers') || 'Customers',
                value: stats.totalCustomers,
                active: stats.activeCustomers,
                inactive: stats.inactiveCustomers,
              },
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'value') return [value, t('dashboard.total') || 'Total'];
                  if (name === 'active') return [value, t('dashboard.active') || 'Active'];
                  if (name === 'inactive') return [value, t('dashboard.inactive') || 'Inactive'];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="value" fill="#8b5cf6" name={t('dashboard.total') || 'Total'} />
              <Bar dataKey="active" fill="#10b981" name={t('dashboard.active') || 'Active'} />
              <Bar dataKey="inactive" fill="#ef4444" name={t('dashboard.inactive') || 'Inactive'} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Companies Active/Inactive */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">{t('dashboard.companiesStatus') || 'Companies Status'}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: t('dashboard.active') || 'Active', value: stats.activeCompanies, color: '#10b981' },
                  { name: t('dashboard.inactive') || 'Inactive', value: stats.inactiveCompanies, color: '#ef4444' },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => {
                  const percentage = percent ? (percent * 100).toFixed(0) : '0';
                  return `${name}: ${value} (${percentage}%)`;
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: t('dashboard.active') || 'Active', value: stats.activeCompanies, color: '#10b981' },
                  { name: t('dashboard.inactive') || 'Inactive', value: stats.inactiveCompanies, color: '#ef4444' },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Admins Active/Inactive */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">{t('dashboard.adminsStatus') || 'Admins Status'}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: t('dashboard.active') || 'Active', value: stats.activeAdmins, color: '#10b981' },
                  { name: t('dashboard.inactive') || 'Inactive', value: stats.inactiveAdmins, color: '#ef4444' },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => {
                  const percentage = percent ? (percent * 100).toFixed(0) : '0';
                  return `${name}: ${value} (${percentage}%)`;
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: t('dashboard.active') || 'Active', value: stats.activeAdmins, color: '#3b82f6' },
                  { name: t('dashboard.inactive') || 'Inactive', value: stats.inactiveAdmins, color: '#ef4444' },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Employees Active/Inactive */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">{t('dashboard.employeesStatus') || 'Employees Status'}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: t('dashboard.active') || 'Active', value: stats.activeEmployees, color: '#10b981' },
                  { name: t('dashboard.inactive') || 'Inactive', value: stats.inactiveEmployees, color: '#ef4444' },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => {
                  const percentage = percent ? (percent * 100).toFixed(0) : '0';
                  return `${name}: ${value} (${percentage}%)`;
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: t('dashboard.active') || 'Active', value: stats.activeEmployees, color: '#10b981' },
                  { name: t('dashboard.inactive') || 'Inactive', value: stats.inactiveEmployees, color: '#ef4444' },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Customers Active/Inactive */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">{t('dashboard.customersStatus') || 'Customers Status'}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: t('dashboard.active') || 'Active', value: stats.activeCustomers, color: '#10b981' },
                  { name: t('dashboard.inactive') || 'Inactive', value: stats.inactiveCustomers, color: '#ef4444' },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => {
                  const percentage = percent ? (percent * 100).toFixed(0) : '0';
                  return `${name}: ${value} (${percentage}%)`;
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  { name: t('dashboard.active') || 'Active', value: stats.activeCustomers, color: '#6366f1' },
                  { name: t('dashboard.inactive') || 'Inactive', value: stats.inactiveCustomers, color: '#ef4444' },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="text-purple-600" size={24} />
          <h2 className="text-xl font-bold text-gray-800">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/admins')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-gray-600 hover:text-purple-600 font-medium"
          >
            Create Admin
          </button>
          <button
            onClick={() => navigate('/companies')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-gray-600 hover:text-purple-600 font-medium"
          >
            Add Company
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-gray-600 hover:text-purple-600 font-medium"
          >
            Send Notification
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

