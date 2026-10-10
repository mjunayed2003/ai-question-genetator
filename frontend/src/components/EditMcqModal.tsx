import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { MCQ, UpdateMcqPayload } from '../types';

interface EditMcqModalProps {
  isOpen: boolean;
  mcq: MCQ | null;
  isLoading?: boolean;
  onClose: () => void;
  onSave: (id: string, payload: UpdateMcqPayload) => Promise<void>;
}

export const EditMcqModal: React.FC<EditMcqModalProps> = ({
  isOpen,
  mcq,
  isLoading = false,
  onClose,
  onSave,
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [answer, setAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState('medium');

  useEffect(() => {
    if (mcq) {
      setQuestion(mcq.question || '');
      const rawOpts = Array.isArray(mcq.options) ? [...mcq.options] : [];
      while (rawOpts.length < 4) rawOpts.push('');
      setOptions(rawOpts.slice(0, 4));
      setAnswer(mcq.answer || '');
      setExplanation(mcq.explanation || '');
      setDifficulty(mcq.difficulty || 'medium');
    }
  }, [mcq]);

  if (!isOpen || !mcq) return null;

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    const prevVal = updated[idx];
    updated[idx] = val;
    setOptions(updated);

    // If answer was the old option, update answer too
    if (answer === prevVal) {
      setAnswer(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(mcq.id, {
      question: question.trim(),
      options: options.map((o) => o.trim()),
      answer: answer.trim(),
      explanation: explanation.trim(),
      difficulty,
    });
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-dialog modal-lg glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Multiple Choice Question</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Question Prompt</label>
              <textarea
                className="form-textarea"
                rows={3}
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter the question text..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Options (Select the radio of the correct answer)</label>
              <div className="edit-options-list">
                {options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isCorrect = answer === opt && opt.trim() !== '';

                  return (
                    <div key={idx} className="edit-option-row">
                      <label className="radio-label" title="Mark as correct answer">
                        <input
                          type="radio"
                          name="correct-option"
                          checked={isCorrect}
                          onChange={() => setAnswer(opt)}
                          disabled={!opt.trim()}
                        />
                        <span className="radio-badge">{letter}</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Option ${letter}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Difficulty Level</label>
                <select
                  className="form-select"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Selected Correct Answer</label>
                <input
                  type="text"
                  className="form-input"
                  readOnly
                  value={answer || 'None selected (click radio button)'}
                  style={{ color: answer ? 'var(--accent-emerald)' : 'var(--text-dim)' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Explanation & Rationale</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain why this answer is correct..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !answer.trim()}
            >
              <Save size={16} />
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
