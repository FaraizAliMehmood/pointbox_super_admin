import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  UserCheck, 
  Mail, 
  CreditCard, 
  Bell, 
  Image, 
  Settings, 
  LogOut,
  Menu,
  X,
  Newspaper,
  HelpCircle,
  MailCheck,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useLanguage();

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard') },
     { path: '/admins', icon: Users, label: t('sidebar.admins') },
    { path: '/super-admins', icon: Users, label: t('sidebar.superAdmins') },
    { path: '/employees', icon: UserCheck, label: t('sidebar.employees') },
    { path: '/companies', icon: Building2, label: t('sidebar.companies') },
    { path: '/customers', icon: Users, label: t('sidebar.customers') },
    { path: '/queries', icon: Mail, label: t('sidebar.queries') },
    { path: '/contact-us', icon: MessageSquare, label: t('sidebar.contactUs') },
    { path: '/transactions', icon: CreditCard, label: t('sidebar.transactions') },
    { path: '/notifications', icon: Bell, label: t('sidebar.notifications') },
    { path: '/banners', icon: Image, label: t('sidebar.banners') },
    { path: '/newsletter-images', icon: Newspaper, label: t('sidebar.newsletterImages') },
    { path: '/newsletter-emails', icon: MailCheck, label: t('sidebar.newsletterEmails') },
    { path: '/faqs', icon: HelpCircle, label: t('sidebar.faqs') },
    { path: '/settings', icon: Settings, label: t('sidebar.settings') },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-purple-600 text-white"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800
          transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out
          flex flex-col
          shadow-2xl
        `}
      >
        <div className="flex items-center justify-center h-16 px-4 border-b border-purple-500/30">
          <h1 className="text-2xl font-bold text-white">PointBox</h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 no-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 mb-2 rounded-lg
                  transition-all duration-200
                  ${isActive
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-purple-100 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-purple-500/30">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-purple-100 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">{t('sidebar.logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

