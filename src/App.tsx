/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  ChevronRight, 
  ChevronDown, 
  Layout, 
  Palette, 
  Database, 
  Zap, 
  ShieldCheck, 
  FileCode,
  FileJson,
  Sparkles,
  Github,
  Terminal,
  Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PromptData, UIElement, Collection } from './types';

const DEFAULT_VALUES = {
  context: {
    project: '',
    description: '',
    agent_role: '',
    assume: {
      OS: 'any',
      browser: 'modern',
      framework: 'React'
    }
  },
  requirements: {
    use: ['React', 'TailwindCSS', 'TypeScript'],
    ensure: [],
    separate: []
  },
  ui_spec: {
    elements: [],
    layout: 'vertical',
    theme: 'light',
    responsive: true
  },
  data_spec: {
    model: {},
    storage: {
      type: 'Local Storage',
      collections: []
    }
  },
  behavior: {
    state_changes: [],
    validation: [],
    edge_cases: []
  },
  testing: {
    test_cases: [],
    error_handling: [],
    performance: []
  },
  contracts: {
    typespec: null
  },
  ontology: {},
  generate: {
    artifacts: [],
    explanation: true
  },
  instructions_for_ai: {
    response_format: 'ONLY JSON, strictly following this schema',
    do_not: [],
    validation_hint: ''
  }
};

const INITIAL_STATE: PromptData = {
  ...DEFAULT_VALUES,
  contracts: { typespec: null },
  ontology: null
};

const INSTRUCTION_TYPES = [
  { id: 'response_format', label: 'Response Format' },
  { id: 'do_not', label: 'Do Not' },
  { id: 'validation_hint', label: 'Validation Hint' },
  { id: 'ensure', label: 'Ensure' },
  { id: 'prevent', label: 'Prevent' },
  { id: 'style_guide', label: 'Style Guide' },
  { id: 'constraints', label: 'Constraints' },
  { id: 'context_note', label: 'Context Note' }
];

export default function App() {
  const [data, setData] = useState<PromptData>(INITIAL_STATE);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('context');
  const [selectedInstructionType, setSelectedInstructionType] = useState('do_not');
  const [ontologyText, setOntologyText] = useState('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const jsonOutput = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateContext = (field: string, value: any) => {
    setData(prev => {
      if (!prev.context) return prev;
      return {
        ...prev,
        context: { ...prev.context, [field]: value }
      }
    });
  };

  const updateAssume = (field: string, value: any) => {
    setData(prev => {
      if (!prev.context) return prev;
      return {
        ...prev,
        context: {
          ...prev.context,
          assume: { ...prev.context.assume, [field]: value }
        }
      }
    });
  };

  const addToList = (path: string[], value: string) => {
    if (!value) return;
    setData(prev => {
      const [level1, level2] = path;
      const section = (prev as any)[level1];
      if (!section) return prev;
      return {
        ...prev,
        [level1]: {
          ...section,
          [level2]: [...section[level2], value]
        }
      };
    });
  };

  const removeFromList = (path: string[], index: number) => {
    setData(prev => {
      const [level1, level2] = path;
      const section = (prev as any)[level1];
      if (!section) return prev;
      return {
        ...prev,
        [level1]: {
          ...section,
          [level2]: section[level2].filter((_: any, i: number) => i !== index)
        }
      };
    });
  };

  const addUIElement = () => {
    const newElement: UIElement = { type: 'button', title: 'New Button' };
    setData(prev => {
      if (!prev.ui_spec) return prev;
      return {
        ...prev,
        ui_spec: {
          ...prev.ui_spec,
          elements: [...prev.ui_spec.elements, newElement]
        }
      }
    });
  };

  const updateUIElement = (index: number, field: keyof UIElement, value: string) => {
    setData(prev => {
      if (!prev.ui_spec) return prev;
      const newElements = [...prev.ui_spec.elements];
      newElements[index] = { ...newElements[index], [field]: value };
      return {
        ...prev,
        ui_spec: { ...prev.ui_spec, elements: newElements }
      }
    });
  };

  const toggleSection = (section: keyof PromptData) => {
    setData(prev => ({
      ...prev,
      [section]: prev[section] ? null : (DEFAULT_VALUES as any)[section]
    }));
  };

  const addInstruction = () => {
    setData(prev => {
      if (!prev.instructions_for_ai) return prev;
      const key = selectedInstructionType;
      const current = prev.instructions_for_ai[key];
      const next = { ...prev.instructions_for_ai };
      
      const listTypes = ['do_not', 'ensure', 'prevent', 'constraints'];
      
      if (listTypes.includes(key)) {
        next[key] = Array.isArray(current) ? [...current, ''] : (current ? [current, ''] : ['']);
      } else {
        if (current !== undefined && current !== '') {
          next[key] = Array.isArray(current) ? [...current, ''] : [current, ''];
        } else {
          next[key] = '';
        }
      }
      
      return { ...prev, instructions_for_ai: next };
    });
  };

  const removeInstruction = (key: string, index?: number) => {
    setData(prev => {
      if (!prev.instructions_for_ai) return prev;
      const next = { ...prev.instructions_for_ai };
      
      if (index !== undefined && Array.isArray(next[key])) {
        const newList = [...(next[key] as string[])];
        newList.splice(index, 1);
        if (newList.length === 0) {
          delete next[key];
        } else if (newList.length === 1) {
          next[key] = newList[0];
        } else {
          next[key] = newList;
        }
      } else {
        delete next[key];
      }
      
      return { ...prev, instructions_for_ai: next };
    });
  };

  const updateInstructionValue = (key: string, value: string, index?: number) => {
    setData(prev => {
      if (!prev.instructions_for_ai) return prev;
      const next = { ...prev.instructions_for_ai };
      
      if (index !== undefined && Array.isArray(next[key])) {
        const newList = [...(next[key] as string[])];
        newList[index] = value;
        next[key] = newList;
      } else {
        next[key] = value;
      }
      
      return { ...prev, instructions_for_ai: next };
    });
  };

  const updateOntology = (text: string) => {
    setOntologyText(text);
    try {
      const parsed = JSON.parse(text);
      setJsonError(null);
      setData(prev => ({ ...prev, ontology: parsed }));
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const SectionHeader = ({ id, title, icon: Icon }: { id: string, title: string, icon: any }) => (
    <button 
      onClick={() => setActiveSection(activeSection === id ? '' : id)}
      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
        activeSection === id 
          ? 'bg-zinc-900 text-white shadow-lg' 
          : 'bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-200'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={activeSection === id ? 'text-orange-400' : 'text-zinc-400'} />
        <span className="font-semibold tracking-tight">{title}</span>
      </div>
      {activeSection === id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
    </button>
  );

  const ListInput = ({ path, placeholder, label }: { path: string[], placeholder: string, label: string }) => {
    const [val, setVal] = useState('');
    const items = path.reduce((acc, key) => acc ? acc[key] : null, data as any) as string[] | null;

    if (!items) return null;

    return (
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (addToList(path, val), setVal(''))}
            placeholder={placeholder}
            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
          <button 
            onClick={() => { addToList(path, val); setVal(''); }}
            className="bg-zinc-900 text-white p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={i} 
                className="flex items-center gap-2 bg-white border border-zinc-200 px-3 py-1.5 rounded-full text-xs font-medium text-zinc-700 shadow-sm group"
              >
                {item}
                <button 
                  onClick={() => removeFromList(path, i)}
                  className="text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 font-sans selection:bg-orange-100 selection:text-orange-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-bottom border-zinc-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 p-2 rounded-xl">
              <Sparkles className="text-orange-400" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Prompt Architect</h1>
              <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">v1.0 • System Design Generator</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com" className="text-zinc-400 hover:text-zinc-900 transition-colors">
              <Github size={20} />
            </a>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-zinc-800 transition-all active:scale-95 shadow-lg shadow-zinc-200"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Prompt JSON'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Context Section */}
          <div className="space-y-2">
            <SectionHeader id="context" title="Project Context" icon={Layout} />
            <AnimatePresence>
              {activeSection === 'context' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-zinc-900">Enable Section</h4>
                        <p className="text-xs text-zinc-500">Include project context in the generated prompt.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="toggle-context"
                          checked={data.context !== null}
                          onChange={() => toggleSection('context')}
                          className="w-4 h-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                        />
                        <label htmlFor="toggle-context" className="text-sm font-medium text-zinc-700">Enabled</label>
                      </div>
                    </div>

                    {data.context && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Project Name</label>
                          <input 
                            type="text" 
                            value={data.context.project}
                            onChange={(e) => updateContext('project', e.target.value)}
                            placeholder="e.g. Real-time Dashboard"
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Project Description</label>
                          <textarea 
                            value={data.context.description}
                            onChange={(e) => updateContext('description', e.target.value)}
                            placeholder="Describe the project goals and core functionality..."
                            rows={3}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Agent Role</label>
                          <textarea 
                            value={data.context.agent_role}
                            onChange={(e) => updateContext('agent_role', e.target.value)}
                            placeholder="Define the AI's persona (e.g. Senior Architect)..."
                            rows={2}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Framework</label>
                            <select 
                              value={['React', 'Next.js', 'Vue', 'Angular', 'Svelte'].includes(data.context.assume.framework) ? data.context.assume.framework : 'Other'}
                              onChange={(e) => updateAssume('framework', e.target.value)}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                            >
                              <option>React</option>
                              <option>Next.js</option>
                              <option>Vue</option>
                              <option>Angular</option>
                              <option>Svelte</option>
                              <option>Other</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 opacity-0">Custom Framework</label>
                            <input 
                              type="text"
                              disabled={['React', 'Next.js', 'Vue', 'Angular', 'Svelte'].includes(data.context.assume.framework)}
                              value={!['React', 'Next.js', 'Vue', 'Angular', 'Svelte'].includes(data.context.assume.framework) ? (data.context.assume.framework === 'Other' ? '' : data.context.assume.framework) : ''}
                              onChange={(e) => updateAssume('framework', e.target.value)}
                              placeholder={!['React', 'Next.js', 'Vue', 'Angular', 'Svelte'].includes(data.context.assume.framework) ? "Enter custom framework..." : "Select 'Other' to enable"}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>
                        <ListInput path={['requirements', 'use']} label="Technologies to Use" placeholder="e.g. Framer Motion" />
                        <ListInput path={['requirements', 'ensure']} label="Core Requirements" placeholder="e.g. Responsive Design" />
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* UI Spec Section */}
          <div className="space-y-2">
            <SectionHeader id="ui" title="UI & Styling" icon={Palette} />
            <AnimatePresence>
              {activeSection === 'ui' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-zinc-900">Enable Section</h4>
                        <p className="text-xs text-zinc-500">Include UI specifications and styling rules.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="toggle-ui"
                          checked={data.ui_spec !== null}
                          onChange={() => toggleSection('ui_spec')}
                          className="w-4 h-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                        />
                        <label htmlFor="toggle-ui" className="text-sm font-medium text-zinc-700">Enabled</label>
                      </div>
                    </div>

                    {data.ui_spec && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Theme</label>
                            <select 
                              value={data.ui_spec.theme}
                              onChange={(e) => setData(prev => ({ ...prev, ui_spec: prev.ui_spec ? { ...prev.ui_spec, theme: e.target.value } : null }))}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                            >
                              <option>Light</option>
                              <option>Dark</option>
                              <option>System</option>
                              <option>Brutalist</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Layout</label>
                            <select 
                              value={data.ui_spec.layout}
                              onChange={(e) => setData(prev => ({ ...prev, ui_spec: prev.ui_spec ? { ...prev.ui_spec, layout: e.target.value } : null }))}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                            >
                              <option>Vertical</option>
                              <option>Horizontal</option>
                              <option>Grid</option>
                              <option>Bento</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">UI Elements</label>
                            <button 
                              onClick={addUIElement}
                              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                            >
                              <Plus size={14} /> Add Element
                            </button>
                          </div>
                          <div className="space-y-3">
                            {data.ui_spec.elements.map((el, i) => (
                              <div key={i} className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3 relative group">
                                <button 
                                  onClick={() => setData(prev => ({ ...prev, ui_spec: prev.ui_spec ? { ...prev.ui_spec, elements: prev.ui_spec.elements.filter((_, idx) => idx !== i) } : null }))}
                                  className="absolute top-4 right-4 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={16} />
                                </button>
                                <div className="grid grid-cols-2 gap-3">
                                  <input 
                                    type="text" 
                                    value={el.type}
                                    onChange={(e) => updateUIElement(i, 'type', e.target.value)}
                                    placeholder="Type (e.g. dialog)"
                                    className="bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                                  />
                                  <input 
                                    type="text" 
                                    value={el.title || ''}
                                    onChange={(e) => updateUIElement(i, 'title', e.target.value)}
                                    placeholder="Title/Label"
                                    className="bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                                  />
                                </div>
                                <input 
                                  type="text" 
                                  value={el.bind_to || ''}
                                  onChange={(e) => updateUIElement(i, 'bind_to', e.target.value)}
                                  placeholder="Data Binding (e.g. data.items)"
                                  className="w-full bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Data & Backend Section */}
          <div className="space-y-2">
            <SectionHeader id="data" title="Data & Backend" icon={Database} />
            <AnimatePresence>
              {activeSection === 'data' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-zinc-900">Enable Section</h4>
                        <p className="text-xs text-zinc-500">Define storage type and data collections.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="toggle-data"
                          checked={data.data_spec !== null}
                          onChange={() => toggleSection('data_spec')}
                          className="w-4 h-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                        />
                        <label htmlFor="toggle-data" className="text-sm font-medium text-zinc-700">Enabled</label>
                      </div>
                    </div>

                    {data.data_spec && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Storage Type</label>
                          <input 
                            type="text" 
                            value={data.data_spec.storage.type}
                            onChange={(e) => setData(prev => ({ ...prev, data_spec: prev.data_spec ? { ...prev.data_spec, storage: { ...prev.data_spec.storage, type: e.target.value }} : null }))}
                            placeholder="e.g. Convex"
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                          />
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Collections / Tables</label>
                            <button 
                              onClick={() => setData(prev => ({ ...prev, data_spec: prev.data_spec ? { ...prev.data_spec, storage: { ...prev.data_spec.storage, collections: [...prev.data_spec.storage.collections, { name: '', schema: '' }] }} : null }))}
                              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                            >
                              <Plus size={14} /> Add Collection
                            </button>
                          </div>
                          <div className="space-y-3">
                            {data.data_spec.storage.collections.map((col, i) => (
                              <div key={i} className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 grid grid-cols-2 gap-3 relative group">
                                <button 
                                  onClick={() => setData(prev => ({ ...prev, data_spec: prev.data_spec ? { ...prev.data_spec, storage: { ...prev.data_spec.storage, collections: prev.data_spec.storage.collections.filter((_, idx) => idx !== i) }} : null }))}
                                  className="absolute -top-2 -right-2 bg-white border border-zinc-200 rounded-full p-1 text-zinc-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={12} />
                                </button>
                                <input 
                                  type="text" 
                                  value={col.name}
                                  onChange={(e) => {
                                    if (!data.data_spec) return;
                                    const newCols = [...data.data_spec.storage.collections];
                                    newCols[i].name = e.target.value;
                                    setData(prev => ({ ...prev, data_spec: prev.data_spec ? { ...prev.data_spec, storage: { ...prev.data_spec.storage, collections: newCols }} : null }));
                                  }}
                                  placeholder="Name"
                                  className="bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                                <input 
                                  type="text" 
                                  value={col.schema}
                                  onChange={(e) => {
                                    if (!data.data_spec) return;
                                    const newCols = [...data.data_spec.storage.collections];
                                    newCols[i].schema = e.target.value;
                                    setData(prev => ({ ...prev, data_spec: prev.data_spec ? { ...prev.data_spec, storage: { ...prev.data_spec.storage, collections: newCols }} : null }));
                                  }}
                                  placeholder="Schema (e.g. JSON)"
                                  className="bg-white border border-zinc-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Behavior Section */}
          <div className="space-y-2">
            <SectionHeader id="behavior" title="Behavior & Logic" icon={Zap} />
            <AnimatePresence>
              {activeSection === 'behavior' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-zinc-900">Enable Section</h4>
                        <p className="text-xs text-zinc-500">Define application behavior and logic rules.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="toggle-behavior"
                          checked={data.behavior !== null}
                          onChange={() => toggleSection('behavior')}
                          className="w-4 h-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                        />
                        <label htmlFor="toggle-behavior" className="text-sm font-medium text-zinc-700">Enabled</label>
                      </div>
                    </div>

                    {data.behavior && (
                      <>
                        <ListInput path={['behavior', 'state_changes']} label="State Changes" placeholder="e.g. onClick submit -> add item" />
                        <ListInput path={['behavior', 'validation']} label="Validation Rules" placeholder="e.g. email must be valid" />
                        <ListInput path={['behavior', 'edge_cases']} label="Edge Cases" placeholder="e.g. empty list state" />
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Testing Section */}
          <div className="space-y-2">
            <SectionHeader id="testing" title="Testing & Quality" icon={ShieldCheck} />
            <AnimatePresence>
              {activeSection === 'testing' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-zinc-900">Enable Section</h4>
                        <p className="text-xs text-zinc-500">Specify test cases and error handling strategies.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="toggle-testing"
                          checked={data.testing !== null}
                          onChange={() => toggleSection('testing')}
                          className="w-4 h-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                        />
                        <label htmlFor="toggle-testing" className="text-sm font-medium text-zinc-700">Enabled</label>
                      </div>
                    </div>

                    {data.testing && (
                      <>
                        <ListInput path={['testing', 'test_cases']} label="Test Cases" placeholder="e.g. user adds item with empty name" />
                        <ListInput path={['testing', 'error_handling']} label="Error Handling" placeholder="e.g. API timeout fallback" />
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Contracts Section */}
          <div className="space-y-2">
            <SectionHeader id="contracts" title="Contracts" icon={FileJson} />
            <AnimatePresence>
              {activeSection === 'contracts' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-zinc-900">Enable Section</h4>
                        <p className="text-xs text-zinc-500">Enable TypeSpec as a set of nullable contracts.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="toggle-contracts"
                          checked={data.contracts !== null}
                          onChange={() => toggleSection('contracts')}
                          className="w-4 h-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                        />
                        <label htmlFor="toggle-contracts" className="text-sm font-medium text-zinc-700">Enabled</label>
                      </div>
                    </div>

                    {data.contracts && (
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-zinc-900">TypeSpec Contract</h4>
                          <p className="text-xs text-zinc-500">Toggle specific TypeSpec functionality.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            id="typespec"
                            checked={data.contracts.typespec !== null}
                            onChange={(e) => {
                              setData(prev => ({
                                ...prev,
                                contracts: prev.contracts ? {
                                  ...prev.contracts,
                                  typespec: e.target.checked ? '' : null
                                } : null
                              }));
                            }}
                            className="w-4 h-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                          />
                          <label htmlFor="typespec" className="text-sm font-medium text-zinc-700">TypeSpec Enabled</label>
                        </div>
                      </div>
                    )}
                    {data.contracts?.typespec !== null && data.contracts !== null && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">TypeSpec Definition</label>
                        <textarea 
                          value={data.contracts.typespec || ''}
                          onChange={(e) => setData(prev => ({
                            ...prev,
                            contracts: prev.contracts ? {
                              ...prev.contracts,
                              typespec: e.target.value
                            } : null
                          }))}
                          placeholder="Enter TypeSpec definition here..."
                          rows={4}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none font-mono"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Ontology Section */}
          <div className="space-y-2">
            <SectionHeader id="ontology" title="Ontology" icon={Network} />
            <AnimatePresence>
              {activeSection === 'ontology' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-zinc-900">Enable Section</h4>
                        <p className="text-xs text-zinc-500">Provide granular system ontology and extra instructions in JSON format.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="toggle-ontology"
                          checked={data.ontology !== null}
                          onChange={() => toggleSection('ontology')}
                          className="w-4 h-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                        />
                        <label htmlFor="toggle-ontology" className="text-sm font-medium text-zinc-700">Enabled</label>
                      </div>
                    </div>

                    {data.ontology !== null && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Ontology Definition (JSON)</label>
                          {jsonError && (
                            <span className="text-[10px] font-bold text-red-500 uppercase">Invalid JSON</span>
                          )}
                        </div>
                        <textarea 
                          value={ontologyText}
                          onChange={(e) => updateOntology(e.target.value)}
                          placeholder='{ "entities": { ... }, "relationships": [ ... ] }'
                          rows={10}
                          className={`w-full bg-zinc-50 border ${jsonError ? 'border-red-200 focus:ring-red-500/20 focus:border-red-500' : 'border-zinc-200 focus:ring-orange-500/20 focus:border-orange-500'} rounded-lg px-4 py-3 text-sm focus:outline-none transition-all resize-none font-mono`}
                        />
                        {jsonError && (
                          <p className="text-[10px] text-red-400 font-medium leading-tight">
                            {jsonError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Output Section */}
          <div className="space-y-2">
            <SectionHeader id="output" title="Output Configuration" icon={FileCode} />
            <AnimatePresence>
              {activeSection === 'output' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-zinc-900">Enable Section</h4>
                        <p className="text-xs text-zinc-500">Configure generated artifacts and explanations.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="toggle-generate"
                          checked={data.generate !== null}
                          onChange={() => toggleSection('generate')}
                          className="w-4 h-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                        />
                        <label htmlFor="toggle-generate" className="text-sm font-medium text-zinc-700">Enabled</label>
                      </div>
                    </div>

                    {data.generate && (
                      <>
                        <ListInput path={['generate', 'artifacts']} label="Generated Artifacts" placeholder="e.g. React Components" />
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            id="explanation"
                            checked={data.generate.explanation}
                            onChange={(e) => setData(prev => ({ ...prev, generate: prev.generate ? { ...prev.generate, explanation: e.target.checked } : null }))}
                            className="w-4 h-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                          />
                          <label htmlFor="explanation" className="text-sm font-medium text-zinc-700">Include step-by-step explanation</label>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI Instructions Section */}
          <div className="space-y-2">
            <SectionHeader id="ai_instructions" title="Instructions for AI" icon={Terminal} />
            <AnimatePresence>
              {activeSection === 'ai_instructions' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-zinc-900">Enable Section</h4>
                        <p className="text-xs text-zinc-500">Add specific directives and constraints for the AI.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="toggle-ai-instructions"
                          checked={data.instructions_for_ai !== null}
                          onChange={() => toggleSection('instructions_for_ai')}
                          className="w-4 h-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
                        />
                        <label htmlFor="toggle-ai-instructions" className="text-sm font-medium text-zinc-700">Enabled</label>
                      </div>
                    </div>

                    {data.instructions_for_ai && (
                      <div className="space-y-6">
                        <div className="flex gap-2">
                          <select 
                            value={selectedInstructionType}
                            onChange={(e) => setSelectedInstructionType(e.target.value)}
                            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all uppercase tracking-widest font-bold text-zinc-500"
                          >
                            {INSTRUCTION_TYPES.map(type => (
                              <option key={type.id} value={type.id}>{type.label}</option>
                            ))}
                          </select>
                          <button 
                            onClick={addInstruction}
                            className="bg-zinc-900 text-white px-4 py-2 rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-2 text-sm font-bold"
                          >
                            <Plus size={18} /> Add
                          </button>
                        </div>

                        <div className="space-y-4">
                          {Object.entries(data.instructions_for_ai).map(([key, value]) => {
                            const label = INSTRUCTION_TYPES.find(t => t.id === key)?.label || key;
                            
                            if (Array.isArray(value)) {
                              return value.map((item, idx) => (
                                <div key={`${key}-${idx}`} className="space-y-2 group">
                                  <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</label>
                                    <button 
                                      onClick={() => removeInstruction(key, idx)}
                                      className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                  <textarea 
                                    value={item}
                                    onChange={(e) => updateInstructionValue(key, e.target.value, idx)}
                                    placeholder={`Enter ${label.toLowerCase()} specifics...`}
                                    rows={2}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                                  />
                                </div>
                              ));
                            }

                            return (
                              <div key={key} className="space-y-2 group">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{label}</label>
                                  <button 
                                    onClick={() => removeInstruction(key)}
                                    className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <textarea 
                                  value={value as string}
                                  onChange={(e) => updateInstructionValue(key, e.target.value)}
                                  placeholder={`Enter ${label.toLowerCase()} specifics...`}
                                  rows={2}
                                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Preview Section */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Live Prompt Preview</h2>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Real-time Sync</span>
              </div>
            </div>
            <div className="bg-zinc-900 rounded-2xl p-6 shadow-2xl shadow-zinc-200 border border-zinc-800 relative overflow-hidden group">
              {/* Code Background Glow */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/10 blur-[100px] pointer-events-none" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">prompt_spec.json</span>
                </div>
                
                <pre className="text-xs font-mono text-zinc-300 overflow-auto max-h-[600px] scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                  <code>{jsonOutput}</code>
                </pre>
              </div>

              {/* Floating Copy Button for Mobile/Small Screens */}
              <button 
                onClick={handleCopy}
                className="absolute bottom-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-md p-2 rounded-lg text-white transition-all active:scale-90 lg:hidden"
              >
                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
              </button>
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <div className="flex gap-3">
                <div className="bg-orange-100 p-2 rounded-lg h-fit">
                  <Sparkles className="text-orange-600" size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-orange-900">Pro Tip</h4>
                  <p className="text-xs text-orange-800/80 leading-relaxed mt-1">
                    Use this JSON as a system instruction or a direct prompt for Gemini to generate high-fidelity boilerplate code.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-zinc-200 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-zinc-400">
            <Sparkles size={16} />
            <span className="text-sm font-medium">Built for AI Studio Build</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">Documentation</a>
            <a href="#" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">Templates</a>
            <a href="#" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
