import React, { useState, useEffect } from 'react';
import { ExtractionMode, DetectedClass } from '../types';
import { getSmartSelector, selectBestClassFromList } from '../services/geminiService';
import { fetchHtmlFromUrl, scanImageClasses } from '../services/parserService';

interface ExtractionControlsProps {
  projectName: string;
  onProjectNameChange: (val: string) => void;
  html: string;
  onHtmlChange: (val: string) => void;
  selector: string;
  onSelectorChange: (val: string) => void;
  mode: ExtractionMode;
  onModeChange: (val: ExtractionMode) => void;
  limit: number;
  onLimitChange: (val: number) => void;
  onExtract: () => void;
  onAiExtract: () => void; 
  onSave: () => void;
  isSaving?: boolean;
  isAiExtracting?: boolean; 
}

// Frappe-like Input Style Class - Changed bg-gray-50 to bg-white for better contrast
const inputClass = "w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all";
const labelClass = "block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide";

const ExtractionControls: React.FC<ExtractionControlsProps> = ({
  projectName,
  onProjectNameChange,
  html,
  onHtmlChange,
  selector,
  onSelectorChange,
  mode,
  onModeChange,
  limit,
  onLimitChange,
  onExtract,
  onAiExtract,
  onSave,
  isSaving,
  isAiExtracting
}) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);
  
  // URL Fetching State
  const [urlInput, setUrlInput] = useState('');
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);

  // Class Detection State
  const [detectedClasses, setDetectedClasses] = useState<DetectedClass[]>([]);

  // When HTML changes, scan for classes
  useEffect(() => {
    if (html) {
      const found = scanImageClasses(html);
      setDetectedClasses(found);
    } else {
      setDetectedClasses([]);
    }
  }, [html]);

  const handleAiSuggest = async (overridePrompt?: string) => {
    if (!html) {
      alert("Vui lòng dán mã HTML hoặc tải từ URL trước.");
      return;
    }
    
    const promptToUse = overridePrompt || aiPrompt;
    if (!promptToUse) return;

    setIsAiLoading(true);
    try {
      const suggestedSelector = await getSmartSelector(html, promptToUse);
      if (suggestedSelector) {
        onSelectorChange(suggestedSelector);
        // Auto-switch mode based on intent
        if (promptToUse.toLowerCase().includes('ảnh') || promptToUse.toLowerCase().includes('image')) {
            onModeChange(ExtractionMode.IMAGES);
        } else if (promptToUse.toLowerCase().includes('link') || promptToUse.toLowerCase().includes('liên kết')) {
            onModeChange(ExtractionMode.LINKS);
        } else {
            onModeChange(ExtractionMode.TEXT);
        }
        setShowAiInput(false);
      } else {
        alert("AI không tìm thấy selector phù hợp.");
      }
    } catch (e) {
      alert("Lỗi khi kết nối với AI.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiPickFromList = async () => {
     if (detectedClasses.length === 0) return;
     setIsAiLoading(true);
     try {
         const best = await selectBestClassFromList(detectedClasses);
         if (best) {
             onSelectorChange(best);
             onModeChange(ExtractionMode.IMAGES);
         } else {
             alert("AI chưa quyết định được, bạn hãy chọn thủ công.");
         }
     } catch(e) {
         console.error(e);
     } finally {
         setIsAiLoading(false);
     }
  };

  const handleFetchUrl = async () => {
    if (!urlInput) return;
    setIsFetchingUrl(true);
    try {
      const fetchedHtml = await fetchHtmlFromUrl(urlInput);
      onHtmlChange(fetchedHtml);
    } catch (error: any) {
      alert(error.message || "Không thể tải trang web này.");
    } finally {
      setIsFetchingUrl(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 h-fit flex flex-col gap-5">
      
      {/* Project Meta */}
      <div>
         <label className={labelClass}>Tên Dự Án</label>
         <div className="flex gap-2">
            <input 
              type="text" 
              className={`${inputClass} font-semibold`}
              value={projectName}
              onChange={(e) => onProjectNameChange(e.target.value)}
              placeholder="Dự án không tên"
            />
            <button 
              onClick={onSave}
              className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors flex-shrink-0 flex items-center gap-2"
            >
              {isSaving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0111.186 0z" />
                </svg>
              )}
              Lưu
            </button>
         </div>
      </div>

      <hr className="border-gray-100" />

      {/* URL Input Step */}
      <div>
        <label className={labelClass}>
          1. Nhập Link Website (Tự động tải HTML)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            className={inputClass}
            placeholder="https://example.com/danh-muc-san-pham"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
          />
          <button
            onClick={handleFetchUrl}
            disabled={isFetchingUrl || !urlInput}
            className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors whitespace-nowrap min-w-[80px] flex justify-center items-center"
          >
            {isFetchingUrl ? (
               <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : 'Tải HTML'}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 italic">
          *Lưu ý: Một số trang web bảo mật cao (Shopee, FB) có thể chặn tính năng này.
        </p>
      </div>

      {/* HTML Input Step */}
      <div className="flex-1 flex flex-col min-h-[100px]">
        <div className="flex justify-between items-center mb-1">
          <label className={labelClass}>
            Mã nguồn HTML
          </label>
          {html && (
            <button 
              onClick={() => onHtmlChange('')}
              className="text-[10px] text-red-500 hover:text-red-700 underline"
            >
              Xóa HTML
            </button>
          )}
        </div>
        <textarea
          className={`${inputClass} flex-1 font-mono text-xs resize-none`}
          placeholder={html ? "" : "Nội dung HTML sẽ hiển thị ở đây sau khi tải URL..."}
          value={html}
          onChange={(e) => onHtmlChange(e.target.value)}
        />
      </div>

      {/* Detected Classes Section */}
      {detectedClasses.length > 0 && (
         <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
             <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-700 uppercase">Class Ảnh Tìm Thấy</span>
                <button 
                    onClick={handleAiPickFromList}
                    disabled={isAiLoading}
                    className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold hover:bg-purple-200 flex items-center gap-1"
                >
                    {isAiLoading ? '...' : '✨ AI Lọc Giúp'}
                </button>
             </div>
             <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto">
                {detectedClasses.map((cls, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            onSelectorChange(cls.className);
                            onModeChange(ExtractionMode.IMAGES);
                        }}
                        className="text-[10px] text-gray-700 px-2 py-1 bg-white border border-gray-300 rounded hover:bg-indigo-50 hover:border-indigo-400 hover:text-indigo-700 hover:shadow-sm transition-all text-left flex items-center gap-2 group"
                        title={`Found ${cls.count} times. Type: ${cls.type}`}
                    >
                       <span className="font-mono font-semibold">{cls.className}</span>
                       <span className="bg-gray-100 text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded text-[9px] group-hover:bg-white group-hover:border-indigo-200 transition-colors">{cls.count}</span>
                    </button>
                ))}
             </div>
         </div>
      )}

      {/* Smart Selector Helper (Legacy) */}
      {!detectedClasses.length && html && (
        <div className="bg-indigo-50/60 p-3 rounded-lg border border-indigo-100">
           <div className="text-xs font-semibold text-indigo-800 mb-2 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a4.5 4.5 0 110-9 4.5 4.5 0 010 9zM12 21.75a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75.75zM4.166 18.894a.75.75 0 001.06 1.06l1.591-1.591a.75.75 0 10-1.06-1.06l-1.59zM2.25 12a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75zM4.166 5.106a.75.75 0 00-1.06 1.06l1.591 1.59a.75.75 0 101.06-1.06l-1.591-1.59z" />
              </svg>
              Gợi ý Selector (AI)
           </div>
           <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleAiSuggest("Hãy tìm class CSS của tiêu đề bài viết hoặc tên sản phẩm")}
                disabled={isAiLoading}
                className="bg-white text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded text-xs font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-colors shadow-sm disabled:opacity-50"
              >
                📝 Tìm Tên/Tiêu Đề
              </button>
              <button
                onClick={() => handleAiSuggest("Hãy tìm class CSS của đường link chi tiết sản phẩm")}
                disabled={isAiLoading}
                className="bg-white text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded text-xs font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-colors shadow-sm disabled:opacity-50"
              >
                🔗 Tìm Link Chi Tiết
              </button>
           </div>
        </div>
      )}

      {/* Selector Step */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className={labelClass}>
            2. Bộ chọn CSS (Selector)
          </label>
          <button
            onClick={() => setShowAiInput(!showAiInput)}
            className="text-xs text-indigo-600 font-medium hover:text-indigo-800 underline"
          >
            Tùy chỉnh nâng cao
          </button>
        </div>

        {showAiInput && (
          <div className="mb-2 p-3 bg-indigo-50/50 rounded-md border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className={`${inputClass}`}
                placeholder="VD: 'Giá tiền màu đỏ', 'Avatar người dùng'..."
                onKeyDown={(e) => e.key === 'Enter' && handleAiSuggest()}
              />
              <button 
                onClick={() => handleAiSuggest()}
                disabled={isAiLoading}
                className="bg-indigo-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {isAiLoading ? '...' : 'Hỏi AI'}
              </button>
            </div>
          </div>
        )}

        <input
          type="text"
          className={`${inputClass} ${isAiLoading ? 'animate-pulse bg-indigo-50' : ''}`}
          placeholder={isAiLoading ? "AI đang phân tích..." : ".product-item img (Hoặc bấm nút gợi ý ở trên)"}
          value={selector}
          onChange={(e) => onSelectorChange(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Type Selection */}
        <div>
          <label className={labelClass}>
            3. Loại dữ liệu
          </label>
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value as ExtractionMode)}
            className={`${inputClass} appearance-none`}
          >
            <option value={ExtractionMode.AUTO}>Tự động (Hỗn hợp)</option>
            <option value={ExtractionMode.LINKS}>Liên kết (href)</option>
            <option value={ExtractionMode.IMAGES}>Hình ảnh (src)</option>
            <option value={ExtractionMode.TEXT}>Chỉ văn bản</option>
          </select>
        </div>

        {/* Limit */}
        <div>
          <label className={labelClass}>
            Số lượng tối đa
          </label>
          <input
            type="number"
            min="1"
            className={inputClass}
            value={limit}
            onChange={(e) => onLimitChange(parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Action */}
      <div className="pt-2 flex flex-col gap-2">
        <button
          onClick={onExtract}
          className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-md font-semibold shadow-sm hover:bg-indigo-700 hover:shadow transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          Chạy Bóc Tách (Theo Selector)
        </button>

        <button
          onClick={onAiExtract}
          disabled={isAiExtracting}
          className="w-full bg-orange-50 text-orange-700 border border-orange-200 py-2.5 px-4 rounded-md font-semibold shadow-sm hover:bg-orange-100 hover:shadow transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isAiExtracting ? (
             <span className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
          )}
          Bóc tách AI (Figma Sync)
        </button>
      </div>

    </div>
  );
};

export default ExtractionControls;