// admin-panel-frontend/src/configs/site.ts
interface SiteConfig {
  companyName: string;
  taxCode: string;
  address: string;
  defaultTitle: string;
  titleTemplate: string;
  description: string;
}

export const siteConfig: SiteConfig = {
  companyName: 'CÔNG TY TNHH THƯƠG MẠI VẬN TẢI PHÚ ANH',
  taxCode: '4800166795',
  address: 'Số nhà 057, Tổ dân phố Hợp Giang 07, phố Nước Giáp, Phường Thục Phán, Cao Bằng, Việt Nam',
  defaultTitle: 'Phu Anh Admin Panel',
  titleTemplate: '%s | Phu Anh Admin',
  description: 'Admin Panel for Phu Anh Trading and Transport Co., Ltd.',
};