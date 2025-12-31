/**
 * Stats tracking service for performance metrics.
 * Singleton that collects data loading and query statistics.
 */
class StatsService {
  constructor() {
    this._reset();
    this.listeners = new Set();
  }

  _reset() {
    this.startTime = Date.now();
    this.indexFiles = new Map(); // name -> { bytes, loadTime }
    this.bucketFiles = new Map(); // prefix -> { bytes, loadTime }
    this.queries = [];
    this.wasmDecodes = [];
  }

  /** Subscribe to stats updates */
  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _notify() {
    const stats = this.getStats();
    for (const cb of this.listeners) {
      cb(stats);
    }
  }

  /** Record an index file load */
  recordIndexLoad(name, bytes, loadTimeMs) {
    this.indexFiles.set(name, { bytes, loadTime: loadTimeMs });
    this._notify();
  }

  /** Record a bucket file load */
  recordBucketLoad(prefix, bytes, loadTimeMs) {
    this.bucketFiles.set(prefix, { bytes, loadTime: loadTimeMs });
    this._notify();
  }

  /** Record a search query */
  recordQuery(tab, query, resultCount, timeMs) {
    this.queries.push({
      tab,
      query,
      resultCount,
      time: timeMs,
      timestamp: Date.now(),
    });
    // Keep last 100 queries
    if (this.queries.length > 100) {
      this.queries = this.queries.slice(-100);
    }
    this._notify();
  }

  /** Record a WASM decode operation */
  recordWasmDecode(edidSize, timeMs) {
    this.wasmDecodes.push({
      edidSize,
      time: timeMs,
      timestamp: Date.now(),
    });
    // Keep last 100 decodes
    if (this.wasmDecodes.length > 100) {
      this.wasmDecodes = this.wasmDecodes.slice(-100);
    }
    this._notify();
  }

  /** Get aggregated stats */
  getStats() {
    let indexBytes = 0;
    let indexCount = 0;
    let indexTotalTime = 0;
    for (const [, info] of this.indexFiles) {
      indexBytes += info.bytes;
      indexCount++;
      indexTotalTime += info.loadTime;
    }

    let bucketBytes = 0;
    let bucketCount = 0;
    let bucketTotalTime = 0;
    for (const [, info] of this.bucketFiles) {
      bucketBytes += info.bytes;
      bucketCount++;
      bucketTotalTime += info.loadTime;
    }

    const queryCount = this.queries.length;
    const avgQueryTime = queryCount > 0
      ? this.queries.reduce((sum, q) => sum + q.time, 0) / queryCount
      : 0;

    const decodeCount = this.wasmDecodes.length;
    const avgDecodeTime = decodeCount > 0
      ? this.wasmDecodes.reduce((sum, d) => sum + d.time, 0) / decodeCount
      : 0;

    return {
      uptime: Date.now() - this.startTime,
      indexFiles: indexCount,
      indexBytes,
      indexTotalTime,
      bucketFiles: bucketCount,
      bucketBytes,
      bucketTotalTime,
      totalBytes: indexBytes + bucketBytes,
      queryCount,
      avgQueryTime,
      decodeCount,
      avgDecodeTime,
    };
  }

  /** Format bytes for display */
  static formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /** Format time for display */
  static formatTime(ms) {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }
}

// Singleton instance
export const stats = new StatsService();
