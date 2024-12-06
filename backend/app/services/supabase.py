from os import getenv
from typing import Optional

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

class SupabaseService:
    def __init__(self):
        self.supabase_url = getenv("SUPABASE_URL")
        self.supabase_key = getenv("SUPABASE_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("Missing Supabase environment variables")
            
        self.client: Optional[Client] = None

    def initialize(self):
        """Initialization of the Supabase client"""
        if self.client is None:
            self.client = create_client(
                self.supabase_url,
                self.supabase_key
            )

    def table(self, table_name: str):
        """Get a table reference with initialized client"""
        if self.client is None:
            self.initialize()
        return self.client.table(table_name)

    def from_(self, table_name: str):
        """Alias for table() to match Supabase syntax"""
        return self.table(table_name)

# Create a singleton instance
_supabase_service = SupabaseService()

def get_supabase() -> SupabaseService:
    """Get the Supabase service instance"""
    if _supabase_service.client is None:
        _supabase_service.initialize()
    return _supabase_service
