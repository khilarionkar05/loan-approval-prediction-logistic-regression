import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header        from './components/Header';
import Footer        from './components/Footer';
import Home          from './pages/Home';
import Prediction    from './pages/Prediction';
import LiveML        from './pages/LiveML';
import LiveAnalysis  from './pages/LiveAnalysis';

/* Placeholder for pages not yet implemented */
function PlaceholderPage({ title }) {
  return (
    <main className="page-placeholder">
      <h1>{title}</h1>
      <p>This page is coming soon.</p>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="page-wrapper">
        <Header />
        <Routes>
          <Route path="/"              element={<Home />} />
          <Route path="/prediction"    element={<Prediction />} />
          <Route path="/live-ml"       element={<LiveML />} />
          <Route path="/live-analysis" element={<LiveAnalysis />} />
          <Route path="/analytics"     element={<PlaceholderPage title="Analytics Dashboard" />} />
          <Route path="/model-info"    element={<PlaceholderPage title="Model Information" />} />
          <Route path="/model"         element={<Navigate to="/model-info" replace />} />
          <Route path="/about"         element={<PlaceholderPage title="About Project" />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
