import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiLayers,
  FiSearch,
  FiFilter,
  FiPlus,
  FiFileText,
  FiCalendar,
  FiTrash2,
  FiArrowRight,
  FiDownload,
  FiLock,
} from 'react-icons/fi';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { ExportModal } from '../components/ExportModal';
import type { QuestionSet } from '../types';

export const QuestionSetsPage: React.FC = () => {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { showToast } = useToast();
  const { user, loginWithGoogle, isLoggingIn } = useAuth();

  // Modals state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exportData, setExportData] = useState<{ title: string; text: string } | null>(null);

  const fetchQuestionSets = async (targetPage = 1) => {
    if (!user) {
      setSets([]);
      setTotalPages(1);
      setPage(1);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.listQuestionSets(targetPage, 24);
      setSets(res.questionSets);
      setTotalPages(res.pagination.totalPages || 1);
      setPage(res.pagination.page);
    } catch (err: any) {
      showToast(err.message || 'Failed to load question sets', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionSets(1);
  }, [user]);

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      setIsDeleting(true);
      await api.deleteQuestionSet(deleteTargetId);
      showToast('Question set deleted successfully', 'success');
      setSets((prev) => prev.filter((s) => s.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete question set', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickExport = async (e: React.MouseEvent, id: string, topic: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await api.exportQuestionSet(id);
      setExportData({ title: topic, text: res.exportText });
    } catch (err: any) {
      showToast(err.message || 'Failed to export question set', 'error');
    }
  };

  const filteredSets = sets.filter((s) => {
    const matchesQuery =
      !searchQuery ||
      (s.topic && s.topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.document?.originalName && s.document.originalName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDiff =
      difficultyFilter === 'all' ||
      (s.difficulty && s.difficulty.toLowerCase() === difficultyFilter.toLowerCase());

    return matchesQuery && matchesDiff;
  });

  const getDifficultyBadge = (diff: string) => {
    const d = (diff || '').toLowerCase();
    if (d === 'easy') return 'badge badge-easy';
    if (d === 'hard') return 'badge-hard';
    return 'badge badge-medium';
  };

  return (
    <div className="page-container container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Question Sets</h1>
          <p className="page-subtitle">
            {user
              ? `Workspace for ${user.email} • Private question sets`
              : 'Browse, practice, and export your private question sets.'}
          </p>
        </div>
        <Link to="/generate" className="btn btn-primary">
          <FiPlus size={17} />
          <span>New Set</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar-row glass-panel">
        <div className="search-input-wrapper">
          <FiSearch size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search sets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <FiFilter size={16} className="text-dim" />
          <select
            className="filter-select"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Question Sets Grid */}
      {isLoading ? (
        <div className="loading-state-box">
          <span className="loading-spinner-lg" />
          <p>Loading question sets...</p>
        </div>
      ) : !user ? (
        <div className="empty-state-card glass-panel animate-fade-in" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'rgba(217, 119, 6, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              color: '#d97706',
            }}
          >
            <FiLock size={26} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
            Private Assessment Workspace
          </h3>
          <p style={{ maxWidth: '460px', margin: '0 auto 1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Each user's question sets are completely isolated and confidential. Please sign in with Google to view and manage your questions.
          </p>
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
      ) : filteredSets.length === 0 ? (
        <div className="empty-state-card glass-panel">
          <FiLayers size={48} className="text-dim" />
          <h3>No Sets Found</h3>
          <p>
            {searchQuery || difficultyFilter !== 'all'
              ? 'Try adjusting your filters or search keywords.'
              : 'Create your very first question set.'}
          </p>
          <Link to="/generate" className="btn btn-primary mt-3">
            <FiPlus size={16} />
            <span>Create First Set</span>
          </Link>
        </div>
      ) : (
        <div className="sets-grid">
          {filteredSets.map((set) => {
            const mcqsCount = set._count?.mcqs ?? set.mcqCount ?? 0;
            const cqsCount = set._count?.cqs ?? set.cqCount ?? 0;

            return (
              <div key={set.id} className="set-card glass-panel">
                <div className="set-card-top">
                  <span className={getDifficultyBadge(set.difficulty)}>
                    {set.difficulty}
                  </span>
                  <div className="set-card-actions">
                    <button
                      type="button"
                      className="card-quick-btn"
                      title="Export formatted text"
                      onClick={(e) => handleQuickExport(e, set.id, set.topic || 'Question Set')}
                    >
                      <FiDownload size={15} />
                    </button>
                    <button
                      type="button"
                      className="card-quick-btn text-rose"
                      title="Delete question set"
                      onClick={() => setDeleteTargetId(set.id)}
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </div>
                </div>

                <Link to={`/sets/${set.id}`} className="set-card-body">
                  <h3 className="set-card-title">{set.topic || 'Untitled Set'}</h3>

                  {set.document && (
                    <div className="set-source-doc">
                      <FiFileText size={13} className="text-cyan" />
                      <span className="truncate">{set.document.originalName}</span>
                    </div>
                  )}

                  <div className="set-pills-row">
                    <span className="set-counter-badge">
                      {mcqsCount} MCQs
                    </span>
                    <span className="set-counter-badge">
                      {cqsCount} CQs
                    </span>
                    <span className="set-counter-badge text-dim">
                      {set.language}
                    </span>
                  </div>
                </Link>

                <div className="set-card-footer">
                  <span className="set-date-text">
                    <FiCalendar size={13} />
                    <span>{new Date(set.createdAt).toLocaleDateString()}</span>
                  </span>
                  <Link to={`/sets/${set.id}`} className="set-open-link">
                    <span>View Set</span>
                    <FiArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-bar mt-6 flex justify-center gap-3">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page <= 1}
            onClick={() => fetchQuestionSets(page - 1)}
          >
            Previous
          </button>
          <span className="pagination-info flex items-center text-sm text-dim">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages}
            onClick={() => fetchQuestionSets(page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Delete Question Set"
        message="Are you sure you want to delete this question set? All associated MCQs and CQs will be permanently deleted."
        confirmLabel="Delete Set"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Quick Export Modal */}
      {exportData && (
        <ExportModal
          isOpen={true}
          topicTitle={exportData.title}
          exportText={exportData.text}
          onClose={() => setExportData(null)}
        />
      )}
    </div>
  );
};
