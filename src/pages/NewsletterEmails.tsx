import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Mail, Search, Download, Eye, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { NewsletterEmail } from '../types';
import apiService from '../services/api';

const NewsletterEmails = () => {
  const { t } = useLanguage();
  const [emails, setEmails] = useState<NewsletterEmail[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<NewsletterEmail[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEmailId, setDeletingEmailId] = useState<string | null>(null);
  const [deletingEmailAddress, setDeletingEmailAddress] = useState<string>('');
  const [viewingEmail, setViewingEmail] = useState<NewsletterEmail | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    source: 'manual',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadEmails();
  }, []);

  useEffect(() => {
    filterEmails();
  }, [searchTerm, emails]);

  const loadEmails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getNewsletterEmails();
      if (response.success && response.data) {
        const mappedEmails: NewsletterEmail[] = response.data.map((item: any) => ({
          id: item._id || item.id,
          email: item.email,
          subscribedAt: item.createdAt || item.subscribedAt || new Date().toISOString(),
          isActive: item.isActive !== false,
          source: item.source || 'manual',
        }));
        // Sort by subscription date (newest first)
        const sorted = mappedEmails.sort((a: NewsletterEmail, b: NewsletterEmail) => 
          new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime()
        );
        setEmails(sorted);
        setFilteredEmails(sorted);
      }
    } catch (error: any) {
      console.error('Error loading newsletter emails:', error);
      setError(error.message || 'Failed to load newsletter emails. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterEmails = () => {
    if (!searchTerm.trim()) {
      setFilteredEmails(emails);
      return;
    }

    const filtered = emails.filter(email =>
      email.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.source?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmails(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiService.createNewsletterEmail({
        email: formData.email.trim(),
        source: formData.source,
      });

      if (response.success) {
        await loadEmails();
        setShowModal(false);
        setFormData({ email: '', source: 'manual' });
        setError('');
      } else {
        setError(response.message || 'Failed to add email. Please try again.');
      }
    } catch (error: any) {
      console.error('Error creating newsletter email:', error);
      setError(error.message || 'Failed to add email. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string, email: string) => {
    setDeletingEmailId(id);
    setDeletingEmailAddress(email);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEmailId) return;

    try {
      setDeleting(true);
      const response = await apiService.deleteNewsletterEmail(deletingEmailId);
      if (response.success) {
        await loadEmails();
        setShowDeleteModal(false);
        setDeletingEmailId(null);
        setDeletingEmailAddress('');
      } else {
        alert(response.message || 'Failed to delete email. Please try again.');
      }
    } catch (error: any) {
      console.error('Error deleting newsletter email:', error);
      alert(error.message || 'Failed to delete email. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletingEmailId(null);
    setDeletingEmailAddress('');
  };

  const handleToggleActive = async (id: string) => {
    const email = emails.find(e => e.id === id);
    if (!email) return;

    try {
      setToggling(id);
      const response = await apiService.updateNewsletterEmail(id, {
        isActive: !email.isActive,
      });

      if (response.success) {
        await loadEmails();
      } else {
        alert(response.message || 'Failed to update email status. Please try again.');
      }
    } catch (error: any) {
      console.error('Error toggling email status:', error);
      alert(error.message || 'Failed to update email status. Please try again.');
    } finally {
      setToggling(null);
    }
  };

  const handleView = (email: NewsletterEmail) => {
    setViewingEmail(email);
    setShowViewModal(true);
  };

  const exportToCSV = () => {
    const activeEmails = emails.filter(e => e.isActive);
    const headers = ['Email', 'Subscribed At', 'Source', 'Status'];
    const rows = activeEmails.map(email => [
      email.email,
      new Date(email.subscribedAt).toLocaleString(),
      email.source || 'Unknown',
      email.isActive ? 'Active' : 'Inactive'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `newsletter_emails_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeCount = emails.filter(e => e.isActive).length;
  const inactiveCount = emails.filter(e => !e.isActive).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-purple-600" size={48} />
          <div className="text-gray-600 text-lg">Loading newsletter emails...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">{t('newsletterEmails.title')}</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
          >
            <Download size={18} />
            {t('newsletterEmails.export')}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus size={20} />
            {t('newsletterEmails.addEmail')}
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">{t('newsletterEmails.totalSubscribers')}</p>
              <p className="text-3xl font-bold text-gray-800">{emails.length}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg">
              <Mail className="text-white" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">{t('newsletterEmails.activeSubscribers')}</p>
              <p className="text-3xl font-bold text-green-600">{activeCount}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg">
              <Mail className="text-white" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">{t('newsletterEmails.inactiveSubscribers')}</p>
              <p className="text-3xl font-bold text-gray-600">{inactiveCount}</p>
            </div>
            <div className="bg-gradient-to-br from-gray-500 to-gray-600 p-4 rounded-lg">
              <Mail className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('newsletterEmails.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>
      </div>

      {/* Emails List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscribed At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmails.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredEmails.map((email) => (
                  <tr key={email.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {email.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(email.subscribedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {email.source || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(email.id)}
                        disabled={toggling === email.id}
                        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                          email.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {toggling === email.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : null}
                        {email.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(email)}
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(email.id, email.email)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
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
          {filteredEmails.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">{t('common.noData')}</div>
          ) : (
            filteredEmails.map((email) => (
              <div key={email.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1">{email.email}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {email.source || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(email.subscribedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleActive(email.id)}
                      disabled={toggling === email.id}
                      className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        email.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {toggling === email.id ? (
                        <Loader2 className="animate-spin" size={12} />
                      ) : null}
                      {email.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleView(email)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteClick(email.id, email.email)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Email Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">{t('newsletterEmails.addEmail')}</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({ email: '', source: 'manual' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('newsletterEmails.email')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setError('');
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="example@email.com"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('newsletterEmails.source')}</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  disabled={submitting}
                >
                  <option value="manual">Manual</option>
                  <option value="footer">Footer</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      {t('newsletterEmails.add')}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ email: '', source: 'manual' });
                    setError('');
                  }}
                  disabled={submitting}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Email Modal */}
      {showViewModal && viewingEmail && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Email Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsletterEmails.email')}</label>
                <p className="text-gray-900">{viewingEmail.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsletterEmails.subscribedAt')}</label>
                <p className="text-gray-900">{new Date(viewingEmail.subscribedAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsletterEmails.source')}</label>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {viewingEmail.source || 'Unknown'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  viewingEmail.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {viewingEmail.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={async () => {
                    setShowViewModal(false);
                    await handleToggleActive(viewingEmail.id);
                  }}
                  disabled={toggling === viewingEmail.id}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {toggling === viewingEmail.id ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Updating...
                    </>
                  ) : (
                    viewingEmail.isActive ? 'Deactivate' : 'Activate'
                  )}
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
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Delete Newsletter Email</h2>
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to remove <span className="font-semibold">{deletingEmailAddress}</span> from the newsletter list?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

export default NewsletterEmails;

