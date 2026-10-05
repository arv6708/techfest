'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Sparkles, 
  RefreshCw, 
  Check, 
  Download,
  AlertTriangle,
  HelpCircle,
  Eye,
  Settings2
} from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ExcelImportWizardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);

  // Step 2 & 3: Sheets and Column data
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [sheetsData, setSheetsData] = useState<Record<string, any>>({});
  const [columns, setColumns] = useState<string[]>([]);
  
  // Mapping configuration
  const [mapping, setMapping] = useState<Record<string, string>>({
    full_name: '',
    email: '',
    phone: '',
    college: '',
    course: '',
    state: '',
    district: '',
    payment_status: '',
    payment_reference: '',
    participant_id: '',
    registration_date: ''
  });

  // Step 4: Preview Data
  const [importMode, setImportMode] = useState<'ADD_NEW_ONLY' | 'UPDATE_EXISTING_ADD_NEW'>('ADD_NEW_ONLY');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Step 5: Execution
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Standard fields definitions
  const standardFields = [
    { key: 'full_name', label: 'Full Name', required: true, desc: 'Participant full name' },
    { key: 'email', label: 'Email Address', required: true, desc: 'Unique contact email' },
    { key: 'phone', label: 'Phone Number', required: true, desc: 'Mobile / WhatsApp number' },
    { key: 'college', label: 'College / Institution', required: false, desc: 'Name of educational institute' },
    { key: 'course', label: 'Department / Course', required: false, desc: 'e.g. CSE, AI & DS, ECE' },
    { key: 'state', label: 'State', required: false, desc: 'State (Default: Kerala)' },
    { key: 'district', label: 'District', required: false, desc: 'District (Default: Kannur)' },
    { key: 'payment_status', label: 'Payment Status', required: false, desc: 'PAID or PENDING' },
    { key: 'payment_reference', label: 'Payment Reference (UTR)', required: false, desc: 'Transaction reference' },
    { key: 'participant_id', label: 'Participant ID (Optional)', required: false, desc: 'Preserves if present, else generates VB26-XXXXX' },
    { key: 'registration_date', label: 'Registration Date / Timestamp', required: false, desc: 'Original signup time' }
  ];

  // 1. File Upload / Parse
  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setParsing(true);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const res = await fetch('/api/import/parse', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to read file');

      setSheetNames(data.sheetNames || []);
      setSheetsData(data.sheetsData || {});
      
      const firstSheet = data.sheetNames[0];
      setSelectedSheet(firstSheet);
      
      if (data.sheetsData[firstSheet]) {
        setColumns(data.sheetsData[firstSheet].columns);
        // Apply detected auto-mapping
        setMapping(prev => ({
          ...prev,
          ...(data.sheetsData[firstSheet].suggestedMapping || {})
        }));
      }

      setCurrentStep(2);
      showToast({ type: 'success', title: 'File Parsed', message: `Detected ${data.sheetNames.length} sheet(s).` });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Parse Failed', message: err.message });
    } finally {
      setParsing(false);
    }
  };

  // Quick Load Initial Sample Dataset
  const handleLoadSampleDataset = async () => {
    setParsing(true);
    try {
      const res = await fetch('/api/import/sample?format=xlsx');
      const blob = await res.blob();
      const sampleFile = new File([blob], 'vibecode_initial_registrations.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      await handleFileUpload(sampleFile);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Error', message: 'Failed to load sample dataset' });
      setParsing(false);
    }
  };

  // Change active sheet
  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (sheetsData[sheetName]) {
      setColumns(sheetsData[sheetName].columns);
      setMapping(prev => ({
        ...prev,
        ...(sheetsData[sheetName].suggestedMapping || {})
      }));
    }
  };

  // 2. Fetch Import Preview (Step 4)
  const handleGeneratePreview = async () => {
    if (!mapping.full_name || !mapping.email) {
      showToast({ type: 'error', title: 'Mapping Incomplete', message: 'Full Name and Email mapping is required.' });
      return;
    }

    setPreviewLoading(true);
    try {
      const activeRows = sheetsData[selectedSheet]?.allRows || [];
      const res = await fetch('/api/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: activeRows,
          mapping,
          mode: importMode
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate preview');

      setPreviewData(data);
      setCurrentStep(4);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Preview Error', message: err.message });
    } finally {
      setPreviewLoading(false);
    }
  };

  // 3. Confirm Import Execution (Step 5)
  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      const activeRows = sheetsData[selectedSheet]?.allRows || [];
      const res = await fetch('/api/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: activeRows,
          mapping,
          mode: importMode,
          fileName,
          registrationSource: 'Excel Import'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm import');

      setImportResult(data.summary);
      setCurrentStep(5);
      showToast({
        type: 'success',
        title: 'Import Successful',
        message: `${data.summary.rowsAdded} participants added to database.`
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Import Failed', message: err.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          Import Registration Excel / CSV
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          5-Step Intelligent Wizard • Auto Column Detection • Duplicate Prevention • Custom Fields Preservation
        </p>
      </div>

      {/* Step Indicator Tracker */}
      <div className="grid grid-cols-5 gap-2 text-center text-xs">
        {[
          { num: 1, label: 'Upload' },
          { num: 2, label: 'Sheets & Columns' },
          { num: 3, label: 'Column Mapping' },
          { num: 4, label: 'Preview & Mode' },
          { num: 5, label: 'Confirmation' }
        ].map(step => (
          <div
            key={step.num}
            className={`p-2.5 rounded-xl border transition-all ${
              currentStep === step.num
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold glow-gold'
                : currentStep > step.num
                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-500'
            }`}
          >
            <div className="text-[10px] uppercase font-mono">Step {step.num}</div>
            <div className="font-semibold truncate">{step.label}</div>
          </div>
        ))}
      </div>

      {/* STEP 1: UPLOAD FILE */}
      {currentStep === 1 && (
        <div className="p-8 sm:p-12 rounded-2xl glass-panel border border-slate-800 text-center space-y-6">
          <div className="max-w-md mx-auto">
            
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4 glow-cyan">
              <UploadCloud className="w-8 h-8 text-cyan-400" />
            </div>

            <h2 className="text-lg font-bold text-white">Select Registration File</h2>
            <p className="text-xs text-slate-400 mt-1">
              Supports <strong className="text-slate-200">.xlsx, .xls, and .csv</strong> files. All columns will be automatically detected and mapped.
            </p>

            {/* Drag & Drop Input */}
            <label className="mt-6 flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl cursor-pointer bg-[#080d21]/60 hover:bg-[#080d21] transition-all">
              <FileSpreadsheet className="w-10 h-10 text-slate-500 mb-2" />
              <span className="text-xs font-semibold text-slate-200">
                {file ? file.name : 'Click to browse or drag & drop file'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">Maximum 25MB file size</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                disabled={parsing}
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
            </label>

            {/* Quick Demo Pre-seed Button */}
            <div className="pt-6 border-t border-slate-800/80 mt-6 flex flex-col gap-2">
              <span className="text-[11px] text-slate-500">Quick Test Options</span>
              <button
                type="button"
                onClick={handleLoadSampleDataset}
                disabled={parsing}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/60 transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Load Initial VibeCode Dataset (vibecode_initial_registrations.xlsx)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* STEP 2: READ SHEETS AND COLUMNS */}
      {currentStep === 2 && (
        <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-mono text-cyan-400">Step 2 of 5</span>
              <h2 className="text-lg font-bold text-white">Detected Sheets & Structure</h2>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
              File: {fileName}
            </span>
          </div>

          {/* Sheet Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Sheet to Import:
            </label>
            <div className="flex gap-2 flex-wrap">
              {sheetNames.map(sheet => (
                <button
                  key={sheet}
                  type="button"
                  onClick={() => handleSheetChange(sheet)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedSheet === sheet
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {sheet} ({sheetsData[sheet]?.totalRows || 0} rows)
                </button>
              ))}
            </div>
          </div>

          {/* Detected Columns Pills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300">
                Detected Columns ({columns.length} columns found):
              </label>
            </div>
            <div className="p-4 rounded-xl bg-[#080d21] border border-slate-800 flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {columns.map(col => (
                <span
                  key={col}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 text-cyan-300 border border-slate-700/80 font-mono text-xs"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>

          {/* Sample Rows Preview */}
          {sheetsData[selectedSheet]?.sampleRows?.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                First 3 Sample Rows from Excel:
              </label>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900 text-slate-400">
                    <tr>
                      {columns.slice(0, 6).map(c => (
                        <th key={c} className="p-2 truncate max-w-[150px]">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {sheetsData[selectedSheet].sampleRows.slice(0, 3).map((r: any, idx: number) => (
                      <tr key={idx}>
                        {columns.slice(0, 6).map(c => (
                          <td key={c} className="p-2 truncate max-w-[150px]">{String(r[c] || '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-between items-center">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Choose Another File</span>
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 glow-blue transition-all flex items-center gap-2"
            >
              <span>Proceed to Column Mapping</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: COLUMN MAPPING SCREEN */}
      {currentStep === 3 && (
        <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-mono text-cyan-400">Step 3 of 5</span>
              <h2 className="text-lg font-bold text-white">Map Excel Columns to Database Fields</h2>
            </div>
            <span className="text-xs text-slate-400">
              Unmapped columns are automatically saved into <strong className="text-cyan-300">custom_fields</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {standardFields.map(field => {
              const selectedCol = mapping[field.key] || '';

              return (
                <div key={field.key} className="p-3.5 rounded-xl bg-[#080d21] border border-slate-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{field.label}</span>
                      {field.required && <span className="text-rose-400">*</span>}
                    </label>
                    <span className="text-[10px] text-slate-500">{field.desc}</span>
                  </div>

                  <select
                    value={selectedCol}
                    onChange={e => setMapping({ ...mapping, [field.key]: e.target.value })}
                    className={`w-full rounded-lg px-3 py-2 text-xs outline-none transition-colors ${
                      selectedCol
                        ? 'bg-slate-900 border border-cyan-500/50 text-cyan-300 font-medium'
                        : 'bg-slate-900/60 border border-slate-800 text-slate-500'
                    }`}
                  >
                    <option value="">-- Do Not Map (Save as Custom Field) --</option>
                    {columns.map(c => (
                      <option key={c} value={c}>
                        Excel Column: "{c}"
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Structure</span>
            </button>
            <button
              onClick={handleGeneratePreview}
              disabled={previewLoading || !mapping.full_name || !mapping.email}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 glow-blue transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {previewLoading ? (
                <span>Analyzing Rows & Duplicates...</span>
              ) : (
                <>
                  <span>Generate Import Preview</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: IMPORT PREVIEW & MODE */}
      {currentStep === 4 && previewData && (
        <div className="p-6 sm:p-8 rounded-2xl glass-panel border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-mono text-cyan-400">Step 4 of 5</span>
              <h2 className="text-lg font-bold text-white">Import Preview & Duplicate Handling</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total Rows: {previewData.totalRows}
            </span>
          </div>

          {/* 4 Summary Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Rows</span>
              <span className="text-2xl font-mono font-black text-white">{previewData.totalRows}</span>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">New Participants</span>
              <span className="text-2xl font-mono font-black">{previewData.newCount}</span>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Existing in Database</span>
              <span className="text-2xl font-mono font-black">{previewData.duplicateCount}</span>
              <span className="text-[10px] text-amber-400/80 block mt-0.5">Will NOT be added again</span>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300">
              <span className="text-[10px] uppercase font-bold text-rose-400 block">Invalid Rows</span>
              <span className="text-2xl font-mono font-black">{previewData.invalidCount}</span>
            </div>
          </div>

          {/* Duplicate Notice Banner */}
          {previewData.duplicateCount > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-700/50 text-amber-200 text-xs flex items-center gap-3">
              <span className="text-lg">ℹ️</span>
              <div>
                <span className="font-semibold">{previewData.duplicateCount} participant(s) already exist in the database.</span>
                <span className="text-amber-300/80 block text-[11px]">
                  {importMode === 'ADD_NEW_ONLY' 
                    ? 'In "ADD NEW ONLY" mode, once-added participants are strictly preserved and will NOT be added again.' 
                    : 'In "UPDATE EXISTING" mode, existing records will be updated with new Excel details without creating duplicate rows.'}
                </span>
              </div>
            </div>
          )}

          {/* Import Mode Selector */}
          <div className="p-4 rounded-xl bg-[#080d21] border border-cyan-500/30 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 block">
              Choose Import Mode:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              
              <label className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                importMode === 'ADD_NEW_ONLY'
                  ? 'bg-blue-950/60 border-blue-500 text-white'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'ADD_NEW_ONLY'}
                  onChange={() => setImportMode('ADD_NEW_ONLY')}
                  className="mt-1"
                />
                <div>
                  <span className="font-bold block">[ADD NEW ONLY]</span>
                  <span className="text-[11px] text-slate-300 mt-0.5 block">
                    Safely adds only new participants. Any participant once added in the database (matching Participant ID, Email, Phone, or Name) will never be added again.
                  </span>
                </div>
              </label>

              <label className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                importMode === 'UPDATE_EXISTING_ADD_NEW'
                  ? 'bg-amber-950/60 border-amber-500 text-white'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400'
              }`}>
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'UPDATE_EXISTING_ADD_NEW'}
                  onChange={() => setImportMode('UPDATE_EXISTING_ADD_NEW')}
                  className="mt-1"
                />
                <div>
                  <span className="font-bold block">[UPDATE EXISTING + ADD NEW]</span>
                  <span className="text-[11px] text-slate-300 mt-0.5 block">
                    Updates existing records with latest Excel details (preserving custom fields) and inserts all new participants without duplicate entries.
                  </span>
                </div>
              </label>

            </div>
          </div>

          {/* Row Preview Table */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">
              Sample Verification Table (showing up to 50 rows):
            </span>

            <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 sticky top-0">
                  <tr>
                    <th className="p-2.5">Row</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Email</th>
                    <th className="p-2.5">Phone</th>
                    <th className="p-2.5">College</th>
                    <th className="p-2.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 text-[11px]">
                  {previewData.previewRows.map((r: any) => (
                    <tr key={r.rowNumber} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-mono text-slate-500">{r.rowNumber}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'NEW' 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : r.status === 'DUPLICATE'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-2.5 font-semibold text-white">{r.mappedData.full_name || '—'}</td>
                      <td className="p-2.5 font-mono">{r.mappedData.email || '—'}</td>
                      <td className="p-2.5 font-mono">{r.mappedData.phone || '—'}</td>
                      <td className="p-2.5 truncate max-w-[180px]">{r.mappedData.college}</td>
                      <td className="p-2.5 text-slate-400">
                        {r.status === 'DUPLICATE' && (
                          <span className="text-amber-400 font-medium">
                            {r.existingRecord 
                              ? `Already in DB (${r.existingRecord.participant_id} - ${r.existingRecord.full_name}${r.matchedBy ? `, matched by ${r.matchedBy}` : ''})` 
                              : `Duplicate in sheet (${r.matchedBy ? `matched by ${r.matchedBy}` : ''})`}
                          </span>
                        )}
                        {r.status === 'NEW' && <span className="text-emerald-400">Ready to add</span>}
                        {r.validationErrors?.length > 0 && (
                          <span className="text-rose-400">{r.validationErrors.join(', ')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-slate-800">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Mapping</span>
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={importing}
              className="px-8 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-xl glow-blue transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {importing ? (
                <span>Writing to Database...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm and Execute Import</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: CONFIRMATION & SUMMARY */}
      {currentStep === 5 && importResult && (
        <div className="p-8 sm:p-12 rounded-2xl glass-panel-elevated glow-cyan border border-cyan-500/40 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-cyan-400" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white">Import Complete!</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
            All records have been committed to the live database with preserved custom columns and unique IDs.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto my-6 text-left">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Processed</span>
              <span className="text-2xl font-mono font-bold text-white">{importResult.totalProcessed}</span>
            </div>
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Added</span>
              <span className="text-2xl font-mono font-bold text-emerald-300">{importResult.rowsAdded}</span>
            </div>
            <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800">
              <span className="text-[10px] uppercase font-bold text-blue-400 block">Updated</span>
              <span className="text-2xl font-mono font-bold text-blue-300">{importResult.rowsUpdated}</span>
            </div>
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Duplicates Skipped</span>
              <span className="text-2xl font-mono font-bold text-amber-300">{importResult.duplicatesSkipped}</span>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Link
              href="/admin"
              className="px-6 py-3 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-500 glow-blue transition-all"
            >
              Open Admin Table
            </Link>
            <button
              onClick={() => {
                setFile(null);
                setCurrentStep(1);
              }}
              className="px-6 py-3 rounded-xl font-semibold text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700"
            >
              Import Another File
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
