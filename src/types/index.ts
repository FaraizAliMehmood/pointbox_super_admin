export interface User {
  id: string;
  email: string;
  username: string;
  role: 'super_admin' | 'admin' | 'employee';
  isActive: boolean;
  createdAt: string;
}

export interface Admin extends User {
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface Employee extends User {
  companyId: string;
  companyName: string;
  permissions?: Permission[];
}

export interface Company {
  id: string;
  name: string;
  licenseNumber: string;
  vatNumber: string;
  logo?: string;
  address?: string;
  country?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  address: string;
  country: string;
  googleSignUp: boolean;
  createdAt: string;
}

export interface CustomerQuery {
  id: string;
  customerEmail: string;
  subject: string;
  message: string;
  status: 'pending' | 'responded';
  response?: string;
  createdAt: string;
  respondedAt?: string;
}

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  companyName?: string;
  amount: number;
  type: 'earn' | 'redeem';
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  target: 'website' | 'mobile' | 'both';
  createdAt: string;
}

export interface Banner {
  id: string;
  badge?: string;
  title: string;
  description?: string;
  imageUrl: string;
  link?: string;
  productUrl?: string;
  isActive: boolean;
  type: 'regular' | 'special_event';
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface NewsletterImage {
  id: string;
  title: string;
  imageUrl: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export interface NewsletterEmail {
  id: string;
  email: string;
  subscribedAt: string;
  isActive: boolean;
  source?: string; // e.g., 'footer', 'manual', 'signup'
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status?: 'new' | 'read' | 'replied' | 'archived';
  repliedAt?: string;
  createdAt: string;
}

