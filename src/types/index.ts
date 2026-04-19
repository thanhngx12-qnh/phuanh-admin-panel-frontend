// ~dir: src/types/index.ts
export interface TrackingEvent {
  id: number;
  timestamp: string;
  status: string;
  location: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Consignment {
  id: number;
  awb: string;
  origin: string;
  destination: string;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  events: TrackingEvent[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

/**
 * Interface cho Danh mục (Mới cập nhật)
 */

export type CategoryType = 'NEWS' | 'SERVICE';
export interface Category {
  id: number;
  name: string;
  slug: string;
  type: 'NEWS' | 'SERVICE';
  description?: string;
  parentId?: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Interface cho Bản dịch (Cập nhật các trường SEO)
 */
export interface Translation {
  locale: string; // 'vi' | 'en' | 'zh' ...
  title: string;
  slug: string;
  content?: string;
  shortDesc?: string; // Dùng cho Service
  excerpt?: string;   // Dùng cho News
  
  // --- CÁC TRƯỜNG SEO MỚI ---
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
}

/**
 * Interface cho Dịch vụ (Cập nhật quan hệ Category)
 */
export interface Service {
  id: number;
  code: string;
  categoryId?: number; // ID liên kết
  category?: Category; // Object danh mục đính kèm
  coverImage: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  translations: Translation[];
}

/**
 * Interface cho Tin tức (Cập nhật quan hệ Category)
 */
export interface News {
  id: number;
  coverImage: string;
  status: 'DRAFT' | 'PUBLISHED';
  featured: boolean;
  categoryId?: number; // ID liên kết
  category?: Category; // Object danh mục đính kèm
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  translations: Translation[];
}

export interface ServiceInfo {
  id: number;
  translations: {
    locale: string;
    title: string;
  }[];
}

export interface Quote {
  id: number;
  customerName: string;
  email: string;
  phone: string;
  details: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
  service: ServiceInfo | null;
}

export type UserRole = 'ADMIN' | 'CONTENT_MANAGER' | 'SALES' | 'OPS';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type JobStatus = 'OPEN' | 'CLOSED';

export interface JobPosting {
  id: number;
  title: string;
  location: string;
  description: string;
  requirements: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: number;
  applicantName: string;
  email: string;
  phone: string;
  coverLetter?: string;
  cvPath: string; 
  appliedAt: string;
  jobPosting: JobPosting | null;
}