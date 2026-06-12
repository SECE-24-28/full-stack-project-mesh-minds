declare module 'qrcode' {
  interface QRCodeToDataURLOptions {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  const QRCode: {
    toDataURL(data: string, options?: QRCodeToDataURLOptions): Promise<string>;
  };

  export default QRCode;
}
