-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- Create custom types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level') THEN
        create type difficulty_level as enum ('easy', 'medium', 'hard');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'measurement_unit') THEN
        create type measurement_unit as enum (
            'grams',
            'milliliters',
            'units',
            'pinch'
        );
    END IF;
END
$$;

-- Base ingredients dictionary
create table if not exists public.ingredients (
    id uuid default uuid_generate_v4() primary key,
    data jsonb not null default '{
        "names": {
            "canonical": null,
            "aliases": []
        },
        "measurement": {
            "standard_unit": null,
            "conversion_factor": 1.0,
            "serving_size": 1
        },
        "nutrition": {
            "per_standard_unit": {
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fat": 0,
                "fiber": 0
            }
        }
    }'::jsonb,
    created_at timestamp with time zone default now(),
    constraint ingredients_canonical_name_required 
        check (data -> 'names' -> 'canonical' is not null)
);

-- Pantry items
create table if not exists public.pantry_items (
    id uuid default uuid_generate_v4() primary key,
    ingredient_id uuid references public.ingredients(id) on delete restrict,
    data jsonb not null default '{
        "display_name": null,
        "quantity": null,
        "unit": null,
        "category": null,
        "notes": null
    }'::jsonb,
    expiry_date timestamp with time zone,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    user_id uuid references auth.users(id) on delete cascade not null,
    constraint pantry_items_required_fields 
        check (
            data -> 'display_name' is not null and
            data -> 'quantity' is not null and
            data -> 'quantity' > '0' and
            data -> 'unit' is not null
        )
);

-- Recipes
create table if not exists public.recipes (
    id uuid default uuid_generate_v4() primary key,
    data jsonb not null default '{
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
    recipe_type text CHECK (recipe_type IN ('generated', 'user_created', 'saved')) default 'generated',
    is_public boolean default false,
    original_recipe_id uuid references public.recipes(id),
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    user_id uuid references auth.users(id) on delete cascade not null,
    constraint recipes_required_fields 
        check (
            data -> 'name' is not null and
            data -> 'ingredients' is not null and
            data -> 'instructions' is not null and
            data -> 'servings' is not null and
            (data -> 'servings')::int > 0
        )
);

-- Indexes
-- create index if not exists idx_ingredients_canonical_name 
--     on ingredients using gin (((data -> 'names' -> 'canonical')::text) gin_trgm_ops);
-- create index if not exists idx_ingredients_aliases 
--     on ingredients using gin ((data -> 'names' -> 'aliases') jsonb_ops);
-- create index if not exists idx_ingredients_category 
--     on ingredients using gin ((data ->> 'category'));

create index if not exists idx_pantry_items_user on pantry_items (user_id);
create index if not exists idx_pantry_items_ingredient on pantry_items (ingredient_id);
create index if not exists idx_pantry_items_category 
    on pantry_items using gin ((data ->> 'category'));

create index if not exists idx_recipes_user on recipes (user_id);
create index if not exists idx_recipes_type on recipes (recipe_type);
create index if not exists idx_recipes_public on recipes (is_public) where is_public = true;
create index if not exists idx_recipes_name 
    on recipes using gin (((data -> 'name')::text) gin_trgm_ops);

create index if not exists idx_recipes_ingredients 
    on recipes USING GIN ((data->'ingredients'));

create index if not exists idx_recipes_nutrition 
    on recipes USING GIN ((data->'calculated_nutrition'));

create index if not exists idx_pantry_items_quantity 
    on pantry_items ((data->>'quantity'));

-- RLS Policies
alter table public.ingredients enable row level security;
alter table public.pantry_items enable row level security;
alter table public.recipes enable row level security;

create policy "Everyone can read ingredients" 
    on public.ingredients for select using (true);

create policy "Users can read own pantry items" 
    on public.pantry_items for select using (auth.uid() = user_id);

create policy "Users can insert own pantry items" 
    on public.pantry_items for insert with check (auth.uid() = user_id);

create policy "Users can update own pantry items" 
    on public.pantry_items for update using (auth.uid() = user_id);

create policy "Users can delete own pantry items" 
    on public.pantry_items for delete using (auth.uid() = user_id);

create policy "Users can read own or public recipes" 
    on public.recipes for select using (auth.uid() = user_id OR is_public = true);

create policy "Users can insert own recipes" 
    on public.recipes for insert with check (auth.uid() = user_id);

create policy "Users can update own recipes" 
    on public.recipes for update using (auth.uid() = user_id);

create policy "Users can delete own recipes" 
    on public.recipes for delete using (auth.uid() = user_id);

-- Recipe ingredients structure example:
COMMENT ON TABLE recipes IS 'Recipe ingredients structure:
{
    "ingredients": [
        {
            "ingredient_id": "uuid",
            "quantity": 2,
            "unit": "units",
            "notes": "beaten"
        }
    ]
}';

-- Example ingredient structure
COMMENT ON TABLE ingredients IS 'Example ingredient:
{
    "names": {
        "canonical": "egg",
        "aliases": ["large egg", "medium egg"]
    },
    "measurement": {
        "standard_unit": "units",
        "conversion_factor": 1.0,
        "serving_size": 1
    },
    "nutrition": {
        "per_standard_unit": {
            "calories": 70,
            "protein": 6,
            "carbs": 0.6,
            "fat": 5,
            "fiber": 0
        }
    }
}';
