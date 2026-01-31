import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content - Changed max-w-3xl to max-w-5xl for wider display */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
            </span>
            <h2 className="text-xl font-bold text-gray-800">Hướng dẫn sử dụng</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 text-sm text-gray-600 leading-relaxed">
          
          {/* Section 1: Workflow */}
          <section>
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">1</span>
                Quy trình cơ bản
            </h3>
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 space-y-3">
               <p>
                 <strong>B1: Nhập nguồn dữ liệu.</strong> Bạn có thể dán trực tiếp mã HTML vào ô nhập liệu hoặc điền URL trang web để tool tự tải về (Lưu ý: Một số trang web chặn tải tự động, hãy dùng cách copy HTML thủ công).
               </p>
               <p>
                 <strong>B2: Xác định Selector.</strong> Điền CSS Selector của phần tử cần lấy (ví dụ: <code>.product-item img</code>). Nếu không biết, hãy dùng tính năng <strong>Gợi ý AI</strong>.
               </p>
               <p>
                 <strong>B3: Chọn chế độ & Bóc tách.</strong> Chọn loại dữ liệu (Link/Ảnh/Text) và nhấn nút "Chạy Bóc Tách".
               </p>
            </div>
          </section>

          {/* Section 2: AI Features */}
          <section>
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">2</span>
                Tính năng AI thông minh
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-3 hover:border-purple-200 transition-colors">
                    <div className="font-semibold text-gray-800 mb-1">🔍 Gợi ý Selector</div>
                    <p className="text-xs">
                        Nếu bạn không rành code, hãy bấm nút "Hỏi AI" và mô tả bằng tiếng Việt (VD: "Lấy giá tiền màu đỏ"). AI sẽ tự viết selector cho bạn.
                    </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 hover:border-purple-200 transition-colors">
                    <div className="font-semibold text-gray-800 mb-1">✨ Class Ảnh tự động</div>
                    <p className="text-xs">
                        Tool tự động quét và liệt kê các class ảnh phổ biến. Bạn có thể bấm vào để chọn nhanh hoặc nhờ AI lọc ra class chính xác nhất.
                    </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 hover:border-purple-200 transition-colors col-span-1 md:col-span-2">
                    <div className="font-semibold text-gray-800 mb-1">🎨 Bóc tách AI (Figma Sync)</div>
                    <p className="text-xs">
                        Nút màu cam dành riêng cho Designer. AI sẽ đọc HTML và trả về bảng dữ liệu gồm <strong>Tên + Link Ảnh chất lượng cao nhất</strong>, sẵn sàng để copy vào plugin "Google Sheets Sync" trên Figma.
                    </p>
                </div>
            </div>
          </section>

          {/* Section 3: Tips & Tricks */}
          <section>
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">3</span>
                Mẹo xử lý & Xuất dữ liệu
            </h3>
            <ul className="list-disc pl-5 space-y-2">
                <li>
                    <strong>Lỗi không tải được URL?</strong> Do cơ chế bảo mật (CORS/Bot protection) của trang web đích. Hãy mở trang web đó trên tab mới, bấm <code>Ctrl + U</code> (Xem nguồn), copy toàn bộ và dán vào tool.
                </li>
                <li>
                    <strong>Copy định dạng (#):</strong> Dùng nút này nếu bạn muốn dán vào Excel/Sheet mà giữ nguyên định dạng ID (VD: #1, #2...).
                </li>
                <li>
                    <strong>Copy ảnh vào Figma:</strong> Ở cột hình ảnh, bấm nút "COPY ẢNH" để copy trực tiếp dữ liệu ảnh (blob) và dán (Ctrl+V) ngay vào Figma mà không cần tải về máy.
                </li>
            </ul>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button 
                onClick={onClose}
                className="bg-indigo-600 text-white px-5 py-2 rounded-md font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
                Đã hiểu, bắt đầu dùng!
            </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;