import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  FileText,
  Upload,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lock,
} from 'lucide-react';
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
      {/* Hero Welcome Section */}
      <section className="dashboard-hero glass-panel">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="text-cyan" />
            <span>
              {user ? `Private Workspace • ${user.email}` : 'AI-Powered Curriculum Intelligence'}
            </span>
          </div>
          <h1 className="hero-title">
            {user ? (
              <>
                Welcome back, <span className="text-gradient">{user.displayName || 'Scholar'}</span>
              </>
            ) : (
              <>
                Generate High-Yield <span className="text-gradient">Exam Questions</span> Instantly
              </>
            )}
          </h1>
          <p className="hero-subtitle">
            {user
              ? 'Your uploaded documents and generated question sets are private to your Gmail account. Only you can view and edit them.'
              : 'Upload course materials or specify any topic to create structured MCQs and Creative Questions aligned with Bloom\'s taxonomy.'}
          </p>

          <div className="hero-cta-group">
            <Link to="/generate" className="btn btn-primary">
              <Sparkles size={18} />
              <span>Launch Generator Studio</span>
            </Link>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Upload size={18} />
              <span>Upload Documents</span>
            </button>
            {!user && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDirectGoogleLogin}
                disabled={isLoggingIn}
              >
                <Lock size={16} />
                <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper stat-icon-indigo">
            <Layers size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{isLoading ? '...' : stats.setsCount}</span>
            <span className="stat-label">Question Sets</span>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper stat-icon-emerald">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{isLoading ? '...' : stats.mcqCount}</span>
            <span className="stat-label">MCQs Generated</span>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper stat-icon-purple">
            <BookOpen size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{isLoading ? '...' : stats.cqCount}</span>
            <span className="stat-label">CQs Generated</span>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper stat-icon-cyan">
            <FileText size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{isLoading ? '...' : stats.docsCount}</span>
            <span className="stat-label">Study Documents</span>
          </div>
        </div>
      </section>

      {/* Split Columns: Recent Sets & Recent Documents */}
      <div className="dashboard-split-layout">
        {/* Recent Question Sets */}
        <div className="split-column glass-panel">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recent Question Sets</h2>
              <p className="section-subtitle">Latest question sets crafted by AI</p>
            </div>
            <Link to="/sets" className="link-more">
              <span>View All</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="recent-list">
            {isLoading ? (
              <div className="loading-state">Loading question sets...</div>
            ) : recentSets.length === 0 ? (
              <div className="empty-state">
                <Layers size={36} className="text-dim" />
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
                  <ArrowRight size={18} className="recent-item-arrow" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="split-column glass-panel">
          <div className="section-header">
            <div>
              <h2 className="section-title">Study Materials</h2>
              <p className="section-subtitle">Uploaded PDFs and textbooks</p>
            </div>
            <Link to="/documents" className="link-more">
              <span>View All</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="recent-list">
            {isLoading ? (
              <div className="loading-state">Loading documents...</div>
            ) : recentDocs.length === 0 ? (
              <div className="empty-state">
                <FileText size={36} className="text-dim" />
                <p>No study materials uploaded yet.</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  Upload Material
                </button>
              </div>
            ) : (
              recentDocs.map((doc) => (
                <div key={doc.id} className="recent-doc-row">
                  <div className="doc-icon-box">
                    <FileText size={18} className="text-cyan" />
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
                    <Sparkles size={14} className="text-cyan" />
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
