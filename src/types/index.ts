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
 * Interface cho Bản dịch Danh mục (Mới)
 */
export interface CategoryTranslation {
  id?: number;
  locale: string;
  name: string;
  slug: string;
  description?: string;
}

/**
 * Interface cho Danh mục (Đã cập nhật đa ngôn ngữ)
 */
export type CategoryType = 'NEWS' | 'SERVICE';
export interface Category {
  id: number;
  type: CategoryType;
  parentId?: number | null;
  createdAt: string;
  updatedAt: string;
  translations: CategoryTranslation[]; // Dữ liệu nằm trong mảng này
  children?: Category[];
}

/**
 * Interface cho Bản dịch News/Service (Cập nhật các trường SEO)
 */
export interface Translation {
  id?: number;
  locale: string; // 'vi' | 'en' | 'zh' ...
  title: string;
  slug: string;
  content?: string;
  shortDesc?: string; // Dùng cho Service
  excerpt?: string;   // Dùng cho News
  
  // --- CÁC TRƯỜNG SEO ---
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
}

/**
 * Interface cho Dịch vụ (Quan hệ với Category đa ngôn ngữ)
 */
export interface Service {
  id: number;
  code: string;
  categoryId?: number;
  category?: Category; // Truy cập tên qua category.translations[0].name
  coverImage: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  translations: Translation[];
}

/**
 * Interface cho Tin tức (Quan hệ với Category đa ngôn ngữ)
 */
export interface News {
  id: number;
  coverImage: string;
  status: 'DRAFT' | 'PUBLISHED';
  featured: boolean;
  categoryId?: number;
  category?: Category; 
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