// Import Dependencies
import { useEffect, useRef } from 'react';
import QRCodeLib from 'qrcode';
import PropTypes from 'prop-types';

// Local Imports
import clsx from 'clsx';

// ----------------------------------------------------------------------

export function QRCode({ 
  value, 
  size = 200, 
  className,
  errorCorrectionLevel = 'M',
  margin = 1,
  color = {
    dark: '#000000',
    light: '#FFFFFF'
  }
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Generate QR code
    QRCodeLib.toCanvas(canvas, value, {
      width: size,
      margin: margin,
      color: color,
      errorCorrectionLevel: errorCorrectionLevel,
    }).catch((error) => {
      console.error('QR Code generation failed:', error);
    });
  }, [value, size, errorCorrectionLevel, margin, color]);

  return (
    <div className={clsx("flex items-center justify-center", className)}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-lg border border-gray-200 dark:border-gray-700"
      />
    </div>
  );
}

QRCode.propTypes = {
  value: PropTypes.string.isRequired,
  size: PropTypes.number,
  className: PropTypes.string,
  errorCorrectionLevel: PropTypes.oneOf(['L', 'M', 'Q', 'H']),
  margin: PropTypes.number,
  color: PropTypes.shape({
    dark: PropTypes.string,
    light: PropTypes.string,
  }),
};
