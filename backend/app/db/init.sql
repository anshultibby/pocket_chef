-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- Create custom types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level') THEN
        create type difficulty_level as enum ('easy', 'medium', 'hard');
    END IF;
END
$$;

-- Pantry items
create table if not exists public.pantry_items (
    id uuid default uuid_generate_v4() primary key,
    data jsonb not null default '{
        "name": null,
        "standard_name": null,
        "quantity": null,
        "unit": null,
        "category": null,
        "notes": null,
        "expiry_date": null,
        "price": null
    }'::jsonb,
    nutrition jsonb not null default '{
        "standard_unit": "serving",
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "fiber": 0
    }'::jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    user_id uuid references auth.users(id) on delete cascade not null,
    constraint pantry_items_required_fields 
        check (
            data -> 'name' is not null and
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
                "standard_unit": "serving",
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fat": 0,
                "fiber": 0
            },
            "per_serving": {
                "standard_unit": "serving",
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
    is_public boolean default false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    user_id uuid references auth.users(id) on delete cascade not null,
    constraint recipes_required_fields 
        check (
            data -> 'name' is not null and
            data -> 'ingredients' is not null and
            data -> 'instructions' is not null and
            data -> 'preparation_time' is not null and
            data -> 'category' is not null and
            data -> 'servings' is not null and
            (data -> 'servings')::int > 0
        )
);

-- Indexes
create index if not exists idx_pantry_items_user on pantry_items (user_id);
create index if not exists idx_pantry_items_name 
    on pantry_items using gin (((data -> 'name')::text) gin_trgm_ops);
create index if not exists idx_pantry_items_category 
    on pantry_items using gin ((data ->> 'category'));

create index if not exists idx_recipes_user on recipes (user_id);
create index if not exists idx_recipes_public on recipes (is_public) where is_public = true;
create index if not exists idx_recipes_name 
    on recipes using gin (((data -> 'name')::text) gin_trgm_ops);
create index if not exists idx_recipes_category
    on recipes using gin ((data ->> 'category'));

-- RLS Policies
alter table public.pantry_items enable row level security;
alter table public.recipes enable row level security;

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
            "pantry_item_id": "uuid",
            "quantity": 2.0,
            "unit": "units",
            "notes": "optional notes",
            "is_optional": false
        }
    ]
}';

-- Example pantry item structure
COMMENT ON TABLE pantry_items IS 'Example pantry item:
{
    "data": {
        "name": "Eggs",
        "standard_name": "Large Eggs",
        "quantity": 12,
        "unit": "units",
        "category": "Dairy & Eggs",
        "notes": "organic",
        "expiry_date": "2024-04-01T00:00:00Z",
        "price": 4.99
    },
    "nutrition": {
        "standard_unit": "serving",
        "calories": 70,
        "protein": 6,
        "carbs": 0.6,
        "fat": 5,
        "fiber": 0
    }
}';

-- Add index for pantry item name lookups
CREATE INDEX IF NOT EXISTS idx_pantry_items_name ON pantry_items ((data->>'name'));

-- Add indexes for recipe lookups
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_is_saved ON recipes(is_saved);
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes((data->>'category'));

-- Recipe table structure
COMMENT ON TABLE recipes IS 'Example recipe:
{
    "data": {
        "name": "Scrambled Eggs",
        "ingredients": [
            {
                "name": "Eggs",
                "quantity": 2,
                "unit": "units",
                "notes": "large",
                "pantry_item_id": "uuid-here",
                "is_optional": false,
                "substitutes": []
            }
        ],
        "instructions": ["Beat eggs", "Cook in pan"],
        "preparation_time": 10,
        "calculated_nutrition": {
            "total": {
                "calories": 140,
                "protein": 12,
                "carbs": 1.2,
                "fat": 10,
                "fiber": 0
            },
            "per_serving": {
                "calories": 140,
                "protein": 12,
                "carbs": 1.2,
                "fat": 10,
                "fiber": 0
            }
        },
        "servings": 1,
        "category": "breakfast"
    },
    "is_saved": true
}';
