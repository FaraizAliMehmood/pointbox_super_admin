import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import Modal from '../components/Modal';
import { X, Image as ImageIcon, Save, FileText, MapPin, Phone, Mail, Map, Loader2, Link } from 'lucide-react';
import apiService from '../services/api';

interface CompanyInfo {
  termsAndConditions: string;
  address: string;
  phoneNumber: string;
  email: string;
  googleLocation: string;
  instagram: string;
  facebook: string;
  x: string;
  youtube: string;
  tiktok: string;
  linkedin: string;
}

const Settings = () => {
  const { t } = useLanguage();
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [showRemoveLogoModal, setShowRemoveLogoModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    termsAndConditions: '',
    address: '',
    phoneNumber: '',
    email: '',
    googleLocation: '',
    instagram: '',
    facebook: '',
    x: '',
    youtube: '',
    tiktok: '',
    linkedin: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await apiService.getSettings();
      if (response.success && response.data) {
        const settings = response.data;
        // Set logo
        if (settings.logoUrl) {
          setLogoUrl(settings.logoUrl);
          setImagePreview(settings.logoUrl);
        }
        // Set company info - map backend fields to frontend fields
        setCompanyInfo({
          termsAndConditions: settings.termsCondition || '',
          address: settings.address || '',
          phoneNumber: settings.phone || '',
          email: settings.email || '',
          googleLocation: settings.location || '',
          instagram: settings.instagram || '',
          facebook: settings.facebook || '',
          x: settings.x || '',
          youtube: settings.youtube || '',
          tiktok: settings.tiktok || '',
          linkedin: settings.linkedin || '',
        });
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      // If settings don't exist yet, that's okay - user can create them
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSuccessMessage('Please select an image file');
        setModalType('error');
        setShowSuccessModal(true);
        return;
      }
      
      // Validate file size (max 2MB for logo)
      if (file.size > 2 * 1024 * 1024) {
        setSuccessMessage('File size must be less than 2MB');
        setModalType('error');
        setShowSuccessModal(true);
        return;
      }

      setUploadedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setLogoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveLogo = async () => {
    if (!uploadedFile) {
      setSuccessMessage('Please upload an image file');
      setModalType('error');
      setShowSuccessModal(true);
      return;
    }

    try {
      setUploadingLogo(true);
      const response = await apiService.uploadLogo(uploadedFile);
      if (response.success && response.data) {
        setLogoUrl(response.data.logoUrl);
        setImagePreview(response.data.logoUrl);
        setSuccessMessage('Logo uploaded successfully!');
        setModalType('success');
        setShowSuccessModal(true);
        // Clear the file input
        setUploadedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      setSuccessMessage(error.message || 'Failed to upload logo. Please try again.');
      setModalType('error');
      setShowSuccessModal(true);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = () => {
    setShowRemoveLogoModal(true);
  };

  const confirmRemoveLogo = () => {
    setLogoUrl('');
    setImagePreview('');
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowRemoveLogoModal(false);
    setSuccessMessage('Logo removed successfully!');
    setModalType('success');
    setShowSuccessModal(true);
  };

  const handleCompanyInfoChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveCompanyInfo = async () => {
    try {
      setSavingSettings(true);
      // Map frontend fields to backend fields
      const settingsData = {
        termsCondition: companyInfo.termsAndConditions,
        address: companyInfo.address,
        phone: companyInfo.phoneNumber,
        email: companyInfo.email,
        location: companyInfo.googleLocation,
        instagram: companyInfo.instagram,
        facebook: companyInfo.facebook,
        x: companyInfo.x,
        youtube: companyInfo.youtube,
        tiktok: companyInfo.tiktok,
        linkedin: companyInfo.linkedin,
      };

      const response = await apiService.updateSettings(settingsData);
      if (response.success) {
        setSuccessMessage(t('settings.companyInfoSaved') || 'Settings saved successfully!');
        setModalType('success');
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      setSuccessMessage(error.message || 'Failed to save settings. Please try again.');
      setModalType('error');
      setShowSuccessModal(true);
    } finally {
      setSavingSettings(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">{t('sidebar.settings')}</h1>
      </div>

      {/* Website Logo Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('settings.websiteLogo')}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.uploadLogo') || 'Upload Logo'}
            </label>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                <ImageIcon size={20} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {uploadedFile ? uploadedFile.name : t('settings.clickToUpload')}
                </span>
              </label>
              {uploadedFile && (
                <button
                  type="button"
                  onClick={() => {
                    setUploadedFile(null);
                    setImagePreview('');
                    setLogoUrl('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t('settings.logoFileInfo')}</p>
          </div>

          {imagePreview && (
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">{t('settings.logoPreview')}:</p>
              <div className="flex items-center gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <img
                    src={imagePreview}
                    alt="Logo Preview"
                    className="max-h-32 max-w-48 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">{t('settings.logoPreviewDescription')}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSaveLogo}
              disabled={!uploadedFile || uploadingLogo}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingLogo ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('settings.uploading') || 'Uploading...'}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {t('settings.saveLogo') || 'Upload Logo'}
                </>
              )}
            </button>
            {(logoUrl || uploadedFile) && (
              <button
                onClick={handleRemoveLogo}
                disabled={uploadingLogo}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={18} />
                {t('settings.removeLogo') || 'Remove'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('settings.languageSettings')}</h2>
        <div className="flex items-center gap-4">
          <span className="text-gray-700">{t('settings.selectLanguage')}:</span>
          <LanguageSelector />
        </div>
      </div>

      {/* Company Information Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FileText size={24} className="text-purple-600" />
          {t('settings.companyInformation')}
        </h2>
        <div className="space-y-6">
          {/* Terms and Conditions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.termsAndConditions')} *
            </label>
            <textarea
              value={companyInfo.termsAndConditions}
              onChange={(e) => handleCompanyInfoChange('termsAndConditions', e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y"
              placeholder={t('settings.termsAndConditionsPlaceholder')}
            />
            <p className="text-xs text-gray-500 mt-1">{t('settings.termsAndConditionsHint')}</p>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-purple-600" />
              {t('settings.address')} *
            </label>
            <input
              type="text"
              value={companyInfo.address}
              onChange={(e) => handleCompanyInfoChange('address', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder={t('settings.addressPlaceholder')}
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Phone size={16} className="text-purple-600" />
              {t('settings.phoneNumber')} *
            </label>
            <input
              type="tel"
              value={companyInfo.phoneNumber}
              onChange={(e) => handleCompanyInfoChange('phoneNumber', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder={t('settings.phoneNumberPlaceholder')}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Mail size={16} className="text-purple-600" />
              {t('settings.email')} *
            </label>
            <input
              type="email"
              value={companyInfo.email}
              onChange={(e) => handleCompanyInfoChange('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder={t('settings.emailPlaceholder')}
            />
          </div>

          {/* Google Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Map size={16} className="text-purple-600" />
              {t('settings.googleLocation')}
            </label>
            <input
              type="url"
              value={companyInfo.googleLocation}
              onChange={(e) => handleCompanyInfoChange('googleLocation', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder={t('settings.googleLocationPlaceholder')}
            />
            <p className="text-xs text-gray-500 mt-1">{t('settings.googleLocationHint')}</p>
            {companyInfo.googleLocation && (
              <div className="mt-3">
                <a
                  href={companyInfo.googleLocation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 text-sm underline flex items-center gap-1"
                >
                  <Map size={14} />
                  {t('settings.viewOnGoogleMaps')}
                </a>
              </div>
            )}
          </div>

          {/* Social Media Links Section */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Social Media Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Instagram */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Link size={16} className="text-purple-600" />
                  Instagram
                </label>
                <input
                  type="url"
                  value={companyInfo.instagram}
                  onChange={(e) => handleCompanyInfoChange('instagram', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="https://instagram.com/yourprofile"
                />
              </div>

              {/* Facebook */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Link size={16} className="text-purple-600" />
                  Facebook
                </label>
                <input
                  type="url"
                  value={companyInfo.facebook}
                  onChange={(e) => handleCompanyInfoChange('facebook', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="https://facebook.com/yourpage"
                />
              </div>

              {/* X (Twitter) */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Link size={16} className="text-purple-600" />
                  X (Twitter)
                </label>
                <input
                  type="url"
                  value={companyInfo.x}
                  onChange={(e) => handleCompanyInfoChange('x', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="https://x.com/yourprofile"
                />
              </div>

              {/* YouTube */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Link size={16} className="text-purple-600" />
                  YouTube
                </label>
                <input
                  type="url"
                  value={companyInfo.youtube}
                  onChange={(e) => handleCompanyInfoChange('youtube', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="https://youtube.com/@yourchannel"
                />
              </div>

              {/* TikTok */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Link size={16} className="text-purple-600" />
                  TikTok
                </label>
                <input
                  type="url"
                  value={companyInfo.tiktok}
                  onChange={(e) => handleCompanyInfoChange('tiktok', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="https://tiktok.com/@yourprofile"
                />
              </div>

              {/* LinkedIn */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Link size={16} className="text-purple-600" />
                  LinkedIn
                </label>
                <input
                  type="url"
                  value={companyInfo.linkedin}
                  onChange={(e) => handleCompanyInfoChange('linkedin', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={handleSaveCompanyInfo}
              disabled={savingSettings}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingSettings ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('settings.saving') || 'Saving...'}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {t('settings.saveCompanyInfo') || 'Save Settings'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('settings.accountSettings')}</h2>
        <p className="text-gray-600">{t('settings.moreSettingsComing')}</p>
      </div>

      {/* Remove Logo Confirmation Modal */}
      <Modal
        isOpen={showRemoveLogoModal}
        onClose={() => setShowRemoveLogoModal(false)}
        title="Remove Logo"
        message="Are you sure you want to remove the logo? This action cannot be undone."
        type="confirm"
        onConfirm={confirmRemoveLogo}
        confirmText="Remove"
        cancelText="Cancel"
      />

      {/* Success/Error Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={modalType === 'success' ? 'Success' : 'Error'}
        message={successMessage}
        type={modalType}
      />
    </div>
  );
};

export default Settings;

