import { config } from "../config.js";

/**
 * Logger utility for debugging and tracking audit progress
 */
export class Logger {
  private static instance: Logger;
  private debugMode: boolean;
  private startTime: number;

  private constructor() {
    this.debugMode = config.debug;
    this.startTime = Date.now();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Get elapsed time since logger initialization
   */
  private getElapsedTime(): string {
    const elapsed = Date.now() - this.startTime;
    const seconds = Math.floor(elapsed / 1000);
    const ms = elapsed % 1000;
    return `[${seconds}s ${ms}ms]`;
  }

  /**
   * Log debug message (only in debug mode)
   */
  debug(message: string, data?: any): void {
    if (this.debugMode) {
      const timestamp = this.getElapsedTime();
      console.log(`🔍 ${timestamp} DEBUG: ${message}`);
      if (data) {
        console.log("   Data:", JSON.stringify(data, null, 2));
      }
    }
  }

  /**
   * Log info message (always shown)
   */
  info(message: string, data?: any): void {
    const timestamp = this.getElapsedTime();
    console.log(`ℹ️  ${timestamp} ${message}`);
    if (data && this.debugMode) {
      console.log("   Data:", JSON.stringify(data, null, 2));
    }
  }

  /**
   * Log warning message (always shown)
   */
  warn(message: string, data?: any): void {
    const timestamp = this.getElapsedTime();
    console.warn(`⚠️  ${timestamp} WARNING: ${message}`);
    if (data) {
      console.warn("   Data:", JSON.stringify(data, null, 2));
    }
  }

  /**
   * Log error message (always shown)
   */
  error(message: string, error?: any): void {
    const timestamp = this.getElapsedTime();
    console.error(`❌ ${timestamp} ERROR: ${message}`);
    if (error) {
      if (error instanceof Error) {
        console.error("   Error:", error.message);
        if (this.debugMode && error.stack) {
          console.error("   Stack:", error.stack);
        }
      } else {
        console.error("   Error:", JSON.stringify(error, null, 2));
      }
    }
  }

  /**
   * Log success message (always shown)
   */
  success(message: string, data?: any): void {
    const timestamp = this.getElapsedTime();
    console.log(`✅ ${timestamp} ${message}`);
    if (data && this.debugMode) {
      console.log("   Data:", JSON.stringify(data, null, 2));
    }
  }

  /**
   * Log progress message (always shown)
   */
  progress(message: string): void {
    const timestamp = this.getElapsedTime();
    console.log(`🔄 ${timestamp} ${message}`);
  }

  /**
   * Log step message (only in debug mode)
   */
  step(stepName: string, details?: string): void {
    if (this.debugMode) {
      const timestamp = this.getElapsedTime();
      console.log(`📍 ${timestamp} STEP: ${stepName}`);
      if (details) {
        console.log(`   ${details}`);
      }
    }
  }

  /**
   * Enable debug mode
   */
  enableDebug(): void {
    this.debugMode = true;
    this.info("Debug mode enabled");
  }

  /**
   * Disable debug mode
   */
  disableDebug(): void {
    this.debugMode = false;
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugEnabled(): boolean {
    return this.debugMode;
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

