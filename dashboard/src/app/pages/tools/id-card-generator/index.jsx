import { useState, useRef, useEffect } from 'react';
import { Page } from "components/shared/Page";
import { Card, Button, Input, Modal } from "components/ui";
import { useThemeContext } from "app/contexts/theme/context";
import SubscriptionGuard from "components/guards/SubscriptionGuard";
import { 
  PhotoIcon,
  PlusIcon,
  DocumentArrowDownIcon,
  ArrowPathIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

// Import fonts - UTM Arial
import utmArialBold from 'fonts/Arial/UTM ArialBold.ttf';
import utmArial from 'fonts/Arial/UTM Arial.ttf';
import ocrFont from 'fonts/OCR.otf';

export default function IDCardGenerator() {
  const { isDark } = useThemeContext();
  
  // State management
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImages, setPreviewImages] = useState({ front: null, back: null });
  const [fontsLoaded, setFontsLoaded] = useState(false);
  
  // Form data theo API PHP mới
  const [formData, setFormData] = useState({
    code: '079123456789',
    name: 'NGUYEN VAN A',
    date_birth: '15/03/1995',
    sex: 'Nam',
    quequan: 'Xã An Phú, Huyện Quốc Oai, Hà Nội',
    thuongtru1: 'Số 123, Đường Lê Lợi',
    thuongtru2: 'Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    dacdiem: 'Nốt ruồi 0.5cm ở mắt trái',
    ngaycap: '15/03/2020',
    ngayhethan: '15/03/2030',
    avatar: null,
    custom_background: null
  });

  // Helper: Tự động sinh số CCCD theo quy tắc
  const generateCCCDNumber = (dateBirth, sex, provinceCode = '079') => {
    if (!dateBirth || !sex) return null;
    
    // Parse date (format dd/mm/yyyy)
    const parts = dateBirth.split('/');
    if (parts.length !== 3) return null;
    
    const year = parseInt(parts[2]);
    if (isNaN(year)) return null;
    
    // Xác định mã giới tính và thế kỷ
    let genderCode;
    if (year >= 1900 && year <= 1999) {
      // Thế kỷ 20
      genderCode = sex === 'Nam' ? '0' : '1'; // Đơn giản hóa: Nam=0, Nữ=1
    } else if (year >= 2000 && year <= 2099) {
      // Thế kỷ 21
      genderCode = sex === 'Nam' ? '2' : '3'; // Nam=2, Nữ=3
    } else {
      genderCode = '0'; // Default
    }
    
    // 2 số cuối của năm sinh
    const yearCode = String(year).slice(-2);
    
    // 6 số ngẫu nhiên
    const randomCode = String(Math.floor(100000 + Math.random() * 900000));
    
    // Ghép thành CCCD: 3 số tỉnh + 1 số giới tính + 2 số năm + 6 số random
    return `${provinceCode}${genderCode}${yearCode}${randomCode}`;
  };

  // Auto-update CCCD when date_birth or sex changes
  useEffect(() => {
    if (formData.date_birth && formData.sex) {
      setFormData(prev => {
        // Lấy mã tỉnh từ CCCD hiện tại (3 số đầu)
        const currentProvinceCode = prev.code.substring(0, 3) || '079';
        const newCCCD = generateCCCDNumber(prev.date_birth, prev.sex, currentProvinceCode);
        
        // Only update if CCCD actually changed
        if (newCCCD && newCCCD !== prev.code) {
          return { ...prev, code: newCCCD };
        }
        return prev;
      });
    }
  }, [formData.date_birth, formData.sex]);

  // Template images từ API mới
  const frontTemplate = 'http://via88online.com/uploads/template-images/template-img-1759235739285-454365100-f1.png.png';
  const backTemplate = 'http://via88online.com/uploads/template-images/template-img-1759235739345-690185194-b.png.png';
  const defaultBg = 'http://via88online.com/uploads/template-images/template-img-1759235738899-815513456-bg1.jpg.jpg';

  // File input refs
  const avatarRef = useRef(null);
  const bgRef = useRef(null);

  // Load fonts
  useEffect(() => {
    const loadFonts = async () => {
      try {
        const boldFace = new FontFace('UTMArialBold', `url(${utmArialBold})`);
        const regularFace = new FontFace('UTMArial', `url(${utmArial})`);
        const ocrFace = new FontFace('OCRFont', `url(${ocrFont})`);

        await Promise.all([boldFace.load(), regularFace.load(), ocrFace.load()]);

        document.fonts.add(boldFace);
        document.fonts.add(regularFace);
        document.fonts.add(ocrFace);

        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        toast.error('Failed to load fonts');
      }
    };

    loadFonts();
  }, []);

  // Load image helper
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Render text with shadow - EXACT PHP function
  const renderTextWithShadow = (ctx, text, fontFamily, size, x, y) => {
    if (!text) return;
    
    const mainColor = 'rgb(23, 26, 29)';
    
    // Blur algorithm từ PHP
    const blurStrength = 2.9;
    const radiusFloor = Math.floor(blurStrength); // 2
    const radiusCeil = radiusFloor + 1; // 3
    const fraction = blurStrength - radiusFloor;
    
    const alphaBase = 125;
    const alphaCeil = Math.min(127, alphaBase + Math.round((1 - fraction) * 10));
    
    // Convert GD alpha to CSS opacity
    const opacityFloor = (127 - alphaBase) / 127;
    const opacityCeil = (127 - alphaCeil) / 127;
    
    // CRITICAL: Set font and textBaseline EXACTLY like PHP GD
    ctx.font = `${size}px ${fontFamily}`;
    ctx.textBaseline = 'alphabetic'; // Match PHP imagettftext baseline
    
    // Pass 1: floor radius
    ctx.fillStyle = `rgba(0, 0, 0, ${opacityFloor})`;
    for (let blurX = -radiusFloor; blurX <= radiusFloor; blurX++) {
      for (let blurY = -radiusFloor; blurY <= radiusFloor; blurY++) {
        ctx.fillText(text, x + blurX, y + blurY);
      }
    }
    
    // Pass 2: ceil radius
    ctx.fillStyle = `rgba(0, 0, 0, ${opacityCeil})`;
    for (let blurX = -radiusCeil; blurX <= radiusCeil; blurX++) {
      for (let blurY = -radiusCeil; blurY <= radiusCeil; blurY++) {
        ctx.fillText(text, x + blurX, y + blurY);
      }
    }
    
    // Main text
    ctx.fillStyle = mainColor;
    ctx.fillText(text, x, y);
  };

  // Helper: Calculate scaled size (EXACT PHP mergeOverlayImage logic)
  const calculateScaledSize = (origW, origH, destW, destH, scalePercent) => {
    // Nếu destW/destH = 0, dùng size gốc
    if (destW <= 0) destW = origW;
    if (destH <= 0) destH = origH;
    
    // Áp dụng tỷ lệ %
    if (scalePercent !== 100) {
      destW = Math.round(destW * scalePercent / 100);
      destH = Math.round(destH * scalePercent / 100);
    }
    
    return { width: destW, height: destH };
  };

  // Generate Front Side theo API mới
  const generateFrontSide = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    try {
      // Load background
      let bgImg;
      if (formData.custom_background) {
        bgImg = await loadImage(formData.custom_background);
      } else {
        bgImg = await loadImage(defaultBg);
      }
      
      canvas.width = 1300;
      canvas.height = 867;
      
      // Draw background - PHP giữ nguyên size gốc của bg1.jpg (1300x867)
      ctx.drawImage(bgImg, 0, 0, 1300, 867);
      
      // IMPORTANT: PHP order - Avatar FIRST, then f1.png overlay
      
      // 1. Merge avatar - PHP: mergeOverlayImageFromBase64($image, $data['avatar'], 125, 330, 290, 390, 100)
      // destX=125, destY=330, destW=290, destH=390, scale=100%
      if (formData.avatar) {
        const avatarImg = await loadImage(formData.avatar);
        const avatarSize = calculateScaledSize(avatarImg.width, avatarImg.height, 290, 390, 100);
        ctx.drawImage(avatarImg, 125, 330, avatarSize.width, avatarSize.height);
      }
      
      // 2. Merge f1.png overlay - PHP: mergeOverlayImage($image, 'f1.png', 100, 100, 0, 0, 90)
      // destX=100, destY=100, destW=0 (use orig 1238), destH=0 (use orig 790), scale=90%
      const f1Img = await loadImage(frontTemplate);
      const f1Size = calculateScaledSize(f1Img.width, f1Img.height, 0, 0, 90);
      ctx.globalAlpha = 0.9; // Not used in PHP, but kept for visual consistency
      ctx.drawImage(f1Img, 100, 100, f1Size.width, f1Size.height);
      ctx.globalAlpha = 1;
      
      // Generate QR code - EXACT PHP logic
      const toTitleCase = (str) => str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      const formatDateDMY = (dateStr) => {
        const parts = dateStr.split('/');
        if (parts.length === 3) return parts[0] + parts[1] + parts[2]; // ddmmyyyy
        return dateStr.replace(/\//g, '');
      };
      
      const date1 = formatDateDMY(formData.date_birth);
      const date2 = formatDateDMY(formData.ngaycap); // ⚠️ PHP dùng ngaycap, không phải ngayhethan!
      const namex = toTitleCase(formData.name);
      
      const qrText = `${formData.code}||${namex}|${date1}|${formData.sex}|${formData.thuongtru1} ${formData.thuongtru2}|${date2}`;
      const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(qrText)}&size=200x200&format=png&light=0000`;
      
      try {
        // PHP: mergeOverlayImageFromBase64($image, $base64, 975, 150, 0, 0, 85)
        // destX=975, destY=150, destW=0 (use orig ~200), destH=0 (use orig ~200), scale=85%
        const qrImg = await loadImage(qrUrl);
        const qrSize = calculateScaledSize(qrImg.width, qrImg.height, 0, 0, 85);
        ctx.drawImage(qrImg, 975, 150, qrSize.width, qrSize.height);
      } catch {
        console.warn('Failed to load QR, skipping');
      }
      
      // Render text với shadow
      renderTextWithShadow(ctx, formData.code, 'UTMArialBold', 44, 545, 430);
      renderTextWithShadow(ctx, formData.name, 'UTMArial', 29, 430, 515);
      renderTextWithShadow(ctx, formData.date_birth, 'UTMArial', 27, 721, 553);
      renderTextWithShadow(ctx, formData.sex, 'UTMArial', 27, 623, 602);
      renderTextWithShadow(ctx, 'Việt Nam', 'UTMArial', 27, 996, 603);
      renderTextWithShadow(ctx, formData.quequan, 'UTMArial', 27, 430, 683);
      renderTextWithShadow(ctx, formData.thuongtru1, 'UTMArial', 27, 853, 725);
      renderTextWithShadow(ctx, formData.thuongtru2, 'UTMArial', 27, 430, 760);
      renderTextWithShadow(ctx, formData.ngayhethan, 'UTMArial', 23, 278, 739);

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating front:', error);
      throw error;
    }
  };

  // Generate MRZ code - EXACT PHP logic
  const generateMRZ = () => {
    // PHP: removeVietnameseAccents
    const removeAccents = (str) => {
      const accentsMap = {
        'á':'a','à':'a','ả':'a','ã':'a','ạ':'a','ă':'a','ắ':'a','ằ':'a','ẳ':'a','ẵ':'a','ặ':'a',
        'â':'a','ấ':'a','ầ':'a','ẩ':'a','ẫ':'a','ậ':'a','đ':'d','é':'e','è':'e','ẻ':'e','ẽ':'e',
        'ẹ':'e','ê':'e','ế':'e','ề':'e','ể':'e','ễ':'e','ệ':'e','í':'i','ì':'i','ỉ':'i','ĩ':'i',
        'ị':'i','ó':'o','ò':'o','ỏ':'o','õ':'o','ọ':'o','ô':'o','ố':'o','ồ':'o','ổ':'o','ỗ':'o',
        'ộ':'o','ơ':'o','ớ':'o','ờ':'o','ở':'o','ỡ':'o','ợ':'o','ú':'u','ù':'u','ủ':'u','ũ':'u',
        'ụ':'u','ư':'u','ứ':'u','ừ':'u','ử':'u','ữ':'u','ự':'u','ý':'y','ỳ':'y','ỷ':'y','ỹ':'y','ỵ':'y',
        'Á':'A','À':'A','Ả':'A','Ã':'A','Ạ':'A','Ă':'A','Ắ':'A','Ằ':'A','Ẳ':'A','Ẵ':'A','Ặ':'A',
        'Â':'A','Ấ':'A','Ầ':'A','Ẩ':'A','Ẫ':'A','Ậ':'A','Đ':'D','É':'E','È':'E','Ẻ':'E','Ẽ':'E',
        'Ẹ':'E','Ê':'E','Ế':'E','Ề':'E','Ể':'E','Ễ':'E','Ệ':'E','Í':'I','Ì':'I','Ỉ':'I','Ĩ':'I',
        'Ị':'I','Ó':'O','Ò':'O','Ỏ':'O','Õ':'O','Ọ':'O','Ô':'O','Ố':'O','Ồ':'O','Ổ':'O','Ỗ':'O',
        'Ộ':'O','Ơ':'O','Ớ':'O','Ờ':'O','Ở':'O','Ỡ':'O','Ợ':'O','Ú':'U','Ù':'U','Ủ':'U','Ũ':'U',
        'Ụ':'U','Ư':'U','Ứ':'U','Ừ':'U','Ử':'U','Ữ':'U','Ự':'U','Ý':'Y','Ỳ':'Y','Ỷ':'Y','Ỹ':'Y','Ỵ':'Y'
      };
      return str.split('').map(c => accentsMap[c] || c).join('').toUpperCase();
    };
    
    // PHP: formatTo20Chars (30 chars)
    const formatTo30Chars = (s) => {
      s = s.trim().replace(/\s+/g, '<');
      return s.padEnd(30, '<');
    };
    
    // PHP: Custom date format
    const customDateFormat = (dateStr) => {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        const year = parts[2];
        const month = parts[1];
        const day = parts[0];
        // Năm: lấy số đầu và 2 số cuối → 2 + 04 = 204
        const yearCustom = year.charAt(0) + year.slice(-2);
        return yearCustom + month + day;
      }
      return '0000000';
    };
    
    const birthResult = customDateFormat(formData.date_birth);
    const expiryResult = customDateFormat(formData.ngayhethan);
    
    const randomId = Math.floor(111111111 + Math.random() * 888888888);
    const line1 = `IDVNM${randomId}${Math.floor(Math.random() * 9)}${formData.code}<<${birthResult.charAt(0)}`;
    const line2 = `${birthResult.slice(1)}${Math.floor(Math.random() * 9)}M${expiryResult.slice(1)}${Math.floor(Math.random() * 9)}VNM<<<<<<<<<<<${Math.floor(Math.random() * 9)}`;
    const line3 = formatTo30Chars(removeAccents(formData.name));
    
    return `${line1}\n${line2}\n${line3}`;
  };

  // Generate Back Side
  const generateBackSide = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    try {
      // Load background
      let bgImg;
      if (formData.custom_background) {
        bgImg = await loadImage(formData.custom_background);
      } else {
        bgImg = await loadImage(defaultBg);
      }
      
      canvas.width = 1300;
      canvas.height = 867;
      
      // Draw background - PHP giữ nguyên size gốc của bg1.jpg (1300x867)
      ctx.drawImage(bgImg, 0, 0, 1300, 867);
      
      // Merge b.png overlay - PHP mặt sau KHÔNG CÓ nhưng logic giống f1.png
      // Giả sử: mergeOverlayImage($image, 'b.png', 100, 100, 0, 0, 90)
      const bImg = await loadImage(backTemplate);
      const bSize = calculateScaledSize(bImg.width, bImg.height, 0, 0, 90);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(bImg, 100, 100, bSize.width, bSize.height);
      ctx.globalAlpha = 1;
      
      // Generate MRZ
      const mrzText = generateMRZ();
      
      // Render MRZ với shadow - EXACT PHP logic (multi-line)
      const mainColor = 'rgb(23, 26, 29)';
      ctx.font = '53px OCRFont';
      ctx.textBaseline = 'alphabetic'; // Match PHP
      
      const radiusFloor = 2;
      const radiusCeil = 3;
      const fraction = 0.9;
      const alphaBase = 125;
      const alphaCeil = Math.min(127, alphaBase + Math.round((1 - fraction) * 10));
      const opacityFloor = (127 - alphaBase) / 127;
      const opacityCeil = (127 - alphaCeil) / 127;
      
      // Split MRZ into lines and render each line separately
      const mrzLines = mrzText.split('\n');
      const lineHeight = 60; // Line spacing for 53px font
      const startX = 179; // Dịch sang phải từ 170 → 200
      const startY = 620;
      
      mrzLines.forEach((line, index) => {
        const yPos = startY + (index * lineHeight);
        
        // Pass 1: floor radius shadow
        ctx.fillStyle = `rgba(0, 0, 0, ${opacityFloor})`;
        for (let blurX = -radiusFloor; blurX <= radiusFloor; blurX++) {
          for (let blurY = -radiusFloor; blurY <= radiusFloor; blurY++) {
            ctx.fillText(line, startX + blurX, yPos + blurY);
          }
        }
        
        // Pass 2: ceil radius shadow
        ctx.fillStyle = `rgba(0, 0, 0, ${opacityCeil})`;
        for (let blurX = -radiusCeil; blurX <= radiusCeil; blurX++) {
          for (let blurY = -radiusCeil; blurY <= radiusCeil; blurY++) {
            ctx.fillText(line, startX + blurX, yPos + blurY);
          }
        }
        
        // Main text
        ctx.fillStyle = mainColor;
        ctx.fillText(line, startX, yPos);
      });
      
      // Render đặc điểm và ngày cấp
      renderTextWithShadow(ctx, formData.dacdiem, 'UTMArial', 25, 142, 177);
      renderTextWithShadow(ctx, formData.ngaycap, 'UTMArial', 23, 555, 231);

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error generating back:', error);
      throw error;
    }
  };

  // Handle generate
  const handleGenerate = async () => {
    if (!fontsLoaded) {
      toast.error('Đang tải fonts, vui lòng đợi...');
      return;
    }
    
    if (!formData.avatar) {
      toast.error('Vui lòng chọn ảnh thẻ!');
      return;
    }

    setIsGenerating(true);
    try {
      const [frontImage, backImage] = await Promise.all([
        generateFrontSide(),
        generateBackSide()
      ]);
      
      setPreviewImages({ front: frontImage, back: backImage });
      setIsPreviewOpen(true);
      
      toast.success('CCCD đã được tạo thành công!');
    } catch (error) {
      toast.error('Lỗi tạo CCCD: ' + error.message);
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (file, field) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, [field]: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  // Handle download
  const handleDownload = (side) => {
    const image = previewImages[side];
    if (image) {
      const link = document.createElement('a');
      link.download = `cccd_${side === 'front' ? 'mat_truoc' : 'mat_sau'}.png`;
      link.href = image;
      link.click();
    }
  };

  return (
    <SubscriptionGuard>
      <Page title="Tạo CCCD XMDT">
        <div className="transition-content w-full px-(--margin-x) pt-5 lg:pt-6">
          <div className="min-w-0">
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <UserIcon className={`h-6 w-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Tạo CCCD XMDT
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      Công cụ tạo căn cước công dân 2 mặt - Mục đích nghiên cứu
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !fontsLoaded}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isGenerating ? (
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <PlusIcon className="w-4 h-4 mr-2" />
                  )}
                  {isGenerating ? 'Đang tạo...' : 'Tạo CCCD'}
                </Button>
              </div>
            </div>

            {!fontsLoaded && (
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-200">
                  <ArrowPathIcon className="w-4 h-4 inline mr-2 animate-spin" />
                  Đang tải fonts...
                </p>
              </div>
            )}

            {/* Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Avatar Upload */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Ảnh thẻ (3x4)
                </h3>
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => avatarRef.current?.click()}
                >
                  <input
                    ref={avatarRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'avatar')}
                    className="hidden"
                  />
                  {formData.avatar ? (
                    <div className="space-y-3">
                      <img src={formData.avatar} alt="Avatar" className="w-32 h-40 object-cover mx-auto rounded-lg border-2 border-blue-500" />
                      <Button variant="outlined" size="sm">Đổi ảnh</Button>
                    </div>
                  ) : (
                    <div>
                      <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">Chọn ảnh thẻ</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Background Upload */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Ảnh nền (tùy chọn)
                </h3>
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => bgRef.current?.click()}
                >
                  <input
                    ref={bgRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'custom_background')}
                    className="hidden"
                  />
                  {formData.custom_background ? (
                    <div className="space-y-3">
                      <img src={formData.custom_background} alt="BG" className="w-full h-24 object-cover rounded-lg" />
                      <Button variant="outlined" size="sm">Đổi nền</Button>
                    </div>
                  ) : (
                    <div>
                      <PhotoIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">Dùng nền mặc định</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Info Card */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Thông tin
                </h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>✅ QR code tự động</p>
                  <p>✅ Shadow effect tự nhiên</p>
                  <p>✅ MRZ code tự động</p>
                  <p>✅ Font chính xác</p>
                </div>
              </Card>

              {/* Form Fields */}
              <Card className="lg:col-span-3 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Số CCCD *</label>
                    <Input value={formData.code} onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))} placeholder="079123456789" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Họ và tên *</label>
                    <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="NGUYEN VAN A" className="uppercase" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ngày sinh *</label>
                    <Input value={formData.date_birth} onChange={(e) => setFormData(prev => ({ ...prev, date_birth: e.target.value }))} placeholder="15/03/1995" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Giới tính *</label>
                    <select value={formData.sex} onChange={(e) => setFormData(prev => ({ ...prev, sex: e.target.value }))} className="w-full px-4 py-2.5 border rounded-lg dark:bg-gray-700">
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Quê quán *</label>
                    <Input value={formData.quequan} onChange={(e) => setFormData(prev => ({ ...prev, quequan: e.target.value }))} placeholder="Xã An Phú, Huyện Quốc Oai, Hà Nội" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Nơi thường trú - Dòng 1 *</label>
                    <Input value={formData.thuongtru1} onChange={(e) => setFormData(prev => ({ ...prev, thuongtru1: e.target.value }))} placeholder="Số 123, Đường Lê Lợi" />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium mb-2">Nơi thường trú - Dòng 2 *</label>
                    <Input value={formData.thuongtru2} onChange={(e) => setFormData(prev => ({ ...prev, thuongtru2: e.target.value }))} placeholder="Phường..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Đặc điểm nhận dạng</label>
                    <Input value={formData.dacdiem} onChange={(e) => setFormData(prev => ({ ...prev, dacdiem: e.target.value }))} placeholder="Nốt ruồi..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ngày cấp *</label>
                    <Input value={formData.ngaycap} onChange={(e) => setFormData(prev => ({ ...prev, ngaycap: e.target.value }))} placeholder="15/03/2020" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Ngày hết hạn *</label>
                    <Input value={formData.ngayhethan} onChange={(e) => setFormData(prev => ({ ...prev, ngayhethan: e.target.value }))} placeholder="15/03/2030" />
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Preview Modal */}
          {isPreviewOpen && (
            <Modal open={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title="CCCD Preview" size="xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center">
                  <h4 className="font-semibold mb-2">Mặt trước</h4>
                  {previewImages.front && <img src={previewImages.front} alt="Front" className="w-full rounded-lg border" />}
                  <Button onClick={() => handleDownload('front')} className="mt-2 w-full" size="sm">
                    <DocumentArrowDownIcon className="w-4 h-4 mr-2" />Tải mặt trước
                  </Button>
                </div>
                <div className="text-center">
                  <h4 className="font-semibold mb-2">Mặt sau</h4>
                  {previewImages.back && <img src={previewImages.back} alt="Back" className="w-full rounded-lg border" />}
                  <Button onClick={() => handleDownload('back')} className="mt-2 w-full" size="sm">
                    <DocumentArrowDownIcon className="w-4 h-4 mr-2" />Tải mặt sau
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      </Page>
    </SubscriptionGuard>
  );
}