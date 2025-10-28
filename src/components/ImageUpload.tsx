// src/components/ImageUpload.tsx
'use client';

import React, { useState } from 'react';
import { App, Upload, Image, Button } from 'antd';
import type { UploadProps } from 'antd';
import { LoadingOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import api, { BackendResponse } from '@/lib/axios'; // Import BackendResponse

interface ImageUploadProps {
  value?: string;
  onChange?: (value: string | null) => void;
}

// Định nghĩa kiểu cho data trả về từ API upload
type UploadResponse = {
  url: string;
};

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const { notification } = App.useApp();

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append('file', file as Blob);

    setLoading(true);
    try {
      // --- SỬA LỖI Ở ĐÂY: Đọc đúng cấu trúc response ---
      const response = await api.post<BackendResponse<UploadResponse>>('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const imageUrl = response.data.data.url; // <-- Đường dẫn chính xác
      
      if (!imageUrl) {
        throw new Error('API không trả về URL ảnh.');
      }

      onChange?.(imageUrl);
      onSuccess?.(response.data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định';
      notification.error({ message: 'Upload ảnh thất bại', description: errorMessage });
      onError?.(new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemove = () => {
    onChange?.(null);
  }

  const uploadButton = (
    <button style={{ border: 0, background: 'none' }} type="button">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  return (
    <div>
      {value && (
        <div style={{ marginBottom: 8, position: 'relative', width: 104, height: 104 }}>
          <Image width={104} height={104} src={value} style={{ objectFit: 'cover' }} />
          <Button icon={<DeleteOutlined />} danger size="small" style={{ position: 'absolute', top: -5, right: -5 }} onClick={handleRemove} />
        </div>
      )}
      <Upload
        name="coverImage"
        listType="picture-card"
        className={value ? 'has-value' : ''} // Ẩn nút upload khi đã có ảnh
        showUploadList={false}
        customRequest={handleUpload}
        beforeUpload={(file) => {
          const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp';
          if (!isJpgOrPng) notification.error({ message: 'Bạn chỉ có thể upload file JPG/PNG/WEBP!' });
          const isLt5M = file.size / 1024 / 1024 < 5;
          if (!isLt5M) notification.error({ message: 'Ảnh phải nhỏ hơn 5MB!' });
          return isJpgOrPng && isLt5M;
        }}
      >
        {!value && uploadButton}
      </Upload>
    </div>
  );
}