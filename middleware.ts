// dir: ~/admin-panel-frontend/middleware.ts
// PHIÊN BẢN AN TOÀN NẾU BẠN CẦN i18n
import createMiddleware from 'next-intl/middleware';

// Giả sử bạn có file định nghĩa locales
const locales = ['vi', 'en']; 

export default createMiddleware({
  locales: locales,
  defaultLocale: 'vi',
  localePrefix: 'always'
});

export const config = {
  matcher: [
    // Chỉ chạy middleware trên root path (/)
    '/',

    // Chạy middleware trên các path có tiền tố locale
    '/(vi|en)/:path*'
  ]
};