import { UserPortfolio } from './userPortfolio';

export interface PdfWorkerPayload {
  portfolio: UserPortfolio;
  scaleFactor: number;
  assets: {
    poppinsRegular?: string;
    poppinsBold?: string;
    poppinsItalic?: string;
    watermark?: string;
    euLogo?: string;
    spaceSuiteLogo?: string;
  };
}