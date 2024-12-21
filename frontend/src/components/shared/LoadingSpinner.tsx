interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export const LoadingSpinner = ({ message, className = '' }: LoadingSpinnerProps) => (
  <div className={`text-center py-8 ${className}`}>
    <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
    {message && <p className="text-gray-400">{message}</p>}
  </div>
);
