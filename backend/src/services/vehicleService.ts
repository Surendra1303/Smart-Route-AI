import { prisma } from "../lib/prisma";

export interface VehicleState {
  fuelLevel: number;
  fuelEfficiency: number;
  odometer: number;
  oilLife: number;
  engineTemp: number;
  batteryVoltage: number;
  batteryHealth: number;
  tirePressureFL: number;
  tirePressureFR: number;
  tirePressureRL: number;
  tirePressureRR: number;
}

// In-memory vehicle storage fallback if DB is not available
const mockVehicleMemory: Record<string, any> = {};

export async function getOrCreateVehicle(userId: string) {
  try {
    if (prisma) {
      let vehicle = await prisma.vehicle.findFirst({
        where: { userId },
      });
      if (!vehicle) {
        vehicle = await prisma.vehicle.create({
          data: {
            userId,
            make: "SmartRoute",
            model: "Platform S-3",
            year: 2026,
            drivingMode: "COMFORT",
            fuelLevel: 82.5,
            fuelEfficiency: 34.2,
            odometer: 14850.2,
            oilLife: 78.0,
            engineTemp: 192.4,
            batteryVoltage: 12.6,
            batteryHealth: 94.0,
            tirePressureFL: 34.5,
            tirePressureFR: 34.2,
            tirePressureRL: 32.8,
            tirePressureRR: 33.1,
          },
        });
      }
      return vehicle;
    }
  } catch (error) {
    console.error("Database error in getOrCreateVehicle, using memory fallback");
  }

  // Fallback memory database
  if (!mockVehicleMemory[userId]) {
    mockVehicleMemory[userId] = {
      id: "mock-vehicle-id",
      userId,
      make: "Tesla / Rivian Simulator",
      model: "NextGen EV Platform",
      year: 2026,
      drivingMode: "ECO",
      fuelLevel: 75.0, // battery level
      fuelEfficiency: 280, // Wh/mi
      odometer: 2450.5,
      oilLife: 100.0, // N/A for EV, but simulated
      engineTemp: 105.4, // battery pack temp
      batteryVoltage: 395.2, // high-voltage traction pack
      batteryHealth: 98.5,
      tirePressureFL: 38.5,
      tirePressureFR: 38.0,
      tirePressureRL: 39.1,
      tirePressureRR: 38.9,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
  return mockVehicleMemory[userId];
}

export async function updateVehicleState(userId: string, data: Partial<VehicleState> & { drivingMode?: string }) {
  try {
    if (prisma) {
      const vehicle = await getOrCreateVehicle(userId);
      const updated = await prisma.vehicle.update({
        where: { id: vehicle.id },
        data,
      });
      return updated;
    }
  } catch (error) {
    console.error("Database error updating vehicle state, using memory fallback");
  }

  const current = await getOrCreateVehicle(userId);
  Object.assign(current, data, { updatedAt: new Date() });
  return current;
}

export function generateOBDDiagnostics(userId: string) {
  // Simulates small fluctuations in vehicle stats (speed, temperature, voltage)
  const baseTemp = 190.0;
  const baseVoltage = 12.4;
  const randTemp = baseTemp + (Math.random() - 0.5) * 6;
  const randVoltage = baseVoltage + (Math.random() - 0.5) * 0.4;
  const randRPM = Math.floor(800 + Math.random() * 3200);
  
  return {
    timestamp: new Date(),
    engineTemp: parseFloat(randTemp.toFixed(1)),
    batteryVoltage: parseFloat(randVoltage.toFixed(2)),
    rpm: randRPM,
    systemStatus: "NOMINAL",
    malfunctionIndicatorLamp: false, // Check engine light
    dtcCount: 0, // Diagnostic Trouble Codes
    coolantTemp: 185,
    intakeTemp: 72,
    loadPct: Math.floor(10 + Math.random() * 80),
  };
}
