import { eventBus } from './EventBus';

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  dependencies?: string[];
  permissions?: PluginPermission[];
  config?: PluginConfig;
  enabled: boolean;
  loaded: boolean;
  instance?: PluginInstance;
  manifest: PluginManifest;
}

export interface PluginManifest {
  main: string;
  assets?: string[];
  styles?: string[];
  hooks?: PluginHook[];
  commands?: PluginCommand[];
  settings?: PluginSetting[];
  api?: PluginAPI[];
  loadPriority?: number;
  sandbox?: boolean;
}

export interface PluginInstance {
  onLoad?: () => Promise<void>;
  onEnable?: () => Promise<void>;
  onDisable?: () => Promise<void>;
  onUnload?: () => Promise<void>;
  onUpdate?: (deltaTime: number) => void;
  onEvent?: (event: string, data: any) => void;
  getState?: () => any;
  setState?: (state: any) => void;
}

export interface PluginHook {
  event: string;
  handler: string;
  priority?: number;
  filter?: (data: any) => boolean;
}

export interface PluginCommand {
  name: string;
  description: string;
  handler: string;
  args?: CommandArg[];
  permissions?: string[];
}

export interface CommandArg {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required?: boolean;
  default?: any;
}

export interface PluginSetting {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'color' | 'range';
  default: any;
  options?: any[];
  min?: number;
  max?: number;
  step?: number;
}

export interface PluginAPI {
  method: string;
  endpoint: string;
  handler: string;
  rateLimit?: number;
  cache?: boolean;
}

export interface PluginConfig {
  [key: string]: any;
}

export enum PluginPermission {
  READ_GAME_STATE = 'read_game_state',
  WRITE_GAME_STATE = 'write_game_state',
  ACCESS_NETWORK = 'access_network',
  ACCESS_STORAGE = 'access_storage',
  MODIFY_UI = 'modify_ui',
  EXECUTE_COMMANDS = 'execute_commands',
  ACCESS_PLAYER_DATA = 'access_player_data',
  SEND_NOTIFICATIONS = 'send_notifications',
}

export interface PluginContext {
  game: GameAPI;
  ui: UIAPI;
  storage: StorageAPI;
  network: NetworkAPI;
  events: EventAPI;
  utils: UtilsAPI;
}

export interface GameAPI {
  getState: () => any;
  setState: (state: any) => void;
  getPlayer: () => any;
  getScore: () => number;
  addScore: (amount: number) => void;
  getCurrency: (type: string) => number;
  addCurrency: (type: string, amount: number) => void;
  getMultipliers: () => any;
  applyMultiplier: (type: string, value: number) => number;
}

export interface UIAPI {
  showNotification: (message: string, type?: string) => void;
  showModal: (content: any) => void;
  createElement: (element: any) => void;
  updateElement: (id: string, updates: any) => void;
  removeElement: (id: string) => void;
  registerScreen: (name: string, component: any) => void;
}

export interface StorageAPI {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}

export interface NetworkAPI {
  fetch: (url: string, options?: any) => Promise<any>;
  websocket: (url: string) => WebSocket;
}

export interface EventAPI {
  on: (event: string, handler: Function) => void;
  off: (event: string, handler: Function) => void;
  emit: (event: string, data?: any) => void;
  once: (event: string, handler: Function) => void;
}

export interface UtilsAPI {
  random: (min: number, max: number) => number;
  uuid: () => string;
  hash: (data: string) => string;
  encrypt: (data: string, key: string) => string;
  decrypt: (data: string, key: string) => string;
  debounce: (func: Function, delay: number) => Function;
  throttle: (func: Function, limit: number) => Function;
}

export class PluginSystem {
  private static instance: PluginSystem;
  private plugins: Map<string, Plugin> = new Map();
  private loadedPlugins: Map<string, PluginInstance> = new Map();
  private hooks: Map<string, Array<{ plugin: string; handler: Function; priority: number }>> = new Map();
  private commands: Map<string, { plugin: string; handler: Function }> = new Map();
  private sandboxes: Map<string, PluginSandbox> = new Map();
  private pluginStates: Map<string, any> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private context: PluginContext;

  private constructor() {
    this.context = this.createContext();
    this.setupEventListeners();
    this.startUpdateLoop();
  }

  static getInstance(): PluginSystem {
    if (!PluginSystem.instance) {
      PluginSystem.instance = new PluginSystem();
    }
    return PluginSystem.instance;
  }

  private createContext(): PluginContext {
    return {
      game: this.createGameAPI(),
      ui: this.createUIAPI(),
      storage: this.createStorageAPI(),
      network: this.createNetworkAPI(),
      events: this.createEventAPI(),
      utils: this.createUtilsAPI(),
    };
  }

  private createGameAPI(): GameAPI {
    return {
      getState: () => {
        // Return read-only game state
        return {};
      },
      setState: (state: any) => {
        if (this.hasPermission('write_game_state')) {
          // Update game state
        }
      },
      getPlayer: () => {
        if (this.hasPermission('access_player_data')) {
          return {};
        }
        return null;
      },
      getScore: () => 0,
      addScore: (amount: number) => {
        if (this.hasPermission('write_game_state')) {
          eventBus.emit('score:add', { amount });
        }
      },
      getCurrency: (type: string) => 0,
      addCurrency: (type: string, amount: number) => {
        if (this.hasPermission('write_game_state')) {
          eventBus.emit('currency:add', { type, amount });
        }
      },
      getMultipliers: () => ({}),
      applyMultiplier: (type: string, value: number) => value,
    };
  }

  private createUIAPI(): UIAPI {
    return {
      showNotification: (message: string, type?: string) => {
        if (this.hasPermission('send_notifications')) {
          eventBus.emit('notification:show', { message, type });
        }
      },
      showModal: (content: any) => {
        if (this.hasPermission('modify_ui')) {
          eventBus.emit('modal:show', { content });
        }
      },
      createElement: (element: any) => {
        if (this.hasPermission('modify_ui')) {
          eventBus.emit('ui:create', { element });
        }
      },
      updateElement: (id: string, updates: any) => {
        if (this.hasPermission('modify_ui')) {
          eventBus.emit('ui:update', { id, updates });
        }
      },
      removeElement: (id: string) => {
        if (this.hasPermission('modify_ui')) {
          eventBus.emit('ui:remove', { id });
        }
      },
      registerScreen: (name: string, component: any) => {
        if (this.hasPermission('modify_ui')) {
          eventBus.emit('screen:register', { name, component });
        }
      },
    };
  }

  private createStorageAPI(): StorageAPI {
    return {
      get: async (key: string) => {
        if (this.hasPermission('access_storage')) {
          return localStorage.getItem(key);
        }
        return null;
      },
      set: async (key: string, value: any) => {
        if (this.hasPermission('access_storage')) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      },
      remove: async (key: string) => {
        if (this.hasPermission('access_storage')) {
          localStorage.removeItem(key);
        }
      },
      clear: async () => {
        if (this.hasPermission('access_storage')) {
          localStorage.clear();
        }
      },
    };
  }

  private createNetworkAPI(): NetworkAPI {
    return {
      fetch: async (url: string, options?: any) => {
        if (this.hasPermission('access_network')) {
          return fetch(url, options);
        }
        throw new Error('Network access denied');
      },
      websocket: (url: string) => {
        if (this.hasPermission('access_network')) {
          return new WebSocket(url);
        }
        throw new Error('Network access denied');
      },
    };
  }

  private createEventAPI(): EventAPI {
    return {
      on: (event: string, handler: Function) => {
        eventBus.on(event, handler);
      },
      off: (event: string, handler: Function) => {
        // eventBus.off would need to be implemented
      },
      emit: (event: string, data?: any) => {
        eventBus.emit(`plugin:${event}`, data);
      },
      once: (event: string, handler: Function) => {
        eventBus.once(event, handler);
      },
    };
  }

  private createUtilsAPI(): UtilsAPI {
    return {
      random: (min: number, max: number) => Math.random() * (max - min) + min,
      uuid: () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      hash: (data: string) => {
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
          hash = ((hash << 5) - hash) + data.charCodeAt(i);
          hash = hash & hash;
        }
        return hash.toString(36);
      },
      encrypt: (data: string, key: string) => btoa(data),
      decrypt: (data: string, key: string) => atob(data),
      debounce: (func: Function, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        return (...args: any[]) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func(...args), delay);
        };
      },
      throttle: (func: Function, limit: number) => {
        let inThrottle: boolean;
        return (...args: any[]) => {
          if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
          }
        };
      },
    };
  }

  private setupEventListeners() {
    eventBus.on('plugin:install', (data: { url: string }) => {
      this.installPlugin(data.url);
    });

    eventBus.on('plugin:uninstall', (data: { id: string }) => {
      this.uninstallPlugin(data.id);
    });

    eventBus.on('plugin:enable', (data: { id: string }) => {
      this.enablePlugin(data.id);
    });

    eventBus.on('plugin:disable', (data: { id: string }) => {
      this.disablePlugin(data.id);
    });
  }

  private startUpdateLoop() {
    this.updateInterval = setInterval(() => {
      this.updatePlugins();
    }, 16); // 60 FPS
  }

  async installPlugin(url: string): Promise<boolean> {
    try {
      // Load plugin manifest
      const response = await fetch(url);
      const pluginCode = await response.text();
      
      // Parse plugin metadata
      const metadata = this.parsePluginMetadata(pluginCode);
      
      if (this.plugins.has(metadata.id)) {
        console.log('Plugin already installed');
        return false;
      }

      // Check dependencies
      if (!this.checkDependencies(metadata.dependencies)) {
        console.log('Missing dependencies');
        return false;
      }

      // Create plugin
      const plugin: Plugin = {
        id: metadata.id,
        name: metadata.name,
        version: metadata.version,
        description: metadata.description,
        author: metadata.author,
        dependencies: metadata.dependencies,
        permissions: metadata.permissions,
        config: {},
        enabled: false,
        loaded: false,
        manifest: metadata.manifest,
      };

      this.plugins.set(plugin.id, plugin);

      // Load plugin if auto-enable
      if (metadata.autoEnable) {
        await this.loadPlugin(plugin);
      }

      eventBus.emit('plugin:installed', {
        id: plugin.id,
        name: plugin.name,
      });

      return true;
    } catch (error) {
      console.error('Failed to install plugin:', error);
      return false;
    }
  }

  async loadPlugin(plugin: Plugin): Promise<boolean> {
    if (plugin.loaded) return true;

    try {
      // Create sandbox if needed
      if (plugin.manifest.sandbox) {
        const sandbox = new PluginSandbox(plugin.id, this.context);
        this.sandboxes.set(plugin.id, sandbox);
      }

      // Load plugin instance
      const instance = await this.createPluginInstance(plugin);
      if (!instance) return false;

      plugin.instance = instance;
      this.loadedPlugins.set(plugin.id, instance);

      // Call onLoad
      if (instance.onLoad) {
        await instance.onLoad();
      }

      // Register hooks
      if (plugin.manifest.hooks) {
        this.registerHooks(plugin);
      }

      // Register commands
      if (plugin.manifest.commands) {
        this.registerCommands(plugin);
      }

      plugin.loaded = true;

      eventBus.emit('plugin:loaded', {
        id: plugin.id,
      });

      return true;
    } catch (error) {
      console.error(`Failed to load plugin ${plugin.id}:`, error);
      return false;
    }
  }

  async enablePlugin(id: string): Promise<boolean> {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;

    if (plugin.enabled) return true;

    if (!plugin.loaded) {
      await this.loadPlugin(plugin);
    }

    if (plugin.instance?.onEnable) {
      await plugin.instance.onEnable();
    }

    plugin.enabled = true;

    eventBus.emit('plugin:enabled', {
      id: plugin.id,
    });

    return true;
  }

  async disablePlugin(id: string): Promise<boolean> {
    const plugin = this.plugins.get(id);
    if (!plugin || !plugin.enabled) return false;

    if (plugin.instance?.onDisable) {
      await plugin.instance.onDisable();
    }

    plugin.enabled = false;

    eventBus.emit('plugin:disabled', {
      id: plugin.id,
    });

    return true;
  }

  async uninstallPlugin(id: string): Promise<boolean> {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;

    // Disable first
    if (plugin.enabled) {
      await this.disablePlugin(id);
    }

    // Unload
    if (plugin.loaded && plugin.instance?.onUnload) {
      await plugin.instance.onUnload();
    }

    // Unregister hooks and commands
    this.unregisterHooks(plugin);
    this.unregisterCommands(plugin);

    // Clean up
    this.loadedPlugins.delete(id);
    this.sandboxes.delete(id);
    this.pluginStates.delete(id);
    this.plugins.delete(id);

    eventBus.emit('plugin:uninstalled', {
      id,
    });

    return true;
  }

  private async createPluginInstance(plugin: Plugin): Promise<PluginInstance | null> {
    // This would dynamically load the plugin code
    // For now, return a dummy instance
    return {
      onLoad: async () => {
        console.log(`Plugin ${plugin.id} loaded`);
      },
      onEnable: async () => {
        console.log(`Plugin ${plugin.id} enabled`);
      },
      onDisable: async () => {
        console.log(`Plugin ${plugin.id} disabled`);
      },
      onUnload: async () => {
        console.log(`Plugin ${plugin.id} unloaded`);
      },
      onUpdate: (deltaTime: number) => {
        // Update logic
      },
      onEvent: (event: string, data: any) => {
        // Handle events
      },
      getState: () => this.pluginStates.get(plugin.id),
      setState: (state: any) => this.pluginStates.set(plugin.id, state),
    };
  }

  private registerHooks(plugin: Plugin) {
    plugin.manifest.hooks?.forEach(hook => {
      if (!this.hooks.has(hook.event)) {
        this.hooks.set(hook.event, []);
      }

      const handler = this.createHookHandler(plugin, hook);
      this.hooks.get(hook.event)!.push({
        plugin: plugin.id,
        handler,
        priority: hook.priority || 0,
      });

      // Sort by priority
      this.hooks.get(hook.event)!.sort((a, b) => b.priority - a.priority);
    });
  }

  private createHookHandler(plugin: Plugin, hook: PluginHook): Function {
    return (data: any) => {
      if (hook.filter && !hook.filter(data)) return;
      
      if (plugin.instance?.onEvent) {
        plugin.instance.onEvent(hook.event, data);
      }
    };
  }

  private registerCommands(plugin: Plugin) {
    plugin.manifest.commands?.forEach(command => {
      const handler = this.createCommandHandler(plugin, command);
      this.commands.set(command.name, {
        plugin: plugin.id,
        handler,
      });
    });
  }

  private createCommandHandler(plugin: Plugin, command: PluginCommand): Function {
    return (args: any) => {
      // Validate args
      if (command.args) {
        for (const arg of command.args) {
          if (arg.required && !args[arg.name]) {
            throw new Error(`Missing required argument: ${arg.name}`);
          }
        }
      }

      // Execute command
      if (plugin.instance?.onEvent) {
        plugin.instance.onEvent(`command:${command.name}`, args);
      }
    };
  }

  private unregisterHooks(plugin: Plugin) {
    this.hooks.forEach((handlers, event) => {
      this.hooks.set(
        event,
        handlers.filter(h => h.plugin !== plugin.id)
      );
    });
  }

  private unregisterCommands(plugin: Plugin) {
    const toRemove: string[] = [];
    this.commands.forEach((cmd, name) => {
      if (cmd.plugin === plugin.id) {
        toRemove.push(name);
      }
    });
    toRemove.forEach(name => this.commands.delete(name));
  }

  private updatePlugins() {
    const deltaTime = 16; // ms

    this.loadedPlugins.forEach((instance, id) => {
      const plugin = this.plugins.get(id);
      if (plugin?.enabled && instance.onUpdate) {
        instance.onUpdate(deltaTime);
      }
    });
  }

  executeHooks(event: string, data: any): any {
    const handlers = this.hooks.get(event);
    if (!handlers) return data;

    let result = data;
    for (const handler of handlers) {
      const plugin = this.plugins.get(handler.plugin);
      if (plugin?.enabled) {
        const hookResult = handler.handler(result);
        if (hookResult !== undefined) {
          result = hookResult;
        }
      }
    }

    return result;
  }

  executeCommand(name: string, args: any): any {
    const command = this.commands.get(name);
    if (!command) {
      throw new Error(`Command not found: ${name}`);
    }

    const plugin = this.plugins.get(command.plugin);
    if (!plugin?.enabled) {
      throw new Error(`Plugin not enabled: ${command.plugin}`);
    }

    return command.handler(args);
  }

  private parsePluginMetadata(code: string): any {
    // Parse plugin metadata from code comments or exports
    // This is a simplified version
    return {
      id: 'example-plugin',
      name: 'Example Plugin',
      version: '1.0.0',
      description: 'An example plugin',
      author: 'Author',
      dependencies: [],
      permissions: [],
      manifest: {
        main: 'index.js',
        hooks: [],
        commands: [],
      },
    };
  }

  private checkDependencies(dependencies?: string[]): boolean {
    if (!dependencies) return true;

    for (const dep of dependencies) {
      if (!this.plugins.has(dep)) {
        return false;
      }
    }

    return true;
  }

  private hasPermission(permission: string): boolean {
    // Check if current plugin has permission
    // This would be implemented based on current execution context
    return true;
  }

  // Public methods
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(id: string): Plugin | null {
    return this.plugins.get(id) || null;
  }

  getEnabledPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter(p => p.enabled);
  }

  getPluginConfig(id: string): PluginConfig | null {
    const plugin = this.plugins.get(id);
    return plugin?.config || null;
  }

  setPluginConfig(id: string, config: PluginConfig) {
    const plugin = this.plugins.get(id);
    if (plugin) {
      plugin.config = config;
      
      if (plugin.instance?.setState) {
        plugin.instance.setState({ config });
      }
    }
  }

  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // Unload all plugins
    this.plugins.forEach(plugin => {
      this.uninstallPlugin(plugin.id);
    });
  }
}

// Plugin Sandbox for isolated execution
class PluginSandbox {
  private id: string;
  private context: PluginContext;
  private scope: any = {};

  constructor(id: string, context: PluginContext) {
    this.id = id;
    this.context = this.createSandboxedContext(context);
  }

  private createSandboxedContext(context: PluginContext): PluginContext {
    // Create a sandboxed version of the context
    // with limited access and monitoring
    return {
      ...context,
      game: this.wrapAPI(context.game),
      ui: this.wrapAPI(context.ui),
      storage: this.wrapAPI(context.storage),
      network: this.wrapAPI(context.network),
      events: this.wrapAPI(context.events),
      utils: context.utils, // Utils are safe
    };
  }

  private wrapAPI(api: any): any {
    const wrapped: any = {};
    
    for (const key in api) {
      if (typeof api[key] === 'function') {
        wrapped[key] = (...args: any[]) => {
          // Log API calls for monitoring
          console.log(`Plugin ${this.id} called ${key}`, args);
          
          // Apply rate limiting, validation, etc.
          return api[key](...args);
        };
      } else {
        wrapped[key] = api[key];
      }
    }

    return wrapped;
  }

  execute(code: string): any {
    // Execute code in sandboxed environment
    // This would use a proper sandbox implementation
    try {
      const func = new Function('context', 'scope', code);
      return func(this.context, this.scope);
    } catch (error) {
      console.error(`Sandbox execution error in plugin ${this.id}:`, error);
      throw error;
    }
  }

  getScope(): any {
    return this.scope;
  }

  setScope(scope: any) {
    this.scope = scope;
  }
}

export const pluginSystem = PluginSystem.getInstance();