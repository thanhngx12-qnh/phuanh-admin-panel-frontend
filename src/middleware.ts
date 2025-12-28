import createMiddleware from 'next-intl/middleware';
 
export default createMiddleware({
  // Danh sách ngôn ngữ bạn hỗ trợ
  locales: ['en', 'vi'],
 
  // Ngôn ngữ mặc định
  defaultLocale: 'vi'
});
 
export const config = {
  // Matcher chuẩn: Bỏ qua tất cả các file hệ thống (_next, api, file ảnh...)
  // ĐÂY LÀ DÒNG QUAN TRỌNG NHẤT ĐỂ TRÁNH LỖI BUILD
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};