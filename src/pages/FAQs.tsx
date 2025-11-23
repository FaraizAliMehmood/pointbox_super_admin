import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Eye, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { FAQ } from '../types';
import apiService from '../services/api';

const FAQs = () => {
  const { t } = useLanguage();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [viewingFAQ, setViewingFAQ] = useState<FAQ | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'general',
    isActive: true
  });

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'points', label: 'Points' },
    { value: 'rewards', label: 'Rewards' },
    { value: 'tiers', label: 'Tiers' },
    { value: 'account', label: 'Account' },
  ];

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const response = await apiService.getFAQs();
      if (response.success && response.data) {
        // Map backend data to frontend format (convert _id to id)
        // Explicitly exclude order field
        const mappedFAQs = response.data.map((faq: any) => ({
          id: faq._id || faq.id,
          question: faq.question,
          answer: faq.answer,
          category: faq.category,
          isActive: faq.isActive,
          createdAt: faq.createdAt || new Date().toISOString(),
        }));
        setFaqs(mappedFAQs);
      }
    } catch (error: any) {
      console.error('Error loading FAQs:', error);
      alert(error.message || 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question.trim() || !formData.answer.trim()) {
      alert('Please fill in both question and answer');
      return;
    }

    try {
      if (editingFAQ) {
        // Update existing FAQ
        const response = await apiService.updateFAQ(editingFAQ.id, {
          question: formData.question.trim(),
          answer: formData.answer.trim(),
          category: formData.category,
          isActive: formData.isActive
        });

        if (response.success) {
          await loadFAQs(); // Reload FAQs to get updated data
          setShowModal(false);
          setEditingFAQ(null);
          setFormData({ question: '', answer: '', category: 'general', isActive: true });
        } else {
          alert(response.message || 'Failed to update FAQ');
        }
      } else {
        // Create new FAQ
        const response = await apiService.createFAQ({
          question: formData.question.trim(),
          answer: formData.answer.trim(),
          category: formData.category,
          isActive: formData.isActive
        });

        if (response.success) {
          await loadFAQs(); // Reload FAQs to get new data
          setShowModal(false);
          setFormData({ question: '', answer: '', category: 'general', isActive: true });
        } else {
          alert(response.message || 'Failed to create FAQ');
        }
      }
    } catch (error: any) {
      console.error('Error saving FAQ:', error);
      alert(error.message || 'Failed to save FAQ');
    }
  };

  const handleView = (faq: FAQ) => {
    setViewingFAQ(faq);
    setShowViewModal(true);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      isActive: faq.isActive
    });
    setShowModal(true);
  };

  const handleDelete = (faq: FAQ) => {
    setFaqToDelete(faq);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!faqToDelete) return;

    try {
      setDeleting(true);
      const response = await apiService.deleteFAQ(faqToDelete.id);
      if (response.success) {
        await loadFAQs(); // Reload FAQs after deletion
        setShowDeleteModal(false);
        setFaqToDelete(null);
      } else {
        alert(response.message || 'Failed to delete FAQ');
      }
    } catch (error: any) {
      console.error('Error deleting FAQ:', error);
      alert(error.message || 'Failed to delete FAQ');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setFaqToDelete(null);
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">{t('faqs.title')}</h1>
        <button
          onClick={() => {
            setEditingFAQ(null);
            setFormData({ question: '', answer: '', category: 'general', isActive: true });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          {t('faqs.createFAQ')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 text-center text-gray-500">
            Loading FAQs...
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Answer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {faqs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        {t('common.noData')}
                      </td>
                    </tr>
                  ) : (
                faqs.map((faq) => (
                  <tr key={faq.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="truncate" title={faq.question}>
                        {faq.question}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-md">
                      <div className="truncate" title={faq.answer}>
                        {faq.answer}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {categories.find(c => c.value === faq.category)?.label || faq.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          faq.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {faq.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(faq)}
                          className="text-green-600 hover:text-green-800"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(faq)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(faq)}
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
              {faqs.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">{t('common.noData')}</div>
              ) : (
                faqs.map((faq) => (
              <div key={faq.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                     
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {categories.find(c => c.value === faq.category)?.label || faq.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{faq.question}</h3>
                    <span
                      className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                        faq.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {faq.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleView(faq)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(faq)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(faq)}
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

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingFAQ ? t('faqs.editFAQ') : t('faqs.createFAQ')}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingFAQ(null);
                  setFormData({ question: '', answer: '', category: 'general', isActive: true });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('faqs.question')}</label>
                <input
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder={t('faqs.questionPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('faqs.answer')}</label>
                <textarea
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder={t('faqs.answerPlaceholder')}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('faqs.category')}</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
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
                  <span className="text-sm font-medium text-gray-700">{t('faqs.isActive')}</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  {editingFAQ ? t('common.save') : t('common.create')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingFAQ(null);
                    setFormData({ question: '', answer: '', category: 'general', isActive: true });
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

      {showViewModal && viewingFAQ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">FAQ Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('faqs.question')}</label>
                <p className="text-gray-900 text-lg font-medium">{viewingFAQ.question}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('faqs.answer')}</label>
                <p className="text-gray-900 whitespace-pre-wrap">{viewingFAQ.answer}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('faqs.category')}</label>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {categories.find(c => c.value === viewingFAQ.category)?.label || viewingFAQ.category}
                  </span>
                </div>
               
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  viewingFAQ.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {viewingFAQ.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-gray-900">{new Date(viewingFAQ.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingFAQ);
                  }}
                  className="flex-1 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Edit FAQ
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

      {showDeleteModal && faqToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800">Delete FAQ</h2>
                  <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Are you sure you want to delete this FAQ?
                </p>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{faqToDelete.question}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {faqToDelete.answer.substring(0, 100)}...
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

export default FAQs;

