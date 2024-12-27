-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level') THEN
        CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
    END IF;
END
$$;

-- Pantry items table
CREATE TABLE IF NOT EXISTS public.pantry_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    data jsonb NOT NULL DEFAULT '{
        "name": null,
        "original_name": null,
        "quantity": null,
        "unit": null,
        "category": null,
        "notes": null,
        "expiry_date": null,
        "price": null
    }'::jsonb,
    nutrition jsonb NOT NULL DEFAULT '{
        "standard_unit": "serving",
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "fiber": 0
    }'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    CONSTRAINT pantry_items_required_fields 
        CHECK (
            data -> 'name' IS NOT NULL AND
            data -> 'quantity' IS NOT NULL AND
            data -> 'quantity' > '0' AND
            data -> 'unit' IS NOT NULL
        )
);

-- Recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    data jsonb NOT NULL DEFAULT '{
        "name": null,
        "ingredients": [],
        "instructions": [],
        "preparation_time": null,
        "difficulty": "medium",
        "calculated_nutrition": {
            "total": {
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fat": 0,
                "fiber": 0
            },
            "per_serving": {
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fat": 0,
                "fiber": 0
            }
        },
        "servings": 1,
        "category": null
    }'::jsonb,
    is_public boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    CONSTRAINT recipes_required_fields 
        CHECK (
            data -> 'name' IS NOT NULL AND
            data -> 'ingredients' IS NOT NULL AND
            data -> 'instructions' IS NOT NULL AND
            data -> 'preparation_time' IS NOT NULL AND
            data -> 'category' IS NOT NULL AND
            data -> 'servings' IS NOT NULL AND
            (data -> 'servings')::int > 0
        )
);

-- Recipe interactions table
CREATE TABLE IF NOT EXISTS public.recipe_interactions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    data jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    
    -- Computed columns for efficient querying
    is_saved boolean GENERATED ALWAYS AS (
        type = 'save'
    ) STORED,
    rating numeric GENERATED ALWAYS AS (
        CASE WHEN type = 'rate' 
        THEN (data->>'rating')::numeric 
        ELSE NULL END
    ) STORED,

    CONSTRAINT valid_type CHECK (
        type = ANY(ARRAY['save', 'rate', 'cook'])
    ),
    -- Ensure only one save/rate per user per recipe
    CONSTRAINT idx_unique_save UNIQUE (user_id, recipe_id) WHERE type = 'save',
    CONSTRAINT idx_unique_rate UNIQUE (user_id, recipe_id) WHERE type = 'rate'
);

-- Indexes
CREATE INDEX idx_pantry_items_user ON pantry_items(user_id);
CREATE INDEX idx_pantry_items_name ON pantry_items USING gin(((data->>'name')::text) gin_trgm_ops);
CREATE INDEX idx_pantry_items_category ON pantry_items USING gin((data->>'category'));

CREATE INDEX idx_recipes_user ON recipes(user_id);
CREATE INDEX idx_recipes_public ON recipes(is_public) WHERE is_public = true;
CREATE INDEX idx_recipes_name ON recipes USING gin(((data->>'name')::text) gin_trgm_ops);
CREATE INDEX idx_recipes_category ON recipes USING gin((data->>'category'));

CREATE INDEX idx_recipe_interactions_user ON recipe_interactions(user_id);
CREATE INDEX idx_recipe_interactions_recipe ON recipe_interactions(recipe_id);
CREATE INDEX idx_recipe_interactions_type ON recipe_interactions(type);
CREATE INDEX idx_recipe_interactions_saved ON recipe_interactions(is_saved) WHERE is_saved = true;
CREATE INDEX idx_recipe_interactions_rating ON recipe_interactions(rating) WHERE rating IS NOT NULL;

-- RLS Policies
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_interactions ENABLE ROW LEVEL SECURITY;

-- Pantry RLS
CREATE POLICY "Users can manage their own pantry items" ON public.pantry_items 
    FOR ALL USING (auth.uid() = user_id);

-- Recipe RLS
CREATE POLICY "Users can read own or public recipes" ON public.recipes 
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can manage their own recipes" ON public.recipes 
    FOR ALL USING (auth.uid() = user_id);

-- Interaction RLS
CREATE POLICY "Users can manage their own interactions" ON public.recipe_interactions 
    FOR ALL USING (auth.uid() = user_id);

-- Add an index to improve join performance
CREATE INDEX idx_recipe_interactions_recipe ON recipe_interactions(recipe_id);

-- Add unique constraint to recipe_interactions
ALTER TABLE recipe_interactions 
ADD CONSTRAINT unique_user_recipe_interaction 
UNIQUE (user_id, recipe_id, type);

-- User profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    dietary_preferences jsonb NOT NULL DEFAULT '[]'::jsonb,
    goals jsonb NOT NULL DEFAULT '[]'::jsonb,
    default_servings integer NOT NULL DEFAULT 2,
    cooking_experience text NOT NULL DEFAULT 'beginner',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_servings CHECK (default_servings BETWEEN 1 AND 12)
);

-- Add RLS policy
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and update their own profile" ON public.user_profiles
    FOR ALL USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);
