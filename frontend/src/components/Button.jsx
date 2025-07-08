import React from 'react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled = false,
  loading = false,
  onClick,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  const variants = {
    primary:
      'bg-[#C33332] text-white hover:bg-[#a82a2a] focus:ring-[#C33332]',
    outline:
      'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50 focus:ring-[#C33332]',
  };
  const size = 'px-4 py-2 text-base';
  const width = fullWidth ? 'w-full' : '';
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${size} ${width} disabled:opacity-60 disabled:cursor-not-allowed`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {leftIcon && <span className="mr-2 flex items-center">{leftIcon}</span>}
      {loading ? 'Loading...' : children}
      {rightIcon && <span className="ml-2 flex items-center">{rightIcon}</span>}
    </button>
  );
} 