// Professional environment configuration service
// Provides secure access to environment variables with validation and fallbacks

export interface AppConfig {
  // Supabase Configuration
  supabase: {
    url: string;
    publishableKey: string;
    serviceRoleKey?: string;
    projectId?: string;
  };
  
  // OCR Configuration
  ocr: {
    primaryApiKey: string;
    backupApiKey?: string;
    maxRetries: number;
    timeout: number;
  };
  
  // Application Configuration
  app: {
    name: string;
    version: string;
    maxFileSize: number;
    supportedFileTypes: string[];
    debugMode: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
}

class EnvironmentService {
  private config: AppConfig;
  private isProduction: boolean;

  constructor() {
    this.isProduction = import.meta.env.PROD;
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  private loadConfiguration(): AppConfig {
    return {
      supabase: {
        url: this.getRequiredEnv('VITE_SUPABASE_URL'),
        publishableKey: this.getRequiredEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
        serviceRoleKey: this.getOptionalEnv('VITE_SUPABASE_SERVICE_ROLE_KEY'),
        projectId: this.getOptionalEnv('VITE_SUPABASE_PROJECT_ID'),
      },
      ocr: {
        primaryApiKey: this.getRequiredEnv('VITE_OCR_API_KEY'),
        backupApiKey: this.getOptionalEnv('VITE_OCR_BACKUP_API_KEY'),
        maxRetries: parseInt(this.getOptionalEnv('VITE_OCR_MAX_RETRIES') || '3'),
        timeout: parseInt(this.getOptionalEnv('VITE_OCR_TIMEOUT') || '30000'),
      },
      app: {
        name: this.getOptionalEnv('VITE_APP_NAME') || 'Insurance Automation System',
        version: this.getOptionalEnv('VITE_APP_VERSION') || '1.0.0',
        maxFileSize: parseInt(this.getOptionalEnv('VITE_MAX_FILE_SIZE') || '10485760'), // 10MB
        supportedFileTypes: this.parseFileTypes(
          this.getOptionalEnv('VITE_SUPPORTED_FILE_TYPES') || 'image/jpeg,image/png,image/gif,application/pdf'
        ),
        debugMode: this.getOptionalEnv('VITE_DEBUG_MODE') === 'true',
        logLevel: this.parseLogLevel(),
      },
    };
  }

  private getRequiredEnv(key: string): string {
    const value = import.meta.env[key];
    if (!value) {
      const error = `Missing required environment variable: ${key}`;
      console.error('🔴 [Environment Error]', error);
      throw new Error(error);
    }
    return value;
  }

  private getOptionalEnv(key: string): string | undefined {
    return import.meta.env[key];
  }

  private parseFileTypes(fileTypesString: string): string[] {
    return fileTypesString.split(',').map(type => type.trim());
  }

  private parseLogLevel(): 'error' | 'warn' | 'info' | 'debug' {
    const level = this.getOptionalEnv('VITE_LOG_LEVEL') || 'info';
    const validLevels = ['error', 'warn', 'info', 'debug'];
    return validLevels.includes(level) ? level as any : 'info';
  }

  private validateConfiguration(): void {
    // Validate Supabase URL format
    try {
      new URL(this.config.supabase.url);
    } catch {
      throw new Error('Invalid Supabase URL format');
    }

    // Validate file size limits
    if (this.config.app.maxFileSize < 1024 || this.config.app.maxFileSize > 104857600) { // 1KB - 100MB
      throw new Error('Invalid file size limit. Must be between 1KB and 100MB');
    }

    // Validate supported file types
    if (this.config.app.supportedFileTypes.length === 0) {
      throw new Error('At least one supported file type must be specified');
    }

    // Log configuration status
    if (!this.isProduction && this.config.app.debugMode) {
      console.log('🟢 [Environment] Configuration loaded successfully', {
        supabaseUrl: this.config.supabase.url ? '✅' : '❌',
        ocrApiKey: this.config.ocr.primaryApiKey ? '✅' : '❌',
        backupOcrKey: this.config.ocr.backupApiKey ? '✅' : '⚠️ (optional)',
        maxFileSize: `${(this.config.app.maxFileSize / 1024 / 1024).toFixed(1)}MB`,
        supportedTypes: this.config.app.supportedFileTypes.length,
      });
    }
  }

  // Public getters
  public getSupabaseConfig() {
    return this.config.supabase;
  }

  public getOcrConfig() {
    return this.config.ocr;
  }

  public getAppConfig() {
    return this.config.app;
  }

  public isDebugMode(): boolean {
    return this.config.app.debugMode && !this.isProduction;
  }

  public getLogLevel(): string {
    return this.config.app.logLevel;
  }

  // Utility methods
  public isFileTypeSupported(mimeType: string): boolean {
    return this.config.app.supportedFileTypes.includes(mimeType);
  }

  public isFileSizeValid(size: number): boolean {
    return size <= this.config.app.maxFileSize && size > 0;
  }

  public getMaxFileSizeMB(): number {
    return Math.round(this.config.app.maxFileSize / 1024 / 1024);
  }
}

// Singleton instance
export const environmentService = new EnvironmentService();

// Convenience exports
export const config = environmentService;
export default environmentService;
