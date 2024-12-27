export const ONBOARDING_IMAGES = {
  receipt: {
    upload: "/onboarding/receipt/upload.png",
    confirm: "/onboarding/receipt/confirm.png"
  },
  addItem: {
    form: "/onboarding/add-item/form.png"
  },
  recipes: {
    preferences: "/onboarding/recipes/preferences.png",
    generated: "/onboarding/recipes/generated.png",
    card: "/onboarding/recipes/card.png"
  },
  usage: {
    ingredients: "/onboarding/usage/ingredients.png",
    servings: "/onboarding/usage/servings.png",
    pantryUpdate: "/onboarding/usage/pantry-update.png"
  }
} as const;

export type OnboardingImageSection = keyof typeof ONBOARDING_IMAGES;
export type OnboardingImageType<T extends OnboardingImageSection> = keyof typeof ONBOARDING_IMAGES[T];
