import React, { useState } from 'react';
import {
  FiCheck,
  FiX,
  FiRefreshCw,
  FiEdit2,
  FiTrash2,
  FiCheckCircle,
  FiHelpCircle,
} from 'react-icons/fi';
import type { MCQ } from '../types';

interface McqCardProps {
  mcq: MCQ;
  index: number;
  onEdit: (mcq: MCQ) => void;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => Promise<void>;
}

export const McqCard: React.FC<McqCardProps> = ({
  mcq,
  index,
  onEdit,
  onDelete,
  onRegenerate,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const options = Array.isArray(mcq.options) ? mcq.options : [];
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  const handleSelectOption = (opt: string) => {
    setSelectedOption(opt);
    setShowExplanation(true);
  };

  const handleRegenerateClick = async () => {
    try {
      setIsRegenerating(true);
      await onRegenerate(mcq.id);
      setSelectedOption(null);
      setShowExplanation(false);
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
          <span className="question-num-pill">MCQ {index + 1}</span>
          <span className={`badge ${getDifficultyClass(mcq.difficulty)}`}>
            {mcq.difficulty}
          </span>
        </div>

        <div className="card-actions">
          <button
            type="button"
            className="icon-action-btn btn-ai"
            title="Regenerate this MCQ"
            disabled={isRegenerating}
            onClick={handleRegenerateClick}
          >
            <FiRefreshCw size={14} className={isRegenerating ? 'spin-anim' : ''} />
            <span className="action-text">{isRegenerating ? 'Regenerating...' : 'Regen'}</span>
          </button>

          <button
            type="button"
            className="icon-action-btn"
            title="Edit MCQ"
            onClick={() => onEdit(mcq)}
          >
            <FiEdit2 size={14} />
            <span className="action-text">Edit</span>
          </button>

          <button
            type="button"
            className="icon-action-btn text-rose"
            title="Delete MCQ"
            onClick={() => onDelete(mcq.id)}
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>

      {/* Question Prompt */}
      <div className="question-prompt">
        <p>{mcq.question}</p>
      </div>

      {/* Options List */}
      <div className="mcq-options-grid">
        {options.map((opt, optIdx) => {
          const letter = optionLetters[optIdx] || `${optIdx + 1}`;
          const isSelected = selectedOption === opt;
          const isCorrect = opt === mcq.answer;

          let optionStateClass = '';
          if (selectedOption !== null) {
            if (isCorrect) {
              optionStateClass = 'option-correct';
            } else if (isSelected) {
              optionStateClass = 'option-incorrect';
            }
          }

          return (
            <button
              key={optIdx}
              type="button"
              className={`mcq-option-item ${optionStateClass}`}
              onClick={() => handleSelectOption(opt)}
            >
              <span className="option-letter">{letter}</span>
              <span className="option-text">{opt}</span>
              {selectedOption !== null && (
                <span className="option-feedback-icon">
                  {isCorrect && <FiCheck size={16} className="text-emerald" />}
                  {isSelected && !isCorrect && <FiX size={16} className="text-rose" />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Explanation Toggle */}
      <div className="question-card-footer">
        <button
          type="button"
          className="explanation-toggle-btn"
          onClick={() => setShowExplanation(!showExplanation)}
        >
          <FiHelpCircle size={15} className={showExplanation ? 'text-amber' : 'text-dim'} />
          <span>{showExplanation ? 'Hide Explanation' : 'Explanation'}</span>
        </button>

        {selectedOption && (
          <button
            type="button"
            className="reset-choice-btn"
            onClick={() => setSelectedOption(null)}
          >
            Reset
          </button>
        )}
      </div>

      {/* Explanation Box */}
      {showExplanation && (
        <div className="explanation-box animate-fade-in">
          <div className="explanation-header">
            <FiCheckCircle size={15} className="text-emerald" />
            <span className="correct-answer-label">
              Answer: <strong>{mcq.answer}</strong>
            </span>
          </div>
          {mcq.explanation ? (
            <p className="explanation-body">{mcq.explanation}</p>
          ) : (
            <p className="explanation-body text-dim italic">No explanation provided.</p>
          )}
        </div>
      )}
    </div>
  );
};
