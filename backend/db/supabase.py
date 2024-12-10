import os
from typing import Optional

from supabase import Client, create_client


def get_supabase(auth_token: Optional[str] = None) -> Client:
    """
    Get a Supabase client instance.
    If auth_token is provided, it will be used for authenticated requests.
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Missing Supabase environment variables")
        
    client = create_client(supabase_url, supabase_key)
    
    # If an auth token is provided, set it for this request
    if auth_token:
        client.auth.set_session(access_token=auth_token)
    
    return client

