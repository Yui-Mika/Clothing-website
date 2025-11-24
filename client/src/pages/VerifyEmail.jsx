import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { TbMail, TbShieldCheck, TbAlertCircle } from 'react-icons/tb';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Redirect nếu không có email
  useEffect(() => {
    if (!email) {
      toast.error('Không có email. Vui lòng đăng ký trước.');
      navigate('/');
    }
  }, [email, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus first input
  useEffect(() => {
    document.getElementById('code-0')?.focus();
  }, []);

  // Handle input change
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().slice(0, 6);
    if (!/^\d{6}$/.test(pastedData)) {
      toast.error('Please paste a valid 6-digit code');
      return;
    }
    
    const newCode = pastedData.split('');
    setCode(newCode);
    document.getElementById('code-5')?.focus();
  };

  // Submit verification
  const handleVerify = async () => {
    const verificationCode = code.join('');
    
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${backendUrl}/api/user/verify-code`,
        {
          email: email,
          code: verificationCode
        }
      );

      if (response.data.success) {
        toast.success('✅ Email verified successfully!');
        setTimeout(() => {
          navigate('/', { state: { openLogin: true } });
        }, 1500);
      } else {
        toast.error(response.data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      const message = error.response?.data?.detail || 'Verification failed. Please try again.';
      toast.error(message);
      
      // Clear code on error
      setCode(['', '', '', '', '', '']);
      document.getElementById('code-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResend = async () => {
    if (countdown > 0) return;

    setResendLoading(true);

    try {
      const response = await axios.post(
        `${backendUrl}/api/user/resend-code`,
        { email: email }
      );

      if (response.data.success) {
        toast.success('✅ A new code has been sent to your email');
        setCountdown(60); // 60 seconds cooldown
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-0')?.focus();
      } else {
        toast.error(response.data.message || 'Failed to resend code');
      }
    } catch (error) {
      console.error('Resend error:', error);
      const message = error.response?.data?.detail || 'Failed to resend code. Please try again.';
      toast.error(message);
    } finally {
      setResendLoading(false);
    }
  };

  // Handle Enter key to submit
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && code.join('').length === 6 && !loading) {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 px-3 sm:px-4 py-6 sm:py-8">
      <div className="w-full max-w-[95vw] sm:max-w-md lg:max-w-lg bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-gray-100">
        {/* Icon */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-blue-500 p-3 sm:p-4 md:p-5 rounded-full shadow-lg">
            <TbMail className="text-white text-3xl sm:text-4xl md:text-5xl" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-2">
          Verify Your Email
        </h2>
        <p className="text-center text-sm sm:text-base text-gray-600 mb-2">
          We sent a 6-digit verification code to
        </p>
        <p className="text-center font-semibold text-sm sm:text-base text-purple-600 mb-6 sm:mb-8 break-all px-2">
          {email}
        </p>

        {/* Code Input */}
        <div className="flex gap-1.5 sm:gap-2 md:gap-3 justify-center mb-6" onKeyPress={handleKeyPress}>
          {code.map((digit, index) => (
            <input
              key={index}
              id={`code-${index}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 text-center text-xl sm:text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition-all"
              disabled={loading}
            />
          ))}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-2.5 sm:p-3 rounded mb-6">
          <div className="flex items-start gap-2">
            <TbAlertCircle className="text-blue-600 text-lg sm:text-xl flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm text-blue-800 font-medium">Code expires in 10 minutes</p>
              <p className="text-[10px] sm:text-xs text-blue-700 mt-1">You have 5 attempts to enter the correct code</p>
            </div>
          </div>
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={loading || code.join('').length !== 6}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:shadow-lg hover:from-purple-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
              <span className="text-sm sm:text-base">Verifying...</span>
            </>
          ) : (
            <>
              <TbShieldCheck className="text-lg sm:text-xl" />
              <span className="text-sm sm:text-base">Verify Email</span>
            </>
          )}
        </button>

        {/* Resend Code */}
        <div className="text-center mt-5 sm:mt-6">
          <p className="text-gray-600 text-xs sm:text-sm mb-2">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResend}
            disabled={resendLoading || countdown > 0}
            className="text-sm sm:text-base text-purple-600 font-semibold hover:text-purple-700 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline transition-colors"
          >
            {resendLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-purple-600"></div>
                <span className="text-xs sm:text-sm">Sending...</span>
              </span>
            ) : countdown > 0 ? (
              `Resend in ${countdown}s`
            ) : (
              'Resend Code'
            )}
          </button>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-200">
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 text-xs sm:text-sm hover:text-gray-700 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
