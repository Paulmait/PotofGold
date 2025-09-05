type EventCallback<T = any> = (data: T) => void;
type UnsubscribeFn = () => void;

interface EventSubscription {
  id: string;
  callback: EventCallback;
  once: boolean;
  priority: number;
}

interface EventMetrics {
  eventName: string;
  count: number;
  lastEmitted: number;
  averageHandlerTime: number;
  handlers: number;
}

export class EventBus {
  private static instance: EventBus;
  private events: Map<string, EventSubscription[]> = new Map();
  private eventMetrics: Map<string, EventMetrics> = new Map();
  private globalMiddleware: Array<(eventName: string, data: any) => any> = [];
  private eventQueue: Array<{ event: string; data: any }> = [];
  private isProcessing = false;
  private subscriptionId = 0;

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on<T = any>(
    event: string,
    callback: EventCallback<T>,
    priority = 0
  ): UnsubscribeFn {
    const id = `sub_${++this.subscriptionId}`;
    const subscription: EventSubscription = {
      id,
      callback,
      once: false,
      priority,
    };

    this.addSubscription(event, subscription);

    return () => this.off(event, id);
  }

  once<T = any>(
    event: string,
    callback: EventCallback<T>,
    priority = 0
  ): UnsubscribeFn {
    const id = `sub_${++this.subscriptionId}`;
    const subscription: EventSubscription = {
      id,
      callback,
      once: true,
      priority,
    };

    this.addSubscription(event, subscription);

    return () => this.off(event, id);
  }

  private addSubscription(event: string, subscription: EventSubscription) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const subscribers = this.events.get(event)!;
    subscribers.push(subscription);
    subscribers.sort((a, b) => b.priority - a.priority);

    this.updateMetrics(event);
  }

  off(event: string, subscriptionId: string) {
    const subscribers = this.events.get(event);
    if (!subscribers) return;

    const index = subscribers.findIndex((sub) => sub.id === subscriptionId);
    if (index !== -1) {
      subscribers.splice(index, 1);
      this.updateMetrics(event);
    }

    if (subscribers.length === 0) {
      this.events.delete(event);
    }
  }

  emit<T = any>(event: string, data?: T, async = false) {
    if (async) {
      this.eventQueue.push({ event, data });
      this.processQueue();
      return;
    }

    this.processEvent(event, data);
  }

  private processEvent<T = any>(event: string, data?: T) {
    let processedData = data;

    for (const middleware of this.globalMiddleware) {
      processedData = middleware(event, processedData);
    }

    const subscribers = this.events.get(event);
    if (!subscribers || subscribers.length === 0) return;

    const startTime = performance.now();
    const toRemove: string[] = [];

    for (const subscription of [...subscribers]) {
      try {
        subscription.callback(processedData);
        
        if (subscription.once) {
          toRemove.push(subscription.id);
        }
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    }

    toRemove.forEach((id) => this.off(event, id));

    const endTime = performance.now();
    this.recordMetrics(event, endTime - startTime);
  }

  private async processQueue() {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const { event, data } = this.eventQueue.shift()!;
      
      await new Promise((resolve) => {
        setTimeout(() => {
          this.processEvent(event, data);
          resolve(undefined);
        }, 0);
      });
    }

    this.isProcessing = false;
  }

  addMiddleware(middleware: (eventName: string, data: any) => any) {
    this.globalMiddleware.push(middleware);
  }

  removeMiddleware(middleware: (eventName: string, data: any) => any) {
    const index = this.globalMiddleware.indexOf(middleware);
    if (index !== -1) {
      this.globalMiddleware.splice(index, 1);
    }
  }

  private updateMetrics(event: string) {
    if (!this.eventMetrics.has(event)) {
      this.eventMetrics.set(event, {
        eventName: event,
        count: 0,
        lastEmitted: 0,
        averageHandlerTime: 0,
        handlers: 0,
      });
    }

    const metrics = this.eventMetrics.get(event)!;
    metrics.handlers = this.events.get(event)?.length || 0;
  }

  private recordMetrics(event: string, handlerTime: number) {
    const metrics = this.eventMetrics.get(event);
    if (!metrics) return;

    metrics.count++;
    metrics.lastEmitted = Date.now();
    metrics.averageHandlerTime =
      (metrics.averageHandlerTime * (metrics.count - 1) + handlerTime) /
      metrics.count;
  }

  getMetrics(event?: string): EventMetrics | EventMetrics[] {
    if (event) {
      return this.eventMetrics.get(event) || {
        eventName: event,
        count: 0,
        lastEmitted: 0,
        averageHandlerTime: 0,
        handlers: 0,
      };
    }

    return Array.from(this.eventMetrics.values());
  }

  clear(event?: string) {
    if (event) {
      this.events.delete(event);
      this.eventMetrics.delete(event);
    } else {
      this.events.clear();
      this.eventMetrics.clear();
      this.eventQueue = [];
    }
  }

  getEvents(): string[] {
    return Array.from(this.events.keys());
  }

  hasListeners(event: string): boolean {
    return this.events.has(event) && this.events.get(event)!.length > 0;
  }
}

export const eventBus = EventBus.getInstance();