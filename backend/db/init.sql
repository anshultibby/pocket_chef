-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types if needed
create type difficulty_level as enum ('easy', 'medium', 'hard');

-- Create pantry_items table
create table if not exists public.pantry_items (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    quantity decimal not null,
    unit text not null,
    category text,
    expiry_date timestamp with time zone,
    notes text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    user_id uuid references public.users(id)
);

-- Create recipes table
create table if not exists public.recipes (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    ingredients jsonb not null, -- Stores array of ingredients
    instructions jsonb not null, -- Stores array of steps
    preparation_time interval,
    difficulty difficulty_level default 'medium',
    nutritional_info jsonb,
    is_saved boolean default false,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    user_id uuid references public.users(id)
);

-- Create function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_pantry_items_updated_at
    before update on pantry_items
    for each row
    execute function update_updated_at_column();

create trigger update_recipes_updated_at
    before update on recipes
    for each row
    execute function update_updated_at_column();

-- Enable Row Level Security (RLS)
alter table public.pantry_items enable row level security;
alter table public.recipes enable row level security;

-- Create RLS policies
create policy "Users can read own pantry items" on public.pantry_items
    for select using (auth.uid() = user_id);

create policy "Users can insert own pantry items" on public.pantry_items
    for insert with check (auth.uid() = user_id);

create policy "Users can update own pantry items" on public.pantry_items
    for update using (auth.uid() = user_id);

create policy "Users can delete own pantry items" on public.pantry_items
    for delete using (auth.uid() = user_id);

-- Repeat policies for recipes table
create policy "Users can read own recipes" on public.recipes
    for select using (auth.uid() = user_id);

create policy "Users can insert own recipes" on public.recipes
    for insert with check (auth.uid() = user_id);

create policy "Users can update own recipes" on public.recipes
    for update using (auth.uid() = user_id);

create policy "Users can delete own recipes" on public.recipes
    for delete using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists idx_pantry_items_name on pantry_items (name);
create index if not exists idx_pantry_items_category on pantry_items (category);
create index if not exists idx_recipes_name on recipes (name);
create index if not exists idx_recipes_is_saved on recipes (is_saved);

-- Create users table
create table if not exists public.users (
    id uuid default uuid_generate_v4() primary key,
    email text unique not null,
    password_hash text not null,
    name text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
