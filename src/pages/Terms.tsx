import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Eye, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { Terms } from '../types';
import apiService from '../services/api';

const Terms = () => {
  const { t } = useLanguage();
  const [terms, setTerms] = useState<Terms[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTerms, setEditingTerms] = useState<Terms | null>(null);
  const [viewingTerms, setViewingTerms] = useState<Terms | null>(null);
  const [termsToDelete, setTermsToDelete] = useState<Terms | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    section: 'general',
    isActive: true
  });

  const sections = [
    { value: 'general', label: 'General' },
    { value: 'user-agreement', label: 'User Agreement' },
    { value: 'privacy', label: 'Privacy' },
    { value: 'points-policy', label: 'Points Policy' },
    { value: 'refund', label: 'Refund Policy' },
    { value: 'liability', label: 'Liability' },
  ];

  useEffect(() => {
    loadTerms();
  }, []);

  const loadTerms = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTerms();
      if (response.success && response.data) {
        const mappedTerms = response.data.map((term: any) => ({
          id: term._id || term.id,
          title: term.title,
          content: term.content,
          section: term.section || term.category,
          isActive: term.isActive,
          createdAt: term.createdAt || new Date().toISOString(),
        }));
        setTerms(mappedTerms);
      }
    } catch (error: any) {
      console.error('Error loading Terms:', error);
      alert(error.message || 'Failed to load Terms and Conditions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    try {
      if (editingTerms) {
        const response = await apiService.updateTerms(editingTerms.id, {
          title: formData.title.trim(),
          content: formData.content.trim(),
          section: formData.section,
          isActive: formData.isActive
        });

        if (response.success) {
          await loadTerms();
          setShowModal(false);
          setEditingTerms(null);
          setFormData({ title: '', content: '', section: 'general', isActive: true });
        } else {
          alert(response.message || 'Failed to update Terms and Conditions');
        }
      } else {
        const response = await apiService.createTerms({
          title: formData.title.trim(),
          content: formData.content.trim(),
          section: formData.section,
          isActive: formData.isActive
        });

        if (response.success) {
          await loadTerms();
          setShowModal(false);
          setFormData({ title: '', content: '', section: 'general', isActive: true });
        } else {
          alert(response.message || 'Failed to create Terms and Conditions');
        }
      }
    } catch (error: any) {
      console.error('Error saving Terms:', error);
      alert(error.message || 'Failed to save Terms and Conditions');
    }
  };

  const handleView = (term: Terms) => {
    setViewingTerms(term);
    setShowViewModal(true);
  };

  const handleEdit = (term: Terms) => {
    setEditingTerms(term);
    setFormData({
      title: term.title,
      content: term.content,
      section: term.section,
      isActive: term.isActive
    });
    setShowModal(true);
  };

  const handleDelete = (term: Terms) => {
    setTermsToDelete(term);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!termsToDelete) return;

    try {
      setDeleting(true);
      const response = await apiService.deleteTerms(termsToDelete.id);
      if (response.success) {
        await loadTerms();
        setShowDeleteModal(false);
        setTermsToDelete(null);
      } else {
        alert(response.message || 'Failed to delete Terms and Conditions');
      }
    } catch (error: any) {
      console.error('Error deleting Terms:', error);
      alert(error.message || 'Failed to delete Terms and Conditions');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTermsToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">{t('terms.title')}</h1>
        <button
          onClick={() => {
            setEditingTerms(null);
            setFormData({ title: '', content: '', section: 'general', isActive: true });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          {t('terms.createTerms')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 text-center text-gray-500">
            Loading Terms and Conditions...
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {terms.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        {t('common.noData')}
                      </td>
                    </tr>
                  ) : (
                    terms.map((term) => (
                      <tr key={term.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="truncate max-w-xs" title={term.title}>
                            {term.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                          <div className="truncate" title={term.content}>
                            {term.content}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {sections.find(s => s.value === term.section)?.label || term.section}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              term.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {term.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleView(term)}
                              className="text-green-600 hover:text-green-800"
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEdit(term)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(term)}
                              className="text-red-600 hover:text-red-800"
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
              {terms.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">{t('common.noData')}</div>
              ) : (
                terms.map((term) => (
                  <div key={term.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {sections.find(s => s.value === term.section)?.label || term.section}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{term.title}</h3>
                        <span
                          className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                            term.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {term.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(term)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(term)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(term)}
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
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingTerms ? t('terms.editTerms') : t('terms.createTerms')}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTerms(null);
                  setFormData({ title: '', content: '', section: 'general', isActive: true });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('terms.titleLabel')}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder={t('terms.titlePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('terms.content')}</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder={t('terms.contentPlaceholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('terms.section')}</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    {sections.map(sec => (
                      <option key={sec.value} value={sec.value}>{sec.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">{t('terms.isActive')}</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  {editingTerms ? t('common.save') : t('common.create')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTerms(null);
                    setFormData({ title: '', content: '', section: 'general', isActive: true });
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

      {/* View Modal */}
      {showViewModal && viewingTerms && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Terms and Conditions Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('terms.titleLabel')}</label>
                <p className="text-gray-900 text-lg font-medium">{viewingTerms.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('terms.content')}</label>
                <p className="text-gray-900 whitespace-pre-wrap">{viewingTerms.content}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('terms.section')}</label>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {sections.find(s => s.value === viewingTerms.section)?.label || viewingTerms.section}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  viewingTerms.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {viewingTerms.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-gray-900">{new Date(viewingTerms.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingTerms);
                  }}
                  className="flex-1 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Edit Terms
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
      {showDeleteModal && termsToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800">Delete Terms and Conditions</h2>
                  <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete this Terms and Conditions entry?
                </p>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{termsToDelete.title}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {termsToDelete.content.substring(0, 100)}...
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      Delete
                    </>
                  )}
                </button>
                <button
                  onClick={cancelDelete}
                  disabled={deleting}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

export default Terms;
