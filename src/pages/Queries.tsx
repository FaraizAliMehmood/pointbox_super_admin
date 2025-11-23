import { useState, useEffect } from 'react';
import { Mail, Send, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { CustomerQuery } from '../types';
import apiService from '../services/api';

const Queries = () => {
  const { t } = useLanguage();
  const [queries, setQueries] = useState<CustomerQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState<CustomerQuery | null>(null);
  const [response, setResponse] = useState('');

  useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = async () => {
    try {
      setLoading(true);
      const response = await apiService.getQueries();
      if (response.success && response.data) {
        const mappedQueries: CustomerQuery[] = response.data.map((q: any) => ({
          id: q._id || q.id,
          customerEmail: q.customerEmail || q.customer?.email || '',
          subject: q.subject,
          message: q.message,
          status: q.status === 'resolved' || q.status === 'responded' ? 'responded' : 'pending',
          response: q.responses && q.responses.length > 0 ? q.responses[q.responses.length - 1].response : undefined,
          createdAt: q.createdAt || new Date().toISOString(),
          respondedAt: q.responses && q.responses.length > 0 ? q.responses[q.responses.length - 1].createdAt : undefined,
        }));
        setQueries(mappedQueries);
      }
    } catch (error) {
      console.error('Error loading queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedQuery || !response.trim()) return;

    try {
      const apiResponse = await apiService.respondToQuery(selectedQuery.id, response);
      if (apiResponse.success) {
        await loadQueries();
        setSelectedQuery(null);
        setResponse('');
      }
    } catch (error) {
      console.error('Error responding to query:', error);
      alert('Failed to send response. Please try again.');
    }
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
        <h1 className="text-3xl font-bold text-gray-800">{t('queries.title')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">All Queries</h2>
          </div>
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {queries.length === 0 ? (
              <div className="p-8 text-center text-gray-500">{t('common.noData')}</div>
            ) : (
              queries.map((query) => (
                <div
                  key={query.id}
                  onClick={() => {
                    setSelectedQuery(query);
                    setResponse(query.response || '');
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedQuery?.id === query.id ? 'bg-purple-50 border-l-4 border-purple-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{query.subject}</p>
                      <p className="text-sm text-gray-500">{query.customerEmail}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        query.status === 'pending'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {query.status === 'pending' ? t('queries.pending') : t('queries.responded')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{query.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(query.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {selectedQuery ? (
            <>
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">{t('queries.respond')}</h2>
                <button
                  onClick={() => {
                    setSelectedQuery(null);
                    setResponse('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('queries.from')}</label>
                  <p className="text-gray-900">{selectedQuery.customerEmail}</p>
                </div>
                {(selectedQuery as any).brandName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('queries.brand')}</label>
                    <p className="text-gray-900">{(selectedQuery as any).brandName}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('queries.subject')}</label>
                  <p className="text-gray-900">{selectedQuery.subject}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('queries.message')}</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-700">{selectedQuery.message}</div>
                </div>
                {selectedQuery.response && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('queries.previousResponse')}</label>
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-gray-700">
                      {selectedQuery.response}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('queries.respondedOn')}: {selectedQuery.respondedAt ? new Date(selectedQuery.respondedAt).toLocaleString() : ''}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedQuery.response ? t('queries.updateResponse') : t('queries.response')}
                  </label>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                    placeholder={t('queries.responsePlaceholder')}
                  />
                </div>
                <button
                  onClick={handleRespond}
                  disabled={!response.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                  {t('queries.send')}
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Mail size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Select a query to respond</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Queries;

