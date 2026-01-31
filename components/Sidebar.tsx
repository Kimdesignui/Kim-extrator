import React from 'react';
import { Project } from '../types';

interface SidebarProps {
  projects: Project[];
  currentProjectId: string | null;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onShowHelp: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  projects, 
  currentProjectId, 
  onSelectProject, 
  onNewProject, 
  onDeleteProject,
  onShowHelp,
  collapsed,
  onToggleCollapse
}) => {
  return (
    <div className={`bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
        {/* Brand */}
        <div className={`h-16 flex items-center border-b border-gray-100 ${collapsed ? 'justify-center px-0' : 'px-6'}`}>
          <div className="flex items-center gap-2 text-indigo-700 overflow-hidden whitespace-nowrap">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 flex-shrink-0">
              <path fillRule="evenodd" d="M3 6a3 3 0 013-3h2.25a3 3 0 013 3v2.25a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm9.75 0a3 3 0 013-3H18a3 3 0 013 3v2.25a3 3 0 01-3 3h-2.25a3 3 0 01-3-3V6zM3 15.75a3 3 0 013-3h2.25a3 3 0 013 3V18a3 3 0 01-3 3H6a3 3 0 01-3-3v-2.25zm9.75 0a3 3 0 013-3H18a3 3 0 013 3V18a3 3 0 01-3 3h-2.25a3 3 0 01-3-3v-2.25z" clipRule="evenodd" />
             </svg>
             <span className={`font-bold text-lg tracking-tight transition-opacity duration-200 ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
               Extractor
             </span>
          </div>
        </div>

        {/* Main Action */}
        <div className="p-4">
          <button 
            onClick={onNewProject}
            title="Tạo dự án mới"
            className={`w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 font-medium py-2 rounded-md flex items-center justify-center transition-colors text-sm ${collapsed ? 'px-0' : 'px-4 gap-2'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {!collapsed && <span>Dự Án Mới</span>}
          </button>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {!collapsed && (
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2 fade-in">
              Dự Án Gần Đây
            </h3>
          )}
          <div className="space-y-1">
            {projects.length === 0 ? (
              <div className={`text-center py-8 text-gray-400 text-xs ${collapsed ? 'hidden' : 'block'}`}>
                Chưa có dự án nào.
              </div>
            ) : (
              projects.map(p => (
                <div 
                  key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  title={p.name}
                  className={`group flex items-center rounded-md text-sm cursor-pointer transition-colors ${
                    currentProjectId === p.id 
                      ? 'bg-gray-100 text-gray-900 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } ${collapsed ? 'justify-center py-3 px-0' : 'justify-between px-3 py-2'}`}
                >
                  {collapsed ? (
                    <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-3 relative">
           <button 
              onClick={onShowHelp}
              title="Hướng dẫn sử dụng"
              className={`w-full flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-gray-100 py-2 rounded-md transition-colors ${collapsed ? 'justify-center' : 'justify-center'}`}
           >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              {!collapsed && "Hướng dẫn"}
           </button>
           
           {!collapsed && (
             <div className="text-[10px] text-center text-gray-400">
               v1.4 • Local Storage
             </div>
           )}

            {/* Collapse Toggle Button */}
            <button 
                onClick={onToggleCollapse}
                className="absolute -right-3 top-[-15px] bg-white border border-gray-200 rounded-full p-1 shadow-md hover:bg-gray-50 text-gray-500 hover:text-indigo-600 z-10"
                title={collapsed ? "Mở rộng" : "Thu gọn"}
            >
                {collapsed ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15l-7.5-7.5 7.5-7.5" />
                    </svg>
                )}
            </button>
        </div>
      </div>
  );
};

export default Sidebar;