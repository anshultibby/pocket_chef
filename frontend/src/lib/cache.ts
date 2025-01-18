interface CacheItem<T> {
  value: T;
  expiry: number;
}

class Cache {
  private storage: Map<string, CacheItem<any>> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const item = this.storage.get(key);
    
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.storage.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    this.storage.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
  }
}

export const cache = new Cache(); 