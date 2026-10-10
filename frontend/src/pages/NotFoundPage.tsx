import React from 'react';
import { Link } from 'react-router-dom';
import { FiHelpCircle, FiArrowLeft, FiHome } from 'react-icons/fi';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="page-container container not-found-wrapper">
      <div className="not-found-card glass-panel text-center">
        <div className="not-found-badge">
          <FiHelpCircle size={48} className="text-cyan" />
        </div>
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Page Not Found</h2>
        <p className="not-found-desc">
          The requested page or question set could not be found.
        </p>

        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            <FiHome size={17} />
            <span>Home</span>
          </Link>
          <Link to="/sets" className="btn btn-secondary">
            <FiArrowLeft size={17} />
            <span>Question Sets</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
