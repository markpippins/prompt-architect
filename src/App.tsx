/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Network,
  Sun,
  Moon,
  Crosshair
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

type Theme = 'steel' | 'light' | 'dark';
const THEME_CYCLE: Theme[] = ['steel', 'light', 'dark'];
// Environment-controlled event bus: the live unit points at the nexus event
// bus (:3200). Set VITE_VA_EVENT_BUS_URL to override; mock mode (VITE_VA_MODE
// = mock) disables live publishing/streaming entirely.
const EVENT_BUS_URL = (import.meta as any).env?.VITE_VA_EVENT_BUS_URL || 'http://localhost:3200';
const VA_MODE: 'live' | 'mock' = (import.meta as any).env?.VITE_VA_MODE === 'mock' ? 'mock' : 'live';

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
  const [theme, setTheme] = useState<Theme>('steel');
  const [busConnected, setBusConnected] = useState(false);

  const jsonOutput = useMemo(() => JSON.stringify(data, null, 2), [data]);

  const toggleTheme = useCallback(() => {
    const idx = THEME_CYCLE.indexOf(theme);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    setTheme(next);
    // Publish to event bus so parent apps sync. In live mode failures stay
  // visible (connection flag drops); in mock mode nothing is published.
    if (VA_MODE === 'live') {
      fetch(`${EVENT_BUS_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'view-architect',
          eventName: 'theme-change',
          eventValue: `theme-${next}`
        })
      }).then(() => setBusConnected(true)).catch(() => setBusConnected(false));
    }
  }, [theme]);

  // Sync theme class to <html> element
  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove('steel', 'light', 'dark');
    el.classList.add(theme);
  }, [theme]);

  // Connect to event bus for theme sync (live mode only; mock mode does not
  // connect so the UI reports local-only operation).
  useEffect(() => {
    if (VA_MODE !== 'live') return;
    let es: EventSource | null = null;
    try {
      const url = `${EVENT_BUS_URL}/api/events/stream?sender=${encodeURIComponent('view-architect')}`;
      es = new EventSource(url);
      es.onopen = () => setBusConnected(true);
      es.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data);
          if (event.sender === '_system' || event.sender === 'view-architect') return;
          if (event.eventName === 'theme-change' && typeof event.eventValue === 'string') {
            const val = event.eventValue;
            if (val === 'theme-steel') setTheme('steel');
            else if (val === 'theme-light') setTheme('light');
            else if (val === 'theme-dark') setTheme('dark');
          }
        } catch { /* ignore parse errors */ }
      };
      es.onerror = () => setBusConnected(false);
    } catch { setBusConnected(false); }
    return () => { es?.close(); };
  }, []);

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
          ? 'shadow-lg' 
          : 'hover:opacity-80'
      }`}
      style={{
        background: activeSection === id ? 'var(--va-surface)' : 'var(--va-surface)',
        color: activeSection === id ? 'var(--va-text)' : 'var(--va-text-muted)',
        border: activeSection === id ? '1px solid var(--va-accent)' : '1px solid var(--va-border)'
      }}
    >
      <div className="flex items-center gap-3">        <Icon size={20} style={{ color: activeSection === id ? 'var(--va-accent)' : 'var(--va-text-dim)' }} />
            <span className="font-semibold tracking-tight" style={{ fontFamily: 'var(--va-font-heading)' }}>{title}</span>
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
        <label className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--va-text-muted)' }}>{label}</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (addToList(path, val), setVal(''))}
            placeholder={placeholder}
            className="flex-1 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 transition-all"
            style={{ background: 'var(--va-bg)', border: '1px solid var(--va-border)', color: 'var(--va-text)' }}
          />
          <button 
            onClick={() => { addToList(path, val); setVal(''); }}
            className="p-2 rounded-lg transition-colors"
            style={{ background: 'var(--va-accent)', color: 'white' }}
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm group"
                style={{ background: 'var(--va-surface)', border: '1px solid var(--va-border)', color: 'var(--va-text-secondary)' }}
              >
                {item}
                <button 
                  onClick={() => removeFromList(path, i)}
                  className="transition-colors" style={{ color: 'var(--va-text-dim)' }}
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
    <div className="min-h-screen" style={{ background: 'var(--va-bg)', color: 'var(--va-text)' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md px-6 py-4" style={{ background: 'color-mix(in srgb, var(--va-surface) 80%, transparent)', borderBottom: '1px solid var(--va-border)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ background: 'var(--va-surface)', color: 'var(--va-text)', border: `1px solid var(--va-border)` }} className="p-2 rounded-xl">
              <Sparkles className="text-orange-400" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--va-font-heading)' }}>View Architect</h1>
              <p className="text-sm" style={{ color: 'var(--va-text-muted)' }}>v1.0 • System Design Generator</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 active:scale-90"
              style={{
                background: 'var(--va-surface)',
                color: 'var(--va-text-muted)',
                border: '1px solid var(--va-border-light)'
              }}
              title={`Theme: ${theme}${VA_MODE === 'mock' ? ' • Mock (no live bus)' : busConnected ? ' • Synced' : ' • Event bus DOWN'}`}
            >
              {theme === 'light' ? <Sun size={18} /> :
               theme === 'dark' ? <Moon size={18} /> :
               <Crosshair size={18} />}
            </button>
            <a href="https://github.com" className="transition-colors" style={{ color: 'var(--va-text-dim)' }}>
              <Github size={20} />
            </a>
            <button 
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95"
              style={{
                background: 'var(--va-surface)',
                color: 'var(--va-text)',
                border: '1px solid var(--va-border)'
              }}
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
                  <div className="rounded-xl p-6 space-y-6 shadow-sm" style={{ background: 'var(--va-surface-2)', border: '1px solid var(--va-border)' }}>
                    <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--va-border)' }}>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold" style={{ color: 'var(--va-text)' }}>Enable Section</h4>
                        <p className="text-sm" style={{ color: 'var(--va-text-muted)' }}>Include project context in the generated prompt.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="toggle-context"
                          checked={data.context !== null}
                          onChange={() => toggleSection('context')}
                          className="w-4 h-4 rounded focus:ring-2"
                          style={{ accentColor: 'var(--va-accent)', borderColor: 'var(--va-border)' }}
                        />
                        <label htmlFor="toggle-context" className="text-sm font-medium" style={{ color: 'var(--va-text-secondary)' }}>Enabled</label>
                      </div>
                    </div>

                    {data.context && (
                      <>
                        <div className="space-y-2">
                          <label className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--va-text-muted)' }}>Project Name</label>
                          <input 
                            type="text" 
                            value={data.context.project}
                            onChange={(e) => updateContext('project', e.target.value)}
                            placeholder="e.g. Real-time Dashboard"
                          className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all"
                          style={{
                            background: 'var(--va-bg)',
                            border: '1px solid var(--va-border)',
                            color: 'var(--va-text)',
                            outlineColor: 'var(--va-accent)'
                          }}
                        />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--va-text-muted)' }}>Project Description</label>
                          <textarea 
                            value={data.context.description}
                            onChange={(e) => updateContext('description', e.target.value)}
                            placeholder="Describe the project goals and core functionality..."
                            rows={3}
                          className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all resize-none"
                          style={{
                            background: 'var(--va-bg)',
                            border: '1px solid var(--va-border)',
                            color: 'var(--va-text)'
                          }}
                        />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--va-text-muted)' }}>Agent Role</label>
                          <textarea 
                            value={data.context.agent_role}
                            onChange={(e) => updateContext('agent_role', e.target.value)}
                            placeholder="Define the AI's persona (e.g. Senior Architect)..."
                            rows={2}
                          className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all resize-none"
                          style={{ background: 'var(--va-bg)', border: '1px solid var(--va-border)', color: 'var(--va-text)' }}
                        />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--va-text-muted)' }}>Framework</label>
                            <select 
                              value={['React', 'Next.js', 'Vue', 'Angular', 'Svelte'].includes(data.context.assume.framework) ? data.context.assume.framework : 'Other'}
                              onChange={(e) => updateAssume('framework', e.target.value)}
                              className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all"
                          style={{
                            background: 'var(--va-bg)',
                            border: '1px solid var(--va-border)',
                            color: 'var(--va-text)'
                          }}
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
                            <label className="text-sm font-bold uppercase tracking-widest opacity-0" style={{ color: 'var(--va-text-muted)' }}>Custom Framework</label>
                            <input 
                              type="text"
                              disabled={['React', 'Next.js', 'Vue', 'Angular', 'Svelte'].includes(data.context.assume.framework)}
                              value={!['React', 'Next.js', 'Vue', 'Angular', 'Svelte'].includes(data.context.assume.framework) ? (data.context.assume.framework === 'Other' ? '' : data.context.assume.framework) : ''}
                              onChange={(e) => updateAssume('framework', e.target.value)}
                              placeholder={!['React', 'Next.js', 'Vue', 'Angular', 'Svelte'].includes(data.context.assume.framework) ? "Enter custom framework..." : "Select 'Other' to enable"}
                              className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{
                                background: 'var(--va-bg)',
                                border: '1px solid var(--va-border)',
                                color: 'var(--va-text)'
                              }}
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
                  <div className="rounded-xl p-6 space-y-6 shadow-sm" style={{ background: 'var(--va-surface-2)', border: '1px solid var(--va-border)' }}>
                    <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--va-border)' }}>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold" style={{ color: 'var(--va-text)' }}>Enable Section</h4>
                        <p className="text-sm" style={{ color: 'var(--va-text-muted)' }}>Include UI specifications and styling rules.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="toggle-ui"
                          checked={data.ui_spec !== null}
                          onChange={() => toggleSection('ui_spec')}
                          className="w-4 h-4 rounded focus:ring-2"
                          style={{ accentColor: 'var(--va-accent)', borderColor: 'var(--va-border)' }}
                        />
                        <label htmlFor="toggle-ui" className="text-sm font-medium" style={{ color: 'var(--va-text-secondary)' }}>Enabled</label>
                      </div>
                    </div>

                    {data.ui_spec && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--va-text-muted)' }}>Theme</label>
                            <select 
                              value={data.ui_spec.theme}
                              onChange={(e) => setData(prev => ({ ...prev, ui_spec: prev.ui_spec ? { ...prev.ui_spec, theme: e.target.value } : null }))}
                              className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all"
                          style={{ background: 'var(--va-bg)', border: '1px solid var(--va-border)', color: 'var(--va-text)' }}
                            >
                              <option>Light</option>
                              <option>Dark</option>
                              <option>System</option>
                              <option>Brutalist</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--va-text-muted)' }}>Layout</label>
                            <select 
                              value={data.ui_spec.layout}
                              onChange={(e) => setData(prev => ({ ...prev, ui_spec: prev.ui_spec ? { ...prev.ui_spec, layout: e.target.value } : null }))}
                              className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all"
                              style={{ background: 'var(--va-bg)', border: '1px solid var(--va-border)', color: 'var(--va-text)' }}
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
                            <label className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--va-text-muted)' }}>UI Elements</label>
                            <button 
                              onClick={addUIElement}
                              className="text-sm font-bold flex items-center gap-1" style={{ color: 'var(--va-accent)' }}
                            >
                              <Plus size={14} /> Add Element
                            </button>
                          </div>
                          <div className="space-y-3">
                            {data.ui_spec.elements.map((el, i) => (
                              <div key={i} className="rounded-lg p-4 space-y-3 relative group" style={{ background: 'var(--va-bg)', border: '1px solid var(--va-border)' }}>
                                <button 
                                  onClick={() => setData(prev => ({ ...prev, ui_spec: prev.ui_spec ? { ...prev.ui_spec, elements: prev.ui_spec.elements.filter((_, idx) => idx !== i) } : null }))}
                                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--va-text-dim)' }}
                                >
                                  <Trash2 size={16} />
                                </button>
                                <div className="grid grid-cols-2 gap-3">
                                  <input 
                                    type="text" 
                                    value={el.type}
                                    onChange={(e) => updateUIElement(i, 'type', e.target.value)}
                                    placeholder="Type (e.g. dialog)"
                                    className="rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1"
                                    style={{ background: 'var(--va-surface)', border: '1px solid var(--va-border)', color: 'var(--va-text)' }}
                                  />
                                  <input 
                                    type="text" 
                                    value={el.title || ''}
                                    onChange={(e) => updateUIElement(i, 'title', e.target.value)}
                                    placeholder="Title/Label"
                                    className="rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1"
                                    style={{ background: 'var(--va-surface)', border: '1px solid var(--va-border)', color: 'var(--va-text)' }}
                                  />
                                </div>                                  <input 
                                    type="text" 
                                    value={el.bind_to || ''}
                                    onChange={(e) => updateUIElement(i, 'bind_to', e.target.value)}
                                    placeholder="Data Binding (e.g. data.items)"
                                    className="w-full rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1"
                                    style={{ background: 'var(--va-surface)', border: '1px solid var(--va-border)', color: 'var(--va-text)' }}
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
                  <div className="rounded-xl p-6 space-y-6 shadow-sm" style={{ background: 'var(--va-surface-2)', border: '1px solid var(--va-border)' }}>
                    <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--va-border)' }}>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold" style={{ color: 'var(--va-text)' }}>Enable Section</h4>
                        <p className="text-sm" style={{ color: 'var(--va-text-muted)' }}>Define storage type and data collections.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="toggle-data"
                          checked={data.data_spec !== null}
                          onChange={() => toggleSection('data_spec')}
                          className="w-4 h-4 rounded focus:ring-2"
                          style={{ accentColor: 'var(--va-accent)', borderColor: 'var(--va-border)' }}
                        />
                        <label htmlFor="toggle-data" className="text-sm font-medium" style={{ color: 'var(--va-text-secondary)' }}>Enabled</label>
                      </div>
                    </div>

                    {data.data_spec && (
                      <>
                        <div className="space-y-2">                            <label className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--va-text-muted)' }}>Storage Type</label>
                          <input 
                            type="text" 
                            value={data.data_spec.storage.type}
                            onChange={(e) => setData(prev => ({ ...prev, data_spec: prev.data_spec ? { ...prev.data_spec, storage: { ...prev.data_spec.storage, type: e.target.value }} : null }))}
                            placeholder="e.g. Convex"
                            className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all"
                            style={{ background: 'var(--va-bg)', border: '1px solid var(--va-border)', color: 'var(--va-text)' }}
                          />
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--va-text-muted)' }}>Collections / Tables</label>
                            <button 
                              onClick={() => setData(prev => ({ ...prev, data_spec: prev.data_spec ? { ...prev.data_spec, storage: { ...prev.data_spec.storage, collections: [...prev.data_spec.storage.collections, { name: '', schema: '' }] }} : null }))}
                              className="text-sm font-bold flex items-center gap-1" style={{ color: 'var(--va-accent)' }}
                            >
                              <Plus size={14} /> Add Collection
                            </button>
                          </div>
                          <div className="space-y-3">
                            {data.data_spec.storage.collections.map((col, i) => (
                              <div key={i} className="rounded-lg p-4 grid grid-cols-2 gap-3 relative group" style={{ background: 'var(--va-bg)', border: '1px solid var(--va-border)' }}>
                                <button 
                                  onClick={() => setData(prev => ({ ...prev, data_spec: prev.data_spec ? { ...prev.data_spec, storage: { ...prev.data_spec.storage, collections: prev.data_spec.storage.collections.filter((_, idx) => idx !== i) }} : null }))}
                                  className="absolute -top-2 -right-2 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ background: 'var(--va-surface)', border: '1px solid var(--va-border)', color: 'var(--va-text-dim)' }}
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
                                  className="rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1"
                                  style={{ background: 'var(--va-surface)', border: '1px solid var(--va-border)', color: 'var(--va-text)' }}
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
                                  className="rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1"
                                  style={{ background: 'var(--va-surface)', border: '1px solid var(--va-border)', color: 'var(--va-text)' }}
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
                  <div className="rounded-xl p-6 space-y-6 shadow-sm" style={{ background: 'var(--va-surface-2)', border: '1px solid var(--va-border)' }}>
                    <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--va-border)' }}>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold" style={{ color: 'var(--va-text)' }}>Enable Section</h4>
                        <p className="text-sm" style={{ color: 'var(--va-text-muted)' }}>Define application behavior and logic rules.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="toggle-behavior"
                          checked={data.behavior !== null}
                          onChange={() => toggleSection('behavior')}
                          className="w-4 h-4 rounded focus:ring-2"
                          style={{ accentColor: 'var(--va-accent)', borderColor: 'var(--va-border)' }}
                        />
                        <label htmlFor="toggle-behavior" className="text-sm font-medium" style={{ color: 'var(--va-text-secondary)' }}>Enabled</label>
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
                  <div className="rounded-xl p-6 space-y-6 shadow-sm" style={{ background: 'var(--va-surface-2)', border: '1px solid var(--va-border)' }}>
                    <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--va-border)' }}>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold" style={{ color: 'var(--va-text)' }}>Enable Section</h4>
                        <p className="text-sm" style={{ color: 'var(--va-text-muted)' }}>Specify test cases and error handling strategies.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="toggle-testing"
                          checked={data.testing !== null}
                          onChange={() => toggleSection('testing')}
                          className="w-4 h-4 rounded focus:ring-2"
                          style={{ accentColor: 'var(--va-accent)', borderColor: 'var(--va-border)' }}
                        />
                        <label htmlFor="toggle-testing" className="text-sm font-medium" style={{ color: 'var(--va-text-secondary)' }}>Enabled</label>
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
                  <div className="rounded-xl p-6 space-y-6 shadow-sm" style={{ background: 'var(--va-surface-2)', border: '1px solid var(--va-border)' }}>
                    <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--va-border)' }}>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold" style={{ color: 'var(--va-text)' }}>Enable Section</h4>
                        <p className="text-sm" style={{ color: 'var(--va-text-muted)' }}>Enable TypeSpec as a set of nullable contracts.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="toggle-contracts"
                          checked={data.contracts !== null}
                          onChange={() => toggleSection('contracts')}
                          className="w-4 h-4 rounded focus:ring-2"
                          style={{ accentColor: 'var(--va-accent)', borderColor: 'var(--va-border)' }}
                        />
                        <label htmlFor="toggle-contracts" className="text-sm font-medium" style={{ color: 'var(--va-text-secondary)' }}>Enabled</label>
                      </div>
                    </div>

                    {data.contracts && (
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">                            <h4 className="text-sm font-bold" style={{ color: 'var(--va-text)' }}>TypeSpec Contract</h4>
                          <p className="text-sm" style={{ color: 'var(--va-text-muted)' }}>Toggle specific TypeSpec functionality.</p>
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
                            className="w-4 h-4 rounded focus:ring-2"
                          style={{ accentColor: 'var(--va-accent)', borderColor: 'var(--va-border)' }}
                          />
                          <label htmlFor="typespec" className="text-sm font-medium" style={{ color: 'var(--va-text-secondary)' }}>TypeSpec Enabled</label>
                        </div>
                      </div>
                    )}
                    {data.contracts?.typespec !== null && data.contracts !== null && (
                      <div className="space-y-2">                            <label className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--va-text-muted)' }}>TypeSpec Definition</label>
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
                          className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all resize-none font-mono"
                          style={{ background: 'var(--va-bg)', border: '1px solid var(--va-border)', color: 'var(--va-text)' }}
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
                  <div className="rounded-xl p-6 space-y-6 shadow-sm" style={{ background: 'var(--va-surface-2)', border: '1px solid var(--va-border)' }}>
                    <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--va-border)' }}>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold" style={{ color: 'var(--va-text)' }}>Enable Section</h4>
                        <p className="text-sm" style={{ color: 'var(--va-text-muted)' }}>Provide granular system ontology and extra instructions in JSON format.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="toggle-ontology"
                          checked={data.ontology !== null}
                          onChange={() => toggleSection('ontology')}
                          className="w-4 h-4 rounded focus:ring-2"
                          style={{ accentColor: 'var(--va-accent)', borderColor: 'var(--va-border)' }}
                        />
                        <label htmlFor="toggle-ontology" className="text-sm font-medium" style={{ color: 'var(--va-text-secondary)' }}>Enabled</label>
                      </div>
                    </div>

                    {data.ontology !== null && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">                            <label className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--va-text-muted)' }}>Ontology Definition (JSON)</label>
                          {jsonError && (
                            <span className="text-[10px] font-bold text-red-500 uppercase">Invalid JSON</span>
                          )}
                        </div>
                        <textarea 
                          value={ontologyText}
                          onChange={(e) => updateOntology(e.target.value)}
                          placeholder='{ "entities": { ... }, "relationships": [ ... ] }'
                          rows={10}
                          className={`w-full rounded-lg px-4 py-3 text-sm focus:outline-none transition-all resize-none font-mono`}
                          style={{
                            background: 'var(--va-bg)',
                            border: `1px solid ${jsonError ? 'var(--va-red)' : 'var(--va-border)'}`,
                            color: 'var(--va-text)'
                          }}
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
                  <div className="rounded-xl p-6 space-y-6 shadow-sm" style={{ background: 'var(--va-surface-2)', border: '1px solid var(--va-border)' }}>
                    <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--va-border)' }}>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold" style={{ color: 'var(--va-text)' }}>Enable Section</h4>
                        <p className="text-sm" style={{ color: 'var(--va-text-muted)' }}>Configure generated artifacts and explanations.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="toggle-generate"
                          checked={data.generate !== null}
                          onChange={() => toggleSection('generate')}
                          className="w-4 h-4 rounded focus:ring-2"
                          style={{ accentColor: 'var(--va-accent)', borderColor: 'var(--va-border)' }}
                        />
                        <label htmlFor="toggle-generate" className="text-sm font-medium" style={{ color: 'var(--va-text-secondary)' }}>Enabled</label>
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
                            className="w-4 h-4 rounded focus:ring-2" style={{ accentColor: 'var(--va-accent)', borderColor: 'var(--va-border)' }}
                          />
                          <label htmlFor="explanation" className="text-sm font-medium" style={{ color: 'var(--va-text-secondary)' }}>Include step-by-step explanation</label>
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
                  <div className="rounded-xl p-6 space-y-6 shadow-sm" style={{ background: 'var(--va-surface-2)', border: '1px solid var(--va-border)' }}>
                    <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--va-border)' }}>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold" style={{ color: 'var(--va-text)' }}>Enable Section</h4>
                        <p className="text-sm" style={{ color: 'var(--va-text-muted)' }}>Add specific directives and constraints for the AI.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          id="toggle-ai-instructions"
                          checked={data.instructions_for_ai !== null}
                          onChange={() => toggleSection('instructions_for_ai')}
                          className="w-4 h-4 rounded focus:ring-2"
                          style={{ accentColor: 'var(--va-accent)', borderColor: 'var(--va-border)' }}
                        />
                        <label htmlFor="toggle-ai-instructions" className="text-sm font-medium" style={{ color: 'var(--va-text-secondary)' }}>Enabled</label>
                      </div>
                    </div>

                    {data.instructions_for_ai && (
                      <div className="space-y-6">
                        <div className="flex gap-2">
                          <select 
                            value={selectedInstructionType}
                            onChange={(e) => setSelectedInstructionType(e.target.value)}
                            className="flex-1 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 transition-all uppercase tracking-widest font-bold"
                            style={{ background: 'var(--va-bg)', border: '1px solid var(--va-border)', color: 'var(--va-text)' }}
                          >
                            {INSTRUCTION_TYPES.map(type => (
                              <option key={type.id} value={type.id}>{type.label}</option>
                            ))}
                          </select>
                          <button 
                            onClick={addInstruction}
                            className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-bold" style={{ background: 'var(--va-accent)', color: 'white' }}
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
                                    <label                                    className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--va-text-muted)' }}>{label}</label>
                                    <button 
                                      onClick={() => removeInstruction(key, idx)}
                                      className="opacity-0 group-hover:opacity-100 transition-all" style={{ color: 'var(--va-text-dim)' }}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                  <textarea 
                                    value={item}
                                    onChange={(e) => updateInstructionValue(key, e.target.value, idx)}
                                    placeholder={`Enter ${label.toLowerCase()} specifics...`}
                                    rows={2}
                                    className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all resize-none"
                                    style={{ background: 'var(--va-bg)', border: '1px solid var(--va-border)', color: 'var(--va-text)' }}
                                  />
                                </div>
                              ));
                            }

                            return (
                              <div key={key} className="space-y-2 group">
                                <div className="flex items-center justify-between">                                    <label className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--va-text-muted)' }}>{label}</label>
                                    <button 
                                      onClick={() => removeInstruction(key)}
                                      className="opacity-0 group-hover:opacity-100 transition-all" style={{ color: 'var(--va-text-dim)' }}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <textarea 
                                  value={value as string}
                                  onChange={(e) => updateInstructionValue(key, e.target.value)}
                                  placeholder={`Enter ${label.toLowerCase()} specifics...`}
                                  rows={2}
                                  className="w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all resize-none"
                                  style={{ background: 'var(--va-bg)', border: '1px solid var(--va-border)', color: 'var(--va-text)' }}
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
              <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--va-text-muted)' }}>Live Prompt Preview</h2>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-tighter" style={{ color: 'var(--va-text-muted)' }}>Real-time Sync</span>
              </div>
            </div>
            <div className="rounded-2xl p-6 shadow-2xl relative overflow-hidden group" style={{ background: 'hsl(222, 47%, 8%)', border: '1px solid var(--va-border)' }}>
              {/* Code Background Glow */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/10 blur-[100px] pointer-events-none" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--va-border)' }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--va-border)' }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--va-border)' }} />
                  </div>
                  <span className="text-[10px] font-mono uppercase" style={{ color: 'var(--va-text-dim)', fontFamily: 'var(--va-font-mono)' }}>prompt_spec.json</span>
                </div>
                
                <pre className="text-sm overflow-auto max-h-[600px]" style={{ color: 'var(--va-text)', fontFamily: 'var(--va-font-mono)' }}>
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

            <div className="rounded-xl p-4" style={{ background: 'var(--va-surface)', border: '1px solid var(--va-border-light)' }}>
              <div className="flex gap-3">
                <div className="p-2 rounded-lg h-fit" style={{ background: 'var(--va-accent)', color: 'white' }}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-sm font-bold" style={{ color: 'var(--va-text)' }}>Pro Tip</h4>
                  <p className="text-sm leading-relaxed mt-1" style={{ color: 'var(--va-text-muted)' }}>
                    Use this JSON as a system instruction or a direct prompt for Gemini to generate high-fidelity boilerplate code.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 mt-12" style={{ borderTop: '1px solid var(--va-border)' }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2" style={{ color: 'var(--va-text-muted)' }}>
            <Sparkles size={16} />
            <span className="text-sm font-medium">Built for AI Studio Build</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-sm font-bold uppercase tracking-widest transition-colors" style={{ color: 'var(--va-text-muted)' }}>Documentation</a>
            <a href="#" className="text-sm font-bold uppercase tracking-widest transition-colors" style={{ color: 'var(--va-text-muted)' }}>Templates</a>
            <a href="#" className="text-sm font-bold uppercase tracking-widest transition-colors" style={{ color: 'var(--va-text-muted)' }}>Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
