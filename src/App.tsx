import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Admins from './pages/Admins';
import SuperAdmins from './pages/SuperAdmins';
import Employees from './pages/Employees';
import Companies from './pages/Companies';
import Customers from './pages/Customers';
import Queries from './pages/Queries';
import Transactions from './pages/Transactions';
import Notifications from './pages/Notifications';
import Banners from './pages/Banners';
import NewsletterImages from './pages/NewsletterImages';
import NewsletterEmails from './pages/NewsletterEmails';
import ContactUs from './pages/ContactUs';
import FAQs from './pages/FAQs';
import Terms from './pages/Terms';
import SEO from './pages/SEO';
import Settings from './pages/Settings';
import ChangePassword from './pages/ChangePassword';
import './i18n';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admins"
              element={
                <ProtectedRoute>
                  <Admins />
                </ProtectedRoute>
              }
            />
            <Route
              path="/super-admins"
              element={
                <ProtectedRoute>
                  <SuperAdmins />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <Employees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/companies"
              element={
                <ProtectedRoute>
                  <Companies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/queries"
              element={
                <ProtectedRoute>
                  <Queries />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/banners"
              element={
                <ProtectedRoute>
                  <Banners />
                </ProtectedRoute>
              }
            />
            <Route
              path="/newsletter-images"
              element={
                <ProtectedRoute>
                  <NewsletterImages />
                </ProtectedRoute>
              }
            />
            <Route
              path="/newsletter-emails"
              element={
                <ProtectedRoute>
                  <NewsletterEmails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/contact-us"
              element={
                <ProtectedRoute>
                  <ContactUs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faqs"
              element={
                <ProtectedRoute>
                  <FAQs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/terms"
              element={
                <ProtectedRoute>
                  <Terms />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seo"
              element={
                <ProtectedRoute>
                  <SEO />
                </ProtectedRoute>
              }
            />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
