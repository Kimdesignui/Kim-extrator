import React, { useState } from 'react';
import { ExtractionMode } from '../types';
import { getSmartSelector } from '../services/geminiService';

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
  onSave: () => void;
  isSaving?: boolean;
}

// Frappe-like Input Style Class
const inputClass = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-200 transition-all";
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
  onSave,
  isSaving
}) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);

  const handleAiSuggest = async () => {
    if (!html) {
      alert("Vui lòng dán mã HTML trước.");
      return;
    }
    if (!aiPrompt) return;

    setIsAiLoading(true);
    try {
      const suggestedSelector = await getSmartSelector(html, aiPrompt);
      onSelectorChange(suggestedSelector);
      setShowAiInput(false);
    } catch (e) {
      alert("AI không tìm thấy selector phù hợp.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 h-full flex flex-col gap-5">
      
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

      {/* HTML Input Step */}
      <div className="flex-1 flex flex-col min-h-[150px]">
        <label className={labelClass}>
          1. Mã nguồn HTML
        </label>
        <textarea
          className={`${inputClass} flex-1 font-mono text-xs resize-none`}
          placeholder="Dán toàn bộ nội dung thẻ <body> vào đây..."
          value={html}
          onChange={(e) => onHtmlChange(e.target.value)}
        />
      </div>

      {/* Selector Step */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className={labelClass}>
            2. Bộ chọn CSS (Selector)
          </label>
          <button
            onClick={() => setShowAiInput(!showAiInput)}
            className="text-xs text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
               <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a4.5 4.5 0 110-9 4.5 4.5 0 010 9zM12 21.75a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75.75zM4.166 18.894a.75.75 0 001.06 1.06l1.591-1.591a.75.75 0 10-1.06-1.06l-1.591 1.59zM2.25 12a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75zM4.166 5.106a.75.75 0 00-1.06 1.06l1.591 1.59a.75.75 0 101.06-1.06l-1.591-1.59z" />
            </svg>
            AI Gợi ý
          </button>
        </div>

        {showAiInput && (
          <div className="mb-2 p-3 bg-indigo-50/50 rounded-md border border-indigo-100 shadow-sm">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className={`${inputClass} bg-white`}
                placeholder="VD: 'Tiêu đề sản phẩm màu xanh'"
                onKeyDown={(e) => e.key === 'Enter' && handleAiSuggest()}
              />
              <button 
                onClick={handleAiSuggest}
                disabled={isAiLoading}
                className="bg-indigo-600 text-white px-3 py-1 rounded-md text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {isAiLoading ? '...' : 'Tìm'}
              </button>
            </div>
          </div>
        )}

        <input
          type="text"
          className={inputClass}
          placeholder=".class-name hoặc thẻ tag"
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
            Số lượng
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
      <div className="pt-2">
        <button
          onClick={onExtract}
          className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-md font-semibold shadow-sm hover:bg-indigo-700 hover:shadow transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          Chạy Bóc Tách
        </button>
      </div>

    </div>
  );
};

export default ExtractionControls;
