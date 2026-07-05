import localforage from "localforage";

// Initialize localforage store for offline assets
const mapStore = localforage.createInstance({
  name: "SmartRouteOffline",
  storeName: "map_cache",
});

const routeStore = localforage.createInstance({
  name: "SmartRouteOffline",
  storeName: "route_cache",
});

export interface OfflineRegion {
  id: string;
  name: string;
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  sizeMb: number;
  downloadedAt: Date;
}

export const offlineManager = {
  // Download/cache a map region
  async downloadRegion(name: string, bbox: [number, number, number, number]): Promise<OfflineRegion> {
    const id = `region-${Date.now()}`;
    const newRegion: OfflineRegion = {
      id,
      name,
      bbox,
      sizeMb: parseFloat((15 + Math.random() * 45).toFixed(1)), // Simulated tile package size
      downloadedAt: new Date(),
    };
    
    // Store in our local DB
    await mapStore.setItem(id, newRegion);
    return newRegion;
  },

  // List all cached offline regions
  async getDownloadedRegions(): Promise<OfflineRegion[]> {
    const regions: OfflineRegion[] = [];
    await mapStore.iterate((value: OfflineRegion) => {
      regions.push(value);
    });
    return regions;
  },

  // Delete a cached region
  async deleteRegion(id: string): Promise<void> {
    await mapStore.removeItem(id);
  },

  // Cache a calculated route for offline turn-by-turn navigation
  async cacheRouteForOffline(routeId: string, routeData: any): Promise<void> {
    await routeStore.setItem(routeId, {
      ...routeData,
      cachedAt: new Date(),
    });
  },

  // Retrieve an offline route
  async getCachedRoute(routeId: string): Promise<any | null> {
    return await routeStore.getItem(routeId);
  },

  // Get all offline cached routes
  async getCachedRoutes(): Promise<any[]> {
    const routes: any[] = [];
    await routeStore.iterate((value) => {
      routes.push(value);
    });
    return routes;
  }
};
