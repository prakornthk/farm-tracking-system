import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout } from 'lucide-react';

function generateState() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLineLogin = () => {
    const clientId = import.meta.env.VITE_LINE_CLIENT_ID || 'your-line-client-id';
    const redirectUri = encodeURIComponent(window.location.origin + '/login/callback');
    const state = generateState();
    sessionStorage.setItem('oauth_state', state);
    window.location.href = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=openid%20profile&state=${encodeURIComponent(state)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-stone-50 to-primary-100 p-4">
      <div className="card max-w-sm w-full p-8 text-center shadow-lg">
        {/* Logo mark */}
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-5">
          <Sprout size={32} className="text-primary-600" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1.5 tracking-tight">Farm Admin</h1>
        <p className="text-sm text-gray-500 mb-8">ระบบจัดการฟาร์มอัจฉริยะ</p>

        <button
          onClick={handleLineLogin}
          className="btn btn-primary w-full py-3 text-sm"
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.349 0-.63-.285-.63-.629V8.108c0-.345.281-.63.63-.63.346 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.915C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          เข้าสู่ระบบด้วย LINE
        </button>

        <p className="text-xs text-gray-400 mt-6 leading-relaxed">
          กรุณาเข้าสู่ระบบด้วยบัญชี LINE ที่ลงทะเบียนไว้กับฟาร์ม
        </p>
      </div>
    </div>
  );
}
