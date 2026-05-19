import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Notebook from './pages/Notebook';
import Trades from './pages/Trades';
import Reports from './pages/Reports';
import Playbook from './pages/Playbook';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/notebook" element={<Notebook />} />
          <Route path="/trades" element={<Trades />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/playbook" element={<Playbook />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;