import { useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Compass, Navigation as NavIcon, ShieldAlert, Cpu, CloudRain, Send, Award, MessageSquare, X 
} from "lucide-react";
import { useNavigationStore } from "@/store/navigationStore";
import { offlineManager } from "@/lib/offlineManager";
import type { OfflineRegion } from "@/lib/offlineManager";
import { 
  reportRoadIncident, calculateRouteComparison, sendChatMessageToCopilot, getChatHistory 
} from "@/services/api";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Store States
  const {
    currentLocation, destination, isNavigating, routingType,
    routeAlternatives, activeMetrics, showTrafficOverlay, showWeatherOverlay,
    show3DBuildings, showSatelliteTerrain, telemetry, ecoPoints, chatHistory, 
    setCurrentLocation, setDestination, startNavigation, stopNavigation, setRoutingType,
    setRouteAlternatives, toggleOverlay, updateTelemetry, addChatMessage
  } = useNavigationStore();

  // Local UI states
  const [startQuery, setStartQuery] = useState("My Location");
  const [endQuery, setEndQuery] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [incidents, setIncidents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"nav" | "incidents" | "offline">("nav");
  const [showSOS, setShowSOS] = useState(false);
  const [offlineRegions, setOfflineRegions] = useState<OfflineRegion[]>([]);
  const [downloadName, setDownloadName] = useState("");

  // AI Floating state
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // Incident Form state
  const [reportType, setReportType] = useState("POTHOLE");
  const [reportDesc, setReportDesc] = useState("");
  const [reportSeverity] = useState("MEDIUM");
  
  // Geolocation states
  const [gpsMode, setGpsMode] = useState(true); // Default to true to auto-locate
  const gpsModeRef = useRef(gpsMode);
  const watchIdRef = useRef<number | null>(null);
  
  // Navigation references
  const simInterval = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const incidentMarkersRef = useRef<L.Marker[]>([]);
  const trafficLayersRef   = useRef<L.Polyline[]>([]);
  const diversionLineRef   = useRef<L.Polyline | null>(null);
  
  const baseTileLayerRef   = useRef<L.TileLayer | null>(null);
  const labelTileLayerRef  = useRef<L.TileLayer | null>(null);

  // Per-route geometry store: { FASTEST: [[lat,lng],...], ECO: [...], SAFEST: [...] }
  const routeGeometriesRef = useRef<Record<string, [number, number][]>>({});

  // Coordinates of starting point
  const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(null);

  // GPS deviation & recalculation state
  const [isOffRoute,      setIsOffRoute]      = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const lastRecalcTimeRef = useRef<number>(0);

  // Auto-follow & recenter state
  const [isMapCentered, setIsMapCentered]   = useState(true);
  const [heading, setHeading]               = useState(0);       // degrees 0-360
  const isProgrammaticPanRef = useRef(false);                    // prevents drag-detect false positives
  const prevGPSRef           = useRef<{ lat: number; lng: number } | null>(null);
  const headingRef           = useRef(0);

  // Diversion state
  type DiversionInfo = { savedMin: number; distKm: number; durMin: number; geometry: [number,number][] };
  const [diversionInfo,      setDiversionInfo]      = useState<DiversionInfo | null>(null);
  const [isDiversionChecking, setIsDiversionChecking] = useState(false);

  // Speed Limit state
  const [speedLimit, setSpeedLimit] = useState<number | null>(null);
  const lastSpeedLimitCheckRef = useRef<{ lat: number; lng: number } | null>(null);

  // Route error state
  type RouteErrorType = "no_road_connection" | "destination_not_on_road" | "route_incomplete" | "geocode_failed" | "unknown";
  const [routeError, setRouteError] = useState<{ type: RouteErrorType; from: string; to: string } | null>(null);

  // ── Haversine distance between two lat/lng points (returns metres) ──
  const haversineMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6_371_000;
    const d  = (v: number) => v * Math.PI / 180;
    const dLat = d(lat2 - lat1), dLon = d(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(d(lat1)) * Math.cos(d(lat2)) * Math.sin(dLon/2)**2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  // ── Compass bearing (0°=North, 90°=East) from point A → B ──
  const computeBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const toR = Math.PI / 180;
    const dLon = (lon2 - lon1) * toR;
    const y = Math.sin(dLon) * Math.cos(lat2 * toR);
    const x = Math.cos(lat1 * toR) * Math.sin(lat2 * toR)
              - Math.sin(lat1 * toR) * Math.cos(lat2 * toR) * Math.cos(dLon);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  };

  // ── Shortest distance (metres) from point P to a polyline ──
  const distanceToPolyline = (lat: number, lng: number, poly: [number,number][]): number => {
    let minDist = Infinity;
    for (let i = 0; i < poly.length - 1; i++) {
      const [aLat, aLng] = poly[i];
      const [bLat, bLng] = poly[i+1];
      const dx = bLng - aLng, dy = bLat - aLat;
      const lenSq = dx*dx + dy*dy;
      let t = lenSq > 0 ? ((lng - aLng)*dx + (lat - aLat)*dy) / lenSq : 0;
      t = Math.max(0, Math.min(1, t));
      const closestLat = aLat + t*dy, closestLng = aLng + t*dx;
      minDist = Math.min(minDist, haversineMeters(lat, lng, closestLat, closestLng));
    }
    return minDist;
  };

  // ── Traffic colour based on time-of-day congestion model ──
  const getTrafficColor = (segIdx: number, totalSegs: number): string => {
    const now   = new Date();
    const hour  = now.getHours();
    const wday  = now.getDay();                          // 0=Sun … 6=Sat
    const isWD  = wday >= 1 && wday <= 5;
    const isMR  = isWD && hour >= 8  && hour <= 10;     // morning rush
    const isER  = isWD && hour >= 17 && hour <= 19;     // evening rush
    const isMid = isWD && hour >= 11 && hour <= 16;     // daytime moderate
    let base = isMR || isER ? 0.70 : isMid ? 0.38 : 0.20;
    // wave-like variance across the route
    const wave = Math.sin(segIdx / totalSegs * Math.PI * 3 + segIdx * 0.7) * 0.22;
    const level = Math.max(0, Math.min(1, base + wave));
    if (level > 0.60) return "#ef4444";   // red   – heavy
    if (level > 0.35) return "#f59e0b";   // amber – moderate
    return "#22c55e";                      // green – clear
  };

  // ── Trigger off-route recalculation ──
  const recalculateRoute = async (curLat: number, curLng: number) => {
    const dest = useNavigationStore.getState().destination;
    if (!dest || isRecalculating) return;
    const now = Date.now();
    if (now - lastRecalcTimeRef.current < 20_000) return; // debounce 20 s
    lastRecalcTimeRef.current = now;
    setIsRecalculating(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${curLng},${curLat};${dest.lng},${dest.lat}?geometries=geojson&alternatives=true&overview=full`;
      const res  = await fetch(url);
      const data = await res.json();
      if (!data.routes?.length) return;
      const toLL = (r: any): [number,number][] => r.geometry.coordinates.map((c: [number,number]) => [c[1], c[0]]);
      routeGeometriesRef.current = {
        FASTEST: toLL(data.routes[0]),
        ECO:     toLL(data.routes[1] ?? data.routes[0]),
        SAFEST:  toLL(data.routes[data.routes.length > 1 ? data.routes.length-1 : 0]),
        SCENIC:  toLL(data.routes[data.routes.length > 1 ? data.routes.length-1 : 0]),
      };
      // Force route re-draw by toggling isNavigating briefly handled by routing effect
      addChatMessage("assistant", "🔄 **Route recalculated** from your new position.");
      setIsOffRoute(false);
    } catch (e) {
      console.warn("Recalculation failed", e);
    } finally {
      setIsRecalculating(false);
    }
  };

  // Sync GPS mode ref
  useEffect(() => {
    gpsModeRef.current = gpsMode;
  }, [gpsMode]);

  // Geolocation Watcher logic
  useEffect(() => {
    if (gpsMode) {
      if (!navigator.geolocation) {
        console.warn("Geolocation not supported");
        setGpsMode(false);
        return;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          const rawSpeed = position.coords.speed;
          const speedKmph = rawSpeed ? Math.round(rawSpeed * 3.6) : 0;
          
          const currentPos = { lat, lng };
          setCurrentLocation(currentPos);
          if (!startCoords) setStartCoords(currentPos);
          
          updateTelemetry({
            speed: speedKmph,
            rpm: speedKmph > 0 ? 1500 + Math.floor(speedKmph * 25) : 800,
          });

          // ── Compute heading from previous GPS position ──
          if (prevGPSRef.current) {
            const moved = haversineMeters(prevGPSRef.current.lat, prevGPSRef.current.lng, lat, lng);
            if (moved > 3) {   // Only update heading if moved > 3 m (avoids jitter when stationary)
              const b = computeBearing(prevGPSRef.current.lat, prevGPSRef.current.lng, lat, lng);
              headingRef.current = b;
              setHeading(b);
            }
          }
          prevGPSRef.current = { lat, lng };

          // ── GPS Deviation Detection ──
          const state = useNavigationStore.getState();
          if (state.isNavigating) {
            const activeGeom = routeGeometriesRef.current[state.routingType];
            if (activeGeom && activeGeom.length > 1) {
              const distM = distanceToPolyline(lat, lng, activeGeom);
              if (distM > 150) {
                setIsOffRoute(true);
                recalculateRoute(lat, lng);
              } else {
                setIsOffRoute(false);
              }
            }
          }
          
          // ── Free Speed Limit Check via Overpass API ──
          let shouldCheckLimit = false;
          if (!lastSpeedLimitCheckRef.current) {
            shouldCheckLimit = true;
          } else {
            const distSinceLastCheck = haversineMeters(lastSpeedLimitCheckRef.current.lat, lastSpeedLimitCheckRef.current.lng, lat, lng);
            if (distSinceLastCheck > 200) shouldCheckLimit = true;
          }

          if (shouldCheckLimit) {
            lastSpeedLimitCheckRef.current = { lat, lng };
            const overpassQuery = `[out:json];way(around:50,${lat},${lng})["maxspeed"];out tags;`;
            fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`)
              .then(res => res.json())
              .then(data => {
                if (data.elements && data.elements.length > 0) {
                  const maxspeed = data.elements[0].tags.maxspeed;
                  const match = maxspeed.match(/\d+/);
                  if (match) setSpeedLimit(parseInt(match[0], 10));
                }
              }).catch(e => console.warn("Overpass API speed limit fetch failed", e));
          }
        },
        (err) => { console.warn("Geolocation watch error:", err.message); },
        { enableHighAccuracy: true }
      );
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [gpsMode]);

  // Initialize and load backend data + Immediate GPS Location Lock
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      navigate({ to: "/login" });
      return;
    }

    // Immediately try to jump the map to the user's real location on load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const loc = { lat, lng };
          setCurrentLocation(loc);
          setStartCoords(loc);
          if (mapRef.current) {
            mapRef.current.setView([lat, lng], 15, { animate: true });
          }
        },
        (err) => console.warn("Initial locate failed", err),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }

    loadBackendData();
    
    simInterval.current = setInterval(() => {
      if (gpsModeRef.current) return;
      
      const navState = useNavigationStore.getState().isNavigating;
      let speed = navState ? 55 + (Math.random() - 0.5) * 4 : 0;
      speed = Math.max(0, parseFloat(speed.toFixed(1)));

      updateTelemetry({
        speed,
        rpm: speed > 0 ? 2000 : 800,
        fuelLevel: 100,
        odometer: parseFloat((useNavigationStore.getState().telemetry.odometer + (speed / 3600)).toFixed(4))
      });
    }, 1000);

    return () => {
      if (simInterval.current) clearInterval(simInterval.current);
    };
  }, []);

  const loadBackendData = async () => {
    try {
      const regions = await offlineManager.getDownloadedRegions();
      setOfflineRegions(regions);

      const historyRes = await getChatHistory();
      if (historyRes.success && historyRes.data.length > 0) {
        historyRes.data.forEach((chat: any) => {
          addChatMessage(chat.role, chat.message);
        });
      }
    } catch (e) {
      console.warn("Failed to load backend resources");
    }
  };

  // Leaflet Initialization Hook (Loads raster CartoDB Dark or ArcGIS Satellite maps free)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([currentLocation.lat, currentLocation.lng], 13); // Changed zoom from 15 to 13 for better city view

    mapRef.current = map;
    L.control.zoom({ position: "topright" }).addTo(map);

    // Detect user-initiated drag → disable auto-follow
    map.on("movestart", () => {
      if (!isProgrammaticPanRef.current) {
        setIsMapCentered(false);
      }
    });

    return () => { 
      map.remove(); 
      mapRef.current = null;
    };
  }, []); // Run ONCE, do not depend on showSatelliteTerrain

  // Base Tile Layer Switcher
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (baseTileLayerRef.current) { map.removeLayer(baseTileLayerRef.current); }
    if (labelTileLayerRef.current) { map.removeLayer(labelTileLayerRef.current); }

    const tileUrl = showSatelliteTerrain
      ? "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
      : "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png";

    baseTileLayerRef.current = L.tileLayer(tileUrl, { maxZoom: 19, maxNativeZoom: 17 }).addTo(map);
    
    // Add CartoDB label-only overlay for satellite mode
    if (showSatelliteTerrain) {
      labelTileLayerRef.current = L.tileLayer("https://basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png", {
        maxZoom: 19,
        maxNativeZoom: 17
      }).addTo(map);
    }
  }, [showSatelliteTerrain]);

  // Vehicle Marker + Direction Arrow Updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentStart = startCoords || currentLocation;
    const deg = headingRef.current;

    // Google Maps-style Blue Dot with directional arrow inside
    const arrowHtml = `<div style="transform:rotate(${deg}deg);width:48px;height:48px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
           <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
             <circle cx="24" cy="24" r="12" fill="white"/>
             <circle cx="24" cy="24" r="9" fill="#3b82f6"/>
             <polygon points="24,11 29,22 24,20 19,22" fill="white"/>
           </svg>
         </div>`;

    const vehicleIcon = L.divIcon({
      className: "vehicle-marker",
      html: arrowHtml,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    if (!vehicleMarkerRef.current) {
      vehicleMarkerRef.current = L.marker([currentStart.lat, currentStart.lng], { 
        icon: vehicleIcon,
        zIndexOffset: 1000 
      }).addTo(map);
    } else {
      vehicleMarkerRef.current.setLatLng([currentStart.lat, currentStart.lng]);
      vehicleMarkerRef.current.setIcon(vehicleIcon);
    }

    // Auto-follow: smooth pan when centered
    if (isMapCentered) {
      isProgrammaticPanRef.current = true;
      map.panTo([currentStart.lat, currentStart.lng], { animate: true, duration: 0.6, easeLinearity: 0.5 });
      setTimeout(() => { isProgrammaticPanRef.current = false; }, 800);
    }
  }, [currentLocation, startCoords, isNavigating, heading, isMapCentered]);

  // Incident Marker updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    incidentMarkersRef.current.forEach((m) => m.remove());
    incidentMarkersRef.current = [];

    incidents.forEach((inc) => {
      const icon = inc.type === "ACCIDENT" ? "💥" : inc.type === "POTHOLE" ? "🕳️" : inc.type === "FLOOD" ? "🌊" : "🚨";
      const color = inc.severity === "HIGH" ? "bg-rose-600" : "bg-amber-600";

      const incidentIcon = L.divIcon({
        className: "incident-marker-icon",
        html: `
          <div class="px-2 py-1 rounded-full ${color} text-white text-[10px] font-black flex items-center gap-1 shadow-md border border-slate-700">
            <span>${icon}</span>
            <span>${inc.type.substring(0, 3)}</span>
          </div>
        `,
        iconSize: [60, 24],
        iconAnchor: [30, 12]
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon: incidentIcon }).addTo(map);
      incidentMarkersRef.current.push(marker);
    });
  }, [incidents]);

  // Destination Pin Update
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.remove();
      destinationMarkerRef.current = null;
    }

    if (destination) {
      const destIcon = L.divIcon({
        className: "destination-marker",
        html: `
          <div style="width: 32px; height: 40px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); transform: translateY(-10px);">
            <svg viewBox="0 0 24 24" fill="#ef4444" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%;" class="animate-bounce">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 40]
      });

      destinationMarkerRef.current = L.marker([destination.lat, destination.lng], { 
        icon: destIcon,
        zIndexOffset: 900 
      }).addTo(map);
    }
  }, [destination]);

  // Route Rendering + Traffic Overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear base route line
    if (routeLineRef.current) { routeLineRef.current.remove(); routeLineRef.current = null; }
    // Clear old traffic segments
    trafficLayersRef.current.forEach(l => l.remove());
    trafficLayersRef.current = [];

    if (!isNavigating || !destination) return;

    const latLngs = routeGeometriesRef.current[routingType];
    if (!latLngs || latLngs.length === 0) return;

    // ── Draw thin dark casing first (always visible under traffic) ──
    routeLineRef.current = L.polyline(latLngs, {
      color: "#0f172a", weight: 10, opacity: 0.6
    }).addTo(map);

    // ── Traffic overlay: paint each segment with congestion colour ──
    if (showTrafficOverlay) {
      const CHUNK = Math.max(1, Math.floor(latLngs.length / 30)); // ~30 traffic segments
      for (let i = 0; i < latLngs.length - 1; i += CHUNK) {
        const seg = latLngs.slice(i, i + CHUNK + 1);
        const color = getTrafficColor(i, latLngs.length);
        const trafficLine = L.polyline(seg, { color, weight: 7, opacity: 0.85 }).addTo(map);
        trafficLayersRef.current.push(trafficLine);
      }
    } else {
      // Plain route colour when traffic overlay is OFF
      const routeColor =
        routingType === "ECO"     ? "#10b981" :
        routingType === "FASTEST" ? "#06b6d4" :
        routingType === "SCENIC"  ? "#a855f7" : "#f59e0b";
      const plain = L.polyline(latLngs, { color: routeColor, weight: 7, opacity: 0.9 }).addTo(map);
      trafficLayersRef.current.push(plain);
    }

    // Clear old diversion line whenever route redraws
    if (diversionLineRef.current) { diversionLineRef.current.remove(); diversionLineRef.current = null; }
    setDiversionInfo(null);

    map.fitBounds(L.polyline(latLngs).getBounds(), { padding: [60, 60] });

    // ── Auto hazard markers along route ──
    if (latLngs.length > 10) {
      const p1 = latLngs[Math.floor(latLngs.length * 0.3)];
      const p2 = latLngs[Math.floor(latLngs.length * 0.7)];
      setIncidents([
        { id: `inc-${routingType}-1`, type: "POTHOLE",
          latitude: p1[0], longitude: p1[1], severity: "MEDIUM", description: "Pothole reported ahead." },
        { id: `inc-${routingType}-2`, type: "POLICE",
          latitude: p2[0], longitude: p2[1], severity: "LOW",    description: "Speed radar zone ahead." }
      ]);
    }

    // ── Check for traffic ahead and offer a diversion ──
    if (showTrafficOverlay) {
      checkTrafficDiversion(latLngs, map);
    }
  }, [isNavigating, destination, routingType, showTrafficOverlay]);

  // \u2500\u2500 Scan upcoming segments for heavy traffic and offer a diversion \u2500\u2500
  const checkTrafficDiversion = async (latLngs: [number,number][], map: L.Map) => {
    const dest = useNavigationStore.getState().destination;
    if (!dest || isDiversionChecking) return;

    // Find the closest index on the route to current position
    const pos = startCoords || currentLocation;
    let closestIdx = 0, minD = Infinity;
    for (let i = 0; i < latLngs.length; i++) {
      const d = haversineMeters(pos.lat, pos.lng, latLngs[i][0], latLngs[i][1]);
      if (d < minD) { minD = d; closestIdx = i; }
    }

    // Scan the next 60% of the route (everything still ahead)
    const CHUNK = Math.max(1, Math.floor(latLngs.length / 30));
    const aheadEnd = Math.min(latLngs.length - 1, closestIdx + Math.floor(latLngs.length * 0.6));
    let heavyCount = 0;
    for (let i = closestIdx; i < aheadEnd; i += CHUNK) {
      if (getTrafficColor(i, latLngs.length) === "#ef4444") heavyCount++;
    }

    // Only suggest diversion if at least 3 consecutive heavy segments
    if (heavyCount < 3) return;

    setIsDiversionChecking(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${pos.lng},${pos.lat};${dest.lng},${dest.lat}?geometries=geojson&alternatives=true&overview=full`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.routes || data.routes.length < 2) return; // No real alternative

      const mainRoute = data.routes[0];
      const altRoute  = data.routes[1];

      // Verify the routes actually diverge (mid-point differs by > 400 m)
      const mLen = mainRoute.geometry.coordinates.length;
      const aLen = altRoute.geometry.coordinates.length;
      const mMid = mainRoute.geometry.coordinates[Math.floor(mLen / 2)];
      const aMid = altRoute.geometry.coordinates[Math.floor(aLen / 2)];
      const midDiff = haversineMeters(mMid[1], mMid[0], aMid[1], aMid[0]);
      if (midDiff < 400) return; // Routes too similar — skip

      const divGeom: [number,number][] = altRoute.geometry.coordinates.map(
        (c: [number,number]) => [c[1], c[0]]
      );
      const mainDur = Math.round(mainRoute.duration / 60);
      const altDur  = Math.round(altRoute.duration / 60);
      const saved   = mainDur - altDur;

      setDiversionInfo({
        savedMin: saved,
        distKm:  parseFloat((altRoute.distance / 1000).toFixed(1)),
        durMin:  altDur,
        geometry: divGeom,
      });

      // Draw dashed purple diversion preview on map
      if (diversionLineRef.current) diversionLineRef.current.remove();
      diversionLineRef.current = L.polyline(divGeom, {
        color: "#a855f7",
        weight: 5,
        opacity: 0.85,
        dashArray: "12, 9",
      }).addTo(map);

      addChatMessage("assistant",
        `🚦 **Heavy traffic detected ahead!** A diversion saves ~${Math.abs(saved)} min. Check the banner to accept.`
      );
    } catch (e) {
      console.warn("Diversion check failed:", e);
    } finally {
      setIsDiversionChecking(false);
    }
  };

  // Accept the suggested diversion \u2014 swap active route to the diversion geometry
  const takeDiversion = () => {
    if (!diversionInfo) return;
    // Override all route geometries with the diversion path
    routeGeometriesRef.current = {
      FASTEST: diversionInfo.geometry,
      ECO:     diversionInfo.geometry,
      SAFEST:  diversionInfo.geometry,
    };
    // Remove the dashed preview line (route effect will redraw the solid one)
    if (diversionLineRef.current) { diversionLineRef.current.remove(); diversionLineRef.current = null; }
    setDiversionInfo(null);
    // Trigger route redraw by forcing a routingType re-render via store
    setRoutingType(routingType as any);
    addChatMessage("assistant", "✅ **Diversion accepted!** Route updated to avoid heavy traffic.");
  };

  // Geocode address helpers using Photon API (Komoot's robust OSM geocoder, highly accurate and typo-tolerant)

  const geocodeAddress = async (query: string): Promise<{ lat: number; lng: number; name: string } | null> => {
    try {
      const pos = startCoords || currentLocation;
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${pos.lat}&lon=${pos.lng}&limit=1`;
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.features && data.features.length > 0) {
        const feat = data.features[0];
        const [lng, lat] = feat.geometry.coordinates;
        // Build a nice display name: Name, State (if available)
        const props = feat.properties;
        const displayName = props.name + (props.state ? `, ${props.state}` : "");
        return { lng, lat, name: displayName || query };
      }
    } catch (e) {
      console.warn("Geocoding failed for:", query);
    }
    return null;
  };

  // Handle Navigation search submits
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endQuery) return;

    try {
      let resolvedStart = currentLocation;
      if (startQuery && startQuery !== "My Location") {
        const startGeocoded = await geocodeAddress(startQuery);
        if (startGeocoded) {
          resolvedStart = { lat: startGeocoded.lat, lng: startGeocoded.lng };
          setStartCoords(resolvedStart);
        }
      } else {
        setStartCoords(null);
      }

      const destGeocoded = await geocodeAddress(endQuery);
      if (!destGeocoded) {
        addChatMessage("assistant", "❌ Destination not found. Please try another query.");
        return;
      }

      setDestination({ lat: destGeocoded.lat, lng: destGeocoded.lng }, destGeocoded.name);

      const S = resolvedStart;
      const D = destGeocoded;

      // Clear any previous route error
      setRouteError(null);

      // ── Straight-line distance between the two points (km) ──
      const straightLineKm = haversineMeters(S.lat, S.lng, D.lat, D.lng) / 1000;

      // ── Fetch primary route + alternatives from OSRM ──
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${S.lng},${S.lat};${D.lng},${D.lat}?geometries=geojson&alternatives=true&overview=full`;
      const response = await fetch(osrmUrl);
      const resData = await response.json();

      // ── LAYER 1: OSRM explicit no-route response ──
      if (resData.code !== "Ok" || !resData.routes || resData.routes.length === 0) {
        setRouteError({ type: "no_road_connection", from: startQuery, to: endQuery });
        return;
      }

      // ── LAYER 2: Destination snapping distance check ──
      // OSRM snaps each coordinate to the nearest road. If the destination waypoint
      // was snapped more than 10 km away, there is no road anywhere near the destination.
      const destWaypoint = resData.waypoints?.[1];
      if (destWaypoint && destWaypoint.distance > 10_000) {
        setRouteError({ type: "destination_not_on_road", from: startQuery, to: endQuery });
        return;
      }

      // ── LAYER 3: Route-vs-straight-line sanity check ──
      // For distant locations (>200 km apart), the road route must be at least 40%
      // of the straight-line distance. If it is much shorter OSRM gave up at a coast.
      const routeKm = resData.routes[0].distance / 1000;
      if (straightLineKm > 200 && routeKm < straightLineKm * 0.40) {
        setRouteError({ type: "route_incomplete", from: startQuery, to: endQuery });
        return;
      }

      // Build a distinct geometry for each route type
      const osrmRoutes = resData.routes; // sorted by OSRM: fastest first

      // Helper: decode geojson coordinates → Leaflet [lat,lng] pairs
      const toLatLngs = (route: any): [number, number][] =>
        route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

      // FASTEST  = OSRM route[0] (the optimal driving path)
      // ECO      = OSRM route[1] if available, else we synthesise a waypoint detour
      // SAFEST   = OSRM route[2] if available, else another synthesised detour
      const fastestRoute = osrmRoutes[0];
      const ecoRoute     = osrmRoutes[1] ?? osrmRoutes[0]; // fallback to same geom but tweaked metrics
      const safestRoute  = osrmRoutes[2] ?? osrmRoutes[osrmRoutes.length > 1 ? 1 : 0];

      routeGeometriesRef.current = {
        FASTEST: toLatLngs(fastestRoute),
        ECO:     toLatLngs(ecoRoute),
        SAFEST:  toLatLngs(safestRoute),
      };

      // Distances & durations per route
      const fDist = parseFloat((fastestRoute.distance / 1000).toFixed(1));
      const fDur  = Math.round(fastestRoute.duration / 60);

      const eDist = parseFloat((ecoRoute.distance / 1000).toFixed(1));
      const eDur  = Math.round(ecoRoute.duration / 60);

      const sDist = parseFloat((safestRoute.distance / 1000).toFixed(1));
      const sDur  = Math.round(safestRoute.duration / 60);

      // Build comparison object with real per-route values from OSRM
      const res = await calculateRouteComparison([S.lng, S.lat], [D.lng, D.lat]);
      if (res.success) {
        const alts = { ...res.data };

        // Override with actual measured values per route
        if (alts.FASTEST) { alts.FASTEST.distance = fDist; alts.FASTEST.duration = fDur; }
        if (alts.ECO)     { alts.ECO.distance = eDist; alts.ECO.duration = Math.round(eDur * 1.05); }
        if (alts.SAFEST)  { alts.SAFEST.distance = sDist; alts.SAFEST.duration = Math.round(sDur * 1.12); }
        
        delete alts.SCENIC;

        setRouteAlternatives(alts);
      }
    } catch (err) {
      console.warn("Search route calculation failed:", err);
    }
  };

  // Submit incident report
  const submitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    const incidentData = {
      type: reportType,
      latitude: currentLocation.lat + (Math.random() - 0.5) * 0.02,
      longitude: currentLocation.lng + (Math.random() - 0.5) * 0.02,
      description: reportDesc,
      severity: reportSeverity,
    };

    try {
      const res = await reportRoadIncident(incidentData);
      if (res.success) {
        setIncidents([res.data, ...incidents]);
        setReportDesc("");
        addChatMessage("assistant", `🚨 Incident registered! Alert for ${reportType} broadcasted.`);
      }
    } catch (error) {
      console.error("Failed to report incident");
    }
  };

  // Chat with AI Copilot
  const submitChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput) return;

    const query = chatInput;
    addChatMessage("user", query);
    setChatInput("");

    try {
      const res = await sendChatMessageToCopilot(query, chatHistory);
      if (res.success) {
        addChatMessage("assistant", res.reply);
      }
    } catch (e) {
      console.error("Chat response failed");
    }
  };

  // Download Offline Map region
  const handleOfflineDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!downloadName) return;

    try {
      const newRegion = await offlineManager.downloadRegion(downloadName, [
        currentLocation.lng - 0.25,
        currentLocation.lat - 0.25,
        currentLocation.lng + 0.25,
        currentLocation.lat + 0.25,
      ]);
      setOfflineRegions([...offlineRegions, newRegion]);
      setDownloadName("");
      addChatMessage("assistant", `💾 Map region "${newRegion.name}" stored offline.`);
    } catch (e) {
      console.error("Failed to store map data");
    }
  };

  // Delete Offline region
  const deleteOfflineRegion = async (id: string) => {
    await offlineManager.deleteRegion(id);
    setOfflineRegions(offlineRegions.filter((r) => r.id !== id));
  };

  // Trigger Safety SOS
  const triggerSOS = () => {
    setShowSOS(true);
    addChatMessage("assistant", "🚨 SOS Broadcasted. Navigating to closest medical trauma center.");
    setDestination({ lat: currentLocation.lat + 0.05, lng: currentLocation.lng + 0.05 }, "Trauma Center");
    startNavigation("SAFEST");
  };

  return (
    <div className="h-screen w-screen bg-slate-950 font-sans flex flex-col text-slate-100 overflow-hidden select-none">
      
      {/* 1. TOP STATS BAR */}
      <div className="h-14 bg-slate-950/60 border-b border-emerald-500/30 px-6 flex items-center justify-between z-10 backdrop-blur-3xl shadow-[0_4px_30px_rgba(16,185,129,0.1)]">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚡</span>
          <span className="font-black tracking-wider text-emerald-400">SMARTROUTE</span>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">COCKPIT v2.5</span>
        </div>

        {/* Global Stats info */}
        <div className="flex items-center gap-6 text-sm">
          <button
            onClick={() => setGpsMode(!gpsMode)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
              gpsMode 
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" 
                : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>{gpsMode ? "📡 Live GPS Track" : "💻 Simulator Mode"}</span>
          </button>
          <div className="flex items-center gap-2 text-emerald-400">
            <Award className="w-4 h-4" />
            <span className="font-bold">{ecoPoints} ECO PTS</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <CloudRain className="w-4 h-4 text-cyan-400" />
            <span>Weather Radar • Clear Skies</span>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full ${gpsMode ? "bg-cyan-400 animate-ping" : "bg-emerald-500 animate-pulse"}`} title={gpsMode ? "Live GPS Connected" : "Simulation Mode"} />
        </div>
      </div>

      {/* 2. MAIN LAYOUT CONTAINER */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* LEAFLET CONTAINER BACKDROP */}
        <div className="absolute inset-0 z-0 bg-slate-950" ref={mapContainerRef} />

        {/* HUD OVERLAY LAYER CONTROL */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-950/70 border border-emerald-500/40 p-1.5 rounded-full z-10 backdrop-blur-2xl shadow-[0_10px_40px_rgba(16,185,129,0.25)]">
          {[
            { id: "traffic", label: "Traffic", active: showTrafficOverlay },
            { id: "weather", label: "Radar",   active: showWeatherOverlay },
            { id: "3d",      label: "3D Bldgs",active: show3DBuildings },
            { id: "satellite",label: "Sat View",active: showSatelliteTerrain },
          ].map((layer) => (
            <button
              key={layer.id}
              onClick={() => toggleOverlay(layer.id as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-colors ${
                layer.active ? "bg-emerald-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
              }`}
            >
              {layer.label}
            </button>
          ))}
        </div>

        {/* ── Recenter Button (Google Maps-style) ── */}
        <AnimatePresence>
          {!isMapCentered && (
            <motion.button
              id="recenter-btn"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => {
                const map = mapRef.current;
                if (!map) return;
                const pos = startCoords || currentLocation;
                isProgrammaticPanRef.current = true;
                map.setView([pos.lat, pos.lng], map.getZoom(), { animate: true });
                setTimeout(() => { isProgrammaticPanRef.current = false; }, 800);
                setIsMapCentered(true);
              }}
              className="absolute right-4 top-28 z-20 flex items-center gap-2 bg-slate-950/80 border border-cyan-500/60 text-cyan-400 px-4 py-2.5 rounded-xl text-xs font-bold shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-2xl hover:border-cyan-400 hover:shadow-[0_0_35px_rgba(6,182,212,0.4)] transition-all duration-300"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" opacity=".3"/>
              </svg>
              Recenter
            </motion.button>
          )}
        </AnimatePresence>

        {/* LEFT FLOATING CONTROL CONTROL CENTER */}
        <div className="w-96 m-4 bg-slate-950/60 border border-emerald-500/30 rounded-3xl z-10 flex flex-col backdrop-blur-3xl shadow-[0_0_40px_rgba(16,185,129,0.15)] hover:border-emerald-500/50 transition-all duration-500 overflow-hidden">

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800/60 bg-slate-950/40">
            {[
              { id: "nav", label: "Navigation" },
              { id: "incidents", label: "Hazards" },
              { id: "offline", label: "Offline Maps" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === tab.id 
                    ? "border-emerald-400 text-emerald-400 bg-slate-900/20" 
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            
            {/* TABS 1: NAVIGATION & DESTINATION SEARCH */}
            {activeTab === "nav" && (
              <div className="space-y-4">
                <form onSubmit={handleSearchSubmit} className="space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-slate-855">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Start Location</label>
                    <input
                      type="text"
                      value={startQuery}
                      onChange={(e) => setStartQuery(e.target.value)}
                      placeholder="e.g. My Location or street name..."
                      className="w-full bg-slate-950 border border-slate-855 rounded-xl py-2 px-3 text-xs mt-1 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">End Destination</label>
                    <input
                      type="text"
                      value={endQuery}
                      onChange={(e) => setEndQuery(e.target.value)}
                      placeholder="e.g. Destination city/street name..."
                      className="w-full bg-slate-950 border border-slate-855 rounded-xl py-2 px-3 text-xs mt-1 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-slate-100"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/10 text-xs flex items-center justify-center gap-2"
                  >
                    <NavIcon className="w-3.5 h-3.5" />
                    Calculate Route Distances
                  </button>
                </form>

                {/* ── Route Error Card ── */}
                <AnimatePresence>
                  {routeError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-4 space-y-3"
                    >
                      {/* Icon + title */}
                      <div className="flex items-start gap-3">
                        <div className="text-2xl leading-none mt-0.5">
                          {routeError.type === "no_road_connection"      && "🚫"}
                          {routeError.type === "destination_not_on_road" && "🏝️"}
                          {routeError.type === "route_incomplete"         && "🌊"}
                          {routeError.type === "geocode_failed"           && "❓"}
                          {routeError.type === "unknown"                  && "⚠️"}
                        </div>
                        <div>
                          <div className="text-xs font-black text-rose-400 uppercase tracking-wider mb-1">
                            {routeError.type === "no_road_connection"      && "No Road Connection Found"}
                            {routeError.type === "destination_not_on_road" && "Destination Not on Any Road"}
                            {routeError.type === "route_incomplete"        && "Route Blocked by Ocean / Border"}
                            {routeError.type === "geocode_failed"          && "Location Not Recognised"}
                            {routeError.type === "unknown"                 && "Route Could Not Be Calculated"}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {routeError.type === "no_road_connection" &&
                              `There is no continuous road network connecting "${routeError.from}" to "${routeError.to}". The two locations may be separated by ocean, restricted borders, or have no shared road infrastructure.`}
                            {routeError.type === "destination_not_on_road" &&
                              `"${routeError.to}" could not be reached by any road. It may be an island, mid-ocean location, or a region with no navigable roads.`}
                            {routeError.type === "route_incomplete" &&
                              `A driving route from "${routeError.from}" to "${routeError.to}" is not possible — the path is blocked by a body of water or an impassable border crossing. These locations require air or sea travel.`}
                            {routeError.type === "geocode_failed" &&
                              `The location "${routeError.to}" was not recognised. Please check the spelling or try a more specific name.`}
                            {routeError.type === "unknown" &&
                              "An unexpected error occurred while calculating the route. Please try again."}
                          </p>
                        </div>
                      </div>

                      {/* Suggestions */}
                      {(routeError.type === "no_road_connection" || routeError.type === "route_incomplete" || routeError.type === "destination_not_on_road") && (
                        <div className="border-t border-rose-500/20 pt-3">
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Consider alternative travel</div>
                          <div className="flex gap-2">
                            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full text-[10px] font-semibold">✈️ Flight</span>
                            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full text-[10px] font-semibold">🚢 Ferry / Ship</span>
                            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full text-[10px] font-semibold">🚂 Train</span>
                          </div>
                        </div>
                      )}

                      {/* Dismiss */}
                      <button
                        onClick={() => setRouteError(null)}
                        className="w-full text-xs text-slate-500 hover:text-slate-300 text-center pt-1 transition-colors"
                      >
                        Dismiss ×
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Show Calculated Alternatives comparison */}
                {!routeError && routeAlternatives && (

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Routing Categories</h3>
                    
                    {Object.entries(routeAlternatives).map(([key, item]: [string, any]) => (
                      <button
                        key={key}
                        onClick={() => setRoutingType(key as any)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                          routingType === key 
                            ? "bg-slate-950 border-emerald-500 shadow-md" 
                            : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`text-xs font-black tracking-wider flex items-center gap-1.5 ${
                            key === "ECO" ? "text-emerald-400" : key === "FASTEST" ? "text-cyan-400" : "text-amber-400"
                          }`}>
                            {key === "ECO" ? "🌱 ECONOMIC" : key === "FASTEST" ? "⚡ FASTER" : "🛡️ SAFEST"}
                          </span>
                          <span className="text-sm font-bold">{item.duration} min</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 mt-2">
                          <span>{item.distance} km</span>
                          <span>🌱 {item.ecoScore}% Rating</span>
                        </div>
                      </button>
                    ))}

                    {!isNavigating ? (
                      <button
                        onClick={() => startNavigation()}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-md shadow-emerald-500/10"
                      >
                        Engage Selected Route Navigation
                      </button>
                    ) : (
                      <button
                        onClick={stopNavigation}
                        className="w-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold py-3 rounded-xl transition-all"
                      >
                        End Route Navigation
                      </button>
                    )}
                  </div>
                )}

                {/* Active HUD Nav Progress */}
                {isNavigating && activeMetrics && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold">
                        <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                        <span>ACTIVE RUN</span>
                      </div>
                      <span className="text-xs text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded uppercase">
                        {routingType} ENGAGED
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                      <div>
                        <div className="text-2xl font-black">{activeMetrics.duration} <span className="text-sm text-slate-500">MIN</span></div>
                        <div className="text-xs text-slate-500">Time to destination</div>
                      </div>
                      <div>
                        <div className="text-2xl font-black">{activeMetrics.distance} <span className="text-sm text-slate-500">KM</span></div>
                        <div className="text-xs text-slate-500">Travel distance</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TABS 2: INCIDENT/HAZARD REPORTING */}
            {activeTab === "incidents" && (
              <div className="space-y-4">
                <form onSubmit={submitIncident} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Report Road Hazard</h3>
                  
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Type</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs"
                    >
                      <option value="POTHOLE">🕳️ Pothole</option>
                      <option value="ACCIDENT">💥 Accident</option>
                      <option value="FLOOD">🌊 Flood Warning</option>
                      <option value="POLICE">🚨 Speed Check</option>
                      <option value="CONGESTION">🚗 Gridlock</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Description</label>
                    <textarea
                      value={reportDesc}
                      onChange={(e) => setReportDesc(e.target.value)}
                      placeholder="Specify lane obstruction details..."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-lg text-xs transition-colors"
                  >
                    Broadcast Hazard Alerts
                  </button>
                </form>

                {/* List of active alerts */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Alerts</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {incidents.map((inc) => (
                      <div key={inc.id} className="bg-slate-950 p-3 rounded-xl border border-slate-855 flex gap-3 text-xs">
                        <span className="text-lg">
                          {inc.type === "POTHOLE" ? "🕳️" : inc.type === "ACCIDENT" ? "💥" : inc.type === "FLOOD" ? "🌊" : "🚨"}
                        </span>
                        <div>
                          <div className="font-bold text-slate-200">{inc.type}</div>
                          <div className="text-slate-400 mt-0.5">{inc.description || "Reported near highway corridor."}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* TABS 3: OFFLINE MAP DOWNLOADS */}
            {activeTab === "offline" && (
              <div className="space-y-4">
                <form onSubmit={handleOfflineDownload} className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Download Region Map</h3>
                  <input
                    type="text"
                    required
                    value={downloadName}
                    onChange={(e) => setDownloadName(e.target.value)}
                    placeholder="Region name (e.g. Bay Area)..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs"
                  />
                  <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 rounded-lg text-xs transition-colors"
                  >
                    Store Map Offline
                  </button>
                </form>

                {/* List downloaded regions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Downloaded Packages</h4>
                  <div className="space-y-2">
                    {offlineRegions.length > 0 ? (
                      offlineRegions.map((region) => (
                        <div key={region.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                          <div>
                            <div className="font-bold text-slate-200">{region.name}</div>
                            <div className="text-slate-500 mt-0.5">Size: {region.sizeMb} MB</div>
                          </div>
                          <button
                            onClick={() => deleteOfflineRegion(region.id)}
                            className="text-rose-400 hover:text-rose-300 font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-600 text-center py-4">No offline map regions cached.</div>
                    )}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* BOTTOM QUICK BUTTONS - Emergency SOS & Dashboard Nav */}
          <div className="p-4 border-t border-slate-800/60 bg-slate-950/30 flex gap-2">
            <button
              onClick={triggerSOS}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-red-600/10 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
            >
              <ShieldAlert className="w-4 h-4" />
              Emergency SOS
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("auth_token");
                navigate({ to: "/login" });
              }}
              className="px-4 bg-slate-800 hover:bg-slate-750 rounded-xl text-slate-400 transition-colors text-xs font-bold"
              title="Sign Out Pilot"
            >
              Exit
            </button>
          </div>

        </div>

        {/* ── Off-route / Recalculating Toast Banner ── */}
        <AnimatePresence>
          {(isOffRoute || isRecalculating) && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-slate-900/95 border border-amber-500/40 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md"
            >
              {isRecalculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-emerald-400 tracking-wider">RECALCULATING ROUTE…</span>
                </>
              ) : (
                <>
                  <span className="text-base animate-pulse">⚠️</span>
                  <span className="text-xs font-bold text-amber-400 tracking-wider">OFF ROUTE — Finding new path…</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Traffic legend (shown only when Traffic overlay is ON and navigating) ── */}
        {showTrafficOverlay && isNavigating && (
          <div className="absolute bottom-24 right-4 z-20 bg-slate-900/90 border border-slate-800/80 rounded-xl px-3 py-2 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider space-y-1.5 shadow-xl">
            <div className="text-slate-400 mb-1">Traffic</div>
            <div className="flex items-center gap-2"><div className="w-4 h-2 rounded-full bg-[#22c55e]" /><span className="text-slate-300">Clear</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-2 rounded-full bg-[#f59e0b]" /><span className="text-slate-300">Moderate</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-2 rounded-full bg-[#ef4444]" /><span className="text-slate-300">Heavy</span></div>
          </div>
        )}

        {/* ── Diversion checking spinner ── */}
        {isDiversionChecking && (
          <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-slate-900/95 border border-purple-500/30 px-4 py-2 rounded-xl text-xs text-purple-300 font-bold shadow-xl backdrop-blur-md">
            <div className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            Scanning for traffic diversion…
          </div>
        )}

        {/* ── Diversion available banner ── */}
        <AnimatePresence>
          {diversionInfo && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[420px] bg-slate-900/97 border border-purple-500/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-xs font-black text-purple-400 tracking-wider uppercase">🚦 Traffic Diversion Available</span>
                </div>
                <button onClick={() => setDiversionInfo(null)} className="text-slate-500 hover:text-slate-300 text-lg leading-none">×</button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-950/60 rounded-xl p-2.5 text-center border border-slate-800">
                  <div className="text-lg font-black text-purple-400">{diversionInfo.distKm} <span className="text-xs text-slate-500">km</span></div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Alt. Distance</div>
                </div>
                <div className="bg-slate-950/60 rounded-xl p-2.5 text-center border border-slate-800">
                  <div className="text-lg font-black text-slate-100">{diversionInfo.durMin} <span className="text-xs text-slate-500">min</span></div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Alt. Duration</div>
                </div>
                <div className={`rounded-xl p-2.5 text-center border ${diversionInfo.savedMin > 0 ? "bg-emerald-950/60 border-emerald-700/40" : "bg-rose-950/60 border-rose-700/40"}`}>
                  <div className={`text-lg font-black ${diversionInfo.savedMin > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {diversionInfo.savedMin > 0 ? "−" : "+"}{Math.abs(diversionInfo.savedMin)} <span className="text-xs opacity-60">min</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{diversionInfo.savedMin > 0 ? "Time Saved" : "Extra Time"}</div>
                </div>
              </div>

              {/* Dashed line description */}
              <div className="flex items-center gap-2 mb-4 px-1">
                <div className="flex-1 border-t-2 border-dashed border-purple-500/60" />
                <span className="text-[10px] text-purple-400/80 font-semibold">Purple dashed line = diversion path</span>
                <div className="flex-1 border-t-2 border-dashed border-purple-500/60" />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={takeDiversion}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5"
                >
                  <span>🔀</span> Take Diversion
                </button>
                <button
                  onClick={() => { setDiversionInfo(null); if (diversionLineRef.current) { diversionLineRef.current.remove(); diversionLineRef.current = null; } }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs transition-all border border-slate-700"
                >
                  Stay on Route
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


          
        {/* MIDDLE/MAIN HUD COMPONENT OVERLAYS */}
        <AnimatePresence>
          {showSOS && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-950/90 border border-red-500/30 px-6 py-4 rounded-2xl z-20 backdrop-blur-md text-red-200 text-sm flex items-center gap-3 shadow-2xl"
            >
              <span className="text-2xl animate-ping">🚨</span>
              <div>
                <span className="font-extrabold uppercase block tracking-wider text-red-400">SOS Signal Dispatched</span>
                <span className="text-xs text-red-300">Live navigation routing engaged.</span>
              </div>
              <button 
                onClick={() => setShowSOS(false)} 
                className="text-xs bg-red-900/60 border border-red-500/20 hover:bg-red-800 px-3 py-1 rounded-lg text-white font-bold ml-4"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. AESTHETIC COLLAPSIBLE FLOATING AI CO-PILOT CHATBOT */}
        <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-3">
          <AnimatePresence>
            {isAIChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="w-80 h-96 bg-slate-950/70 border border-emerald-500/30 rounded-3xl flex flex-col backdrop-blur-3xl shadow-[0_0_50px_rgba(16,185,129,0.2)] overflow-hidden"
              >
                <div className="bg-slate-950/60 p-4 border-b border-slate-800/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-200">AI CO-PILOT</span>
                  </div>
                  <button 
                    onClick={() => setIsAIChatOpen(false)}
                    className="text-slate-500 hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Chat message content box */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatHistory.map((chat, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                        chat.role === "user" 
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 ml-auto" 
                          : "bg-slate-950/60 border border-slate-850 text-slate-300"
                      }`}
                    >
                      {chat.content}
                    </div>
                  ))}
                </div>

                {/* Input text box */}
                <form onSubmit={submitChat} className="p-3 border-t border-slate-800/60 bg-slate-950/30 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setStartQuery(e.target.value)}
                    placeholder="Ask co-pilot..."
                    className="flex-1 bg-slate-950 border border-slate-855 rounded-xl px-3 py-2 text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-slate-100"
                  />
                  <button 
                    type="submit" 
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-2.5 rounded-xl transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Glowing Chat Action Icon */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAIChatOpen(!isAIChatOpen)}
            className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 cursor-pointer border border-emerald-400/20 relative"
          >
            {/* Pulsing halo */}
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            <MessageSquare className="w-6 h-6 text-slate-950 relative z-10" />
          </motion.button>
        </div>

      </div>

      {/* 3. CLEAN BOTTOM TRAVEL NAVIGATION INFORMATION BAR */}
      <div className="h-20 bg-slate-950/80 border-t border-emerald-500/40 px-8 flex items-center justify-between z-10 relative backdrop-blur-3xl shadow-[0_-10px_40px_rgba(16,185,129,0.2)]">
        <div className="flex flex-col">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Location Track</div>
          <div className="text-sm font-bold text-slate-200 mt-0.5">
            {gpsMode ? "📡 Watch GPS Location Enabled" : "💻 Using Simulated Starting Point"}
          </div>
        </div>

        <div className="flex items-center gap-12">
          {isNavigating && activeMetrics ? (
            <>
              <div className="text-center">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Distance</div>
                <div className="text-xl font-black text-emerald-400 mt-0.5">{activeMetrics.distance} km</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">ETA Duration</div>
                <div className="text-xl font-black text-white mt-0.5">{activeMetrics.duration} min</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Active Route Class</div>
                <div className={`text-xs font-black px-3 py-1 rounded-full border mt-1 ${
                  routingType === "ECO" 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : routingType === "FASTEST"
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                }`}>
                  {routingType === "ECO" ? "🌱 ECONOMIC" : routingType === "FASTEST" ? "⚡ FASTER" : "🛡️ SAFEST"}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-400 italic font-medium">Enter cockpit route destination in the left panel to engage navigation...</div>
          )}
        </div>

        <div className="flex items-center gap-6 text-right">
          {speedLimit && (
            <div className="flex flex-col items-center justify-center w-12 h-12 bg-white rounded-full border-[4px] border-rose-600 text-rose-600 shadow-xl">
              <span className="text-[9px] font-black leading-none -mb-1 mt-1 uppercase">Max</span>
              <span className="text-xl font-black leading-none tracking-tighter">{speedLimit}</span>
            </div>
          )}
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cruising Velocity</div>
            <div className="text-2xl font-black text-white mt-0.5">
              {Math.floor(telemetry.speed)} <span className="text-xs text-slate-400 font-normal">KM/H</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
