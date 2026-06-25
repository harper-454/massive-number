import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

// Track if ws-service is already started
let wsStarted = false;

export async function GET() {
  if (wsStarted) {
    return NextResponse.json({ status: "already_running" });
  }

  try {
    const servicePath = path.join(
      process.cwd(),
      "mini-services",
      "ws-service"
    );

    const child = spawn("bun", ["index.ts"], {
      cwd: servicePath,
      detached: true,
      stdio: "ignore",
    });

    child.unref();
    wsStarted = true;

    // Wait a moment for the service to start
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return NextResponse.json({
      status: "started",
      pid: child.pid,
      port: 3003,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", error: error.message },
      { status: 500 }
    );
  }
}
