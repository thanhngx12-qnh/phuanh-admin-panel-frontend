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