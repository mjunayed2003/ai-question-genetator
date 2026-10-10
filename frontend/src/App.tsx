import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { DashboardPage } from './pages/DashboardPage';
import { GeneratePage } from './pages/GeneratePage';
import { QuestionSetsPage } from './pages/QuestionSetsPage';
import { QuestionSetDetailPage } from './pages/QuestionSetDetailPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="app-root">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/generate" element={<GeneratePage />} />
                <Route path="/sets" element={<QuestionSetsPage />} />
                <Route path="/sets/:id" element={<QuestionSetDetailPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <LoginModal />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
