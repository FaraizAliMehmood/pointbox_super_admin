import { useState, useEffect } from 'react';
import { Mail, Search, Loader2, Eye, X, Send } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { Contact } from '../types';
import apiService from '../services/api';

const ContactUs = () => {
  const { t } = useLanguage();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [searchTerm, contacts]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getContacts();
      if (response.success && response.data) {
        const mappedContacts: Contact[] = response.data.map((item: any) => ({
          id: item._id || item.id,
          name: item.name,
          email: item.email,
          phone: item.phone,
          subject: item.subject,
          message: item.message,
          status: item.status || 'new',
          repliedAt: item.repliedAt,
          createdAt: item.createdAt || new Date().toISOString(),
        }));
        // Sort by date (newest first)
        const sorted = mappedContacts.sort((a: Contact, b: Contact) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setContacts(sorted);
        setFilteredContacts(sorted);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterContacts = () => {
    if (!searchTerm.trim()) {
      setFilteredContacts(contacts);
      return;
    }

    const filtered = contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.phone && contact.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredContacts(filtered);
  };

  const handleView = (contact: Contact) => {
    setSelectedContact(contact);
    setResponse('');
    setShowViewModal(true);
  };

  const handleRespond = async () => {
    if (!selectedContact || !response.trim()) return;

    try {
      setSubmitting(true);
      const apiResponse = await apiService.respondToContact(selectedContact.id, response);
      if (apiResponse.success) {
        await loadContacts();
        setResponse('');
        // Update selected contact to show it's been replied
        if (selectedContact) {
          setSelectedContact({ ...selectedContact, status: 'replied', repliedAt: new Date().toISOString() });
        }
      }
    } catch (error: any) {
      console.error('Error responding to contact:', error);
      alert(error.message || 'Failed to send response. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-purple-600" size={48} />
          <div className="text-gray-600 text-lg">Loading contacts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">{t('contactUs.title')}</h1>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">{t('contactUs.totalContacts')}</p>
              <p className="text-3xl font-bold text-gray-800">{contacts.length}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg">
              <Mail className="text-white" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">{t('contactUs.thisMonth')}</p>
              <p className="text-3xl font-bold text-green-600">
                {contacts.filter(c => {
                  const contactDate = new Date(c.createdAt);
                  const now = new Date();
                  return contactDate.getMonth() === now.getMonth() && 
                         contactDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg">
              <Mail className="text-white" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">{t('contactUs.thisWeek')}</p>
              <p className="text-3xl font-bold text-blue-600">
                {contacts.filter(c => {
                  const contactDate = new Date(c.createdAt);
                  const now = new Date();
                  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                  return contactDate >= weekAgo;
                }).length}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg">
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
            placeholder={t('contactUs.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {contact.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.phone || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {contact.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          contact.status === 'replied'
                            ? 'bg-green-100 text-green-800'
                            : contact.status === 'read'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {contact.status === 'replied' ? 'Replied' : contact.status === 'read' ? 'Read' : 'New'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleView(contact)}
                        className="text-purple-600 hover:text-purple-800 transition-colors"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-gray-200">
          {filteredContacts.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">{t('common.noData')}</div>
          ) : (
            filteredContacts.map((contact) => (
              <div key={contact.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 mb-1">{contact.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{contact.email}</p>
                    {contact.phone && (
                      <p className="text-xs text-gray-500 mb-2">{contact.phone}</p>
                    )}
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">{contact.subject}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleView(contact)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
                  >
                    <Eye size={16} />
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* View Contact Modal */}
      {showViewModal && selectedContact && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-800">{t('contactUs.contactDetails')}</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('contactUs.name')}</label>
                <p className="text-gray-900">{selectedContact.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('contactUs.email')}</label>
                <p className="text-gray-900">
                  <a href={`mailto:${selectedContact.email}`} className="text-purple-600 hover:text-purple-800">
                    {selectedContact.email}
                  </a>
                </p>
              </div>
              {selectedContact.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('contactUs.phone')}</label>
                  <p className="text-gray-900">
                    <a href={`tel:${selectedContact.phone}`} className="text-purple-600 hover:text-purple-800">
                      {selectedContact.phone}
                    </a>
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('contactUs.subject')}</label>
                <p className="text-gray-900">{selectedContact.subject}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('contactUs.message')}</label>
                <div className="p-4 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap">
                  {selectedContact.message}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('contactUs.submittedAt')}</label>
                <p className="text-gray-900">{new Date(selectedContact.createdAt).toLocaleString()}</p>
              </div>
              {selectedContact.status === 'replied' && selectedContact.repliedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Replied At</label>
                  <p className="text-gray-900">{new Date(selectedContact.repliedAt).toLocaleString()}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedContact.status === 'replied' ? 'Update Response' : 'Response'}
                </label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Enter your response message..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleRespond}
                  disabled={!response.trim() || submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      {selectedContact.status === 'replied' ? 'Update Response' : 'Send Response'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setResponse('');
                  }}
                  disabled={submitting}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactUs;

