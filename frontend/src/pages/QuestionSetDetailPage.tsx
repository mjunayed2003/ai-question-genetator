import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Trash2,
  Edit,
  FileText,
  Calendar,
  Layers,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';
import { McqCard } from '../components/McqCard';
import { CqCard } from '../components/CqCard';
import { EditMcqModal } from '../components/EditMcqModal';
import { EditCqModal } from '../components/EditCqModal';
import { ExportModal } from '../components/ExportModal';
import { ConfirmModal } from '../components/ConfirmModal';
import type { MCQ, CQ, QuestionSet, UpdateCqPayload, UpdateMcqPayload } from '../types';

export const QuestionSetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'mcq' | 'cq'>('all');

  // Modals state
  const [editingMcq, setEditingMcq] = useState<MCQ | null>(null);
  const [editingCq, setEditingCq] = useState<CQ | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportText, setExportText] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Deletion confirmations
  const [deleteSetConfirm, setDeleteSetConfirm] = useState(false);
  const [deleteMcqTargetId, setDeleteMcqTargetId] = useState<string | null>(null);
  const [deleteCqTargetId, setDeleteCqTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Title / Metadata editing modal
  const [isEditMetaOpen, setIsEditMetaOpen] = useState(false);
  const [editTopic, setEditTopic] = useState('');
  const [editDifficulty, setEditDifficulty] = useState('medium');

  const fetchSet = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await api.getQuestionSet(id);
      setQuestionSet(data);
      setEditTopic(data.topic || '');
      setEditDifficulty(data.difficulty || 'medium');
    } catch (err: any) {
      showToast(err.message || 'Failed to load question set', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSet();
  }, [id]);

  // Handle Export
  const handleOpenExport = async () => {
    if (!id) return;
    try {
      const res = await api.exportQuestionSet(id);
      setExportText(res.exportText);
      setIsExportOpen(true);
    } catch (err: any) {
      showToast(err.message || 'Failed to generate export text', 'error');
    }
  };

  // Delete Set
  const handleDeleteSet = async () => {
    if (!id) return;
    try {
      setIsDeleting(true);
      await api.deleteQuestionSet(id);
      showToast('Question set deleted successfully', 'success');
      navigate('/sets');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete set', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Update Set Metadata
  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setIsSavingEdit(true);
      const updated = await api.updateQuestionSet(id, {
        topic: editTopic.trim(),
        difficulty: editDifficulty,
      });
      setQuestionSet((prev) => (prev ? { ...prev, topic: updated.topic, difficulty: updated.difficulty } : null));
      showToast('Question set metadata updated', 'success');
      setIsEditMetaOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update metadata', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Regenerate individual MCQ
  const handleRegenerateMcq = async (mcqId: string) => {
    try {
      const updated = await api.regenerateMcq(mcqId);
      setQuestionSet((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          mcqs: prev.mcqs.map((m) => (m.id === mcqId ? updated : m)),
        };
      });
      showToast('MCQ regenerated with Gemini AI!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to regenerate MCQ', 'error');
      throw err;
    }
  };

  // Save edited MCQ
  const handleSaveMcq = async (mcqId: string, payload: UpdateMcqPayload) => {
    try {
      setIsSavingEdit(true);
      const updated = await api.updateMcq(mcqId, payload);
      setQuestionSet((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          mcqs: prev.mcqs.map((m) => (m.id === mcqId ? updated : m)),
        };
      });
      showToast('MCQ updated successfully', 'success');
      setEditingMcq(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update MCQ', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete individual MCQ
  const handleDeleteMcqConfirm = async () => {
    if (!deleteMcqTargetId) return;
    try {
      setIsDeleting(true);
      await api.deleteMcq(deleteMcqTargetId);
      setQuestionSet((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          mcqCount: Math.max(0, prev.mcqCount - 1),
          mcqs: prev.mcqs.filter((m) => m.id !== deleteMcqTargetId),
        };
      });
      showToast('MCQ removed', 'success');
      setDeleteMcqTargetId(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete MCQ', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Regenerate individual CQ
  const handleRegenerateCq = async (cqId: string) => {
    try {
      const updated = await api.regenerateCq(cqId);
      setQuestionSet((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          cqs: prev.cqs.map((c) => (c.id === cqId ? updated : c)),
        };
      });
      showToast('Creative Question regenerated with Gemini AI!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to regenerate CQ', 'error');
      throw err;
    }
  };

  // Save edited CQ
  const handleSaveCq = async (cqId: string, payload: UpdateCqPayload) => {
    try {
      setIsSavingEdit(true);
      const updated = await api.updateCq(cqId, payload);
      setQuestionSet((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          cqs: prev.cqs.map((c) => (c.id === cqId ? updated : c)),
        };
      });
      showToast('Creative Question updated successfully', 'success');
      setEditingCq(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to update CQ', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete individual CQ
  const handleDeleteCqConfirm = async () => {
    if (!deleteCqTargetId) return;
    try {
      setIsDeleting(true);
      await api.deleteCq(deleteCqTargetId);
      setQuestionSet((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          cqCount: Math.max(0, prev.cqCount - 1),
          cqs: prev.cqs.filter((c) => c.id !== deleteCqTargetId),
        };
      });
      showToast('Creative Question removed', 'success');
      setDeleteCqTargetId(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete CQ', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container container">
        <div className="loading-state-box">
          <span className="loading-spinner-lg" />
          <p>Loading question set and AI assessments...</p>
        </div>
      </div>
    );
  }

  if (!questionSet) {
    return (
      <div className="page-container container text-center">
        <div className="empty-state-card glass-panel">
          <Layers size={48} className="text-dim" />
          <h3>Question Set Not Found</h3>
          <p>This question set may have been deleted or the link is invalid.</p>
          <Link to="/sets" className="btn btn-primary mt-3">
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const mcqs = questionSet.mcqs || [];
  const cqs = questionSet.cqs || [];
  const totalQuestions = mcqs.length + cqs.length;

  const getDifficultyBadge = (diff: string) => {
    const d = (diff || '').toLowerCase();
    if (d === 'easy') return 'badge badge-easy';
    if (d === 'hard') return 'badge-hard';
    return 'badge-medium';
  };

  return (
    <div className="page-container container">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="detail-top-nav">
        <Link to="/sets" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Question Sets</span>
        </Link>

        <div className="detail-action-buttons">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setIsEditMetaOpen(true)}
          >
            <Edit size={14} />
            <span>Edit Title</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOpenExport}
          >
            <Download size={14} />
            <span>Export & Print</span>
          </button>

          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => setDeleteSetConfirm(true)}
          >
            <Trash2 size={14} />
            <span>Delete Set</span>
          </button>
        </div>
      </div>

      {/* Main Set Header Banner */}
      <div className="set-hero-banner glass-panel">
        <div className="set-hero-main">
          <div className="set-meta-badges">
            <span className={`badge ${getDifficultyBadge(questionSet.difficulty)}`}>
              {questionSet.difficulty}
            </span>
            <span className="badge badge-purple">{questionSet.language}</span>
            {questionSet.document && (
              <span className="badge badge-cyan" title="Source Document">
                <FileText size={12} />
                <span>{questionSet.document.originalName}</span>
              </span>
            )}
          </div>

          <h1 className="set-hero-title">{questionSet.topic || 'Untitled Question Set'}</h1>

          <div className="set-hero-details">
            <span className="detail-meta-item">
              <Layers size={14} className="text-dim" />
              <span>{mcqs.length} Multiple Choice</span>
            </span>
            <span className="detail-meta-item">
              <BookOpen size={14} className="text-dim" />
              <span>{cqs.length} Creative Questions</span>
            </span>
            <span className="detail-meta-item">
              <Calendar size={14} className="text-dim" />
              <span>Created {new Date(questionSet.createdAt).toLocaleDateString()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="tabs-header-container">
        <div className="filter-tabs">
          <button
            type="button"
            className={`filter-tab-btn ${activeTab === 'all' ? 'filter-tab-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Questions ({totalQuestions})
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${activeTab === 'mcq' ? 'filter-tab-active' : ''}`}
            onClick={() => setActiveTab('mcq')}
          >
            MCQs ({mcqs.length})
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${activeTab === 'cq' ? 'filter-tab-active' : ''}`}
            onClick={() => setActiveTab('cq')}
          >
            Creative Questions ({cqs.length})
          </button>
        </div>
      </div>

      {/* Questions Content */}
      <div className="questions-stream">
        {totalQuestions === 0 ? (
          <div className="empty-state-card glass-panel">
            <HelpCircle size={40} className="text-dim" />
            <h3>No questions in this set</h3>
            <p>You can generate a new set from the studio.</p>
            <Link to="/generate" className="btn btn-primary mt-2">
              Generate Questions
            </Link>
          </div>
        ) : null}

        {/* Section A: MCQs */}
        {(activeTab === 'all' || activeTab === 'mcq') && mcqs.length > 0 && (
          <section className="section-group">
            <div className="group-header">
              <h2 className="group-title">Section A: Multiple Choice Questions</h2>
              <span className="group-count">{mcqs.length} Questions</span>
            </div>
            <div className="questions-list">
              {mcqs.map((mcq, idx) => (
                <McqCard
                  key={mcq.id}
                  mcq={mcq}
                  index={idx}
                  onEdit={(m) => setEditingMcq(m)}
                  onDelete={(mcqId) => setDeleteMcqTargetId(mcqId)}
                  onRegenerate={handleRegenerateMcq}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section B: CQs */}
        {(activeTab === 'all' || activeTab === 'cq') && cqs.length > 0 && (
          <section className="section-group mt-6">
            <div className="group-header">
              <h2 className="group-title">Section B: Creative Questions (CQ)</h2>
              <span className="group-count">{cqs.length} Questions (10 Marks Each)</span>
            </div>
            <div className="questions-list">
              {cqs.map((cq, idx) => (
                <CqCard
                  key={cq.id}
                  cq={cq}
                  index={idx}
                  onEdit={(c) => setEditingCq(c)}
                  onDelete={(cqId) => setDeleteCqTargetId(cqId)}
                  onRegenerate={handleRegenerateCq}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Edit Metadata Modal */}
      {isEditMetaOpen && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setIsEditMetaOpen(false)}>
          <div className="modal-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Question Set Details</h3>
            </div>
            <form onSubmit={handleSaveMetadata}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Topic Title</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select
                    className="form-select"
                    value={editDifficulty}
                    onChange={(e) => setEditDifficulty(e.target.value)}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditMetaOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit MCQ Modal */}
      <EditMcqModal
        isOpen={editingMcq !== null}
        mcq={editingMcq}
        isLoading={isSavingEdit}
        onClose={() => setEditingMcq(null)}
        onSave={handleSaveMcq}
      />

      {/* Edit CQ Modal */}
      <EditCqModal
        isOpen={editingCq !== null}
        cq={editingCq}
        isLoading={isSavingEdit}
        onClose={() => setEditingCq(null)}
        onSave={handleSaveCq}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        topicTitle={questionSet.topic || 'Question-Set'}
        exportText={exportText}
        onClose={() => setIsExportOpen(false)}
      />

      {/* Delete Question Set Confirm */}
      <ConfirmModal
        isOpen={deleteSetConfirm}
        title="Delete Entire Question Set"
        message="Are you sure you want to permanently delete this question set and all its questions?"
        confirmLabel="Delete Everything"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteSet}
        onCancel={() => setDeleteSetConfirm(false)}
      />

      {/* Delete Single MCQ Confirm */}
      <ConfirmModal
        isOpen={deleteMcqTargetId !== null}
        title="Delete MCQ"
        message="Are you sure you want to remove this multiple choice question from the set?"
        confirmLabel="Remove MCQ"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteMcqConfirm}
        onCancel={() => setDeleteMcqTargetId(null)}
      />

      {/* Delete Single CQ Confirm */}
      <ConfirmModal
        isOpen={deleteCqTargetId !== null}
        title="Delete Creative Question"
        message="Are you sure you want to remove this creative question from the set?"
        confirmLabel="Remove CQ"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteCqConfirm}
        onCancel={() => setDeleteCqTargetId(null)}
      />
    </div>
  );
};
