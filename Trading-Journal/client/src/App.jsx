import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AccountProvider } from './context/AccountContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Notebook from './pages/Notebook';
import Trades from './pages/Trades';
import Reports from './pages/Reports';
import Playbook from './pages/Playbook';
import AccountCenter from './pages/AccountCenter';

function App() {
  return (
    <AccountProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/notebook" element={<Notebook />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/playbook" element={<Playbook />} />
            <Route path="/account" element={<AccountCenter />} />
          </Routes>
        </Layout>
      </Router>
    </AccountProvider>
  );
}

export default App;