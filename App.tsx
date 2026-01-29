import React, { useState, useEffect } from 'react';
import ExtractionControls from './components/ExtractionControls';
import ResultsTable from './components/ResultsTable';
import Sidebar from './components/Sidebar';
import { ExtractionMode, ExtractionResult, Project } from './types';
import { parseHtml } from './services/parserService';
import { getProjects, saveProject, deleteProject, generateId } from './services/storageService';
import { extractFigmaData } from './services/geminiService';

const App: React.FC = () => {
  // Global App State
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Active Editor State
  const [projectName, setProjectName] = useState('Dự án mới');
  const [html, setHtml] = useState<string>('');
  const [selector, setSelector] = useState<string>('');
  const [mode, setMode] = useState<ExtractionMode>(ExtractionMode.AUTO);
  const [limit, setLimit] = useState<number>(10);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiExtracting, setIsAiExtracting] = useState(false);
  
  // Mobile Sidebar Toggle
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // Load projects on mount
  useEffect(() => {
    setProjects(getProjects());
  }, []);

  // Handle Loading a project
  const handleSelectProject = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      setCurrentProjectId(id);
      setProjectName(project.name);
      setHtml(project.config.html);
      setSelector(project.config.selector);
      setMode(project.config.mode);
      setLimit(project.config.limit);
      setResult(project.lastResult);
      setShowMobileSidebar(false);
    }
  };

  // Handle Creating new project
  const handleNewProject = () => {
    setCurrentProjectId(null);
    setProjectName('Dự án không tên');
    setHtml('');
    setSelector('');
    setMode(ExtractionMode.AUTO);
    setLimit(10);
    setResult(null);
    setShowMobileSidebar(false);
  };

  // Handle Deletion
  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bạn có chắc chắn muốn xóa dự án này?")) {
      const updatedList = deleteProject(id);
      setProjects(updatedList);
      if (currentProjectId === id) {
        handleNewProject();
      }
    }
  };

  // Run Extraction (Local DOM)
  const handleExtract = () => {
    const extractedData = parseHtml({
      html,
      selector,
      mode,
      limit
    });
    setResult(extractedData);
  };

  // Run Extraction (AI Gemini for Figma)
  const handleAiExtract = async () => {
    if (!html) {
      alert("Vui lòng nhập HTML trước.");
      return;
    }
    
    setIsAiExtracting(true);
    try {
      const items = await extractFigmaData(html);
      setResult({
        items,
        totalFound: items.length,
        requested: limit,
        message: `AI đã tìm thấy ${items.length} sản phẩm theo chuẩn Figma Sync (BookName, #image).`
      });
    } catch (error) {
      alert("Lỗi khi bóc tách bằng AI. Vui lòng thử lại.");
      console.error(error);
    } finally {
      setIsAiExtracting(false);
    }
  };

  // Save Project
  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate slight delay for UI feedback
    setTimeout(() => {
      const projectToSave: Project = {
        id: currentProjectId || generateId(),
        name: projectName || "Không tên",
        createdAt: 0, // Handled in service
        updatedAt: 0, // Handled in service
        config: {
          html,
          selector,
          mode,
          limit
        },
        lastResult: result
      };

      const updatedList = saveProject(projectToSave);
      setProjects(updatedList);
      setCurrentProjectId(projectToSave.id);
      setIsSaving(false);
    }, 400);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* Sidebar Navigation - Hidden on mobile unless toggled */}
      <div className={`fixed inset-0 z-50 bg-gray-800/50 lg:hidden ${showMobileSidebar ? 'block' : 'hidden'}`} onClick={() => setShowMobileSidebar(false)}></div>
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          projects={projects}
          currentProjectId={currentProjectId}
          onSelectProject={handleSelectProject}
          onNewProject={handleNewProject}
          onDeleteProject={handleDeleteProject}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        
        {/* Mobile Header */}
        <header className="bg-white border-b border-gray-200 p-4 lg:hidden flex justify-between items-center shrink-0">
             <div className="flex items-center gap-2">
                 <button onClick={() => setShowMobileSidebar(true)} className="p-1 -ml-1 text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                 </button>
                 <span className="font-bold text-indigo-700">Extractor CRM</span>
             </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-full lg:h-auto">
            
            {/* Editor Column - Takes natural height, does not overflow container on mobile */}
            <div className="lg:col-span-4 flex flex-col h-fit">
              <ExtractionControls
                projectName={projectName}
                onProjectNameChange={setProjectName}
                html={html}
                onHtmlChange={setHtml}
                selector={selector}
                onSelectorChange={setSelector}
                mode={mode}
                onModeChange={setMode}
                limit={limit}
                onLimitChange={setLimit}
                onExtract={handleExtract}
                onAiExtract={handleAiExtract}
                onSave={handleSave}
                isSaving={isSaving}
                isAiExtracting={isAiExtracting}
              />
            </div>

            {/* Results Column - Fills rest of height on Desktop, specific height on mobile */}
            <div className="lg:col-span-8 flex flex-col h-[600px] lg:h-full pb-4 lg:pb-0">
              <ResultsTable 
                result={result} 
                projectName={projectName}
              />
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default App;