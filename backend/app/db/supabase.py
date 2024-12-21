import os
from typing import Optional
from supabase import Client, create_client

def get_supabase() -> Client:
    """
    Get a Supabase client instance with service role.
    """
    supabase_url = os.getenv("SUPABASE_URL")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role key
    
    if not supabase_url or not service_role_key:
        raise ValueError("Missing Supabase environment variables")
        
    return create_client(supabase_url, service_role_key)

