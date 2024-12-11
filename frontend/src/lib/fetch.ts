export const fetchApi = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const url = `${baseUrl}${path}`;
  
  const isFormData = options?.body instanceof FormData;
  
  console.log('Fetch request:', {
    url,
    method: options?.method,
    headers: options?.headers,
    bodyType: options?.body ? typeof options.body : null,
    isFormData
  });

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText
    });
    throw new Error(errorText);
  }

  return response.json();
};
