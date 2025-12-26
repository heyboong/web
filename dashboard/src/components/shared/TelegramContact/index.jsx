import { useState } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useThemeContext } from 'app/contexts/theme/context';

export default function TelegramContact() {
  const [isOpen, setIsOpen] = useState(false);
  const { isDark } = useThemeContext();

  const handleContactClick = () => {
    window.open('https://t.me/scanvia247', '_blank');
  };

  return (
    <>
      {/* Floating Telegram Button */}
      <div className="fixed bottom-6 right-6 z-50 telegram-contact-button">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-telegram hover:bg-telegram-dark transition-all duration-300 rounded-full p-4 shadow-lg hover:shadow-xl transform hover:scale-105 group"
          aria-label="Contact via Telegram"
        >
          <svg
            className="w-6 h-6 text-white group-hover:scale-110 transition-transform duration-200"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
        </button>
      </div>

      {/* Float Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className={`relative w-full max-w-md transform transition-all duration-300 ${
            isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}>
            <div className={`rounded-2xl shadow-2xl overflow-hidden ${
              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'
            }`}>
              {/* Header */}
              <div className="bg-telegram px-6 py-4 relative">
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors duration-200"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold">Telegram Support</h3>
                    <p className="text-blue-100 text-sm">@scanvia247</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className={`text-center ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <h4 className={`text-lg font-medium mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Cần hỗ trợ?
                  </h4>
                  <p className="text-sm leading-relaxed mb-4">
                    Liên hệ với chúng tôi qua Telegram để được hỗ trợ nhanh chóng và tận tình. 
                    Đội ngũ support sẵn sàng giúp đỡ bạn 24/7!
                  </p>
                  
                  <div className={`rounded-lg p-4 mb-4 ${
                    isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className="flex items-center justify-center space-x-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                        Đang online - Phản hồi nhanh
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span>⚡ Hỗ trợ kỹ thuật</span>
                      <span className="text-green-500">✓</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>🔧 Hướng dẫn sử dụng</span>
                      <span className="text-green-500">✓</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-6">
                <button
                  onClick={handleContactClick}
                  className="w-full bg-telegram hover:bg-telegram-dark text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                  <span>Nhắn tin ngay</span>
                </button>
                
                <p className={`text-center text-xs mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Hoặc tìm kiếm <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">@scanvia247</span> trên Telegram
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
