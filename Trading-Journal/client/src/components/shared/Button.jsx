const Button = ({ children, onClick, variant = 'primary', className = '', type = 'button' }) => {
  const variants = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white',
    secondary: 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-[#2a2a2a] text-gray-400 hover:text-white',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;