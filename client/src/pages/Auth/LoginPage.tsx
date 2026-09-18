import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SEOHead } from '../../components/common/SEO/SEOHead';
import { ButtonLoader } from '../../components/feedback';
import { BRANDING } from '../../config/branding';
import { Lock, Mail, Phone, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      setError('يرجى ملء كافة الحقول (البريد الإلكتروني أو رقم الهاتف وكلمة المرور).');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(cleanIdentifier, password);
      onNavigate('/');
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول. يرجى التأكد من صحة البيانات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEmailInput = identifier.includes('@');

  return (
    <div className="content-wrapper" style={{ maxWidth: '460px', margin: '40px auto' }}>
      <SEOHead
        title="تسجيل الدخول"
        description="تسجيل الدخول إلى حسابك في متجر هايبر تكنولوجي (Hyper Technology) لمتابعة الطلبات وتصفح الأسعار."
      />
      <div className="card" style={{ padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ marginBottom: '8px' }}>تسجيل الدخول</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
            الدخول إلى حسابك في {BRANDING.shortName}
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--color-danger-bg)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-danger)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>البريد الإلكتروني أو رقم الهاتف</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isEmailInput ? <Mail size={12} /> : <Phone size={12} />}
                {isEmailInput ? 'بريد إلكتروني' : 'رقم هاتف'}
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="admin@superapp.com أو 01012345678"
                dir="ltr"
                style={{ textAlign: 'right' }}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isSubmitting}
                autoComplete="username"
              />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
              يمكنك الدخول باستخدام بريدك الإلكتروني (مثل Gmail) أو رقم هاتفك
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                dir="ltr"
                style={{ paddingLeft: '44px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'color var(--transition-fast)',
                }}
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '12px' }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ButtonLoader loadingText="جاري التحقق..." size="sm" color="white" />
            ) : (
              <>
                <span>دخول</span>
                <ArrowLeft size={18} />
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid var(--color-border)',
            textAlign: 'center',
            fontSize: '0.875rem',
          }}
        >
          <span style={{ color: 'var(--color-text-secondary)' }}>ليس لديك حساب؟ </span>
          <button
            type="button"
            onClick={() => onNavigate('/register')}
            style={{ color: 'var(--color-gold)', fontWeight: 700, cursor: 'pointer', background: 'none', border: 'none' }}
          >
            إنشاء حساب جديد
          </button>
        </div>
      </div>
    </div>
  );
};
