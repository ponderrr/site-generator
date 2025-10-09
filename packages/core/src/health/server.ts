/**
 * @fileoverview Health Check HTTP Server
 *
 * Simple HTTP server for health check endpoints that can be used
 * in production environments for load balancer health checks.
 */

import { createServer, IncomingMessage, ServerResponse } from "http";
import { URL, fileURLToPath } from "url";
import { createHealthCheckMiddleware } from "./index.js";

export interface HealthServerOptions {
  port?: number;
  host?: string;
  endpoints?: {
    basic?: string;
    detailed?: string;
    readiness?: string;
    liveness?: string;
  };
}

export class HealthCheckServer {
  private server: any;
  private options: Required<HealthServerOptions>;
  private middleware: ReturnType<typeof createHealthCheckMiddleware>;

  constructor(options: HealthServerOptions = {}) {
    this.options = {
      port: options.port || 3000,
      host: options.host || "0.0.0.0",
      endpoints: {
        basic: options.endpoints?.basic || "/health",
        detailed: options.endpoints?.detailed || "/health/detailed",
        readiness: options.endpoints?.readiness || "/health/ready",
        liveness: options.endpoints?.liveness || "/health/live",
        ...options.endpoints,
      },
    };

    this.middleware = createHealthCheckMiddleware();
    this.server = createServer(this.handleRequest.bind(this));
  }

  /**
   * Start the health check server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.listen(
        this.options.port,
        this.options.host,
        (error?: Error) => {
          if (error) {
            reject(error);
          } else {
            console.log(
              `🏥 Health check server running on http://${this.options.host}:${this.options.port}`,
            );
            console.log(`📊 Available endpoints:`);
            console.log(
              `   - ${this.options.endpoints.basic} (basic health check)`,
            );
            console.log(
              `   - ${this.options.endpoints.detailed} (detailed health check)`,
            );
            console.log(
              `   - ${this.options.endpoints.readiness} (readiness probe)`,
            );
            console.log(
              `   - ${this.options.endpoints.liveness} (liveness probe)`,
            );
            resolve();
          }
        },
      );
    });
  }

  /**
   * Stop the health check server
   */
  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((error?: Error) => {
        if (error) {
          reject(error);
        } else {
          console.log("🏥 Health check server stopped");
          resolve();
        }
      });
    });
  }

  /**
   * Handle incoming HTTP requests
   */
  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    try {
      const url = new URL(req.url || "/", `http://${req.headers.host}`);
      const pathname = url.pathname;

      // Set CORS headers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      // Handle OPTIONS requests
      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      // Route requests to appropriate handlers
      if (pathname === this.options.endpoints.basic) {
        await this.middleware.basic(req, res);
      } else if (pathname === this.options.endpoints.detailed) {
        await this.middleware.detailed(req, res);
      } else if (pathname === this.options.endpoints.readiness) {
        await this.middleware.readiness(req, res);
      } else if (pathname === this.options.endpoints.liveness) {
        await this.middleware.liveness(req, res);
      } else {
        // 404 for unknown endpoints
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "Not Found",
            message: "Health check endpoint not found",
            availableEndpoints: Object.values(this.options.endpoints),
          }),
        );
      }
    } catch (error) {
      console.error("Health check server error:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Internal Server Error",
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }

  /**
   * Get server information
   */
  getInfo(): { port: number; host: string; endpoints: Record<string, string> } {
    return {
      port: this.options.port,
      host: this.options.host,
      endpoints: this.options.endpoints,
    };
  }
}

/**
 * Create and start a health check server
 */
export async function startHealthCheckServer(
  options?: HealthServerOptions,
): Promise<HealthCheckServer> {
  const server = new HealthCheckServer(options);
  await server.start();
  return server;
}

/**
 * CLI interface for health check server
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env["HEALTH_CHECK_PORT"] || "3000", 10);
  const host = process.env["HEALTH_CHECK_HOST"] || "0.0.0.0";

  startHealthCheckServer({ port, host })
    .then((server) => {
      console.log("✅ Health check server started successfully");

      // Graceful shutdown
      process.on("SIGINT", async () => {
        console.log("\n🔄 Shutting down health check server...");
        await server.stop();
        process.exit(0);
      });

      process.on("SIGTERM", async () => {
        console.log("\n🔄 Shutting down health check server...");
        await server.stop();
        process.exit(0);
      });
    })
    .catch((error) => {
      console.error("❌ Failed to start health check server:", error);
      process.exit(1);
    });
}
