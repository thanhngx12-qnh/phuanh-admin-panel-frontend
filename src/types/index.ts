// src/types/index.ts

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

// --- THÊM INTERFACE CÒN THIẾU Ở ĐÂY ---
export interface Translation {
  locale: 'vi' | 'en' | 'zh';
  title: string;
  slug: string;
  // Các trường này có thể có hoặc không tùy vào model (News/Service)
  content?: string;
  shortDesc?: string;
  excerpt?: string;
}

export interface Service {
  id: number;
  code: string;
  category: string;
  coverImage: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  translations: Translation[];
}

export interface News {
  id: number;
  coverImage: string;
  status: 'DRAFT' | 'PUBLISHED';
  featured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  translations: Translation[];
}

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'CONTENT_MANAGER' | 'SALES' | 'OPS';
  createdAt: string;
  updatedAt: string;
}