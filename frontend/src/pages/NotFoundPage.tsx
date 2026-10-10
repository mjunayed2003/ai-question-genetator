import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="page-container container not-found-wrapper">
      <div className="not-found-card glass-panel text-center">
        <div className="not-found-badge">
          <HelpCircle size={48} className="text-cyan" />
        </div>
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Page Not Found</h2>
        <p className="not-found-desc">
          The page or question set you are looking for does not exist or has been relocated.
        </p>

        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary">
            <Home size={17} />
            <span>Back to Dashboard</span>
          </Link>
          <Link to="/sets" className="btn btn-secondary">
            <ArrowLeft size={17} />
            <span>Question Sets Catalog</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
