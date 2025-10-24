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
  // --- SỬA LỖI Ở ĐÂY: any -> unknown ---
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

// --- THÊM CÁC TYPE TẠM THỜI ĐỂ TEST ---
// Cấu trúc một bản dịch của tin tức
interface NewsTranslation {
  locale: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
}

// Cấu trúc của một bài viết tin tức trả về từ API /news/all
export interface NewsArticle {
  id: number;
  coverImage: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  translations: NewsTranslation[];
}