import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import apiService from '../services/api';

type Step = 'email' | 'otp' | 'password';

const ChangePassword = () => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiService.sendOTPForPasswordChange(email);
      console.log(response);
      if (response.success) {
        setStep('otp');
      } else {
        setError(response.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiService.verifyOTPForPasswordChange(email, otp);
      if (response.success) {
        setStep('password');
      } else {
        setError(response.message || 'Invalid OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError(t('changePassword.passwordMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('changePassword.passwordMismatch'));
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.changePasswordWithOTP(email, newPassword);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setError(response.message || t('changePassword.passwordUpdateError'));
      }
    } catch (err: any) {
      setError(err.message || t('changePassword.passwordUpdateError'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('changePassword.passwordUpdated')}</h1>
            <p className="text-gray-600 mb-6">
              {t('changePassword.passwordUpdatedMessage')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Step 1: Check Email */}
          {step === 'email' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-full mb-4">
                  <Mail className="text-white" size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800">{t('changePassword.checkEmail')}</h1>
                <p className="text-gray-600 mt-2">{t('changePassword.checkEmailDescription')}</p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    placeholder="admin@pointbox.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('common.loading') : t('changePassword.sendOTP')}
                </button>
              </form>
            </>
          )}

          {/* Step 2: Verify OTP */}
          {step === 'otp' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-full mb-4">
                  <KeyRound className="text-white" size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800">{t('changePassword.verifyOTP')}</h1>
                <p className="text-gray-600 mt-2">{t('changePassword.verifyOTPDescription')}</p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('changePassword.otpCode')}
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    maxLength={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-center text-2xl tracking-widest"
                    placeholder="000000"
                  />
                  <p className="text-sm text-gray-500 mt-2">{t('changePassword.otpSentTo')} {email}</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 4}
                  className="w-full bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('common.loading') : t('changePassword.verify')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                    setError('');
                  }}
                  className="w-full text-purple-600 font-semibold hover:text-purple-700 transition-colors"
                >
                  {t('changePassword.backToEmail')}
                </button>
              </form>
            </>
          )}

          {/* Step 3: Change Password */}
          {step === 'password' && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 rounded-full mb-4">
                  <Lock className="text-white" size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-800">{t('changePassword.changePassword')}</h1>
                <p className="text-gray-600 mt-2">{t('changePassword.changePasswordDescription')}</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('changePassword.newPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      placeholder={t('changePassword.enterNewPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('changePassword.confirmPassword')}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                      placeholder={t('changePassword.confirmNewPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('common.loading') : t('changePassword.updatePassword')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep('otp');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                  }}
                  className="w-full text-purple-600 font-semibold hover:text-purple-700 transition-colors"
                >
                  {t('changePassword.backToOTP')}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
