import React, { useState } from 'react';
import { FiRefreshCw, FiEdit2, FiTrash2, FiFileText } from 'react-icons/fi';
import type { CQ } from '../types';

interface CqCardProps {
  cq: CQ;
  index: number;
  onEdit: (cq: CQ) => void;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => Promise<void>;
}

export const CqCard: React.FC<CqCardProps> = ({
  cq,
  index,
  onEdit,
  onDelete,
  onRegenerate,
}) => {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerateClick = async () => {
    try {
      setIsRegenerating(true);
      await onRegenerate(cq.id);
    } finally {
      setIsRegenerating(false);
    }
  };

  const getDifficultyClass = (diff: string) => {
    const d = (diff || '').toLowerCase();
    if (d === 'easy') return 'badge-easy';
    if (d === 'hard') return 'badge-hard';
    return 'badge-medium';
  };

  return (
    <div className="question-card glass-panel animate-fade-in">
      {/* Card Header */}
      <div className="question-card-header">
        <div className="question-badge-group">
          <span className="question-num-pill cq-num-pill">CQ {index + 1}</span>
          <span className={`badge ${getDifficultyClass(cq.difficulty)}`}>
            {cq.difficulty}
          </span>
          <span className="badge badge-purple">10 Marks</span>
        </div>

        <div className="card-actions">
          <button
            type="button"
            className="icon-action-btn btn-ai"
            title="Regenerate this Creative Question"
            disabled={isRegenerating}
            onClick={handleRegenerateClick}
          >
            <FiRefreshCw size={14} className={isRegenerating ? 'spin-anim' : ''} />
            <span className="action-text">{isRegenerating ? 'Regenerating...' : 'Regen'}</span>
          </button>

          <button
            type="button"
            className="icon-action-btn"
            title="Edit CQ"
            onClick={() => onEdit(cq)}
          >
            <FiEdit2 size={14} />
            <span className="action-text">Edit</span>
          </button>

          <button
            type="button"
            className="icon-action-btn text-rose"
            title="Delete CQ"
            onClick={() => onDelete(cq.id)}
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>

      {/* Stimulus Box */}
      <div className="cq-stimulus-box">
        <div className="stimulus-title">
          <FiFileText size={15} className="text-cyan" />
          <span>Stimulus</span>
        </div>
        <p className="stimulus-text">{cq.stimulus}</p>
      </div>

      {/* Sub-Questions (a, b, c, d) */}
      <div className="cq-subquestions-list">
        <div className="cq-subquestion-item">
          <div className="subquestion-tag">
            <span className="sub-letter">a</span>
            <span className="sub-type">Knowledge</span>
          </div>
          <div className="subquestion-content">
            <p>{cq.questionA}</p>
          </div>
          <div className="subquestion-marks">1 Mark</div>
        </div>

        <div className="cq-subquestion-item">
          <div className="subquestion-tag">
            <span className="sub-letter">b</span>
            <span className="sub-type">Comprehension</span>
          </div>
          <div className="subquestion-content">
            <p>{cq.questionB}</p>
          </div>
          <div className="subquestion-marks">2 Marks</div>
        </div>

        <div className="cq-subquestion-item">
          <div className="subquestion-tag">
            <span className="sub-letter">c</span>
            <span className="sub-type">Application</span>
          </div>
          <div className="subquestion-content">
            <p>{cq.questionC}</p>
          </div>
          <div className="subquestion-marks">3 Marks</div>
        </div>

        <div className="cq-subquestion-item">
          <div className="subquestion-tag">
            <span className="sub-letter">d</span>
            <span className="sub-type">Higher Ability</span>
          </div>
          <div className="subquestion-content">
            <p>{cq.questionD}</p>
          </div>
          <div className="subquestion-marks">4 Marks</div>
        </div>
      </div>
    </div>
  );
};
