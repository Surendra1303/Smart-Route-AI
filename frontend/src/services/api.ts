const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("auth_token");
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export function getAuthToken(): string | null {
  return localStorage.getItem("auth_token");
}

// Guest Login
export async function loginGuest(email: string, fullName?: string) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register-guest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, fullName }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Login failed");
  }
  return response.json();
}

// User Dashboard Data
export async function getDashboardData() {
  const response = await fetch(`${API_BASE_URL}/api/user/dashboard`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch dashboard metrics");
  }
  return response.json();
}

// Vehicle telemetry & settings
export async function getVehicleStatus() {
  const response = await fetch(`${API_BASE_URL}/api/vehicle`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch vehicle status");
  return response.json();
}

export async function updateVehicleStatus(data: any) {
  const response = await fetch(`${API_BASE_URL}/api/vehicle/update`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Failed to update vehicle");
  return response.json();
}

export async function getVehicleDiagnosticsStream() {
  const response = await fetch(`${API_BASE_URL}/api/vehicle/diagnostics`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to read diagnostics stream");
  return response.json();
}

export async function getTripLogs() {
  const response = await fetch(`${API_BASE_URL}/api/vehicle/trips`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch trip logs");
  return response.json();
}

export async function logCompletedTrip(tripData: any) {
  const response = await fetch(`${API_BASE_URL}/api/vehicle/trip`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(tripData),
  });
  if (!response.ok) throw new Error("Failed to log trip");
  return response.json();
}

// Incidents & Hazards
export async function getRoadIncidents() {
  const response = await fetch(`${API_BASE_URL}/api/incidents`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch reported incidents");
  return response.json();
}

export async function reportRoadIncident(incident: {
  type: string;
  latitude: number;
  longitude: number;
  description: string;
  severity: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/incidents/report`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(incident),
  });
  if (!response.ok) throw new Error("Failed to report incident");
  return response.json();
}

// Navigation & Favorites
export async function getFavoritePlaces() {
  const response = await fetch(`${API_BASE_URL}/api/navigation/favorites`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to fetch favorite places");
  return response.json();
}

export async function addFavoritePlace(place: {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/navigation/favorites`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(place),
  });
  if (!response.ok) throw new Error("Failed to save favorite place");
  return response.json();
}

export async function calculateRouteComparison(startCoords: [number, number], endCoords: [number, number]) {
  const response = await fetch(`${API_BASE_URL}/api/navigation/calculate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ startCoords, endCoords }),
  });
  if (!response.ok) throw new Error("Failed to calculate routing variations");
  return response.json();
}

// AI Copilot
export async function sendChatMessageToCopilot(message: string, chatHistory: any[]) {
  const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ message, chatHistory }),
  });
  if (!response.ok) throw new Error("AI assistant request failed");
  return response.json();
}

export async function getChatHistory() {
  const response = await fetch(`${API_BASE_URL}/api/ai/history`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Failed to load chat logs");
  return response.json();
}
