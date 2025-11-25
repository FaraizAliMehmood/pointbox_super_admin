import { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, X, Upload, Image as ImageIcon, Eye, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { NewsletterImage } from '../types';
import apiService from '../services/api';

const NewsletterImages = () => {
  const { t } = useLanguage();
  const [images, setImages] = useState<NewsletterImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<NewsletterImage | null>(null);
  const [viewingImage, setViewingImage] = useState<NewsletterImage | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    description: '',
    isActive: true,
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await apiService.getNewsletters();
      if (response.success && response.data) {
        const mappedImages: NewsletterImage[] = response.data.map((item: any) => ({
          id: item._id || item.id,
          title: item.title || '',
          imageUrl: item.imageUrl || '',
          description: item.description || '',
          isActive: item.isActive !== false,
          createdAt: item.createdAt || new Date().toISOString(),
        }));
        setImages(mappedImages);
      }
    } catch (error) {
      console.error('Error loading newsletters:', error);
      alert('Failed to load newsletters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setUploadedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // For create, image file is required
    if (!editingImage && !uploadedFile) {
      alert('Please upload an image file');
      return;
    }

    try {
      setSubmitting(true);
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }
      formDataToSend.append('isActive', formData.isActive.toString());
      
      // Append image file if provided (for create or update)
      if (uploadedFile) {
        formDataToSend.append('image', uploadedFile);
      }

      if (editingImage) {
        // Update newsletter
        const response = await apiService.updateNewsletter(editingImage.id, formDataToSend);
        if (response.success) {
          await loadImages();
          setShowModal(false);
          setEditingImage(null);
          setFormData({ title: '', imageUrl: '', description: '', isActive: true });
          setUploadedFile(null);
          setImagePreview('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      } else {
        // Create newsletter
        const response = await apiService.createNewsletter(formDataToSend);
        console.log(response);
        if (response.success) {
          await loadImages();
          setShowModal(false);
          setFormData({ title: '', imageUrl: '', description: '', isActive: true });
          setUploadedFile(null);
          setImagePreview('');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      }
    } catch (error: any) {
      console.error('Error saving newsletter:', error);
      alert(error.message || 'Failed to save newsletter. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleView = (image: NewsletterImage) => {
    setViewingImage(image);
    setShowViewModal(true);
  };

  const handleEdit = (image: NewsletterImage) => {
    setEditingImage(image);
    setFormData({
      title: image.title,
      imageUrl: image.imageUrl,
      description: image.description || '',
      isActive: image.isActive,
    });
    setUploadedFile(null);
    setImagePreview(image.imageUrl);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowModal(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingImageId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingImageId) return;
    
    try {
      setDeleting(true);
      const response = await apiService.deleteNewsletter(deletingImageId);
      if (response.success) {
        await loadImages();
        setShowDeleteModal(false);
        setDeletingImageId(null);
      }
    } catch (error) {
      console.error('Error deleting newsletter:', error);
      alert('Failed to delete newsletter. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (image: NewsletterImage) => {
    try {
      const newActiveStatus = !image.isActive;
      const formDataToSend = new FormData();
      formDataToSend.append('title', image.title);
      if (image.description) {
        formDataToSend.append('description', image.description);
      }
      formDataToSend.append('isActive', newActiveStatus.toString());
      
      const response = await apiService.updateNewsletter(image.id, formDataToSend);
      if (response.success) {
        await loadImages();
      } else {
        alert('Failed to update status. Please try again.');
      }
    } catch (error: any) {
      console.error('Error toggling status:', error);
      alert(error.message || 'Failed to update status. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">{t('newsletterImages.title')}</h1>
        <button
          onClick={() => {
            setEditingImage(null);
            setFormData({ title: '', imageUrl: '', description: '', isActive: true });
            setUploadedFile(null);
            setImagePreview('');
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Plus size={20} />
          {t('newsletterImages.createImage')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 size={32} className="text-purple-600 animate-spin" />
                      <p className="text-gray-500 text-sm">Loading newsletters...</p>
                    </div>
                  </td>
                </tr>
              ) : images.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {t('common.noData')}
                  </td>
                </tr>
              ) : (
                images.map((image, index) => (
                  <tr 
                    key={image.id} 
                    className="hover:bg-gray-50 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="w-20 h-16 bg-gray-200 rounded-lg overflow-hidden">
                        {image.imageUrl ? (
                          <img
                            src={image.imageUrl}
                            alt={image.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x64?text=Image';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No Image
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {image.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {image.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={image.isActive}
                          onChange={() => handleToggleActive(image)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                        />
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            image.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {image.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleView(image)}
                          className="text-green-600 hover:text-green-800"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(image)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(image.id)}
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
          {loading ? (
            <div className="px-4 py-12 text-center">
              <div className="flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="text-purple-600 animate-spin" />
                <p className="text-gray-500 text-sm">Loading newsletters...</p>
              </div>
            </div>
          ) : images.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">{t('common.noData')}</div>
          ) : (
            images.map((image, index) => (
              <div 
                key={image.id} 
                className="p-4 hover:bg-gray-50 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4 mb-3">
                  <div className="w-24 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {image.imageUrl ? (
                      <img
                        src={image.imageUrl}
                        alt={image.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96x80?text=Image';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{image.title}</h3>
                    {image.description && (
                      <p className="text-xs text-gray-500 mb-2 line-clamp-2">{image.description}</p>
                    )}
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={image.isActive}
                        onChange={() => handleToggleActive(image)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                      />
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          image.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {image.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleView(image)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    onClick={() => handleEdit(image)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(image.id)}
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

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingImage ? t('newsletterImages.editImage') : t('newsletterImages.createImage')}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingImage(null);
                  setFormData({ title: '', imageUrl: '', description: '', isActive: true });
                  setUploadedFile(null);
                  setImagePreview('');
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('newsletterImages.imageTitle')}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('newsletterImages.imageUrl')} {!editingImage && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="newsletter-image-upload"
                  />
                  <label
                    htmlFor="newsletter-image-upload"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <ImageIcon size={20} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {uploadedFile ? uploadedFile.name : 'Click to upload image'}
                    </span>
                  </label>
                  {uploadedFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        setImagePreview('');
                        setFormData({ ...formData, imageUrl: '' });
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
                <p className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, GIF, WebP (Max 5MB)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('newsletterImages.description')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder={t('newsletterImages.descriptionPlaceholder')}
                />
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">{t('newsletterImages.isActive')}</span>
                    <span className="text-xs text-gray-500">
                      {formData.isActive ? 'This newsletter will be visible to users' : 'This newsletter will be hidden from users'}
                    </span>
                  </div>
                </label>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    formData.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {imagePreview && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              {!imagePreview && editingImage && editingImage.imageUrl && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Current Image:</p>
                  <img
                    src={editingImage.imageUrl}
                    alt="Current"
                    className="w-full h-32 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      {editingImage ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      {t('newsletterImages.upload')}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingImage(null);
                    setFormData({ title: '', imageUrl: '', description: '', isActive: true });
                    setUploadedFile(null);
                    setImagePreview('');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
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

      {showViewModal && viewingImage && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Newsletter Image Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('newsletterImages.imageTitle')}</label>
                <p className="text-gray-900">{viewingImage.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                <div className="w-full max-w-md">
                  {viewingImage.imageUrl ? (
                    <img
                      src={viewingImage.imageUrl}
                      alt={viewingImage.title}
                      className="w-full h-auto rounded-lg border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Newsletter+Image';
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
              </div>
              {viewingImage.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('newsletterImages.description')}</label>
                  <p className="text-gray-900">{viewingImage.description}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  viewingImage.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {viewingImage.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-gray-900">{new Date(viewingImage.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingImage);
                  }}
                  className="flex-1 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all"
                >
                  Edit Image
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

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Delete Newsletter</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this newsletter? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingImageId(null);
                  }}
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

export default NewsletterImages;

