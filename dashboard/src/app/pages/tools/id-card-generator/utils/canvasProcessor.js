// Canvas processing utilities for ID Card Generator

export class CanvasProcessor {
  constructor() {
    this.canvas = null;
    this.ctx = null;
  }

  // Initialize canvas
  initCanvas(width, height) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = width;
    this.canvas.height = height;
    return this.canvas;
  }

  // Load image from URL or base64
  async loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  // Draw background image with cover strategy
  async drawBackground(src) {
    if (!src) return;

    const bgImg = await this.loadImage(src);
    const canvas = this.canvas;
    
    // Cover strategy
    const scale = Math.max(canvas.width / bgImg.width, canvas.height / bgImg.height);
    const scaledWidth = bgImg.width * scale;
    const scaledHeight = bgImg.height * scale;
    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;
    
    this.ctx.drawImage(bgImg, x, y, scaledWidth, scaledHeight);
  }

  // Draw profile image with feathering effect
  async drawProfileImage(src, x, y, width, height) {
    if (!src) return;

    const profileImg = await this.loadImage(src);
    
    // Create temporary canvas for processing
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = width;
    tempCanvas.height = height;

    // Draw and resize profile image
    tempCtx.drawImage(profileImg, 0, 0, width, height);

    // Apply feathering effect
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const featherWidth = 10;

    for (let px = 0; px < width; px++) {
      for (let py = 0; py < height; py++) {
        const distToEdge = Math.min(px, py, width - 1 - px, height - 1 - py);
        let alpha = 1.0;

        if (distToEdge < featherWidth) {
          alpha = distToEdge / featherWidth;
        }

        const pixelIndex = (py * width + px) * 4;
        data[pixelIndex + 3] = data[pixelIndex + 3] * alpha;
      }
    }

    tempCtx.putImageData(imageData, 0, 0);
    this.ctx.drawImage(tempCanvas, x, y);
  }

  // Draw QR code with square crop
  async drawQRCode(src, x, y, size) {
    if (!src) return;

    const qrImg = await this.loadImage(src);
    
    // Crop to square if needed
    const cropSize = Math.min(qrImg.width, qrImg.height);
    const cropX = (qrImg.width - cropSize) / 2;
    const cropY = (qrImg.height - cropSize) / 2;

    this.ctx.drawImage(qrImg, cropX, cropY, cropSize, cropSize, x, y, size, size);
  }

  // Draw text without any shadow - clean like printed text
  drawTextWithShadow(text, x, y, fontSize, fontFamily = 'Arial') {
    // Main color from PHP: imagecolorallocate($image, 23, 26, 29)
    const mainColor = 'rgb(23, 26, 29)';
    
    // Set font
    this.ctx.font = `${fontSize}px ${fontFamily}`;
    
    // NO shadow - just clean text like real printed ID card
    this.ctx.fillStyle = mainColor;
    this.ctx.fillText(text, x, y);
  }

  // Draw simple text
  drawText(text, x, y, fontSize, fontFamily = 'Arial', color = '#000000') {
    this.ctx.font = `${fontSize}px ${fontFamily}`;
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
  }

  // Get canvas as data URL
  toDataURL(type = 'image/png', quality = 1) {
    return this.canvas.toDataURL(type, quality);
  }

  // Get canvas as blob
  toBlob(type = 'image/png', quality = 1) {
    return new Promise((resolve) => {
      this.canvas.toBlob(resolve, type, quality);
    });
  }

  // Clean up
  destroy() {
    if (this.canvas) {
      this.canvas = null;
      this.ctx = null;
    }
  }
}

// Utility function to download image
export const downloadImage = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
};

// Utility function to format date
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN');
};

// Utility function to generate QR code URL
export const generateQRCodeURL = (data, size = 200) => {
  const encodedData = encodeURIComponent(data);
  return `https://quickchart.io/qr?text=${encodedData}&size=${size}`;
};

// Font loader utility
export const loadFont = (fontName, fontUrl) => {
  return new Promise((resolve, reject) => {
    const font = new FontFace(fontName, `url(${fontUrl})`);
    font.load().then((loadedFont) => {
      document.fonts.add(loadedFont);
      resolve(loadedFont);
    }).catch(reject);
  });
};
