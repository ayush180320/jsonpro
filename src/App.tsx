import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { FileJson, FileText, Download, Upload, AlertCircle, Table2, ListTree, Code2 } from 'lucide-react';

// --- Tree Component ---
const JsonTree = ({ data, name = "root" }: { data: any, name?: string }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isObject = data !== null && typeof data === 'object';
  const isArray = Array.isArray(data);

  if (!isObject) {
    return (
      <div className="flex pl-4 py-1 text-sm hover:bg-[#2a2a2a] transition-colors">
        <span className="text-blue-300 font-semibold mr-2">{name}:</span>
        <span className={typeof data === 'string' ? "text-green-400" : typeof data === 'number' ? "text-orange-400" : "text-purple-400"}>
          {typeof data === 'string' ? `"${data}"` : String(data)}
        </span>
      </div>
    );
  }

  return (
    <div className="pl-4 text-sm font-mono">
      <div 
        className="flex items-center cursor-pointer py-1 hover:bg-[#2a2a2a] transition-colors"
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

// --- New Structured Table Component ---
const JsonTable = ({ data }: { data: any }) => {
  if (!data) return <div className="p-8 text-gray-500 text-center">No valid data to display.</div>;

  const isArray = Array.isArray(data);
  const isObject = typeof data === 'object' && data !== null;

  if (!isObject) {
    return <div className="p-4 text-gray-300">{String(data)}</div>;
  }

  // Convert a single object into an array so it can be mapped into a table row
  const dataArray = isArray ? data : [data];
  if (dataArray.length === 0) return <div className="p-8 text-gray-500 text-center">Empty Array</div>;

  // Dynamically extract all unique keys from the data to act as Table Headers
  const headers = Array.from(new Set(
    dataArray.flatMap(item => typeof item === 'object' && item !== null ? Object.keys(item) : ['Value'])
  ));

  return (
    <div className="w-full h-full overflow-auto bg-[#181818] p-4">
      <div className="border border-[#333] rounded-lg overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-[#252526] border-b border-[#333]">
            <tr>
              {headers.map(header => (
                <th key={header} className="p-3 text-gray-200 font-semibold border-r border-[#333] last:border-r-0 uppercase text-xs tracking-wider sticky top-0 bg-[#252526] shadow-sm">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#333] bg-[#1e1e1e]">
            {dataArray.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-[#2a2a2a] transition-colors">
                {headers.map(header => {
                  const cellValue = typeof row === 'object' && row !== null ? row[header] : row;
                  // If a cell contains nested objects/arrays, stringify it so it doesn't crash the table
                  const displayValue = typeof cellValue === 'object' && cellValue !== null ? JSON.stringify(cellValue) : String(cellValue ?? '');
                  return (
                    <td key={header} className="p-3 text-gray-300 border-r border-[#333] last:border-r-0 max-w-xs truncate" title={displayValue}>
                      {displayValue || <span className="text-gray-600 italic">null</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function App() {
  const [jsonText, setJsonText] = useState('[\n  {\n    "ID": 1,\n    "Name": "John Doe",\n    "Role": "Admin",\n    "Status": "Active"\n  },\n  {\n    "ID": 2,\n    "Name": "Jane Smith",\n    "Role": "User",\n    "Status": "Inactive"\n  }\n]');
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'tree' | 'code'>('table');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse text live
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setJsonText(event.target?.result as string);
    reader.readAsText(file);
  };

  const formatJSON = () => {
    if (parsedData) setJsonText(JSON.stringify(parsedData, null, 2));
  };

  const exportAsJSON = () => {
    if (!parsedData) return;
    const blob = new Blob([JSON.stringify(parsedData, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'data-export.json');
  };

  const exportAsCSV = () => {
    if (!parsedData) return;
    const dataToExport = Array.isArray(parsedData) ? parsedData : [parsedData];
    if (dataToExport.length === 0) return;

    const headers = Array.from(new Set(dataToExport.flatMap(obj => Object.keys(obj))));
    const csvRows = [
      headers.join(','),
      ...dataToExport.map(row => 
        headers.map(header => {
          let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            cell = `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      )
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    downloadBlob(blob, 'table-export.csv');
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
      <div className="w-16 flex flex-col items-center py-4 bg-[#1a1a1a] border-r border-[#2d2d2d] justify-between z-10 shadow-lg">
        <div className="flex flex-col gap-6 w-full items-center">
          <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button title="Upload JSON File" onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#2d2d2d] rounded-lg">
            <Upload size={22} />
          </button>

          <div className="w-8 h-px bg-[#333]"></div>

          <button title="Format JSON Code" onClick={formatJSON} className="text-blue-400 hover:text-blue-300 transition-colors p-2 hover:bg-[#2d2d2d] rounded-lg">
            <FileJson size={22} />
          </button>
          
          <button title="Export Table as CSV" onClick={exportAsCSV} className="text-green-500 hover:text-green-400 transition-colors p-2 hover:bg-[#2d2d2d] rounded-lg">
            <FileText size={22} />
          </button>

          <button title="Export as JSON" onClick={exportAsJSON} className="text-purple-400 hover:text-purple-300 transition-colors p-2 hover:bg-[#2d2d2d] rounded-lg">
            <Download size={22} />
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header & Navigation */}
        <div className="h-14 bg-[#1a1a1a] border-b border-[#2d2d2d] flex items-center justify-between px-4">
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'table' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-[#2d2d2d] hover:text-gray-200'}`}
            >
              <Table2 size={16} /> Table View
            </button>
            <button 
              onClick={() => setActiveTab('tree')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'tree' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-[#2d2d2d] hover:text-gray-200'}`}
            >
              <ListTree size={16} /> Tree View
            </button>
            <button 
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'code' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-[#2d2d2d] hover:text-gray-200'}`}
            >
              <Code2 size={16} /> Raw Code
            </button>
          </div>

          {error && (
            <div className="flex items-center text-red-400 text-xs gap-1.5 bg-red-400/10 border border-red-500/20 px-3 py-1.5 rounded-full font-medium">
              <AlertCircle size={14} /> Syntax Error
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'code' && (
            <div className="h-full bg-[#1e1e1e] animate-in fade-in duration-200">
              <Editor
                height="100%"
                defaultLanguage="json"
                theme="vs-dark"
                value={jsonText}
                onChange={(val) => setJsonText(val || '')}
                options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on', padding: { top: 16 } }}
              />
            </div>
          )}
          
          {activeTab === 'tree' && (
            <div className="h-full overflow-y-auto bg-[#181818] p-4 animate-in fade-in duration-200">
              {parsedData ? <JsonTree data={parsedData} /> : <div className="text-gray-500 flex justify-center mt-10">Invalid or empty JSON.</div>}
            </div>
          )}

          {activeTab === 'table' && (
            <div className="h-full bg-[#121212] animate-in fade-in duration-200">
              {parsedData ? <JsonTable data={parsedData} /> : <div className="text-gray-500 flex justify-center mt-10">Invalid or empty JSON.</div>}
            </div>
          )}
        </div>
        
        {/* Status Bar */}
        <div className={`h-7 text-[11px] flex items-center px-4 justify-between font-medium tracking-wide z-10 ${error ? 'bg-red-900/80 text-red-200 border-t border-red-800' : 'bg-[#007acc] text-white border-t border-blue-600'}`}>
          <span className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-400' : 'bg-green-400'}`}></div>
            {error ? `Parse Error: ${error}` : 'System Ready | Valid JSON'}
          </span>
          <span>Pro JSON Tool - V1</span>
        </div>
      </div>
    </div>
  );
}
