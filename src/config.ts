export function getApiBase(): string {
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return (import.meta as any).env?.VITE_API_BASE_URL || '';
  }
  return '';
}
