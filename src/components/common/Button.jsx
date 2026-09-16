import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  showArrow = false,
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeStyles = {
    sm: 'px-4 py-2 text-xs tracking-wide',
    md: 'px-5 py-2.5 text-sm tracking-wide',
    lg: 'px-7 py-3.5 text-base tracking-wide font-semibold',
  };

  const variantStyles = {
    primary: 'bg-[#E2522B] text-white hover:bg-[#C8421D] focus:ring-[#E2522B]/40 shadow-sm shadow-[#E2522B]/20 font-bold',
    secondary: 'bg-[#F4EFE6] text-[#171717] hover:bg-[#EAE4D8] focus:ring-[#E2522B]/20 border border-[#EFE8DB] font-bold',
    dark: 'bg-[#171717] text-white hover:bg-neutral-800 focus:ring-neutral-900 font-bold',
    outline: 'border border-[#EFE8DB] bg-white text-[#171717] hover:bg-[#FFF7EC] hover:border-[#171717]/30 focus:ring-neutral-400 font-bold',
    ghost: 'bg-transparent text-[#171717] hover:bg-[#FFF7EC] focus:ring-neutral-300 font-bold',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500/30 font-bold'
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      <span className="flex items-center gap-2">
        {children}
        {showArrow && (
          <motion.span
            initial={{ x: 0 }}
            whileHover={{ x: 3 }}
            transition={{ duration: 0.15 }}
          >
            <ArrowRight className="w-4 h-4" />
          </motion.span>
        )}
      </span>
    </motion.button>
  );
}
