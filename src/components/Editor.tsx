// src/components/Editor.tsx
'use client';

import React from 'react';
import { Editor as TinyMCEEditor } from '@tinymce/tinymce-react';
import { App } from 'antd';
import api, { BackendResponse } from '@/lib/axios'; // Import BackendResponse

interface EditorProps {
  value?: string;
  onChange?: (value: string) => void;
}

type UploadResponse = {
  url: string;
};

export function Editor({ value, onChange }: EditorProps) {
  const { notification } = App.useApp();

  const imageUploadHandler = async (blobInfo: any): Promise<string> => {
    const formData = new FormData();
    formData.append('file', blobInfo.blob(), blobInfo.filename());

    try {
      // --- SỬA LỖI Ở ĐÂY: Đọc đúng cấu trúc response ---
      const response = await api.post<BackendResponse<UploadResponse>>('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const imageUrl = response.data.data.url; // <-- Đường dẫn chính xác

      if (!imageUrl) {
        throw new Error('API không trả về URL ảnh.');
      }
      return imageUrl;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định';
      notification.error({ message: 'Upload ảnh thất bại', description: errorMessage });
      throw new Error(errorMessage);
    }
  };

  return (
    <TinyMCEEditor
      apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
      value={value}
      onEditorChange={onChange}
      init={{
        height: 500,
        menubar: true,
        plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'],
        toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | image link | code | help',
        content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
        images_upload_handler: imageUploadHandler,
        automatic_uploads: true,
        file_picker_types: 'image',
      }}
    />
  );
}