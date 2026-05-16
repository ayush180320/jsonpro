import { useState, useEffect, useRef, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { FileJson, FileText, Download, Upload, AlertCircle, Table2, ListTree, Code2, Database, Copy, Minimize2, Search, Check } from 'lucide-react';

// --- Recursive Object Flattener ---
const flattenRow = (obj: any, parent = '', res: any = {}) => {
  if (typeof obj !== 'object' || obj === null) {
    res[parent || 'Value'] = obj;
    return res;
  }
  for (let key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    const propName = parent ? `${parent}.${key}` : key;
    const val = obj[key];

    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      flattenRow(val, propName, res);
    } else if (Array.isArray(val)) {
      try {
        res[propName] = JSON.stringify(val);
      } catch {
        res[propName] = "[Array]";
      }
    } else {
      res[propName] = val;
    }
  }
  return res;
};

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
      <div className="flex items-center cursor-pointer py-1 hover:bg-[#2a2a2a] transition-colors" onClick={() => setIsOpen(!isOpen)}>
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

// --- High-Grade Structured Table Component with Advanced Search ---
const JsonTable = ({ data, searchQuery }: { data: any[], searchQuery: string }) => {
  if (!data || data.length === 0) return <div className="p-8 text-gray-500 text-center">No valid data to display.</div>;

  const flattenedData = data.map(row => flattenRow(row));
  
  const headers = Array.from(new Set(
    flattenedData.flatMap(row => Object.keys(row))
  ));

  // Smart Search: Filter rows across ALL columns based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return flattenedData;
    const lowerQuery = searchQuery.toLowerCase();
    return flattenedData.filter(row => {
      return Object.values(row).some(val => 
        String(val ?? '').toLowerCase().includes(lowerQuery)
      );
    });
  }, [flattenedData, searchQuery]);

  if (filteredData.length === 0) {
    return <div className="p-8 text-gray-500 text-center">No results found for "{searchQuery}".</div>;
  }

  return (
    <div className="w-full h-full overflow-auto bg-[#181818] p-4">
      <div className="border border-[#333] rounded-lg overflow-hidden shadow-lg">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-[#252526] border-b border-[#333]">
            <tr>
              {headers.map(header => (
                <th key={header} className="p-3 text-gray-200 font-semibold border-r border-[#333] last:border-r-0 uppercase text-xs tracking-wider sticky top-0 bg-[#252526] shadow-sm whitespace-nowrap">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#333] bg-[#1e1e1e]">
            {filteredData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-[#2a2a2a] transition-colors">
                {headers.map(header => {
                  const cellValue = row[header];
                  return (
                    <td key={header} className="p-3 text-gray-300 border-r border-[#333] last:border-r-0 max-w-xs truncate" title={String(cellValue ?? '')}>
                      {cellValue !== undefined && cellValue !== null ? String(cellValue) : <span className="text-gray-600 italic">null</span>}
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
  const [jsonText, setJsonText] = useState('{\n  "message": "Paste your nested data here!"\n}');
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'tree' | 'code'>('table');
  const [selectedTablePath, setSelectedTablePath] = useState<string>('root');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
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

  // Deep scanner
  const availableTables = useMemo(() => {
    if (!parsedData) return {};
    const tables: Record<string, any[]> = {};

    const traverse = (obj: any, path: string) => {
      if (Array.isArray(obj)) {
        let flatArr = obj;
        while (flatArr.length > 0 && Array.isArray(flatArr[0])) flatArr = flatArr.flat();
        tables[path] = flatArr;

        if (flatArr.length > 0 && typeof flatArr[0] === 'object' && flatArr[0] !== null) {
          Object.keys(flatArr[0]).forEach(k => {
            const val = flatArr[0][k];
            if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
              traverse(val, `${path} -> ${k}`);
            }
          });
        }
      } else if (typeof obj === 'object' && obj !== null) {
        if (path === 'root') tables['root'] = [obj];
        Object.keys(obj).forEach(key => {
          traverse(obj[key], path === 'root' ? key : `${path} -> ${key}`);
        });
      }
    };

    traverse(parsedData, 'root');
    return tables;
  }, [parsedData]);

  useEffect(() => {
    if (parsedData && !availableTables[selectedTablePath]) {
      setSelectedTablePath(Object.keys(availableTables)[0] || 'root');
      setSearchQuery('');
    }
  }, [availableTables]);

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

  const minifyJSON = () => {
    if (parsedData) setJsonText(JSON.stringify(parsedData));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportAsJSON = () => {
    if (!parsedData) return;
    const blob = new Blob([JSON.stringify(parsedData, null, 2)], { type: 'application/json' });
    downloadBlob(blob, 'data-export.json');
  };

  const exportAsCSV = () => {
    const targetData = availableTables[selectedTablePath];
    if (!targetData || targetData.length === 0) return;

    const flattenedData = targetData.map(row => flattenRow(row));
    
    // Apply the active search filter to the CSV export too!
    const lowerQuery = searchQuery.toLowerCase();
    const exportData = searchQuery.trim() 
      ? flattenedData.filter(row => Object.values(row).some(val => String(val ?? '').toLowerCase().includes(lowerQuery)))
      : flattenedData;

    if (exportData.length === 0) return;

    const headers = Array.from(new Set(exportData.flatMap(row => Object.keys(row))));
    const csvRows = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          let cellString = String(row[header] ?? '');
          if (cellString.includes(',') || cellString.includes('"') || cellString.includes('\n')) {
            cellString = `"${cellString.replace(/"/g, '""')}"`;
          }
          return cellString;
        }).join(',')
      )
    ];

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${selectedTablePath.replace(/ -> /g, '_')}-export.csv`);
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
        <div className="flex flex-col gap-5 w-full items-center">
          <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button title="Upload JSON File" onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#2d2d2d] rounded-lg">
            <Upload size={22} />
          </button>

          <div className="w-8 h-px bg-[#333]"></div>

          <button title="Format JSON (Beautify)" onClick={formatJSON} className="text-blue-400 hover:text-blue-300 transition-colors p-2 hover:bg-[#2d2d2d] rounded-lg">
            <FileJson size={22} />
          </button>
          
          <button title="Minify JSON (Compress)" onClick={minifyJSON} className="text-orange-400 hover:text-orange-300 transition-colors p-2 hover:bg-[#2d2d2d] rounded-lg">
            <Minimize2 size={22} />
          </button>

          <button title="Copy Current Code" onClick={copyToClipboard} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#2d2d2d] rounded-lg">
            {copied ? <Check size={22} className="text-green-500" /> : <Copy size={22} />}
          </button>

          <div className="w-8 h-px bg-[#333]"></div>

          <button title={`Export to Excel`} onClick={exportAsCSV} className="text-green-500 hover:text-green-400 transition-colors p-2 hover:bg-[#2d2d2d] rounded-lg">
            <FileText size={22} />
          </button>

          <button title="Export Entire JSON" onClick={exportAsJSON} className="text-purple-400 hover:text-purple-300 transition-colors p-2 hover:bg-[#2d2d2d] rounded-lg">
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

          <div className="flex items-center gap-4">
            {/* Global Search Bar - Only shows on Table view */}
            {activeTab === 'table' && parsedData && (
              <div className="flex items-center gap-2 bg-[#121212] px-3 py-1.5 rounded-md border border-[#333] focus-within:border-blue-500 transition-colors w-64">
                <Search size={14} className="text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search table data..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-gray-200 outline-none w-full placeholder-gray-600"
                />
              </div>
            )}

            {Object.keys(availableTables).length > 0 && activeTab === 'table' && (
              <div className="flex items-center gap-2 bg-[#252526] px-3 py-1.5 rounded-md border border-[#333] shadow-inner">
                <Database size={14} className="text-purple-400" />
                <select 
                  value={selectedTablePath} 
                  onChange={(e) => {
                    setSelectedTablePath(e.target.value);
                    setSearchQuery(''); // Reset search on table change
                  }}
                  className="bg-transparent text-xs font-semibold text-gray-200 outline-none cursor-pointer max-w-[180px] truncate"
                >
                  {Object.keys(availableTables).map(path => (
                    <option key={path} value={path} className="bg-[#252526]">
                      {path}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div className="flex items-center text-red-400 text-xs gap-1.5 bg-red-400/10 border border-red-500/20 px-3 py-1.5 rounded-full font-medium">
                <AlertCircle size={14} /> Syntax Error
              </div>
            )}
          </div>
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
              {parsedData ? <JsonTable data={availableTables[selectedTablePath] || []} searchQuery={searchQuery} /> : <div className="text-gray-500 flex justify-center mt-10">Invalid or empty JSON.</div>}
            </div>
          )}
        </div>
        
        {/* Status Bar */}
        <div className={`h-7 text-[11px] flex items-center px-4 justify-between font-medium tracking-wide z-10 ${error ? 'bg-red-900/80 text-red-200 border-t border-red-800' : 'bg-[#007acc] text-white border-t border-blue-600'}`}>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-400' : 'bg-green-400'}`}></div>
              {error ? `Parse Error: ${error}` : 'System Ready | Valid JSON'}
            </span>
            {parsedData && !error && (
              <span className="text-blue-200 bg-blue-800/50 px-2 py-0.5 rounded">
                Rows in view: {availableTables[selectedTablePath]?.length || 0}
              </span>
            )}
          </div>
          <span>Pro JSON Tool - High Grade</span>
        </div>
      </div>
    </div>
  );
}
