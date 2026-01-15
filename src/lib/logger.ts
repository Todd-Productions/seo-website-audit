import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { config } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Logger utility for debugging and tracking audit progress
 * Supports both console and file logging
 */
export class Logger {
  private static instance: Logger;
  private debugMode: boolean;
  private startTime: number;
  private logFilePath: string | null = null;
  private logBuffer: string[] = [];
  private isFileLoggingEnabled = false;

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
   * Initialize file logging
   * Creates logs/ directory and sets up log file with domain-timestamp naming
   */
  async initializeFileLogging(website: string): Promise<void> {
    try {
      // Create logs directory if it doesn't exist
      const logsDir = path.resolve(__dirname, "../../logs");
      await fs.mkdir(logsDir, { recursive: true });

      // Extract domain from website URL
      const domain = new URL(website).hostname.replace(/^www\./, "");

      // Create timestamp in ISO format, replacing colons with hyphens for filename
      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, "-")
        .split(".")[0];

      // Create filename: domain-timestamp.log
      const filename = `${domain}-${timestamp}.log`;
      this.logFilePath = path.join(logsDir, filename);

      // Write initial log header
      const header = `=== SEO Website Audit Log ===\nWebsite: ${website}\nStarted: ${new Date().toISOString()}\n${"=".repeat(
        50
      )}\n\n`;
      await fs.writeFile(this.logFilePath, header, "utf-8");

      this.isFileLoggingEnabled = true;
      this.info(`Log file created: ${this.logFilePath}`);
    } catch (error: any) {
      console.error(`Failed to initialize file logging: ${error.message}`);
      this.isFileLoggingEnabled = false;
    }
  }

  /**
   * Write a message to the log file
   */
  private async writeToFile(message: string): Promise<void> {
    if (!this.isFileLoggingEnabled || !this.logFilePath) {
      return;
    }

    try {
      // Add to buffer
      this.logBuffer.push(message + "\n");

      // Flush buffer if it gets too large (every 10 messages)
      if (this.logBuffer.length >= 10) {
        await this.flushBuffer();
      }
    } catch (error: any) {
      // Silently fail file writes to avoid disrupting the audit
      console.error(`Failed to write to log file: ${error.message}`);
    }
  }

  /**
   * Flush the log buffer to file
   */
  async flushBuffer(): Promise<void> {
    if (
      !this.isFileLoggingEnabled ||
      !this.logFilePath ||
      this.logBuffer.length === 0
    ) {
      return;
    }

    try {
      const content = this.logBuffer.join("");
      await fs.appendFile(this.logFilePath, content, "utf-8");
      this.logBuffer = [];
    } catch (error: any) {
      console.error(`Failed to flush log buffer: ${error.message}`);
    }
  }

  /**
   * Get the log file path
   */
  getLogFilePath(): string | null {
    return this.logFilePath;
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
      const logMessage = `🔍 ${timestamp} DEBUG: ${message}`;
      console.log(logMessage);

      let fullMessage = logMessage;
      if (data) {
        const dataStr = "   Data: " + JSON.stringify(data, null, 2);
        console.log(dataStr);
        fullMessage += "\n" + dataStr;
      }

      this.writeToFile(fullMessage);
    }
  }

  /**
   * Log info message (always shown)
   */
  info(message: string, data?: any): void {
    const timestamp = this.getElapsedTime();
    const logMessage = `ℹ️  ${timestamp} ${message}`;
    console.log(logMessage);

    let fullMessage = logMessage;
    if (data && this.debugMode) {
      const dataStr = "   Data: " + JSON.stringify(data, null, 2);
      console.log(dataStr);
      fullMessage += "\n" + dataStr;
    }

    this.writeToFile(fullMessage);
  }

  /**
   * Log warning message (always shown)
   */
  warn(message: string, data?: any): void {
    const timestamp = this.getElapsedTime();
    const logMessage = `⚠️  ${timestamp} WARNING: ${message}`;
    console.warn(logMessage);

    let fullMessage = logMessage;
    if (data) {
      const dataStr = "   Data: " + JSON.stringify(data, null, 2);
      console.warn(dataStr);
      fullMessage += "\n" + dataStr;
    }

    this.writeToFile(fullMessage);
  }

  /**
   * Log error message (always shown)
   */
  error(message: string, error?: any): void {
    const timestamp = this.getElapsedTime();
    const logMessage = `❌ ${timestamp} ERROR: ${message}`;
    console.error(logMessage);

    let fullMessage = logMessage;
    if (error) {
      if (error instanceof Error) {
        const errorMsg = "   Error: " + error.message;
        console.error(errorMsg);
        fullMessage += "\n" + errorMsg;

        if (this.debugMode && error.stack) {
          const stackMsg = "   Stack: " + error.stack;
          console.error(stackMsg);
          fullMessage += "\n" + stackMsg;
        }
      } else {
        const errorStr = "   Error: " + JSON.stringify(error, null, 2);
        console.error(errorStr);
        fullMessage += "\n" + errorStr;
      }
    }

    this.writeToFile(fullMessage);
  }

  /**
   * Log success message (always shown)
   */
  success(message: string, data?: any): void {
    const timestamp = this.getElapsedTime();
    const logMessage = `✅ ${timestamp} ${message}`;
    console.log(logMessage);

    let fullMessage = logMessage;
    if (data && this.debugMode) {
      const dataStr = "   Data: " + JSON.stringify(data, null, 2);
      console.log(dataStr);
      fullMessage += "\n" + dataStr;
    }

    this.writeToFile(fullMessage);
  }

  /**
   * Log progress message (always shown)
   */
  progress(message: string): void {
    const timestamp = this.getElapsedTime();
    const logMessage = `🔄 ${timestamp} ${message}`;
    console.log(logMessage);
    this.writeToFile(logMessage);
  }

  /**
   * Log step message (only in debug mode)
   */
  step(stepName: string, details?: string): void {
    if (this.debugMode) {
      const timestamp = this.getElapsedTime();
      const logMessage = `📍 ${timestamp} STEP: ${stepName}`;
      console.log(logMessage);

      let fullMessage = logMessage;
      if (details) {
        const detailsStr = `   ${details}`;
        console.log(detailsStr);
        fullMessage += "\n" + detailsStr;
      }

      this.writeToFile(fullMessage);
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
