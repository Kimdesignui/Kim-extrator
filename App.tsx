import React, { useState, useEffect } from 'react';
import ExtractionControls from './components/ExtractionControls';
import ResultsTable from './components/ResultsTable';
import Sidebar from './components/Sidebar';
import { ExtractionMode, ExtractionResult, Project } from './types';
import { parseHtml } from './services/parserService';
import { getProjects, saveProject, deleteProject, generateId } from './services/storageService';

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

  // Run Extraction
  const handleExtract = () => {
    const extractedData = parseHtml({
      html,
      selector,
      mode,
      limit
    });
    setResult(extractedData);
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
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        projects={projects}
        currentProjectId={currentProjectId}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
        onDeleteProject={handleDeleteProject}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        {/* Mobile Header (Only visible on small screens - simplified) */}
        <header className="bg-white border-b border-gray-200 p-4 md:hidden flex justify-between items-center">
             <span className="font-bold text-indigo-700">Extractor CRM</span>
             <button className="text-gray-500">Menu</button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Editor Column */}
            <div className="lg:col-span-4 flex flex-col h-full min-h-[500px]">
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
                onSave={handleSave}
                isSaving={isSaving}
              />
            </div>

            {/* Results Column */}
            <div className="lg:col-span-8 flex flex-col h-full min-h-[400px]">
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
