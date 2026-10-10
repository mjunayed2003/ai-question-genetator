import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  FileText,
  Type,
  CheckCircle2,
  Upload,
  AlertCircle,
  BrainCircuit,
  Languages,
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import type { Document } from '../types';

export const GeneratePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDocId = searchParams.get('documentId');
  const { showToast } = useToast();

  const [inputMode, setInputMode] = useState<'topic' | 'document'>(
    preselectedDocId ? 'document' : 'topic',
  );
  const [topic, setTopic] = useState('');
  const [selectedDocId, setSelectedDocId] = useState(preselectedDocId || '');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [mcqCount, setMcqCount] = useState<number>(5);
  const [cqCount, setCqCount] = useState<number>(2);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [language, setLanguage] = useState<string>('English');

  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);

  // Fetch available documents
  useEffect(() => {
    api.listDocuments(1, 50)
      .then((res) => {
        setDocuments(res.documents);
        if (preselectedDocId && !selectedDocId) {
          setSelectedDocId(preselectedDocId);
          setInputMode('document');
        }
      })
      .catch((err) => console.error('Error fetching documents:', err));
  }, [preselectedDocId]);

  // Loading animation progression messages
  const steps = [
    'Parsing content and analyzing curriculum concepts...',
    'Consulting Google Gemini AI for contextual question design...',
    'Formulating high-quality MCQs with logical distractor options...',
    'Synthesizing Bloom taxonomy-aligned Creative Questions (CQ)...',
    'Validating JSON structures and saving to PostgreSQL...',
  ];

  useEffect(() => {
    let timer: any;
    if (isGenerating) {
      setGenerationStep(0);
      timer = setInterval(() => {
        setGenerationStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (inputMode === 'topic' && !topic.trim()) {
      showToast('Please enter a topic or concept to generate questions.', 'error');
      return;
    }

    if (inputMode === 'document' && !selectedDocId) {
      showToast('Please select an uploaded document.', 'error');
      return;
    }

    if (mcqCount === 0 && cqCount === 0) {
      showToast('Please select at least 1 MCQ or 1 CQ to generate.', 'error');
      return;
    }

    try {
      setIsGenerating(true);
      const payload = {
        documentId: inputMode === 'document' ? selectedDocId : undefined,
        topic: inputMode === 'topic' ? topic.trim() : undefined,
        mcqCount: Number(mcqCount),
        cqCount: Number(cqCount),
        difficulty,
        language,
      };

      const result = await api.generateQuestionSet(payload);
      showToast('Questions generated successfully!', 'success');
      navigate(`/sets/${result.id}`);
    } catch (err: any) {
      showToast(err.message || 'Generation failed. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="page-container container">
      <div className="page-header text-center">
        <div className="page-badge mx-auto">
          <Sparkles size={14} className="text-cyan" />
          <span>Interactive AI Studio</span>
        </div>
        <h1 className="page-title">Generate Question Set</h1>
        <p className="page-subtitle">
          Configure question types, difficulty, and source material for your assessment.
        </p>
      </div>

      <div className="generate-form-wrapper">
        {isGenerating ? (
          <div className="generation-progress-panel glass-panel animate-fade-in">
            <div className="progress-spinner-container">
              <div className="outer-glow-ring" />
              <BrainCircuit size={48} className="text-cyan progress-center-icon" />
            </div>

            <h3 className="progress-status-heading">Gemini AI is crafting your question set</h3>
            <p className="progress-status-sub">This usually takes 8 to 20 seconds depending on question counts</p>

            <div className="progress-steps-list">
              {steps.map((st, idx) => (
                <div
                  key={idx}
                  className={`progress-step-item ${
                    idx < generationStep
                      ? 'step-done'
                      : idx === generationStep
                      ? 'step-active'
                      : 'step-pending'
                  }`}
                >
                  <div className="step-indicator">
                    {idx < generationStep ? (
                      <CheckCircle2 size={16} className="text-emerald" />
                    ) : (
                      <span className="step-number">{idx + 1}</span>
                    )}
                  </div>
                  <span className="step-text">{st}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-panel form-card">
            {/* Input Mode Selector */}
            <div className="source-selector-section">
              <span className="form-section-title">1. Choose Content Source</span>
              <div className="mode-toggle-group">
                <button
                  type="button"
                  className={`mode-toggle-btn ${inputMode === 'topic' ? 'mode-active' : ''}`}
                  onClick={() => setInputMode('topic')}
                >
                  <Type size={18} />
                  <div>
                    <span className="mode-title">By Topic or Syllabus</span>
                    <span className="mode-desc">Specify any subject, concept, or prompt</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`mode-toggle-btn ${inputMode === 'document' ? 'mode-active' : ''}`}
                  onClick={() => setInputMode('document')}
                >
                  <FileText size={18} />
                  <div>
                    <span className="mode-title">From Uploaded Document</span>
                    <span className="mode-desc">Extract from PDF textbook or lecture notes</span>
                  </div>
                </button>
              </div>

              {/* Source Inputs */}
              {inputMode === 'topic' ? (
                <div className="form-group mt-4">
                  <label className="form-label">Topic or Subject Area</label>
                  <input
                    type="text"
                    className="form-input"
                    required={inputMode === 'topic'}
                    placeholder="e.g. Photosynthesis & Cellular Respiration in Plants"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                  <span className="input-hint">Tip: Be descriptive for more targeted questions.</span>
                </div>
              ) : (
                <div className="form-group mt-4">
                  <div className="label-with-action">
                    <label className="form-label">Select Document</label>
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => setIsUploading(true)}
                    >
                      <Upload size={14} />
                      <span>Upload New File</span>
                    </button>
                  </div>

                  {documents.length === 0 ? (
                    <div className="no-docs-alert">
                      <AlertCircle size={18} className="text-amber" />
                      <span>No documents found. Please upload a PDF first or switch to Topic mode.</span>
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      required={inputMode === 'document'}
                      value={selectedDocId}
                      onChange={(e) => setSelectedDocId(e.target.value)}
                    >
                      <option value="">-- Choose an uploaded document --</option>
                      {documents.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.originalName} ({(doc.fileSize / (1024 * 1024)).toFixed(2)} MB)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            <div className="divider-hr" />

            {/* Question Counts Section */}
            <div className="counts-section">
              <span className="form-section-title">2. Question Quantities</span>
              <div className="grid-2-cols">
                <div className="counter-card glass-panel">
                  <div className="counter-header">
                    <div>
                      <span className="counter-title">Multiple Choice Questions (MCQ)</span>
                      <span className="counter-desc">4 Options with 1 correct answer</span>
                    </div>
                    <span className="counter-pill">{mcqCount}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    className="slider-input"
                    value={mcqCount}
                    onChange={(e) => setMcqCount(parseInt(e.target.value, 10))}
                  />
                  <div className="slider-ticks">
                    <span>0</span>
                    <span>5</span>
                    <span>10</span>
                    <span>15</span>
                    <span>20</span>
                  </div>
                </div>

                <div className="counter-card glass-panel">
                  <div className="counter-header">
                    <div>
                      <span className="counter-title">Creative Questions (CQ)</span>
                      <span className="counter-desc">Stimulus + 4 sub-questions (10 marks)</span>
                    </div>
                    <span className="counter-pill">{cqCount}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    className="slider-input"
                    value={cqCount}
                    onChange={(e) => setCqCount(parseInt(e.target.value, 10))}
                  />
                  <div className="slider-ticks">
                    <span>0</span>
                    <span>2</span>
                    <span>5</span>
                    <span>8</span>
                    <span>10</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="divider-hr" />

            {/* Parameters Section (Difficulty & Language) */}
            <div className="parameters-section">
              <span className="form-section-title">3. Assessment Settings</span>
              <div className="grid-2-cols">
                {/* Difficulty Selector */}
                <div className="form-group">
                  <label className="form-label">Difficulty Level</label>
                  <div className="difficulty-options">
                    <button
                      type="button"
                      className={`difficulty-btn diff-easy ${difficulty === 'easy' ? 'diff-active' : ''}`}
                      onClick={() => setDifficulty('easy')}
                    >
                      <span className="diff-name">Easy</span>
                      <span className="diff-sub">Fundamental recall</span>
                    </button>

                    <button
                      type="button"
                      className={`difficulty-btn diff-medium ${difficulty === 'medium' ? 'diff-active' : ''}`}
                      onClick={() => setDifficulty('medium')}
                    >
                      <span className="diff-name">Medium</span>
                      <span className="diff-sub">Standard exam rigor</span>
                    </button>

                    <button
                      type="button"
                      className={`difficulty-btn diff-hard ${difficulty === 'hard' ? 'diff-active' : ''}`}
                      onClick={() => setDifficulty('hard')}
                    >
                      <span className="diff-name">Hard</span>
                      <span className="diff-sub">Complex critical thinking</span>
                    </button>
                  </div>
                </div>

                {/* Language Selector */}
                <div className="form-group">
                  <label className="form-label">
                    <Languages size={16} />
                    <span>Output Language</span>
                  </label>
                  <select
                    className="form-select"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="English">English</option>
                    <option value="Bengali">Bengali (বাংলা)</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="French">French (Français)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="Arabic">Arabic (العربية)</option>
                  </select>
                  <span className="input-hint">The AI will generate all questions in this language.</span>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="form-submit-row">
              <button
                type="submit"
                className="btn btn-primary btn-generate-submit"
                disabled={isGenerating || (mcqCount === 0 && cqCount === 0)}
              >
                <Sparkles size={20} />
                <span>Generate {mcqCount + cqCount} Questions with AI</span>
              </button>
            </div>
          </form>
        )}
      </div>

      <DocumentUploadModal
        isOpen={isUploading}
        onClose={() => setIsUploading(false)}
        onSuccess={(newDoc) => {
          setDocuments((prev) => [newDoc, ...prev]);
          setSelectedDocId(newDoc.id);
          setInputMode('document');
        }}
      />
    </div>
  );
};
