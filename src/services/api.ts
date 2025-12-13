/**
 * Centralized API Service for Super Admin
 * Handles all API calls to the backend
 */
//
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pointbox-backend-beta.vercel.app/api/superadmin';
const SETTINGS_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://pointbox-backend-beta.vercel.app/api/settings';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  token?: string;
  user?: any;
}

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load token from localStorage on initialization
    const storedToken = localStorage.getItem('super_admin_token');
    if (storedToken) {
      this.token = storedToken;
    }
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('super_admin_token', token);
    } else {
      localStorage.removeItem('super_admin_token');
    }
  }

  /**
   * Get authentication token
   */
  getToken(): string | null {
    return this.token || localStorage.getItem('super_admin_token');
  }

  /**
   * Generic request method
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Remove Content-Type for FormData (let browser set it with boundary)
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Extract user-friendly error message from response
        const errorMessage = data.message || `HTTP error! status: ${response.status}`;
        const error = new Error(errorMessage);
        // Attach the full response data for additional context if needed
        (error as any).response = data;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ==================== Authentication ====================

  /**
   * Sign up super admin
   */
  async signup(username: string, email: string, password: string): Promise<ApiResponse<any>> {
    const response = await this.request('/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });

    if (response.success && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  /**
   * Login super admin
   */
  async login(email: string, password: string): Promise<ApiResponse<any>> {
    const response = await this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  /**
   * Logout (clear token)
   */
  logout() {
    this.setToken(null);
  }

  // ==================== Admins ====================

  /**
   * Get all admins
   */
  async getAdmins(): Promise<ApiResponse<any[]>> {
    return this.request('/admins');
  }

  /**
   * Create admin
   */
  async createAdmin(data: {
    username: string;
    email: string;
    password: string;
    permissions?: Record<string, boolean>;
  }): Promise<ApiResponse<any>> {
    return this.request('/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update admin
   */
  async updateAdmin(id: string, data: Partial<{
    username: string;
    email: string;
    password: string;
    permissions: Record<string, boolean>;
    isActive: boolean;
  }>): Promise<ApiResponse<any>> {
    return this.request(`/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete admin
   */
  async deleteAdmin(id: string): Promise<ApiResponse<void>> {
    return this.request(`/admins/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Employees ====================

  /**
   * Get all employees
   */
  async getEmployees(): Promise<ApiResponse<any[]>> {
    return this.request('/employees');
  }

  /**
   * Toggle employee status (activate/deactivate)
   */
  async toggleEmployeeStatus(id: string, isActive: boolean): Promise<ApiResponse<any>> {
    return this.request(`/employees/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  }

  /**
   * Update employee
   */
  async updateEmployee(id: string, data: Partial<{
    name: string;
    email: string;
    phone: string;
    dutyAddress: string;
    password: string;
    permissions: Record<string, boolean>;
  }>): Promise<ApiResponse<any>> {
    return this.request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ==================== Companies ====================

  /**
   * Get all companies
   */
  async getCompanies(): Promise<ApiResponse<any[]>> {
    return this.request('/companies');
  }

  /**
   * Create company
   */
  async createCompany(formData: FormData): Promise<ApiResponse<any>> {
    return this.request('/companies', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Update company
   */
  async updateCompany(id: string, formData: FormData): Promise<ApiResponse<any>> {
    return this.request(`/companies/${id}`, {
      method: 'PUT',
      body: formData,
    });
  }

  /**
   * Toggle company status (activate/deactivate)
   */
  async toggleCompanyStatus(id: string, isActive: boolean): Promise<ApiResponse<any>> {
    return this.request(`/companies/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  }

  /**
   * Delete company
   */
  async deleteCompany(id: string): Promise<ApiResponse<void>> {
    return this.request(`/companies/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Customers ====================

  /**
   * Get all customers
   */
  async getCustomers(): Promise<ApiResponse<any[]>> {
    return this.request('/customers');
  }

  /**
   * Create customer
   */
  async createCustomer(data: {
    username: string;
    email: string;
    password?: string;
    phone?: string;
    address?: string;
    country?: string;
    googleId?: string;
    isGoogleSignup?: boolean;
  }): Promise<ApiResponse<any>> {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update customer
   */
  async updateCustomer(id: string, data: Partial<{
    username: string;
    email: string;
    password: string;
    phone: string;
    address: string;
    country: string;
    isGoogleSignup: boolean;
  }>): Promise<ApiResponse<any>> {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete customer
   */
  async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    return this.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Queries ====================

  /**
   * Get all customer queries
   */
  async getQueries(): Promise<ApiResponse<any[]>> {
    return this.request('/queries');
  }

  /**
   * Respond to query
   */
  async respondToQuery(id: string, response: string): Promise<ApiResponse<any>> {
    return this.request(`/queries/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    });
  }

  // ==================== Transactions ====================

  /**
   * Get all transactions
   */
  async getTransactions(transactionId?: string): Promise<ApiResponse<any[]>> {
    const query = transactionId ? `?transactionId=${encodeURIComponent(transactionId)}` : '';
    return this.request(`/transactions${query}`);
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/transactions/${id}`);
  }

  // ==================== Notifications ====================

  /**
   * Get all notifications
   */
  async getNotifications(): Promise<ApiResponse<any[]>> {
    return this.request('/notifications');
  }

  /**
   * Create/send notification via FCM (expects deviceTokens array)
   */
  async createNotification(data: {
    titleText: string;
    bodyText: string;
    deviceTokens: string[];
    imageUrl?: string;
    clickAction?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    return this.request(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Banners ====================

  /**
   * Get all banners
   */
  async getBanners(): Promise<ApiResponse<any[]>> {
    return this.request('/banners');
  }

  /**
   * Upload banner with image file
   */
  async uploadBanner(formData: FormData): Promise<ApiResponse<any>> {
    return this.request('/banners', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Update banner (optionally with image file)
   */
  async updateBanner(
    id: string,
    formData: FormData
  ): Promise<ApiResponse<any>> {
    return this.request(`/banners/${id}`, {
      method: 'PUT',
      body: formData,
    });
  }

  /**
   * Delete banner
   */
  async deleteBanner(id: string): Promise<ApiResponse<void>> {
    return this.request(`/banners/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== FAQs ====================

  /**
   * Get all FAQs
   */
  async getFAQs(): Promise<ApiResponse<any[]>> {
    return this.request('/faqs');
  }

  /**
   * Create FAQ
   */
  async createFAQ(data: {
    question: string;
    answer: string;
    category?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<any>> {
    return this.request('/faqs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update FAQ
   */
  async updateFAQ(id: string, data: Partial<{
    question: string;
    answer: string;
    category: string;
    isActive: boolean;
  }>): Promise<ApiResponse<any>> {
    return this.request(`/faqs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete FAQ
   */
  async deleteFAQ(id: string): Promise<ApiResponse<void>> {
    return this.request(`/faqs/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Terms and Conditions ====================

  /**
   * Get all Terms and Conditions
   */
  async getTerms(): Promise<ApiResponse<any[]>> {
    return this.request('/terms');
  }

  /**
   * Create Terms and Conditions
   */
  async createTerms(data: {
    title: string;
    content: string;
    section?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<any>> {
    return this.request('/terms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update Terms and Conditions
   */
  async updateTerms(id: string, data: Partial<{
    title: string;
    content: string;
    section: string;
    isActive: boolean;
  }>): Promise<ApiResponse<any>> {
    return this.request(`/terms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete Terms and Conditions
   */
  async deleteTerms(id: string): Promise<ApiResponse<void>> {
    return this.request(`/terms/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Newsletters ====================

  /**
   * Get all newsletters
   */
  async getNewsletters(): Promise<ApiResponse<any[]>> {
    return this.request('/newsletters');
  }

  /**
   * Create newsletter with image upload
   */
  async createNewsletter(formData: FormData): Promise<ApiResponse<any>> {
    return this.request('/newsletters', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Update newsletter (optionally with image upload)
   */
  async updateNewsletter(id: string, formData: FormData): Promise<ApiResponse<any>> {
    return this.request(`/newsletters/${id}`, {
      method: 'PUT',
      body: formData,
    });
  }

  /**
   * Delete newsletter
   */
  async deleteNewsletter(id: string): Promise<ApiResponse<void>> {
    return this.request(`/newsletters/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Newsletter Emails ====================

  /**
   * Get all newsletter emails
   */
  async getNewsletterEmails(search?: string, source?: string, isActive?: boolean): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (source) params.append('source', source);
    if (isActive !== undefined) params.append('isActive', isActive.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/newsletter-emails${query}`);
  }

  /**
   * Get newsletter email by ID
   */
  async getNewsletterEmailById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/newsletter-emails/${id}`);
  }

  /**
   * Create newsletter email subscription
   */
  async createNewsletterEmail(data: {
    email: string;
    source?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/newsletter-emails', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update newsletter email (toggle active status or update source)
   */
  async updateNewsletterEmail(id: string, data: {
    isActive?: boolean;
    source?: string;
  }): Promise<ApiResponse<any>> {
    return this.request(`/newsletter-emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete newsletter email
   */
  async deleteNewsletterEmail(id: string): Promise<ApiResponse<void>> {
    return this.request(`/newsletter-emails/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== Super Admins ====================

  /**
   * Get all super admins
   */
  async getSuperAdmins(): Promise<ApiResponse<any[]>> {
    return this.request('/super-admins');
  }

  /**
   * Update super admin password
   */
  async updateSuperAdminPassword(id: string, currentPassword: string, newPassword: string): Promise<ApiResponse<any>> {
    return this.request(`/super-admins/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  /**
   * Send OTP for password change
   */
  async sendOTPForPasswordChange(email: string): Promise<ApiResponse<any>> {
    return this.request('/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Verify OTP for password change
   */
  async verifyOTPForPasswordChange(email: string, otp: string): Promise<ApiResponse<any>> {
    return this.request('/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  /**
   * Change password with OTP
   */
  async changePasswordWithOTP(email: string, newPassword: string): Promise<ApiResponse<any>> {
    return this.request('/change-password', {
      method: 'PUT',
      body: JSON.stringify({ email, newPassword }),
    });
  }

  // ==================== Contacts ====================

  /**
   * Get all customer contacts
   */
  async getContacts(): Promise<ApiResponse<any[]>> {
    return this.request('/contacts');
  }

  /**
   * Respond to contact
   */
  async respondToContact(id: string, response: string): Promise<ApiResponse<any>> {
    return this.request(`/contacts/${id}/respond`, {
      method: 'POST',
      body: JSON.stringify({ response }),
    });
  }

  // ==================== Settings ====================

  /**
   * Get settings
   */
  async getSettings(): Promise<ApiResponse<any>> {
    const url = `${SETTINGS_API_BASE_URL}`;
    const token = this.getToken();
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || `HTTP error! status: ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).response = data;
      throw error;
    }

    return data;
  }

  /**
   * Upload logo
   */
  async uploadLogo(file: File): Promise<ApiResponse<any>> {
    const url = `${SETTINGS_API_BASE_URL}/logo`;
    const token = this.getToken();
    const formData = new FormData();
    formData.append('logo', file);

    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || `HTTP error! status: ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).response = data;
      throw error;
    }

    return data;
  }

  /**
   * Update settings (JSON data)
   */
  async updateSettings(data: {
    termsCondition?: string;
    address?: string;
    phone?: string;
    email?: string;
    location?: string;
    instagram?: string;
    facebook?: string;
    x?: string;
    youtube?: string;
    tiktok?: string;
    linkedin?: string;
  }): Promise<ApiResponse<any>> {
    const url = `${SETTINGS_API_BASE_URL}`;
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = responseData.message || `HTTP error! status: ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).response = responseData;
      throw error;
    }

    return responseData;
  }

  // ==================== SEO ====================

  /**
   * Get SEO settings
   */
  async getSEO(): Promise<ApiResponse<any>> {
    const url = `${SETTINGS_API_BASE_URL}/seo`;
    const token = this.getToken();
    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || `HTTP error! status: ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).response = data;
      throw error;
    }

    return data;
  }

  /**
   * Update SEO settings
   */
  async updateSEO(data: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    canonicalUrl?: string;
    robotsMeta?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogUrl?: string;
    ogType?: string;
    ogSiteName?: string;
    twitterCard?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    twitterSite?: string;
    twitterCreator?: string;
    structuredData?: string;
    favicon?: string;
    sitemapUrl?: string;
  }): Promise<ApiResponse<any>> {
    const url = `${SETTINGS_API_BASE_URL}/seo`;
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = responseData.message || `HTTP error! status: ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).response = responseData;
      throw error;
    }

    return responseData;
  }

  /**
   * Upload SEO image (OG image, Twitter image, or favicon)
   */
  async uploadSEOImage(type: 'ogImage' | 'twitterImage' | 'favicon', file: File): Promise<ApiResponse<any>> {
    const url = `${SETTINGS_API_BASE_URL}/seo/image`;
    const token = this.getToken();
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

    const headers: HeadersInit = {
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || `HTTP error! status: ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).response = data;
      throw error;
    }

    return data;
  }
}

// Initialize and export the API service instance
const apiService = new ApiService(API_BASE_URL);

export default apiService;

