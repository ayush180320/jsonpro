import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Allotment } from 'allotment';
import 'allotment/dist/style.css';
import { FileJson, Table, Network, Download, Settings } from 'lucide-react';

export default function App() {
  const [jsonText, setJsonText] = useState('{\n  "status": "Ready",\n  "project": "Pro JSON Tool"\n}');

  return (
    <div className="flex h-screen w-full bg-[#121212] text-gray-300 font-sans overflow-hidden">
      <div className="w-16 flex flex-col items-center py-4 bg-[#1e1e1e] border-r border-[#2d2d2d] justify-between">
        <div className="flex flex-col gap-6">
          <button className="text-blue-400"><FileJson size={24} /></button>
          <button className="text-gray-500"><Table size={24} /></button>
          <button className="text-gray-500"><Network size={24} /></button>
        </div>
        <div className="flex flex-col gap-6">
          <button className="text-gray-500"><Download size={24} /></button>
          <button className="text-gray-500"><Settings size={24} /></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-12 bg-[#1e1e1e] border-b border-[#2d2d2d] flex items-center px-4 justify-between">
          <span className="font-semibold text-sm tracking-wide">WORKSPACE / data.json</span>
        </div>

        <div className="flex-1">
          <Allotment>
            <Allotment.Pane minSize={200}>
              <div className="h-full bg-[#1e1e1e]">
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  theme="vs-dark"
                  value={jsonText}
                  onChange={(val) => setJsonText(val || '')}
                  options={{ minimap: { enabled: false }, fontSize: 14 }}
                />
              </div>
            </Allotment.Pane>
            <Allotment.Pane preferredSize={300} minSize={200}>
              <div className="h-full bg-[#181818] border-l border-[#2d2d2d] p-4 flex flex-col">
                <h3 className="text-xs uppercase text-gray-500 font-bold mb-4">Inspector</h3>
                <div className="flex-1 border border-[#2d2d2d] rounded bg-[#1e1e1e] p-4 flex items-center justify-center text-gray-600 text-sm">
                  Ready.
                </div>
              </div>
            </Allotment.Pane>
          </Allotment>
        </div>
        
        <div className="h-6 bg-[#007acc] text-white text-[11px] flex items-center px-3 justify-between">
          <span>Online</span>
          <span>JSON</span>
        </div>
      </div>
    </div>
  );
}
