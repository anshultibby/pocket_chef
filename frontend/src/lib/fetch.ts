export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    throw new Error('API URL not configured');
  }

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: defaultHeaders
  });

  if (!response.ok) {
    let errorMessage = 'API request failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // If parsing JSON fails, use status text
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  // Return null for 204 No Content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}
