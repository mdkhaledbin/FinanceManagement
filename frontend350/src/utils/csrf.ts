export function getCSRFToken(): string | null {
  const match = document.cookie.match(/(^|;)\s*csrftoken=([^;]*)/);
  return match ? decodeURIComponent(match[2]) : null;
}