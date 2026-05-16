import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { FileJson, FileText, Download, Upload, AlertCircle } from 'lucide-react';

// --- Recursive Component to make JSON highly readable ---
const JsonTree = ({ data, name = "root" }: { data: any, name?: string }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isObject = data !== null && typeof data === 'object';
  const isArray = Array.isArray(data);

  if (!isObject) {
    return (
      <div className="flex pl-4 py-0.5 text-sm hover:bg-[#2a2a2a]">
        <span className="text-blue-300 font-semibold mr-2">{name}:</span>
        <span className={typeof data === 'string' ? "text-green-400" : typeof data === 'number' ? "text-orange-400" : "text-purple-400"}>
          {typeof data === 'string' ? `"${data}"` : String(data)}
        </span>
      </div>
    );
  }

  return (
    <div className="pl-4 text-sm">
      <div 
        className="flex items-center cursor-pointer py-0.5 hover:bg-[#2a2a2a]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-gray-400 mr-1 w-3 text-center">{isOpen ? '▼' : '▶'}</span>
        <span className="text-blue-300 font-semibold mr-2">{name}</span>
        <span className="text-gray-500">{isArray ? `[${data.length} items]` : '{...}'}</span>
      </div>
      {isOpen && (
        <div className="border-l border-[#333] ml-1.5 pl-1.5">
          {Object.entries(data).map(([key, val]) => (
            <JsonTree key={key} name={key} data={val} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [jsonText, setJsonText] = useState('{\n  "message": "Upload a JSON file or paste code here to get started!"\n}');
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live parsing whenever the text changes
  useEffect(() => {
    try {
      if (!jsonText.trim()) {
        setParsedData(null);
        setError(null);
        return;
      }
      const parsed = JSON.parse(jsonText);
      setParsedData(parsed);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setParsedData(null);
    }
  }, [jsonText]);

  // --- Features ---
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setJsonText(event.target?.result as string);
    reader.readAsText(file);
  };

  const formatJSON = () => {
    if (parsedData) {
      setJsonText(JSON.stringify(parsedData, null, 2));
    }
  };

  const exportAsJSON = () => {
    if (!parsedData) return;
    const blob = new Blob([JSON.stringify(parsedData, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'formatted-export.json');
  };

  const exportAsCSV = () => {
    if (!parsedData) return;
    
    // Simple CSV logic for arrays of objects
    const dataToExport = Array.isArray(parsedData) ? parsedData : [parsedData];
    if (dataToExport.length === 0) return;

    const headers = Array.from(new Set(dataToExport.flatMap(obj => Object.keys(obj))));
    const csvRows = [
      headers.join(','),
      ...dataToExport.map(row => 
        headers.map(header => {
          let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
          // escape quotes and commas
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            cell = `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    downloadBlob(blob, 'export.csv');
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-full bg-[#121212] text-gray-300 font-sans overflow-hidden">
      
      {/* Sidebar Toolbar */}
      <div className="w-16 flex flex-col items-center py-4 bg-[#1e1e1e] border-r border-[#2d2d2d] justify-between">
        <div className="flex flex-col gap-6 w-full items-center">
          
          <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button title="Import File" onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-white transition-colors">
            <Upload size={24} />
          </button>

          <div className="w-8 h-px bg-[#333]"></div>

          <button title="Format Code" onClick={formatJSON} className="text-blue-400 hover:text-blue-300 transition-colors">
            <FileJson size={24} />
          </button>
          
          <button title="Export to CSV" onClick={exportAsCSV} className="text-green-500 hover:text-green-400 transition-colors">
            <FileText size={24} />
          </button>
        </div>

        <div className="flex flex-col gap-6">
          <button title="Download JSON" onClick={exportAsJSON} className="text-gray-400 hover:text-white transition-colors">
            <Download size={24} />
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col">
        <div className="h-12 bg-[#1e1e1e] border-b border-[#2d2d2d] flex items-center px-4 justify-between">
          <span className="font-semibold text-sm tracking-wide">WORKSPACE</span>
          {error && (
            <div className="flex items-center text-red-400 text-xs gap-1.5 bg-red-400/10 px-2 py-1 rounded">
              <AlertCircle size={14} /> Syntax Error: {error}
            </div>
          )}
        </div>

        <div className="flex-1">
          <Allotment>
            {/* Raw Text Editor */}
            <Allotment.Pane minSize={200}>
              <div className="h-full bg-[#1e1e1e]">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  theme="vs-dark"
                  value={jsonText}
                  onChange={(val) => setJsonText(val || '')}
                  options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' }}
                />
              </div>
            </Allotment.Pane>
            
            {/* Structured Viewer */}
            <Allotment.Pane preferredSize={400} minSize={250}>
              <div className="h-full bg-[#181818] border-l border-[#2d2d2d] flex flex-col">
                <div className="p-3 border-b border-[#2d2d2d] bg-[#1a1a1a]">
                  <h3 className="text-xs uppercase text-gray-400 font-bold">Structured Data Viewer</h3>
                </div>
                <div className="flex-1 p-4 overflow-y-auto font-mono text-sm">
                  {parsedData ? (
                    <JsonTree data={parsedData} />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-600">
                      Fix syntax errors to view structured data.
                    </div>
                  )}
                </div>
              </div>
            </Allotment.Pane>
          </Allotment>
        </div>
        
        {/* Status Bar */}
        <div className={`h-6 text-[11px] flex items-center px-3 justify-between ${error ? 'bg-red-900 text-red-200' : 'bg-[#007acc] text-white'}`}>
          <span>{error ? 'Status: Invalid JSON' : 'Status: Ready & Valid'}</span>
          <span>Pro JSON Tool</span>
        </div>
      </div>
    </div>
  );
}
