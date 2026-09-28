import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Eye, EyeOff, AlertTriangle, Power } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { AiApiKey } from '../types';
import apiService from '../services/api';

const providers = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'gemini', label: 'Gemini' },
  { value: 'stability', label: 'Stability' },
  { value: 'elevenlabs', label: 'ElevenLabs' },
  { value: 'other', label: 'Other' },
];

const AiApiKeys = () => {
  const { t } = useLanguage();
  const [keys, setKeys] = useState<AiApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingKey, setEditingKey] = useState<AiApiKey | null>(null);
  const [viewingKey, setViewingKey] = useState<AiApiKey | null>(null);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<AiApiKey | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [formData, setFormData] = useState({
    provider: 'openai',
    label: '',
    apiKey: '',
    isActive: true,
  });

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAiApiKeys();
      if (response.success && response.data) {
        const mapped = response.data.map((key: any) => ({
          id: key._id || key.id,
          provider: key.provider,
          label: key.label,
          apiKeyPreview: key.apiKeyPreview,
          isActive: key.isActive,
          createdAt: key.createdAt || new Date().toISOString(),
          updatedAt: key.updatedAt,
        }));
        setKeys(mapped);
      }
    } catch (error: any) {
      console.error('Error loading AI API keys:', error);
      alert(error.message || 'Failed to load AI API keys');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ provider: 'openai', label: '', apiKey: '', isActive: true });
    setShowApiKeyInput(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.label.trim() || (!editingKey && !formData.apiKey.trim())) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      if (editingKey) {
        const payload: any = {
          provider: formData.provider,
          label: formData.label.trim(),
          isActive: formData.isActive,
        };
        if (formData.apiKey.trim()) payload.apiKey = formData.apiKey.trim();

        const response = await apiService.updateAiApiKey(editingKey.id, payload);
        if (response.success) {
          await loadKeys();
          setShowModal(false);
          setEditingKey(null);
          resetForm();
        } else {
          alert(response.message || 'Failed to update AI API key');
        }
      } else {
        const response = await apiService.createAiApiKey({
          provider: formData.provider,
          label: formData.label.trim(),
          apiKey: formData.apiKey.trim(),
          isActive: formData.isActive,
        });
        if (response.success) {
          await loadKeys();
          setShowModal(false);
          resetForm();
        } else {
          alert(response.message || 'Failed to create AI API key');
        }
      }
    } catch (error: any) {
      console.error('Error saving AI API key:', error);
      alert(error.message || 'Failed to save AI API key');
    } finally {
      setSaving(false);
    }
  };

  const handleView = async (key: AiApiKey) => {
    setViewingKey(key);
    setRevealedKey(null);
    setShowViewModal(true);
  };

  const handleReveal = async () => {
    if (!viewingKey) return;
    try {
      setRevealing(true);
      const response = await apiService.getAiApiKeyById(viewingKey.id, true);
      if (response.success && response.data) {
        setRevealedKey(response.data.apiKey || null);
      } else {
        alert(response.message || 'Failed to reveal API key');
      }
    } catch (error: any) {
      console.error('Error revealing AI API key:', error);
      alert(error.message || 'Failed to reveal API key');
    } finally {
      setRevealing(false);
    }
  };

  const handleEdit = (key: AiApiKey) => {
    setEditingKey(key);
    setFormData({
      provider: key.provider,
      label: key.label,
      apiKey: '',
      isActive: key.isActive,
    });
    setShowApiKeyInput(false);
    setShowModal(true);
  };

  const handleToggleStatus = async (key: AiApiKey) => {
    try {
      const response = await apiService.toggleAiApiKeyStatus(key.id);
      if (response.success) {
        await loadKeys();
      } else {
        alert(response.message || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Error toggling AI API key status:', error);
      alert(error.message || 'Failed to update status');
    }
  };

  const handleDelete = (key: AiApiKey) => {
    setKeyToDelete(key);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!keyToDelete) return;

    try {
      setDeleting(true);
      const response = await apiService.deleteAiApiKey(keyToDelete.id);
      if (response.success) {
        await loadKeys();
        setShowDeleteModal(false);
        setKeyToDelete(null);
      } else {
        alert(response.message || 'Failed to delete AI API key');
      }
    } catch (error: any) {
      console.error('Error deleting AI API key:', error);
      alert(error.message || 'Failed to delete AI API key');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setKeyToDelete(null);
  };

  const providerLabel = (value: string) => providers.find((p) => p.value === value)?.label || value;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">{t('aiApiKeys.title')}</h1>
        <button
          onClick={() => {
            setEditingKey(null);
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          {t('aiApiKeys.createKey')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="px-6 py-8 text-center text-gray-500">{t('common.loading')}</div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('aiApiKeys.provider')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('aiApiKeys.label')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('aiApiKeys.apiKey')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('aiApiKeys.status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('aiApiKeys.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {keys.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        {t('common.noData')}
                      </td>
                    </tr>
                  ) : (
                    keys.map((key) => (
                      <tr key={key.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {providerLabel(key.provider)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{key.label}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{key.apiKeyPreview}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(key)}
                            className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                              key.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                            title={t('aiApiKeys.toggleStatus')}
                          >
                            {key.isActive ? t('aiApiKeys.active') : t('aiApiKeys.inactive')}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleView(key)} className="text-green-600 hover:text-green-800" title="View">
                              <Eye size={18} />
                            </button>
                            <button onClick={() => handleEdit(key)} className="text-blue-600 hover:text-blue-800" title="Edit">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => handleToggleStatus(key)} className="text-purple-600 hover:text-purple-800" title={t('aiApiKeys.toggleStatus')}>
                              <Power size={18} />
                            </button>
                            <button onClick={() => handleDelete(key)} className="text-red-600 hover:text-red-800" title="Delete">
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
              {keys.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">{t('common.noData')}</div>
              ) : (
                keys.map((key) => (
                  <div key={key.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {providerLabel(key.provider)}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              key.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {key.isActive ? t('aiApiKeys.active') : t('aiApiKeys.inactive')}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{key.label}</h3>
                        <p className="text-xs text-gray-500 font-mono">{key.apiKeyPreview}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(key)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(key)}
                        className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(key)}
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingKey ? t('aiApiKeys.editKey') : t('aiApiKeys.createKey')}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingKey(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('aiApiKeys.provider')}</label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  {providers.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('aiApiKeys.label')}</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder={t('aiApiKeys.labelPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('aiApiKeys.apiKey')}
                  {editingKey && <span className="text-xs text-gray-400 font-normal"> ({t('aiApiKeys.leaveBlankToKeep')})</span>}
                </label>
                <div className="relative">
                  <input
                    type={showApiKeyInput ? 'text' : 'password'}
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    required={!editingKey}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                    placeholder={t('aiApiKeys.apiKeyPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKeyInput((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKeyInput ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
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
                  <span className="text-sm font-medium text-gray-700">{t('aiApiKeys.isActive')}</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? t('common.saving') : editingKey ? t('common.save') : t('common.create')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingKey(null);
                    resetForm();
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
      {showViewModal && viewingKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">{t('aiApiKeys.keyDetails')}</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiApiKeys.provider')}</label>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {providerLabel(viewingKey.provider)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiApiKeys.label')}</label>
                <p className="text-gray-900 text-lg font-medium">{viewingKey.label}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiApiKeys.apiKey')}</label>
                <div className="flex items-center gap-2">
                  <p className="text-gray-900 font-mono bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex-1 break-all">
                    {revealedKey || viewingKey.apiKeyPreview}
                  </p>
                  <button
                    onClick={handleReveal}
                    disabled={revealing || !!revealedKey}
                    className="shrink-0 flex items-center gap-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm disabled:opacity-50"
                  >
                    {revealedKey ? <Eye size={16} /> : <EyeOff size={16} />}
                    {revealing ? t('common.loading') : revealedKey ? t('aiApiKeys.revealed') : t('aiApiKeys.reveal')}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('aiApiKeys.status')}</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  viewingKey.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {viewingKey.isActive ? t('aiApiKeys.active') : t('aiApiKeys.inactive')}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-gray-900">{new Date(viewingKey.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingKey);
                  }}
                  className="flex-1 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && keyToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800">{t('aiApiKeys.deleteKey')}</h2>
                  <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-gray-700 mb-2">{t('aiApiKeys.deleteConfirm')}</p>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{keyToDelete.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{providerLabel(keyToDelete.provider)}</p>
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
                      {t('common.deleting')}
                    </>
                  ) : (
                    <>
                      <Trash2 size={18} />
                      {t('common.delete')}
                    </>
                  )}
                </button>
                <button
                  onClick={cancelDelete}
                  disabled={deleting}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiApiKeys;
