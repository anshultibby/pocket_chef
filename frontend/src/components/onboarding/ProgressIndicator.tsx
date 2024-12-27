interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={`h-2 rounded-full transition-all ${
            index < currentStep
              ? 'bg-blue-500 flex-1'
              : index === currentStep
              ? 'bg-blue-500/50 flex-1'
              : 'bg-gray-700 flex-1'
          }`}
        />
      ))}
    </div>
  );
}
