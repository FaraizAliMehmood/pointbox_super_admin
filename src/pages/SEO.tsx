import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Save, Loader2, Search, Image as ImageIcon, Link2, Eye, Globe, X } from 'lucide-react';
import apiService from '../services/api';

interface SEOData {
  // Meta Tags
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonicalUrl: string;
  robotsMeta: string;
  
  // Open Graph Tags
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
  ogType: string;
  ogSiteName: string;
  
  // Twitter Card Tags
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterSite: string;
  twitterCreator: string;
  
  // Additional SEO
  structuredData: string;
  favicon: string;
  sitemapUrl: string;
}

const SEO = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [ogImagePreview, setOgImagePreview] = useState<string>('');
  const [twitterImagePreview, setTwitterImagePreview] = useState<string>('');
  const [faviconPreview, setFaviconPreview] = useState<string>('');
  const ogImageFileInputRef = useRef<HTMLInputElement>(null);
  const twitterImageFileInputRef = useRef<HTMLInputElement>(null);
  const faviconFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);
  const [uploadingTwitterImage, setUploadingTwitterImage] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  const [seoData, setSeoData] = useState<SEOData>({
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    canonicalUrl: '',
    robotsMeta: 'index, follow',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    ogUrl: '',
    ogType: 'website',
    ogSiteName: '',
    twitterCard: 'summary_large_image',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    twitterSite: '',
    twitterCreator: '',
    structuredData: '',
    favicon: '',
    sitemapUrl: '',
  });

  const robotsOptions = [
    { value: 'index, follow', label: 'Index, Follow' },
    { value: 'index, nofollow', label: 'Index, NoFollow' },
    { value: 'noindex, follow', label: 'NoIndex, Follow' },
    { value: 'noindex, nofollow', label: 'NoIndex, NoFollow' },
  ];

  const ogTypeOptions = [
    { value: 'website', label: 'Website' },
    { value: 'article', label: 'Article' },
    { value: 'product', label: 'Product' },
    { value: 'profile', label: 'Profile' },
  ];

  const twitterCardOptions = [
    { value: 'summary', label: 'Summary' },
    { value: 'summary_large_image', label: 'Summary Large Image' },
    { value: 'app', label: 'App' },
    { value: 'player', label: 'Player' },
  ];

  useEffect(() => {
    loadSEOData();
  }, []);

  const loadSEOData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSEO();
      if (response.success && response.data) {
        const data = response.data;
        setSeoData({
          metaTitle: data.metaTitle || '',
          metaDescription: data.metaDescription || '',
          metaKeywords: data.metaKeywords || '',
          canonicalUrl: data.canonicalUrl || '',
          robotsMeta: data.robotsMeta || 'index, follow',
          ogTitle: data.ogTitle || '',
          ogDescription: data.ogDescription || '',
          ogImage: data.ogImage || '',
          ogUrl: data.ogUrl || '',
          ogType: data.ogType || 'website',
          ogSiteName: data.ogSiteName || '',
          twitterCard: data.twitterCard || 'summary_large_image',
          twitterTitle: data.twitterTitle || '',
          twitterDescription: data.twitterDescription || '',
          twitterImage: data.twitterImage || '',
          twitterSite: data.twitterSite || '',
          twitterCreator: data.twitterCreator || '',
          structuredData: data.structuredData || '',
          favicon: data.favicon || '',
          sitemapUrl: data.sitemapUrl || '',
        });
        
        if (data.ogImage) setOgImagePreview(data.ogImage);
        if (data.twitterImage) setTwitterImagePreview(data.twitterImage);
        if (data.favicon) setFaviconPreview(data.favicon);
      }
    } catch (error: any) {
      console.error('Error loading SEO data:', error);
      // If SEO data doesn't exist yet, that's okay - user can create it
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof SEOData, value: string) => {
    setSeoData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = async (type: 'ogImage' | 'twitterImage' | 'favicon', file: File) => {
    try {
      if (type === 'ogImage') {
        setUploadingOgImage(true);
      } else if (type === 'twitterImage') {
        setUploadingTwitterImage(true);
      } else {
        setUploadingFavicon(true);
      }

      const response = await apiService.uploadSEOImage(type, file);
      if (response.success && response.data) {
        const imageUrl = response.data.url || response.data.imageUrl;
        handleInputChange(type, imageUrl);
        
        if (type === 'ogImage') {
          setOgImagePreview(imageUrl);
        } else if (type === 'twitterImage') {
          setTwitterImagePreview(imageUrl);
        } else {
          setFaviconPreview(imageUrl);
        }

        setSuccessMessage(t('seo.imageUploaded') || 'Image uploaded successfully!');
        setModalType('success');
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      setSuccessMessage(error.message || `Failed to upload ${type}. Please try again.`);
      setModalType('error');
      setShowSuccessModal(true);
    } finally {
      if (type === 'ogImage') {
        setUploadingOgImage(false);
      } else if (type === 'twitterImage') {
        setUploadingTwitterImage(false);
      } else {
        setUploadingFavicon(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'ogImage' | 'twitterImage' | 'favicon') => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSuccessMessage('Please select an image file');
        setModalType('error');
        setShowSuccessModal(true);
        return;
      }

      const maxSize = type === 'favicon' ? 100 * 1024 : 2 * 1024 * 1024; // 100KB for favicon, 2MB for others
      if (file.size > maxSize) {
        setSuccessMessage(`File size must be less than ${type === 'favicon' ? '100KB' : '2MB'}`);
        setModalType('error');
        setShowSuccessModal(true);
        return;
      }

      handleFileUpload(type, file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiService.updateSEO(seoData);
      if (response.success) {
        setSuccessMessage(t('seo.settingsSaved') || 'SEO settings saved successfully!');
        setModalType('success');
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      console.error('Error saving SEO settings:', error);
      setSuccessMessage(error.message || 'Failed to save SEO settings. Please try again.');
      setModalType('error');
      setShowSuccessModal(true);
    } finally {
      setSaving(false);
    }
  };

  const getCharacterCount = (text: string) => text.length;
  const getCharacterCountColor = (count: number, optimal: number, max: number) => {
    if (count <= optimal) return 'text-green-600';
    if (count <= max) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-600">Loading SEO settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Search size={32} className="text-purple-600" />
          {t('seo.title')}
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {t('common.saving') || 'Saving...'}
            </>
          ) : (
            <>
              <Save size={18} />
              {t('common.save') || 'Save SEO Settings'}
            </>
          )}
        </button>
      </div>

      {/* Meta Tags Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Search size={20} className="text-purple-600" />
          {t('seo.metaTags')}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('seo.metaTitle')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={seoData.metaTitle}
              onChange={(e) => handleInputChange('metaTitle', e.target.value)}
              maxLength={60}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder={t('seo.metaTitlePlaceholder')}
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className={getCharacterCountColor(getCharacterCount(seoData.metaTitle), 50, 60)}>
                {getCharacterCount(seoData.metaTitle)}/60 characters
              </span>
              <span className="text-gray-500">Optimal: 50-60 characters</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('seo.metaDescription')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={seoData.metaDescription}
              onChange={(e) => handleInputChange('metaDescription', e.target.value)}
              rows={3}
              maxLength={160}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y"
              placeholder={t('seo.metaDescriptionPlaceholder')}
            />
            <div className="mt-1 flex justify-between text-xs">
              <span className={getCharacterCountColor(getCharacterCount(seoData.metaDescription), 120, 160)}>
                {getCharacterCount(seoData.metaDescription)}/160 characters
              </span>
              <span className="text-gray-500">Optimal: 120-160 characters</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('seo.metaKeywords')}
            </label>
            <input
              type="text"
              value={seoData.metaKeywords}
              onChange={(e) => handleInputChange('metaKeywords', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder={t('seo.metaKeywordsPlaceholder')}
            />
            <p className="mt-1 text-xs text-gray-500">Separate keywords with commas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Link2 size={16} className="text-purple-600" />
                {t('seo.canonicalUrl')}
              </label>
              <input
                type="url"
                value={seoData.canonicalUrl}
                onChange={(e) => handleInputChange('canonicalUrl', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('seo.robotsMeta')}
              </label>
              <select
                value={seoData.robotsMeta}
                onChange={(e) => handleInputChange('robotsMeta', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                {robotsOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Open Graph Tags Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ImageIcon size={20} className="text-purple-600" />
          {t('seo.openGraphTags')}
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('seo.ogTitle')}
              </label>
              <input
                type="text"
                value={seoData.ogTitle}
                onChange={(e) => handleInputChange('ogTitle', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder={t('seo.ogTitlePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('seo.ogType')}
              </label>
              <select
                value={seoData.ogType}
                onChange={(e) => handleInputChange('ogType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                {ogTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('seo.ogDescription')}
            </label>
            <textarea
              value={seoData.ogDescription}
              onChange={(e) => handleInputChange('ogDescription', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y"
              placeholder={t('seo.ogDescriptionPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Link2 size={16} className="text-purple-600" />
                {t('seo.ogUrl')}
              </label>
              <input
                type="url"
                value={seoData.ogUrl}
                onChange={(e) => handleInputChange('ogUrl', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="https://example.com/page"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('seo.ogSiteName')}
              </label>
              <input
                type="text"
                value={seoData.ogSiteName}
                onChange={(e) => handleInputChange('ogSiteName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder={t('seo.ogSiteNamePlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('seo.ogImage')}
            </label>
            <input
              ref={ogImageFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'ogImage')}
              className="hidden"
              id="og-image-upload"
            />
            <div className="space-y-2">
              <label
                htmlFor="og-image-upload"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                <ImageIcon size={20} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {uploadingOgImage ? 'Uploading...' : seoData.ogImage ? 'Change OG Image' : 'Upload OG Image'}
                </span>
              </label>
              {ogImagePreview && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <img
                    src={ogImagePreview}
                    alt="OG Image Preview"
                    className="max-w-md max-h-48 object-contain mx-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">Recommended: 1200x630px (1.91:1 ratio)</p>
          </div>
        </div>
      </div>

      {/* Twitter Card Tags Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Globe size={20} className="text-purple-600" />
          {t('seo.twitterCardTags')}
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('seo.twitterCard')}
              </label>
              <select
                value={seoData.twitterCard}
                onChange={(e) => handleInputChange('twitterCard', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                {twitterCardOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('seo.twitterTitle')}
              </label>
              <input
                type="text"
                value={seoData.twitterTitle}
                onChange={(e) => handleInputChange('twitterTitle', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder={t('seo.twitterTitlePlaceholder')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('seo.twitterDescription')}
            </label>
            <textarea
              value={seoData.twitterDescription}
              onChange={(e) => handleInputChange('twitterDescription', e.target.value)}
              rows={3}
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y"
              placeholder={t('seo.twitterDescriptionPlaceholder')}
            />
            <p className="mt-1 text-xs text-gray-500">{getCharacterCount(seoData.twitterDescription)}/200 characters</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('seo.twitterSite')}
              </label>
              <input
                type="text"
                value={seoData.twitterSite}
                onChange={(e) => handleInputChange('twitterSite', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="@yourhandle"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('seo.twitterCreator')}
              </label>
              <input
                type="text"
                value={seoData.twitterCreator}
                onChange={(e) => handleInputChange('twitterCreator', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="@creatorhandle"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('seo.twitterImage')}
              </label>
              <input
                ref={twitterImageFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'twitterImage')}
                className="hidden"
                id="twitter-image-upload"
              />
              <label
                htmlFor="twitter-image-upload"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                <ImageIcon size={16} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-700">
                  {uploadingTwitterImage ? 'Uploading...' : 'Upload'}
                </span>
              </label>
              {twitterImagePreview && (
                <div className="mt-2 border border-gray-200 rounded-lg p-2">
                  <img
                    src={twitterImagePreview}
                    alt="Twitter Image Preview"
                    className="max-w-full max-h-32 object-contain mx-auto"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional SEO Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Eye size={20} className="text-purple-600" />
          {t('seo.additionalSeo')}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('seo.favicon')}
            </label>
            <input
              ref={faviconFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'favicon')}
              className="hidden"
              id="favicon-upload"
            />
            <div className="space-y-2">
              <label
                htmlFor="favicon-upload"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                <ImageIcon size={20} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {uploadingFavicon ? 'Uploading...' : seoData.favicon ? 'Change Favicon' : 'Upload Favicon'}
                </span>
              </label>
              {faviconPreview && (
                <div className="border border-gray-200 rounded-lg p-4 inline-block">
                  <img
                    src={faviconPreview}
                    alt="Favicon Preview"
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">Recommended: 32x32px or 16x16px ICO/PNG</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Link2 size={16} className="text-purple-600" />
              {t('seo.sitemapUrl')}
            </label>
            <input
              type="url"
              value={seoData.sitemapUrl}
              onChange={(e) => handleInputChange('sitemapUrl', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="https://example.com/sitemap.xml"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('seo.structuredData')} (JSON-LD)
            </label>
            <textarea
              value={seoData.structuredData}
              onChange={(e) => handleInputChange('structuredData', e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y font-mono text-sm"
              placeholder='{"@context": "https://schema.org", "@type": "Organization", ...}'
            />
            <p className="mt-1 text-xs text-gray-500">Enter valid JSON-LD structured data</p>
          </div>
        </div>
      </div>

      {/* Success/Error Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className={`flex items-center gap-4 mb-4 ${modalType === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {modalType === 'error' ? (
                  <X className="w-8 h-8" />
                ) : (
                  <Save className="w-8 h-8" />
                )}
                <h2 className="text-xl font-bold text-gray-800">
                  {modalType === 'error' ? t('common.error') : t('common.success')}
                </h2>
              </div>
              <p className="text-gray-700 mb-6">{successMessage}</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                {t('common.close') || 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SEO;
