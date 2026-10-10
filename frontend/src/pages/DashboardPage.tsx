import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiLayers,
  FiFileText,
  FiUploadCloud,
  FiArrowRight,
  FiBookOpen,
  FiCheckCircle,
  FiLock,
  FiAward,
  FiDownload,
  FiShield,
  FiSliders,
} from 'react-icons/fi';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import type { Document, QuestionSet } from '../types';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    setsCount: 0,
    mcqCount: 0,
    cqCount: 0,
    docsCount: 0,
  });
  const [recentSets, setRecentSets] = useState<QuestionSet[]>([]);
  const [recentDocs, setRecentDocs] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { user, loginWithGoogle, isLoggingIn, isFirebaseConfigured, openLoginModal } = useAuth();
  const { showToast } = useToast();

  const handleDirectGoogleLogin = async () => {
    if (!isFirebaseConfigured) {
      showToast('Firebase .env setup required. Please configure credentials.', 'info');
      openLoginModal();
      return;
    }

    try {
      await loginWithGoogle();
      showToast('Successfully signed in with Google!', 'success');
    } catch (err: any) {
      if (err.message) {
        showToast(err.message, 'error');
      }
    }
  };

  const fetchData = async () => {
    if (!user) {
      setStats({
        setsCount: 0,
        mcqCount: 0,
        cqCount: 0,
        docsCount: 0,
      });
      setRecentSets([]);
      setRecentDocs([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [setsData, docsData] = await Promise.all([
        api.listQuestionSets(1, 6),
        api.listDocuments(1, 5),
      ]);

      const totalSets = setsData.pagination.total;
      const totalDocs = docsData.pagination.total;

      let totalMcqs = 0;
      let totalCqs = 0;

      setsData.questionSets.forEach((s) => {
        totalMcqs += s._count?.mcqs ?? s.mcqCount ?? 0;
        totalCqs += s._count?.cqs ?? s.cqCount ?? 0;
      });

      setStats({
        setsCount: totalSets,
        mcqCount: totalMcqs,
        cqCount: totalCqs,
        docsCount: totalDocs,
      });

      setRecentSets(setsData.questionSets);
      setRecentDocs(docsData.documents);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const getDifficultyBadge = (diff: string) => {
    const d = (diff || '').toLowerCase();
    if (d === 'easy') return 'badge badge-easy';
    if (d === 'hard') return 'badge-hard';
    return 'badge badge-medium';
  };

  return (
    <div className="page-container container">
      {/* Hero Welcome Section - 2-Row Design (Row 1: Content + Photo, Row 2: Full Width Highlights) */}
      <section className="dashboard-hero-card glass-panel">
        <div className="hero-main-row">
          <div className="hero-content-col">
            <div className="hero-badge-pill">
              <FiAward size={14} className="text-amber" />
              <span>
                {user
                  ? `Workspace • ${user.displayName || user.email}`
                  : 'Verified Questions • Instant Export'}
              </span>
            </div>

            <h1 className="hero-title-main">
              Create Exam Papers in Seconds.
            </h1>

            <p className="hero-subtitle-main">
              Turn syllabus topics and PDF notes into verified MCQs and Creative Questions aligned with Bloom's taxonomy.
            </p>

            <div className="hero-cta-group">
              <Link to="/generate" className="btn btn-primary">
                <span>Create Questions</span>
                <FiArrowRight size={17} />
              </Link>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (!user) {
                    handleDirectGoogleLogin();
                  } else {
                    setIsUploadModalOpen(true);
                  }
                }}
              >
                <FiUploadCloud size={17} />
                <span>Upload PDF</span>
              </button>

              {!user && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleDirectGoogleLogin}
                  disabled={isLoggingIn}
                >
                  <FiLock size={16} />
                  <span>{isLoggingIn ? 'Connecting...' : 'Google Sign In'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Hero Visual Card matching Image 2 */}
          <div className="hero-image-col">
            <div className="hero-img-card">
              <img
                src="/hero-study.jpg"
                alt="ExamGen Study Workspace"
                loading="lazy"
              />
              <div className="hero-badge-overlay">
                <span>Assessment Studio ⭐</span>
              </div>
              <div className="hero-badge-bottom">
                <FiCheckCircle size={15} />
                <span>Curriculum Aligned</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Trust Bar - Full width row across entire card */}
        <div className="hero-feature-bar">
          <div className="feature-pill-item">
            <div className="feature-pill-icon mint">
              <FiFileText />
            </div>
            <div className="feature-pill-text">
              <strong>PDF & Notes</strong>
              <span>Extract from books</span>
            </div>
          </div>

          <div className="feature-pill-item">
            <div className="feature-pill-icon amber">
              <FiCheckCircle />
            </div>
            <div className="feature-pill-text">
              <strong>Bloom's Taxonomy</strong>
              <span>Standard rubrics</span>
            </div>
          </div>

          <div className="feature-pill-item">
            <div className="feature-pill-icon emerald">
              <FiShield />
            </div>
            <div className="feature-pill-text">
              <strong>Private Cloud</strong>
              <span>Secure storage</span>
            </div>
          </div>

          <div className="feature-pill-item">
            <div className="feature-pill-icon blue">
              <FiDownload />
            </div>
            <div className="feature-pill-text">
              <strong>Instant Export</strong>
              <span>Print PDF & Word</span>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Row - Balanced 4 Columns */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-indigo">
            <FiLayers size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{isLoading ? '...' : stats.setsCount}</span>
            <span className="stat-label">Total Sets</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-emerald">
            <FiCheckCircle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{isLoading ? '...' : stats.mcqCount}</span>
            <span className="stat-label">MCQs</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-purple">
            <FiBookOpen size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{isLoading ? '...' : stats.cqCount}</span>
            <span className="stat-label">Creative Questions</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-cyan">
            <FiFileText size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{isLoading ? '...' : stats.docsCount}</span>
            <span className="stat-label">Documents</span>
          </div>
        </div>
      </section>

      {/* Split Columns: Recent Sets & Recent Documents (1fr 1fr) */}
      <div className="dashboard-split-layout">
        {/* Recent Question Sets */}
        <div className="split-column glass-panel">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recent Sets</h2>
              <p className="section-subtitle">Latest generated question papers</p>
            </div>
            <Link to="/sets" className="link-more">
              <span>View All</span>
              <FiArrowRight size={15} />
            </Link>
          </div>

          <div className="recent-list">
            {isLoading ? (
              <div className="loading-state">Loading question sets...</div>
            ) : !user ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <FiLock size={32} className="text-amber" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
                  Private Question Sets
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                  Sign in with Google to view and manage your generated assessments.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleDirectGoogleLogin}
                  disabled={isLoggingIn}
                >
                  <FiLock size={14} />
                  <span>Sign In with Google</span>
                </button>
              </div>
            ) : recentSets.length === 0 ? (
              <div className="empty-state">
                <FiLayers size={36} className="text-dim" />
                <p>No question sets generated yet.</p>
                <Link to="/generate" className="btn btn-primary btn-sm">
                  Create First Set
                </Link>
              </div>
            ) : (
              recentSets.map((set) => (
                <Link
                  key={set.id}
                  to={`/sets/${set.id}`}
                  className="recent-item-card"
                >
                  <div className="recent-item-main">
                    <h3 className="recent-item-title">{set.topic || 'Untitled Set'}</h3>
                    <div className="recent-item-meta">
                      <span className={getDifficultyBadge(set.difficulty)}>
                        {set.difficulty}
                      </span>
                      <span className="meta-pill">
                        {set.mcqCount} MCQs • {set.cqCount} CQs
                      </span>
                      <span className="meta-pill text-dim">
                        {new Date(set.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <FiArrowRight size={18} className="recent-item-arrow" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="split-column glass-panel">
          <div className="section-header">
            <div>
              <h2 className="section-title">Documents</h2>
              <p className="section-subtitle">Uploaded PDF books and study notes</p>
            </div>
            <Link to="/documents" className="link-more">
              <span>View All</span>
              <FiArrowRight size={15} />
            </Link>
          </div>

          <div className="recent-list">
            {isLoading ? (
              <div className="loading-state">Loading documents...</div>
            ) : !user ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <FiLock size={32} className="text-amber" style={{ margin: '0 auto 0.75rem' }} />
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
                  Private Documents
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 1rem' }}>
                  Sign in with Google to view and upload study materials securely.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleDirectGoogleLogin}
                  disabled={isLoggingIn}
                >
                  <FiLock size={14} />
                  <span>Sign In with Google</span>
                </button>
              </div>
            ) : recentDocs.length === 0 ? (
              <div className="empty-state">
                <FiFileText size={36} className="text-dim" />
                <p>No documents uploaded yet.</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  Upload PDF
                </button>
              </div>
            ) : (
              recentDocs.map((doc) => (
                <div key={doc.id} className="recent-doc-row">
                  <div className="doc-icon-box">
                    <FiFileText size={18} className="text-cyan" />
                  </div>
                  <div className="doc-details">
                    <span className="doc-name" title={doc.originalName}>
                      {doc.originalName}
                    </span>
                    <span className="doc-meta-sub">
                      {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB • {doc.status}
                    </span>
                  </div>
                  <Link
                    to={`/generate?documentId=${doc.id}`}
                    className="btn btn-secondary btn-sm"
                    title="Generate questions from this document"
                  >
                    <FiSliders size={14} />
                    <span>Generate</span>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => fetchData()}
      />
    </div>
  );
};
