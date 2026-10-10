import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiEdit3,
  FiFileText,
  FiUploadCloud,
  FiCheckCircle,
  FiAlertCircle,
  FiGlobe,
  FiArrowRight,
  FiAward,
  FiBookOpen,
  FiLock,
} from 'react-icons/fi';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import type { Document } from '../types';

export const GeneratePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDocId = searchParams.get('documentId');
  const { showToast } = useToast();
  const { user, loginWithGoogle, isLoggingIn } = useAuth();

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

  // Fetch available documents for the authenticated user only
  useEffect(() => {
    if (user) {
      api.listDocuments(1, 50)
        .then((res) => {
          setDocuments(res.documents);
          if (preselectedDocId && !selectedDocId) {
            setSelectedDocId(preselectedDocId);
            setInputMode('document');
          }
        })
        .catch((err) => console.error('Error fetching documents:', err));
    } else {
      setDocuments([]);
    }
  }, [user, preselectedDocId]);

  // Loading animation progression messages
  const steps = [
    'Parsing content and analyzing curriculum concepts...',
    'Consulting Gemini AI engine for rigorous question formulation...',
    'Synthesizing high-yield MCQs with plausible distractors...',
    'Constructing Bloom-aligned Creative Questions (CQ) with rubrics...',
    'Validating structured assessment data and finalizing...',
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

    if (!user) {
      showToast('Please sign in with Google to generate questions.', 'info');
      try {
        await loginWithGoogle();
      } catch (err: any) {
        if (err?.message) showToast(err.message, 'error');
      }
      return;
    }

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
      showToast('Assessment generated successfully!', 'success');
      navigate(`/sets/${result.id}`);
    } catch (err: any) {
      showToast(err.message || 'Generation failed. Please try again.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const totalQuestions = mcqCount + cqCount;

  return (
    <div className="page-container container">
      <div className="page-header text-center">
        <div className="hero-badge-pill mx-auto">
          <FiAward size={14} className="text-amber" />
          <span>Assessment Studio • Fast & Aligned</span>
        </div>
        <h1 className="page-title">Generate Questions</h1>
        <p className="page-subtitle">
          Configure question formats, difficulty, and source material.
        </p>
      </div>

      {!user && (
        <div
          className="auth-alert-banner glass-panel animate-fade-in"
          style={{
            maxWidth: '820px',
            margin: '0 auto 1.5rem',
            padding: '1.25rem 1.5rem',
            borderRadius: '1rem',
            background: 'linear-gradient(135deg, rgba(22, 62, 54, 0.95), rgba(15, 23, 42, 0.95))',
            border: '1px solid rgba(217, 119, 6, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.25rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '240px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'rgba(217, 119, 6, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
                flexShrink: 0,
              }}
            >
              <FiLock size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#ffffff', fontWeight: 600 }}>
                Sign In Required to Generate
              </h4>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                Your generated questions and uploaded notes remain 100% private to your account.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              try {
                await loginWithGoogle();
                showToast('Signed in successfully!', 'success');
              } catch (err: any) {
                if (err?.message) showToast(err.message, 'error');
              }
            }}
            disabled={isLoggingIn}
          >
            <FiLock size={16} />
            <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
          </button>
        </div>
      )}

      <div className="generate-form-wrapper">
        {isGenerating ? (
          <div className="generation-progress-panel glass-panel animate-fade-in">
            <div className="progress-spinner-container">
              <div className="outer-glow-ring" />
              <FiBookOpen size={48} className="text-cyan progress-center-icon" />
            </div>

            <h3 className="progress-status-heading">Generating Questions</h3>
            <p className="progress-status-sub">Formulating high-quality MCQs and Creative Questions...</p>

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
                      <FiCheckCircle size={16} className="text-emerald" />
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
              <span className="form-section-title">1. Select Source</span>
              <div className="mode-toggle-group">
                <button
                  type="button"
                  className={`mode-toggle-btn ${inputMode === 'topic' ? 'mode-active' : ''}`}
                  onClick={() => setInputMode('topic')}
                >
                  <FiEdit3 size={18} />
                  <div>
                    <span className="mode-title">Topic or Concept</span>
                    <span className="mode-desc">Any subject, concept, or prompt</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`mode-toggle-btn ${inputMode === 'document' ? 'mode-active' : ''}`}
                  onClick={() => setInputMode('document')}
                >
                  <FiFileText size={18} />
                  <div>
                    <span className="mode-title">Uploaded Document</span>
                    <span className="mode-desc">Extract from PDF book or notes</span>
                  </div>
                </button>
              </div>

              {/* Source Inputs */}
              {inputMode === 'topic' ? (
                <div className="form-group mt-4">
                  <label className="form-label">Subject or Topic</label>
                  <input
                    type="text"
                    className="form-input"
                    required={inputMode === 'topic'}
                    placeholder="e.g. Photosynthesis in Plants or Newton's Laws"
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
                      <FiUploadCloud size={14} />
                      <span>Upload PDF</span>
                    </button>
                  </div>

                  {documents.length === 0 ? (
                    <div className="no-docs-alert">
                      <FiAlertCircle size={18} className="text-amber" />
                      <span>No documents found. Please upload a PDF or switch to Topic mode.</span>
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
              <span className="form-section-title">2. Question Counts</span>
              <div className="grid-2-cols quantity-grid">
                <div className="counter-card glass-panel">
                  <div className="counter-header">
                    <div>
                      <span className="counter-title">MCQs</span>
                      <span className="counter-desc">4 options, single correct answer</span>
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
                      <span className="counter-desc">Stem + 4 sub-questions (10 marks)</span>
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
              <span className="form-section-title">3. Settings</span>
              <div className="grid-2-cols">
                {/* Difficulty Selector */}
                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <div className="difficulty-options">
                    <button
                      type="button"
                      className={`difficulty-btn diff-easy ${difficulty === 'easy' ? 'diff-active' : ''}`}
                      onClick={() => setDifficulty('easy')}
                    >
                      <span className="diff-name">Easy</span>
                      <span className="diff-sub">Recall</span>
                    </button>

                    <button
                      type="button"
                      className={`difficulty-btn diff-medium ${difficulty === 'medium' ? 'diff-active' : ''}`}
                      onClick={() => setDifficulty('medium')}
                    >
                      <span className="diff-name">Medium</span>
                      <span className="diff-sub">Standard</span>
                    </button>

                    <button
                      type="button"
                      className={`difficulty-btn diff-hard ${difficulty === 'hard' ? 'diff-active' : ''}`}
                      onClick={() => setDifficulty('hard')}
                    >
                      <span className="diff-name">Hard</span>
                      <span className="diff-sub">Advanced</span>
                    </button>
                  </div>
                </div>

                {/* Language Selector */}
                <div className="form-group">
                  <label className="form-label">
                    <FiGlobe size={16} />
                    <span>Language</span>
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
                  <span className="input-hint">Questions will be generated in this language.</span>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="form-submit-row">
              <button
                type="submit"
                className="btn btn-primary btn-generate-submit"
                disabled={isGenerating || totalQuestions === 0}
              >
                <span>Generate {totalQuestions} Questions</span>
                <FiArrowRight size={18} />
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
