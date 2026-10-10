import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { CQ, UpdateCqPayload } from '../types';

interface EditCqModalProps {
  isOpen: boolean;
  cq: CQ | null;
  isLoading?: boolean;
  onClose: () => void;
  onSave: (id: string, payload: UpdateCqPayload) => Promise<void>;
}

export const EditCqModal: React.FC<EditCqModalProps> = ({
  isOpen,
  cq,
  isLoading = false,
  onClose,
  onSave,
}) => {
  const [stimulus, setStimulus] = useState('');
  const [questionA, setQuestionA] = useState('');
  const [questionB, setQuestionB] = useState('');
  const [questionC, setQuestionC] = useState('');
  const [questionD, setQuestionD] = useState('');
  const [difficulty, setDifficulty] = useState('medium');

  useEffect(() => {
    if (cq) {
      setStimulus(cq.stimulus || '');
      setQuestionA(cq.questionA || '');
      setQuestionB(cq.questionB || '');
      setQuestionC(cq.questionC || '');
      setQuestionD(cq.questionD || '');
      setDifficulty(cq.difficulty || 'medium');
    }
  }, [cq]);

  if (!isOpen || !cq) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(cq.id, {
      stimulus: stimulus.trim(),
      questionA: questionA.trim(),
      questionB: questionB.trim(),
      questionC: questionC.trim(),
      questionD: questionD.trim(),
      difficulty,
    });
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-dialog modal-lg glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Creative Question (CQ)</h3>
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
              <label className="form-label">Stimulus Scenario / Passage</label>
              <textarea
                className="form-textarea"
                rows={4}
                required
                value={stimulus}
                onChange={(e) => setStimulus(e.target.value)}
                placeholder="Enter the context scenario..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sub-Question (a) - Knowledge Level [1 Mark]</label>
              <input
                type="text"
                className="form-input"
                required
                value={questionA}
                onChange={(e) => setQuestionA(e.target.value)}
                placeholder="e.g. What is photosynthesis?"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sub-Question (b) - Comprehension Level [2 Marks]</label>
              <input
                type="text"
                className="form-input"
                required
                value={questionB}
                onChange={(e) => setQuestionB(e.target.value)}
                placeholder="e.g. Explain why light is essential for the reaction."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sub-Question (c) - Application Level [3 Marks]</label>
              <textarea
                className="form-textarea"
                rows={2}
                required
                value={questionC}
                onChange={(e) => setQuestionC(e.target.value)}
                placeholder="e.g. How does the process in the stimulus relate to..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Sub-Question (d) - Higher Order Analysis [4 Marks]</label>
              <textarea
                className="form-textarea"
                rows={2}
                required
                value={questionD}
                onChange={(e) => setQuestionD(e.target.value)}
                placeholder="e.g. Evaluate the impact if factor X is removed..."
              />
            </div>

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
              disabled={isLoading}
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
