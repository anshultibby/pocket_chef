export type OnboardingStep = 
  | 'welcome'
  | 'add_items'
  | 'generate_recipes'
  | 'use_recipes';

export interface OnboardingState {
  currentStep: OnboardingStep;
  completed: boolean;
}

export interface WelcomeStepProps {
  userName: string;
  onNext: () => void;
  onExit: () => void;
}

export interface AddItemsStepProps {
  onNext: () => void;
  onBack: () => void;
  onExit: () => void;
}

export interface GenerateRecipesStepProps {
  onNext: () => void;
  onBack: () => void;
  onExit: () => void;
}

export interface UseRecipesStepProps {
  onComplete: () => void;
  onBack: () => void;
  onExit: () => void;
}
