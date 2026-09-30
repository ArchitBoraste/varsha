import { Route, Routes } from 'react-router';
import AppShell from './components/AppShell/AppShell.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import CasesPage from './pages/CasesPage.jsx';
import DistrictPage from './pages/DistrictPage.jsx';
import DistrictsPage from './pages/DistrictsPage.jsx';
import ForecastPage from './pages/ForecastPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import BulletinPrint from './pages/print/BulletinPrint.jsx';
import DistrictPrint from './pages/print/DistrictPrint.jsx';
import VerificationPrint from './pages/print/VerificationPrint.jsx';
import RegimesPage from './pages/RegimesPage.jsx';
import VerificationPage from './pages/VerificationPage.jsx';

export default function App() {
  return (
    <Routes>
      {/* Printable A4 reports, without the app shell; each opens in its own tab. */}
      <Route path="print">
        <Route path="bulletin" element={<BulletinPrint />} />
        <Route path="district/:id" element={<DistrictPrint />} />
        <Route path="verification" element={<VerificationPrint />} />
      </Route>
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
