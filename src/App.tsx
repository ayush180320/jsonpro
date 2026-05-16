import { useState, useEffect, useRef, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { FileJson, FileText, Download, Upload, AlertCircle, Table2, ListTree, Code2, Database, Copy, Minimize2, Search, Check, Network, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

// --- Bulletproof CSV Flattener ---
const flattenRow = (obj: any, prefix = '', res: any = {}) => {
  if (typeof obj !== 'object' || obj === null) {
    res[prefix || 'Value'] = obj;
    return res;
  }
  for (let key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    const propName = prefix ? `${prefix}.${key}` : key;
    const val = obj[key];

    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      flattenRow(val, propName, res);
    } else {
      res[propName] = val;
    }
  }
  return res;
};

// --- JSONCrack Style Infinite Canvas ---
const ZoomCanvas = ({ children }: { children: React.ReactNode }) => {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [scale, setScale] = useState(1);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPos(p => ({ x: p.x + dx, y: p.y + dy }));
  };

  const handleMouseUp = () => isDragging.current = false;

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(s => Math.min(Math.max(0.1, s + delta), 4));
  };

  return (
    <div 
      className="w-full h-full overflow-hidden relative bg-[#0a0a0a] cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}
    >
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #666 1px, transparent 1px)', backgroundSize: `${20 * scale}px ${20 * scale}px`, backgroundPosition: `${pos.x}px ${pos.y}px` }}></div>
      <div className="absolute origin-top-left" style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})` }}>
        {children}
      </div>
      <div className="absolute bottom-6 right-6 flex gap-2 z-50">
        <button onClick={() => setScale(s => Math.min(s + 0.2, 4))} className="bg-[#222] p-2.5 rounded-md hover:bg-[#333] text-gray-300 shadow-xl border border-[#444]"><ZoomIn size={18} /></button>
        <button onClick={() => setScale(s => Math.max(s - 0.2, 0.1))} className="bg-[#222] p-2.5 rounded-md hover:bg-[#333] text-gray-300 shadow-xl border border-[#444]"><ZoomOut size={18} /></button>
        <button onClick={() => { setScale(1); setPos({x: 50, y: 50}); }} className="bg-[#222] p-2.5 rounded-md hover:bg-[#333] text-gray-300 shadow-xl border border-[#444]"><Maximize size={18} /></button>
      </div>
    </div>
  );
};

// --- JSONCrack Visual Node Tree ---
const VisualNode = ({ label, data }: { label: string, data: any }) => {
  const isObj = typeof data === 'object' && data !== null && !Array.isArray(data);
  const isArr = Array.isArray(data);
  if (!isObj && !isArr) return null;

  const entries = Object.entries(data);
  const primitives = entries.filter(([_, v]) => typeof v !== 'object' || v === null);
  // Cap array rendering to prevent freezing on massive datasets
  const complex = entries.filter(([_, v]) => typeof v === 'object' && v !== null);
  const renderComplex = isArr ? complex.slice(0, 15) : complex; 
  const hiddenCount = isArr ? Math.max(0, complex.length - 15) : 0;

  return (
    <div className="flex items-center">
      <div className="bg-[#1e1e1e] border border-[#333] rounded-lg shadow-2xl flex flex-col min-w-[220px] max-w-[350px] m-2 relative z-10 hover:border-blue-500 transition-colors">
        <div className="px-3 py-2 border-b border-[#333] flex justify-between items-center bg-[#252526] rounded-t-lg">
          <span className="font-bold text-sm text-blue-400 truncate mr-4">{label}</span>
          <span className="text-[10px] text-gray-400 bg-[#111] px-2 py-0.5 rounded-full whitespace-nowrap">
            {isArr ? `Array[${data.length}]` : 'Object'}
          </span>
        </div>
        {primitives.length > 0 && (
          <div className="p-2 flex flex-col gap-1 text-xs max-h-[300px] overflow-y-auto custom-scrollbar">
            {primitives.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-[#2d2d2d] last:border-0 pb-1.5 pt-1">
                <span className="text-gray-500 font-medium truncate max-w-[120px]">{k}</span>
                <span className={`truncate text-right max-w-[150px] ${typeof v === 'string' ? "text-green-400" : typeof v === 'number' ? "text-orange-400" : "text-purple-400"}`} title={String(v)}>
                  {v === null ? 'null' : String(v)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {complex.length > 0 && (
        <div className="flex flex-col justify-center border-l-2 border-[#444] ml-2 pl-6 py-2 relative gap-4">
          <div className="absolute top-1/2 -left-2 w-2 border-t-2 border-[#444]"></div>
          {renderComplex.map(([k, v]) => (
            <div key={k} className="relative flex items-center">
              <div className="absolute top-1/2 -left-6 w-6 border-t-2 border-[#444]"></div>
              <VisualNode label={isArr ? `Index ${k}` : k} data={v} />
            </div>
          ))}
          {hiddenCount > 0 && (
             <div className="relative flex items-center text-xs text-gray-500 italic bg-[#1e1e1e] border border-[#333] px-3 py-1 rounded shadow">
               <div className="absolute top-1/2 -left-6 w-6 border-t-2 border-[#444]"></div>
               + {hiddenCount} more items hidden
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [jsonText, setJsonText] = useState('{\n  "task_data": [\n    {"id": 1, "task": "Design UI", "status": "Done"},\n    {"id": 2, "task": "Export Excel", "status": "Pending"}\n  ],\n  "title_metadata": [\n    {"doc_id": "A1", "owner": "John"}\n  ]\n}');
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'table' | 'code'>('visualizer');
  const [selectedTablePath, setSelectedTablePath] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      if (!jsonText.trim()) { setParsedData(null); setError(null); return; }
      setParsedData(JSON.parse(jsonText));
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setParsedData(null);
    }
  }, [jsonText]);

  // Strict Extraction: Only allows you to select actual arrays, avoiding the 'Root Object' export crash
  const availableTables = useMemo(() => {
    if (!parsedData) return {};
    const tables: Record<string, any[]> = {};
    const traverse = (obj: any, path: string) => {
      if (Array.isArray(obj)) {
        tables[path || 'Root Array'] = obj;
      } else if (typeof obj === 'object' && obj !== null) {
        Object.keys(obj).forEach(k => traverse(obj[k], path ? `${path}.${k}` : k));
      }
    };
    traverse(parsedData, '');
    return tables;
  }, [parsedData]);

  useEffect(() => {
    if (parsedData && !availableTables[selectedTablePath]) {
      setSelectedTablePath(Object.keys(availableTables)[0] || '');
    }
  }, [availableTables]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setJsonText(event.target?.result as string);
    reader.readAsText(file);
  };

  const exportAsCSV = () => {
    const targetData = availableTables[selectedTablePath];
    if (!targetData || targetData.length === 0) return;

    // Deep flatten rows
    const flattenedRows = targetData.map(row => flattenRow(row));
    const headers = Array.from(new Set(flattenedRows.flatMap(row => Object.keys(row))));

    const csvRows = [
      headers.join(','),
      ...flattenedRows.map(row => 
        headers.map(header => {
          let val = row[header];
          if (val === null || val === undefined) return '""';
          
          // BULLETPROOF: If an inner cell is still an array/object, stringify it securely!
          if (typeof val === 'object') val = JSON.stringify(val);
          
          let strVal = String(val).replace(/"/g, '""');
          return `"${strVal}"`;
        }).join(',')
      )
    ];

    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTablePath || 'table'}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-full bg-[#121212] text-gray-300 font-sans overflow-hidden">
      
      {/* Sidebar Toolbar */}
      <div className="w-16 flex flex-col items-center py-4 bg-[#1a1a1a] border-r border-[#2d2d2d] shadow-lg z-20 gap-5">
        <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
        <button title="Upload File" onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#2d2d2d] rounded-lg"><Upload size={22} /></button>
        <div className="w-8 h-px bg-[#333]"></div>
        <button title="Format JSON" onClick={() => {if(parsedData) setJsonText(JSON.stringify(parsedData, null, 2))}} className="text-blue-400 hover:text-blue-300 p-2 hover:bg-[#2d2d2d] rounded-lg"><FileJson size={22} /></button>
        <button title="Minify Code" onClick={() => {if(parsedData) setJsonText(JSON.stringify(parsedData))}} className="text-orange-400 hover:text-orange-300 p-2 hover:bg-[#2d2d2d] rounded-lg"><Minimize2 size={22} /></button>
        <button title="Copy Code" onClick={() => {navigator.clipboard.writeText(jsonText); setCopied(true); setTimeout(() => setCopied(false), 2000)}} className="text-gray-400 hover:text-white p-2 hover:bg-[#2d2d2d] rounded-lg">
          {copied ? <Check size={22} className="text-green-500" /> : <Copy size={22} />}
        </button>
        <div className="w-8 h-px bg-[#333]"></div>
        <button title="Export Table to Excel" onClick={exportAsCSV} className="text-green-500 hover:text-green-400 p-2 hover:bg-[#2d2d2d] rounded-lg"><FileText size={22} /></button>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navigation */}
        <div className="h-14 bg-[#1a1a1a] border-b border-[#2d2d2d] flex items-center justify-between px-4 z-20">
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('visualizer')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'visualizer' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-[#2d2d2d]'}`}>
              <Network size={16} /> JSONCrack Visualizer
            </button>
            <button onClick={() => setActiveTab('table')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'table' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-[#2d2d2d]'}`}>
              <Table2 size={16} /> Table Extractor
            </button>
            <button onClick={() => setActiveTab('code')} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'code' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-[#2d2d2d]'}`}>
              <Code2 size={16} /> Raw Editor
            </button>
          </div>

          <div className="flex items-center gap-4">
            {Object.keys(availableTables).length > 0 && activeTab === 'table' && (
              <div className="flex items-center gap-2 bg-[#252526] px-3 py-1.5 rounded-md border border-[#333]">
                <Database size={14} className="text-purple-400" />
                <select value={selectedTablePath} onChange={(e) => setSelectedTablePath(e.target.value)} className="bg-transparent text-xs font-semibold text-gray-200 outline-none cursor-pointer max-w-[250px] truncate">
                  {Object.keys(availableTables).map(path => <option key={path} value={path} className="bg-[#252526]">Export: {path}</option>)}
                </select>
              </div>
            )}
            {error && <div className="text-red-400 text-xs bg-red-400/10 px-3 py-1.5 rounded-full"><AlertCircle size={14} className="inline mr-1" /> Syntax Error</div>}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-hidden relative">
          
          {activeTab === 'code' && (
            <Editor height="100%" defaultLanguage="json" theme="vs-dark" value={jsonText} onChange={(val) => setJsonText(val || '')} options={{ minimap: { enabled: false }, fontSize: 14 }} />
          )}
          
          {activeTab === 'table' && (
            <div className="h-full bg-[#121212] overflow-auto p-4">
               {availableTables[selectedTablePath] ? (
                 <div className="border border-[#333] rounded-lg overflow-hidden shadow-lg">
                   <table className="w-full text-left border-collapse text-sm">
                     <thead className="bg-[#252526] border-b border-[#333]">
                       <tr>
                         {Array.from(new Set(availableTables[selectedTablePath].map(row => flattenRow(row)).flatMap(row => Object.keys(row)))).map(header => (
                           <th key={header} className="p-3 text-gray-200 font-semibold border-r border-[#333] uppercase text-xs sticky top-0 bg-[#252526] whitespace-nowrap">{header}</th>
                         ))}
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-[#333] bg-[#1e1e1e]">
                       {availableTables[selectedTablePath].map(row => flattenRow(row)).slice(0, 50).map((row, rowIndex) => (
                         <tr key={rowIndex} className="hover:bg-[#2a2a2a] transition-colors">
                           {Array.from(new Set(availableTables[selectedTablePath].map(r => flattenRow(r)).flatMap(r => Object.keys(r)))).map(header => (
                             <td key={header} className="p-3 text-gray-300 border-r border-[#333] max-w-[200px] truncate" title={String(row[header] ?? '')}>
                               {row[header] !== undefined && row[header] !== null ? String(row[header]) : <span className="text-gray-600 italic">null</span>}
                             </td>
                           ))}
                         </tr>
                       ))}
                     </tbody>
                   </table>
                   {availableTables[selectedTablePath].length > 50 && (
                      <div className="p-3 text-center text-xs text-gray-500 bg-[#1e1e1e]">Showing top 50 rows. Export to Excel to view all {availableTables[selectedTablePath].length} rows.</div>
                   )}
                 </div>
               ) : <div className="text-gray-500 p-10 text-center">No arrays found to extract into a table.</div>}
            </div>
          )}

          {activeTab === 'visualizer' && (
            <ZoomCanvas>
              {parsedData ? (
                <div className="inline-block min-w-max p-10">
                  <VisualNode label="Root" data={parsedData} />
                </div>
              ) : <div className="text-gray-500 p-10">Paste valid JSON to generate visualization.</div>}
            </ZoomCanvas>
          )}
        </div>
        
        {/* Status Bar */}
        <div className={`h-7 text-[11px] flex items-center px-4 justify-between font-medium tracking-wide z-20 ${error ? 'bg-red-900/80 text-red-200' : 'bg-[#007acc] text-white'}`}>
          <span>{error ? `Error: ${error}` : 'System Ready'}</span>
          <span>Industry Grade Data Tool</span>
        </div>
      </div>
    </div>
  );
}
