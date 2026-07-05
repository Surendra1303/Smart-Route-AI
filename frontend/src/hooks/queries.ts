import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../lib/queryClient";
import {
  getDashboardData,
  getVehicleStatus,
  getTripLogs,
  getRoadIncidents,
  getFavoritePlaces,
  getChatHistory,
  updateVehicleStatus,
  reportRoadIncident,
} from "../services/api";

export function useUserProfile() {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const response = await fetch("http://localhost:5001/api/user/profile", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("auth_token")}` }
      });
      return response.json();
    },
    enabled: !!localStorage.getItem("auth_token"),
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: getDashboardData,
    enabled: !!localStorage.getItem("auth_token"),
  });
}

export function useVehicleStatus() {
  return useQuery({
    queryKey: ["vehicleStatus"],
    queryFn: getVehicleStatus,
    enabled: !!localStorage.getItem("auth_token"),
  });
}

export function useTripLogs() {
  return useQuery({
    queryKey: ["tripLogs"],
    queryFn: getTripLogs,
    enabled: !!localStorage.getItem("auth_token"),
  });
}

export function useRoadIncidents() {
  return useQuery({
    queryKey: ["roadIncidents"],
    queryFn: getRoadIncidents,
    enabled: !!localStorage.getItem("auth_token"),
  });
}

export function useFavoritePlaces() {
  return useQuery({
    queryKey: ["favoritePlaces"],
    queryFn: getFavoritePlaces,
    enabled: !!localStorage.getItem("auth_token"),
  });
}

export function useChatHistory() {
  return useQuery({
    queryKey: ["chatHistory"],
    queryFn: getChatHistory,
    enabled: !!localStorage.getItem("auth_token"),
  });
}

export function useUpdateVehicleStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVehicleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicleStatus"] });
    },
  });
}

export function useReportRoadIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reportRoadIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadIncidents"] });
    },
  });
}
