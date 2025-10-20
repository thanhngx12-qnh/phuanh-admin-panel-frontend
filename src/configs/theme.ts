// admin-panel-frontend/src/configs/theme.ts
import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    colorPrimary: '#0EA5E9', // Cyan
    borderRadius: 8,
    // Font family, cần đảm bảo font 'Inter' được load trước đó
    // fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
  },
  components: {
    // Tùy chỉnh cụ thể cho từng component (ví dụ: Button, Table)
    Button: {
      controlHeight: 40, // Chiều cao mặc định cho nút
      borderRadius: 8,
    },
    Input: {
      controlHeight: 40,
      borderRadius: 8,
    },
    Select: {
      controlHeight: 40,
      borderRadius: 8,
    },
    Table: {
      borderRadius: 8,
    },
    Layout: {
      headerBg: '#fff', // Màu nền Header của Layout
      footerBg: '#fff', // Màu nền Footer của Layout
    }
    // Thêm các tùy chỉnh component khác nếu cần
  },
};

export default theme;