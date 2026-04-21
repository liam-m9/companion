'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { RelationshipType, Stage, Priority } from '@/types';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/onboarding/ProgressBar';
import StepLocation from '@/components/onboarding/StepLocation';
import StepRelationship from '@/components/onboarding/StepRelationship';
import StepStage from '@/components/onboarding/StepStage';
import StepPriorities from '@/components/onboarding/StepPriorities';
import StepChildren from '@/components/onboarding/StepChildren';

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [country, setCountry] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType | ''>('');
  const [stage, setStage] = useState<Stage | ''>('');
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [hasChildren, setHasChildren] = useState<boolean | null>(null);
  const [childrenCount, setChildrenCount] = useState<number | null>(null);
  const [childrenAges, setChildrenAges] = useState('');

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return country !== '';
      case 2:
        return relationshipType !== '';
      case 3:
        return stage !== '';
      case 4:
        return priorities.length > 0;
      case 5:
        return hasChildren !== null;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to complete onboarding');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          country,
          relationship_type: relationshipType,
          stage,
          priorities,
          has_children: hasChildren,
          children_count: hasChildren ? childrenCount : null,
          children_ages: hasChildren ? childrenAges : null,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      router.refresh();
      router.push('/dashboard');
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepLocation value={country} onChange={setCountry} />;
      case 2:
        return <StepRelationship value={relationshipType} onChange={setRelationshipType} />;
      case 3:
        return <StepStage value={stage} onChange={setStage} />;
      case 4:
        return <StepPriorities value={priorities} onChange={setPriorities} />;
      case 5:
        return (
          <StepChildren
            hasChildren={hasChildren}
            childrenCount={childrenCount}
            childrenAges={childrenAges}
            onHasChildrenChange={setHasChildren}
            onChildrenCountChange={setChildrenCount}
            onChildrenAgesChange={setChildrenAges}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
        </div>

        <Card className="p-6 sm:p-8">
          {renderStep()}

          {error && (
            <div className="mt-6 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700 space-y-3">
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
              {currentStep > 1 ? (
                <Button variant="outline" onClick={handleBack} className="w-full sm:w-auto">
                  Back
                </Button>
              ) : (
                <div className="hidden sm:block" />
              )}

              {currentStep < TOTAL_STEPS ? (
                <Button onClick={handleNext} disabled={!canProceed()} className="w-full sm:w-auto">
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={!canProceed()}
                  isLoading={isLoading}
                  className="w-full sm:w-auto"
                >
                  Complete Setup
                </Button>
              )}
            </div>

            {currentStep < TOTAL_STEPS && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  Skip this step
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
