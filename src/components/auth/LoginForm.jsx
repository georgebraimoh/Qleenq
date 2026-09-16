import React, { useState } from 'react';
import FormField from '../common/FormField';
import Button from '../common/Button';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginForm({ onSubmit, onToggleSignUp, isLoading, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!email.trim() || !password) {
      setValidationError('Please enter both your email and password.');
      return;
    }

    onSubmit({ email: email.trim(), password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(error || validationError) && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error || validationError}</span>
        </div>
      )}

      <FormField label="Email address" required>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6F6F6F]">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="name@example.com"
            disabled={isLoading}
            className="w-full pl-10 pr-4 py-3 bg-[#F7F6F2] border border-[#E8E6E1] rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-[#FF6B4A] disabled:opacity-50"
          />
        </div>
      </FormField>

      <FormField label="Password" required>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6F6F6F]">
            <Lock className="w-4 h-4" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            disabled={isLoading}
            className="w-full pl-10 pr-10 py-3 bg-[#F7F6F2] border border-[#E8E6E1] rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-[#FF6B4A] disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6F6F6F] hover:text-[#171717] cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </FormField>

      <div className="flex items-center justify-between text-xs pt-1">
        <button
          type="button"
          onClick={() => alert("Forgot password link sent! Check your inbox.")}
          className="text-[#6F6F6F] hover:text-[#FF6B4A] font-medium cursor-pointer"
        >
          Forgot password?
        </button>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        disabled={isLoading || !email.trim() || !password}
        className="mt-2"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </Button>

      <div className="text-center pt-2">
        <p className="text-xs text-[#6F6F6F]">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onToggleSignUp}
            className="text-[#FF6B4A] font-bold hover:underline cursor-pointer"
          >
            Create account
          </button>
        </p>
      </div>
    </form>
  );
}
