import { useState, useEffect } from 'react';
import { Plus, Send, X, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { Notification } from '../types';
import apiService from '../services/api';

const Notifications = () => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    target: 'both' as 'website' | 'mobile' | 'both',
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNotifications();
      if (response.success && response.data) {
        const mappedNotifications: Notification[] = response.data.map((n: any) => ({
          id: n._id || n.id,
          title: n.title,
          message: n.message,
          target: n.type || 'both',
          createdAt: n.createdAt || n.sentAt || new Date().toISOString(),
        }));
        setNotifications(mappedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiService.createNotification({
        title: formData.title,
        message: formData.message,
        type: formData.target,
        target: 'all',
      });
      if (response.success) {
        await loadNotifications();
        setShowModal(false);
        setFormData({ title: '', message: '', target: 'both' });
      }
    } catch (error) {
      console.error('Error creating notification:', error);
      alert('Failed to create notification. Please try again.');
    }
  };

  const handleDeleteClick = (notification: Notification) => {
    setNotificationToDelete(notification);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!notificationToDelete) return;

    try {
      setDeleting(notificationToDelete.id);
      const response = await apiService.deleteNotification(notificationToDelete.id);
      if (response.success) {
        await loadNotifications();
        setShowDeleteModal(false);
        setNotificationToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Failed to delete notification. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setNotificationToDelete(null);
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
        <h1 className="text-3xl font-bold text-gray-800">{t('notifications.title')}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          {t('notifications.createNotification')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notifications.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">{t('common.noData')}</div>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className="bg-white rounded-xl shadow-lg p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex-1 pr-2">{notification.title}</h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      notification.target === 'both'
                        ? 'bg-purple-100 text-purple-800'
                        : notification.target === 'website'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {notification.target === 'both'
                      ? t('notifications.both')
                      : notification.target === 'website'
                      ? t('notifications.website')
                      : t('notifications.mobile')}
                  </span>
                  <button
                    onClick={() => handleDeleteClick(notification)}
                    disabled={deleting === notification.id}
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('notifications.delete') || 'Delete'}
                  >
                    {deleting === notification.id ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-gray-600 mb-4">{notification.message}</p>
              <p className="text-xs text-gray-400">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">{t('notifications.createNotification')}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('notifications.titleField')}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('notifications.message')}</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('notifications.target')}</label>
                <select
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="website">{t('notifications.website')}</option>
                  <option value="mobile">{t('notifications.mobile')}</option>
                  <option value="both">{t('notifications.both')}</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  <Send size={18} />
                  {t('notifications.send')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && notificationToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">{t('notifications.deleteNotification') || 'Delete Notification'}</h2>
              <button 
                onClick={handleDeleteCancel}
                className="text-gray-400 hover:text-gray-600"
                disabled={deleting === notificationToDelete.id}
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-gray-700 text-center mb-2">
                  {t('notifications.deleteConfirm') || 'Are you sure you want to delete this notification?'}
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mt-4">
                  <p className="text-sm font-medium text-gray-900">{t('notifications.titleField') || 'Title'}:</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {notificationToDelete.title}
                  </p>
                </div>
                <p className="text-sm text-red-600 text-center mt-4">
                  {t('notifications.deleteWarning') || 'This action cannot be undone.'}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleting === notificationToDelete.id}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting === notificationToDelete.id}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting === notificationToDelete.id ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {t('common.deleting') || 'Deleting...'}
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      {t('common.delete')}
                    </>
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

export default Notifications;

