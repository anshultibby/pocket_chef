'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AuthGuard } from '@/components/AuthGuard';
import { motion } from 'framer-motion';
import { ProgressIndicator } from '@/components/onboarding/ProgressIndicator';
import { OnboardingStep } from './types';
import { WelcomeStep } from './WelcomeStep';
import { AddItemsStep } from './AddItemsStep';
import { GenerateRecipesStep } from './GenerateRecipeStep';
import { UseRecipesStep } from './UseRecipeStep';

const steps: OnboardingStep[] = [
  'welcome',
  'add_items',
  'generate_recipes',
  'use_recipes'
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <WelcomeStep
            userName={user?.user_metadata?.name || 'Chef'}
            onNext={() => setCurrentStep('add_items')}
          />
        );
      case 'add_items':
        return (
          <AddItemsStep
            onNext={() => setCurrentStep('generate_recipes')}
            onBack={() => setCurrentStep('welcome')}
          />
        );
      case 'generate_recipes':
        return (
          <GenerateRecipesStep
            onNext={() => setCurrentStep('use_recipes')}
            onBack={() => setCurrentStep('add_items')}
          />
        );
      case 'use_recipes':
        return (
          <UseRecipesStep
            onComplete={() => router.push('/')}
            onBack={() => setCurrentStep('generate_recipes')}
          />
        );
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-900 rounded-xl p-8"
          >
            <ProgressIndicator 
              currentStep={steps.indexOf(currentStep)} 
              totalSteps={steps.length} 
            />
            {renderStep()}
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  );
}
