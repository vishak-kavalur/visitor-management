import { NextResponse } from "next/server";

/**
 * Health check endpoint for container orchestration and monitoring
 * Returns 200 OK with basic system status information
 */
export async function GET() {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  // Format memory usage in MB for easier reading
  const formattedMemory = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024),
  };
  
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 60)} minutes, ${Math.floor(uptime % 60)} seconds`,
      memory: formattedMemory,
      version: process.env.npm_package_version || "unknown",
      environment: process.env.NODE_ENV || "development",
    },
    { status: 200 }
  );
}