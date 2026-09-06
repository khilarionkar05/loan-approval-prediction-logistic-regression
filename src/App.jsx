import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header        from './components/Header';
import Footer        from './components/Footer';
import Home          from './pages/Home';
import Prediction    from './pages/Prediction';
import LiveML        from './pages/LiveML';
import LiveAnalysis  from './pages/LiveAnalysis';
import Analytics     from './pages/Analytics';


import ModelInfo     from './pages/ModelInfo';

import About         from './pages/About';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="page-wrapper">
        <Header />
        <Routes>
          <Route path="/"              element={<Home />} />
          <Route path="/prediction"    element={<Prediction />} />
          <Route path="/live-ml"       element={<LiveML />} />
          <Route path="/live-analysis" element={<LiveAnalysis />} />
          <Route path="/analytics"     element={<Analytics />} />
          <Route path="/model-info"    element={<ModelInfo />} />
          <Route path="/model"         element={<Navigate to="/model-info" replace />} />
          <Route path="/about"         element={<About />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
