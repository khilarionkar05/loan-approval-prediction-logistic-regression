import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home   from './pages/Home';

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
          <Route path="/"           element={<Home />} />
          <Route path="/prediction" element={<PlaceholderPage title="Prediction" />} />
          <Route path="/live-ml"    element={<PlaceholderPage title="Live ML" />} />
          <Route path="/analytics"  element={<PlaceholderPage title="Analytics" />} />
          <Route path="/model"      element={<PlaceholderPage title="Model" />} />
          <Route path="/about"      element={<PlaceholderPage title="About" />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
