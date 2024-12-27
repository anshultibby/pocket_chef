export type OnboardingStep = 
  | 'welcome'
  | 'add_items'
  | 'generate_recipes'
  | 'use_recipes';

export interface OnboardingState {
  currentStep: OnboardingStep;
  completed: boolean;
}
