import { CACHE_DURATION } from 'src/constants/config';

interface CacheItem<T> {
    data: T;
    expiresAt: number;
}

class Cache {
    private static instance: Cache;
    private cache: { [key: string]: CacheItem<any> };
    private readonly defaultDuration: number;

    private constructor() {
        this.cache = {};
        this.defaultDuration = CACHE_DURATION;
    }

    public static getInstance(): Cache {
        if (!Cache.instance) {
            Cache.instance = new Cache();
        }
        return Cache.instance;
    }

    private createKey(pageName: string, params: any): string {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc: any, key) => {
                if (params[key] !== undefined && params[key] !== null) {
                    acc[key] = params[key];
                }
                return acc;
            }, {});
            
        return `${pageName}_${JSON.stringify(sortedParams)}`;
    }

    public set<T>(pageName: string, params: any, data: T): void {
        const key = this.createKey(pageName, params);
        this.cache[key] = {
            data,
            expiresAt: Date.now() + this.defaultDuration
        };
    }

    public get<T>(pageName: string, params: any): T | null {
        const key = this.createKey(pageName, params);
        const item = this.cache[key];

        if (!item) return null;

        if (Date.now() > item.expiresAt) {
            delete this.cache[key];
            return null;
        }

        return item.data;
    }

    public clear(): void {
        this.cache = {};
    }

    public clearByPage(pageName: string): void {
        Object.keys(this.cache).forEach(key => {
            if (key.startsWith(`${pageName}_`)) {
                delete this.cache[key];
            }
        });
    }

    public getSize(): number {
        return Object.keys(this.cache).length;
    }
}

// Single cache instance for the entire application
export const cache = Cache.getInstance(); 