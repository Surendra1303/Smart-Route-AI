import { create } from "zustand";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteMetrics {
  distance: number; // miles
  duration: number; // minutes
  fuelUsed: number;
  carbonEmission: number;
  ecoScore: number;
  safetyScore: number;
  warnings: string[];
}

export interface OBDTelemetry {
  speed: number;
  rpm: number;
  engineTemp: number;
  batteryVoltage: number;
  batteryHealth: number;
  oilLife: number;
  fuelLevel: number;
  tirePressureFL: number;
  tirePressureFR: number;
  tirePressureRL: number;
  tirePressureRR: number;
  odometer: number;
}

interface SmartRouteState {
  // Navigation & Location
  currentLocation: LatLng;
  destination: LatLng | null;
  destinationName: string;
  isNavigating: boolean;
  routingType: "FASTEST" | "ECO" | "SAFEST" | "SCENIC";
  routeAlternatives: Record<string, RouteMetrics> | null;
  activeMetrics: RouteMetrics | null;
  
  // HUD Overlays
  showTrafficOverlay: boolean;
  showWeatherOverlay: boolean;
  show3DBuildings: boolean;
  showSatelliteTerrain: boolean;
  
  // Vehicle Telemetry
  drivingMode: "ECO" | "SPORT" | "COMFORT" | "CUSTOM";
  telemetry: OBDTelemetry;
  ecoPoints: number;
  
  // AI assistant history
  chatHistory: { role: "user" | "assistant"; content: string }[];
  
  // Setters
  setCurrentLocation: (loc: LatLng) => void;
  setDestination: (dest: LatLng | null, name?: string) => void;
  startNavigation: (type?: "FASTEST" | "ECO" | "SAFEST" | "SCENIC") => void;
  stopNavigation: () => void;
  setRoutingType: (type: "FASTEST" | "ECO" | "SAFEST" | "SCENIC") => void;
  setRouteAlternatives: (alts: Record<string, RouteMetrics> | null) => void;
  toggleOverlay: (overlay: "traffic" | "weather" | "3d" | "satellite") => void;
  setDrivingMode: (mode: "ECO" | "SPORT" | "COMFORT" | "CUSTOM") => void;
  updateTelemetry: (data: Partial<OBDTelemetry>) => void;
  addChatMessage: (role: "user" | "assistant", content: string) => void;
  addEcoPoints: (points: number) => void;
}

export const useNavigationStore = create<SmartRouteState>((set) => ({
  currentLocation: { lat: 37.7749, lng: -122.4194 }, // SF default
  destination: null,
  destinationName: "",
  isNavigating: false,
  routingType: "FASTEST",
  routeAlternatives: null,
  activeMetrics: null,
  
  showTrafficOverlay: true,
  showWeatherOverlay: false,
  show3DBuildings: true,
  showSatelliteTerrain: false,
  
  drivingMode: "COMFORT",
  telemetry: {
    speed: 0,
    rpm: 800,
    engineTemp: 194.2,
    batteryVoltage: 12.6,
    batteryHealth: 96.0,
    oilLife: 82.0,
    fuelLevel: 85.0,
    tirePressureFL: 35.0,
    tirePressureFR: 35.2,
    tirePressureRL: 33.8,
    tirePressureRR: 34.0,
    odometer: 18452.1,
  },
  ecoPoints: 340,
  chatHistory: [
    { role: "assistant", content: "Welcome back, Driver. Map loaded. All vehicle systems nominal. Destination search or voice controls ready." }
  ],
  
  setCurrentLocation: (currentLocation) => set({ currentLocation }),
  setDestination: (destination, destinationName = "") => set({ destination, destinationName }),
  startNavigation: (type) => set((state) => {
    const selectedType = type || state.routingType;
    const active = state.routeAlternatives ? state.routeAlternatives[selectedType] : null;
    return {
      isNavigating: true,
      routingType: selectedType,
      activeMetrics: active || {
        distance: 32.5,
        duration: 38,
        fuelUsed: 1.1,
        carbonEmission: 9.8,
        ecoScore: 82,
        safetyScore: 90,
        warnings: [],
      }
    };
  }),
  stopNavigation: () => set({ isNavigating: false, activeMetrics: null }),
  setRoutingType: (routingType) => set((state) => ({
    routingType,
    activeMetrics: state.routeAlternatives ? state.routeAlternatives[routingType] : state.activeMetrics,
  })),
  setRouteAlternatives: (routeAlternatives) => set((state) => ({
    routeAlternatives,
    activeMetrics: routeAlternatives ? routeAlternatives[state.routingType] : state.activeMetrics,
  })),
  toggleOverlay: (overlay) => set((state) => {
    switch (overlay) {
      case "traffic": return { showTrafficOverlay: !state.showTrafficOverlay };
      case "weather": return { showWeatherOverlay: !state.showWeatherOverlay };
      case "3d": return { show3DBuildings: !state.show3DBuildings };
      case "satellite": return { showSatelliteTerrain: !state.showSatelliteTerrain };
    }
  }),
  setDrivingMode: (drivingMode) => set((state) => {
    return {
      drivingMode,
      telemetry: {
        ...state.telemetry,
        rpm: drivingMode === "SPORT" ? 1800 : drivingMode === "ECO" ? 900 : 1200,
      }
    };
  }),
  updateTelemetry: (data) => set((state) => ({
    telemetry: { ...state.telemetry, ...data }
  })),
  addChatMessage: (role, content) => set((state) => ({
    chatHistory: [...state.chatHistory, { role, content }]
  })),
  addEcoPoints: (points) => set((state) => ({
    ecoPoints: state.ecoPoints + points
  })),
}));
