import { Route, Routes } from 'react-router';
import AppShell from './components/AppShell/AppShell.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import CasesPage from './pages/CasesPage.jsx';
import DistrictPage from './pages/DistrictPage.jsx';
import DistrictsPage from './pages/DistrictsPage.jsx';
import ForecastPage from './pages/ForecastPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import RegimesPage from './pages/RegimesPage.jsx';
import VerificationPage from './pages/VerificationPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<ForecastPage />} />
        <Route path="regimes" element={<RegimesPage />} />
        <Route path="districts" element={<DistrictsPage />} />
        <Route path="districts/:id" element={<DistrictPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="verification" element={<VerificationPage />} />
        <Route path="cases" element={<CasesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
