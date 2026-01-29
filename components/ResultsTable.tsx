import React, { useState } from 'react';
import { ExtractionResult } from '../types';
import { exportToExcel, copyForGoogleSheets, copyFormatted } from '../services/exportService';

interface ResultsTableProps {
  result: ExtractionResult | null;
  projectName?: string;
}

// Enhanced Copy Button with customizable label
const CopyButton = ({ text, label = "Copy" }: { text: string, label?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`
        flex-shrink-0 flex items-center justify-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border shadow-sm transition-all uppercase tracking-wide flex-1
        ${copied 
          ? 'bg-green-50 text-green-700 border-green-200' 
          : 'bg-white text-gray-500 border-gray-200 hover:text-indigo-600 hover:border-indigo-300 hover:shadow'
        }
      `}
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
        </svg>
      )}
      {copied ? 'Đã chép' : label}
    </button>
  );
};

// Helper: Fetch image blob with fallbacks
const fetchImageBlob = async (src: string): Promise<Blob> => {
  const fetchWithTimeout = async (url: string) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 15000); // 15s timeout
      try {
          const res = await fetch(url, { signal: controller.signal });
          clearTimeout(id);
          if(!res.ok) throw new Error(`Status ${res.status}`);
          return await res.blob();
      } catch (e) {
          clearTimeout(id);
          throw e;
      }
  };

  // List of proxies to try
  const strategies = [
    // Strategy 1: CorsProxy.io (Specific for images)
    `https://corsproxy.io/?${encodeURIComponent(src)}`,
    // Strategy 2: CodeTabs
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(src)}`,
     // Strategy 3: Direct (If CORS is allowed)
    src
  ];

  for (const url of strategies) {
    try {
      const blob = await fetchWithTimeout(url);
      if (blob.size > 0) return blob;
    } catch (e) {
      // Continue to next strategy
    }
  }

  throw new Error("Failed to fetch image via all proxies");
};

// Helper: Convert any blob to PNG for clipboard compatibility
const convertToPng = (blob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
              URL.revokeObjectURL(url);
              reject(new Error("Canvas context failed"));
              return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((b) => {
              URL.revokeObjectURL(url);
              if (b) resolve(b);
              else reject(new Error("Conversion to PNG failed"));
          }, 'image/png');
      };
      
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error("Image load failed"));
      };
      
      img.src = url;
  });
};

// Button to copy actual image blob to clipboard (for Figma)
const CopyImageButton = ({ src }: { src: string }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleCopyImage = async () => {
    if (!src) return;
    setStatus('loading');
    try {
      // 1. Fetch the raw image data (handling CORS)
      const rawBlob = await fetchImageBlob(src);
      
      // 2. Convert to PNG to ensure Clipboard API compatibility
      const pngBlob = await convertToPng(rawBlob);

      // 3. Write blob to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob })
      ]);

      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error("Copy Image Failed", error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <button
      onClick={handleCopyImage}
      disabled={status === 'loading'}
      className={`
        flex-shrink-0 flex items-center justify-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold border shadow-sm transition-all uppercase tracking-wide flex-1
        ${status === 'success' ? 'bg-green-50 text-green-700 border-green-200' : ''}
        ${status === 'error' ? 'bg-red-50 text-red-700 border-red-200' : ''}
        ${status === 'idle' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' : ''}
        ${status === 'loading' ? 'opacity-75 cursor-wait bg-indigo-50 border-indigo-200' : ''}
      `}
      title="Copy hình ảnh để dán vào Figma (Ctrl+V)"
    >
       {status === 'loading' && (
         <span className="w-2.5 h-2.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
       )}
       
       {status === 'success' && (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
        </svg>
       )}

       {status === 'error' && (
         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
         </svg>
       )}

       {status === 'idle' && (
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
         </svg>
       )}
       
       {status === 'success' ? 'Xong' : status === 'error' ? 'Lỗi' : status === 'loading' ? 'Đang tải' : 'Copy Ảnh'}
    </button>
  );
};

const ResultsTable: React.FC<ResultsTableProps> = ({ result, projectName = "Data" }) => {
  const [copySheetLabel, setCopySheetLabel] = useState("Copy thường");
  const [copyFormattedLabel, setCopyFormattedLabel] = useState("Copy định dạng (#)");
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);

  if (!result) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col items-center justify-center text-center text-gray-400 p-8">
        <div className="bg-gray-50 p-4 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M19.125 14.625c.621 0 1.125.504 1.125 1.125V16.5c0 .621-.504 1.125-1.125 1.125" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900">Chưa có dữ liệu</h3>
        <p className="text-xs text-gray-500 mt-1">Hãy nhập mã HTML và chạy bóc tách.</p>
      </div>
    );
  }

  const hasName = result.items.some(i => i.name);
  const hasLink = result.items.some(i => i.href);
  const hasImage = result.items.some(i => i.src);

  const handleExportExcel = () => {
    exportToExcel(result.items, projectName || "extracted_data");
  };

  const handleCopySheets = () => {
    copyForGoogleSheets(result.items);
    setCopySheetLabel("Đã copy!");
    setTimeout(() => setCopySheetLabel("Copy thường"), 2000);
  };

  const handleCopyFormatted = () => {
    copyFormatted(result.items);
    setCopyFormattedLabel("Đã copy #");
    setTimeout(() => setCopyFormattedLabel("Copy định dạng (#)"), 2000);
  };

  return (
    <>
      {/* Zoomed Image Overlay */}
      {hoveredImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
           <div className="bg-white p-2 rounded-xl shadow-2xl border-4 border-white/50 backdrop-blur-sm transform transition-all animate-in fade-in zoom-in-95 duration-200">
              <img src={hoveredImage} className="max-w-[80vw] max-h-[80vh] object-contain rounded-lg" alt="Preview" />
              <div className="text-center mt-2 text-xs font-semibold text-gray-500 uppercase tracking-widest bg-gray-50 py-1 rounded">Xem trước ảnh</div>
           </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-2 justify-between items-center">
          <div className="flex items-center gap-2">
             <h2 className="font-semibold text-gray-800 text-sm">Kết quả ({result.items.length})</h2>
             {result.message && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${result.items.length < result.requested ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                {result.items.length < result.requested ? 'Thiếu dữ liệu' : 'Hoàn thành'}
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleCopySheets}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              {copySheetLabel}
            </button>

            <button 
              onClick={handleCopyFormatted}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {copyFormattedLabel}
            </button>
            
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 border border-green-600 rounded text-xs font-medium text-white hover:bg-green-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Xuất .xlsx
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-0 relative">
          <table className="w-full text-left text-sm text-gray-600 table-fixed">
            <thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs sticky top-0 z-10 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 w-[10%] text-center">#</th>
                {hasName && <th className="px-4 py-2.5 w-[45%]">Tên / Nội dung</th>}
                {hasLink && <th className="px-4 py-2.5 w-[20%]">Liên kết</th>}
                {hasImage && <th className="px-4 py-2.5 w-[45%]">Hình ảnh</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.items.map((item) => (
                <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-center text-xs text-gray-400 align-top pt-6">{item.id}</td>
                  
                  {hasName && (
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-col gap-2">
                        <div className="break-words line-clamp-4 text-gray-900 leading-relaxed" title={item.name}>
                          {item.name || <span className="text-gray-300 italic">Trống</span>}
                        </div>
                        {item.name && (
                          <div className="flex w-fit">
                            <CopyButton text={item.name} />
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                  
                  {hasLink && (
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-col gap-2">
                        {item.href ? (
                          <a 
                            href={item.href} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-indigo-600 hover:text-indigo-800 hover:underline break-all block text-xs leading-relaxed"
                            title={item.href}
                          >
                            {item.href}
                          </a>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                        {item.href && (
                          <div className="flex w-fit">
                            <CopyButton text={item.href} label="Copy Link" />
                          </div>
                        )}
                      </div>
                    </td>
                  )}
                  
                  {hasImage && (
                    <td className="px-4 py-4 align-top">
                      {item.src ? (
                        <div className="flex items-center gap-3">
                          {/* Image */}
                          <div 
                            className="relative w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden cursor-zoom-in group/image flex-shrink-0"
                            onMouseEnter={() => setHoveredImage(item.src || null)}
                            onMouseLeave={() => setHoveredImage(null)}
                          >
                            <img 
                              src={item.src} 
                              alt="preview" 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-110" 
                            />
                            {/* Hover Hint */}
                            <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-white opacity-0 group-hover/image:opacity-100 drop-shadow-md">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                              </svg>
                            </div>
                          </div>
                          
                          {/* URL and Copy Buttons on the same row, to the right */}
                          <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
                             <div className="text-[10px] text-gray-500 font-mono truncate select-all bg-gray-50 px-2 py-1 rounded border border-gray-100 w-full" title={item.src}>
                               {item.src}
                             </div>
                             <div className="flex gap-2">
                               <CopyButton text={item.src} label="Copy URL" />
                               <CopyImageButton src={item.src} />
                             </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ResultsTable;