import React from 'react';
import { Project } from '../types';

interface SidebarProps {
  projects: Project[];
  currentProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ projects, currentProjectId, onSelectProject, onNewProject, onDeleteProject }) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-2 text-indigo-700">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" />
           </svg>
           <span className="font-bold text-lg tracking-tight">Extractor</span>
        </div>
      </div>

      {/* Main Action */}
      <div className="p-4">
        <button 
          onClick={onNewProject}
          className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 font-medium py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Dự Án Mới
        </button>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">Dự Án Gần Đây</h3>
        <div className="space-y-1">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              Chưa có dự án nào.
            </div>
          ) : (
            projects.map(p => (
              <div 
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer transition-colors ${
                  currentProjectId === p.id 
                    ? 'bg-gray-100 text-gray-900 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="truncate flex-1 pr-2">
                   {p.name || "Dự án không tên"}
                   <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                     {new Date(p.updatedAt).toLocaleDateString()}
                   </div>
                </div>
                <button
                   onClick={(e) => onDeleteProject(p.id, e)}
                   className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                   title="Xóa"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200 text-xs text-center text-gray-400">
         v1.2 • Lưu trữ cục bộ
      </div>
    </div>
  );
};

export default Sidebar;
