import { LitElement, html, css } from 'lit';
import './edid-selector.js';
import './edid-detail.js';
import { stats } from './stats.js';

/**
 * Main EDID browser component - wrapper that coordinates selector and viewer.
 * Handles responsive layout and status display.
 *
 * @element edid-browser
 * @prop {string} baseUrl - Base URL for data files
 */
export class EdidBrowser extends LitElement {
  static properties = {
    baseUrl: { type: String, attribute: 'data-base-url' },
    _status: { type: Object, state: true },
    _statusHistory: { type: Array, state: true },
    _showStatusLog: { type: Boolean, state: true },
    _selectedEdid: { type: Object, state: true },
    _layoutMode: { type: String, state: true },
    _showDetail: { type: Boolean, state: true },
    _manifest: { type: Object, state: true },
    _stats: { type: Object, state: true },
  };

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 1036px;
      height: 100%;
      min-height: 0;
      max-width: 100%;
      margin: 0 auto;
      background: var(--color-bg);
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      position: relative;
    }

    .header {
      height: 48px;
      padding: 0 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      border-bottom: 1px solid var(--color-border);
      flex-shrink: 0;
      background: var(--color-surface);
    }

    .header h1 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .header .count {
      color: var(--color-text-muted);
      font-size: 0.8125rem;
    }

    .header .project-link {
      color: var(--color-accent);
      text-decoration: none;
      font-size: 0.8125rem;
      margin-left: auto;
    }

    .header .project-link:hover {
      text-decoration: underline;
    }

    /* Main content area */
    .main-content {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: row;
      overflow: hidden;
    }

    /* Wide layout: side by side */
    :host([layout="wide"]) .main-content {
      flex-direction: row;
    }

    :host([layout="wide"]) .selector-section {
      width: 500px;
      flex-shrink: 0;
      border-right: 1px solid var(--color-border);
    }

    :host([layout="wide"]) .detail-section {
      width: 500px;
      flex-shrink: 0;
    }

    /* Mobile layout: slide between screens */
    :host([layout="mobile"]) .main-content {
      position: relative;
      overflow: hidden;
    }

    :host([layout="mobile"]) .selector-section,
    :host([layout="mobile"]) .detail-section {
      width: auto;
      min-width: 0;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      transition: transform 0.3s ease-in-out;
    }

    :host([layout="mobile"]) .selector-section {
      transform: translateX(0);
    }

    :host([layout="mobile"][show-detail]) .selector-section {
      transform: translateX(-100%);
    }

    :host([layout="mobile"]) .detail-section {
      transform: translateX(100%);
    }

    :host([layout="mobile"][show-detail]) .detail-section {
      transform: translateX(0);
    }

    .selector-section {
      overflow: hidden;
      background: var(--color-bg);
      width: 500px;
      flex-shrink: 0;
    }

    .detail-section {
      overflow: hidden;
      background: var(--color-surface);
      width: 500px;
      flex-shrink: 0;
      padding: 0.75rem 1rem;
      display: flex;
      flex-direction: column;
    }

    .status-bar {
      height: 24px;
      padding: 0 1rem;
      background: var(--color-surface);
      border-top: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.6875rem;
      color: var(--color-text-muted);
      flex-shrink: 0;
    }

    .status-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-text-muted);
    }

    .status-indicator[data-type="loading"] {
      background: var(--color-accent);
      animation: pulse 1s ease-in-out infinite;
    }

    .status-indicator[data-type="success"] {
      background: var(--color-success);
    }

    .status-indicator[data-type="warning"] {
      background: var(--color-warning);
    }

    .status-indicator[data-type="error"] {
      background: var(--color-accent);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .status-message {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .status-source {
      color: var(--color-text-muted);
      font-size: 0.625rem;
    }

    .status-source a {
      color: var(--color-text-muted);
      text-decoration: none;
    }

    .status-source a:hover {
      color: var(--color-accent);
      text-decoration: underline;
    }

    .status-bar {
      cursor: pointer;
      user-select: none;
    }

    .status-expand {
      background: none;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      font-size: 0.625rem;
      padding: 0;
      line-height: 1;
    }

    .status-expand:hover {
      color: var(--color-text);
    }

    .status-log-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      top: 48px;
      background: var(--color-overlay-heavy);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s;
    }

    .status-log-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    .status-log {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: calc(50% + 24px);
      background: rgba(22, 33, 62, 0.95);
      border-top: 2px solid var(--color-accent);
      display: flex;
      flex-direction: column;
      transform: translateY(100%);
      transition: transform 0.25s ease-out;
    }

    .status-log.open {
      transform: translateY(0);
    }

    .status-log-header {
      padding: 0.5rem 1rem;
      font-size: 0.6875rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .status-log-close {
      background: none;
      border: none;
      color: var(--color-text-muted);
      cursor: pointer;
      font-size: 0.875rem;
      padding: 0.25rem 0.5rem;
    }

    .status-log-close:hover {
      color: var(--color-text);
    }

    .status-log-content {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .status-log-list {
      list-style: none;
      margin: 0;
      padding: 0;
      margin-top: auto;
    }

    .status-log-item {
      padding: 0.25rem 1rem;
      font-size: 0.75rem;
      font-family: var(--font-mono);
      display: flex;
      gap: 0.75rem;
    }

    .status-log-item:nth-child(odd) {
      background: var(--color-overlay-dark);
    }

    .status-log-time {
      color: var(--color-text-muted);
      flex-shrink: 0;
    }

    .status-log-type {
      min-width: 4em;
      text-transform: uppercase;
      font-size: 0.625rem;
    }

    .status-log-msg {
      color: var(--color-text);
      flex: 1;
    }

    .status-log-item[data-type="error"] .status-log-type,
    .status-log-item[data-type="error"] .status-log-msg {
      color: var(--color-accent);
    }

    .status-log-item[data-type="success"] .status-log-type,
    .status-log-item[data-type="success"] .status-log-msg {
      color: var(--color-success);
    }

    .status-log-item[data-type="warning"] .status-log-type,
    .status-log-item[data-type="warning"] .status-log-msg {
      color: var(--color-warning);
    }

    .status-log-item[data-type="loading"] .status-log-type {
      color: var(--color-text-muted);
    }

    .stats-pane {
      padding: 0.5rem 1rem;
      background: var(--color-primary);
      border-bottom: 1px solid var(--color-border);
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .stat-label {
      font-size: 0.5625rem;
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-value {
      font-size: 0.875rem;
      font-family: var(--font-mono);
      color: var(--color-text);
    }
  `;

  constructor() {
    super();
    this.baseUrl = 'data/roaringbuckets/';
    this._status = { message: 'Ready', type: 'info', timestamp: Date.now() };
    this._statusHistory = [];
    this._showStatusLog = false;
    this._selectedEdid = null;
    this._layoutMode = 'wide';
    this._showDetail = false;
    this._resizeObserver = null;
    this._manifest = null;
    this._stats = stats.getStats();
    this._statsUnsubscribe = null;
  }

  connectedCallback() {
    super.connectedCallback();

    // Set default layout
    this.setAttribute('layout', 'wide');

    // Subscribe to stats updates
    this._statsUnsubscribe = stats.onChange(newStats => {
      this._stats = newStats;
    });

    // Fetch manifest for upstream info
    this._loadManifest();

    // Set up resize observer for responsive layout
    this._resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        this._updateLayout(entry.contentRect.width);
      }
    });
    this._resizeObserver.observe(this);

    // Initial layout check
    requestAnimationFrame(() => {
      const rect = this.getBoundingClientRect();
      this._updateLayout(rect.width);
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._statsUnsubscribe) {
      this._statsUnsubscribe();
      this._statsUnsubscribe = null;
    }
  }

  async _loadManifest() {
    try {
      const response = await fetch(`${this.baseUrl}manifest.json`);
      if (response.ok) {
        const manifest = await response.json();
        this._manifest = {
          totalCount: manifest?.totalCount || manifest?.total_entries,
          version: manifest?.version,
          data_version: manifest?.data_version,
          built_at: manifest?.built_at,
          upstream: manifest?.upstream && {
            date: manifest?.upstream?.date,
            commit: manifest?.upstream?.commit,
          },
        };
      }
    } catch (err) {
      console.warn('Failed to load manifest:', err);
    }
  }

  _updateLayout(width) {
    if (width < 100) return;

    const mode = width < 600 ? 'mobile' : 'wide';

    if (mode !== this._layoutMode) {
      this._layoutMode = mode;
      this.setAttribute('layout', mode);
    }

    if (this._showDetail) {
      this.setAttribute('show-detail', '');
    } else {
      this.removeAttribute('show-detail');
    }
  }

  _onStatus(e) {
    this._status = e.detail;
    // Add to history (keep last 100 messages)
    this._statusHistory = [
      ...this._statusHistory.slice(-99),
      { ...e.detail, timestamp: e.detail.timestamp || Date.now() },
    ];
  }

  _toggleStatusLog() {
    this._showStatusLog = !this._showStatusLog;
  }

  _formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false });
  }

  _onEdidSelect(e) {
    this._selectedEdid = e.detail.edid;
    if (this._layoutMode === 'mobile') {
      this._showDetail = true;
      this.setAttribute('show-detail', '');
    }
  }

  _onDetailBack() {
    this._showDetail = false;
    this.removeAttribute('show-detail');
  }

  _renderVersionInfo() {
    if (!this._manifest?.data_version) {
      return html`
        <span>Data:&nbsp;</span>
        <a href="https://github.com/lokkju/linuxhw-datasets" target="_blank">lokkju/linuxhw-datasets</a>
        &nbsp;|&nbsp;
        <a href="https://github.com/linuxhw/EDID" target="_blank">linuxhw/EDID</a>
        `;
    }
    return html`
        <span>Data:&nbsp;</span>
        <a href="https://github.com/lokkju/linuxhw-datasets" target="_blank">lokkju/linuxhw-datasets @ ${this._manifest.built_at}</a>
        &nbsp;|&nbsp;
        <a href="https://github.com/linuxhw/EDID" target="_blank">linuxhw/EDID @ ${this._manifest.upstream.date}-${this._manifest.upstream.commit}</a>
        `;
  }

  _formatCount(count) {
    if (!count) return '';
    return count.toLocaleString();
  }

  _renderStatsPane() {
    const s = this._stats;
    const formatBytes = (bytes) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };
    const formatTime = (ms) => {
      if (ms < 1000) return `${Math.round(ms)}ms`;
      return `${(ms / 1000).toFixed(1)}s`;
    };

    return html`
      <div class="stats-pane">
        <div class="stat-item">
          <span class="stat-label">Data Loaded</span>
          <span class="stat-value">${formatBytes(s.totalBytes)}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Index Files</span>
          <span class="stat-value">${s.indexFiles} (${formatBytes(s.indexBytes)})</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Bucket Files</span>
          <span class="stat-value">${s.bucketFiles} (${formatBytes(s.bucketBytes)})</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Load Time</span>
          <span class="stat-value">${formatTime(s.indexTotalTime + s.bucketTotalTime)}</span>
        </div>
      </div>
    `;
  }

  render() {
    const count = this._manifest?.totalCount;

    return html`
      <div class="header">
        <h1>EDID Browser</h1>
        ${count ? html`<span class="count">${this._formatCount(count)} EDIDs</span>` : ''}
        <a href="https://github.com/lokkju/linuxhw-browser" target="_blank" class="project-link">lokkju/linuxhw-browser</a>
      </div>
      <div class="main-content">
        <div class="selector-section">
          <edid-selector
            base-url=${this.baseUrl}
            @status=${this._onStatus}
            @edid-select=${this._onEdidSelect}
          ></edid-selector>
        </div>
        <div class="detail-section">
          <edid-detail
            .edid=${this._selectedEdid}
            ?mobile=${this._layoutMode === 'mobile'}
            @back=${this._onDetailBack}
            @status=${this._onStatus}
          ></edid-detail>
        </div>
      </div>
      <div
        class="status-log-overlay ${this._showStatusLog ? 'open' : ''}"
        @click=${this._toggleStatusLog}
      ></div>
      <div class="status-log ${this._showStatusLog ? 'open' : ''}">
        <div class="status-log-header">
          <button class="status-log-close" @click=${this._toggleStatusLog}>▼</button>
          <span>Status Log (${this._statusHistory.length} messages)</span>
        </div>
        ${this._renderStatsPane()}
        <div class="status-log-content">
          <ul class="status-log-list">
            ${this._statusHistory.map(entry => html`
              <li class="status-log-item" data-type=${entry.type}>
                <span class="status-log-time">${this._formatTime(entry.timestamp)}</span>
                <span class="status-log-type">${entry.type}</span>
                <span class="status-log-msg">${entry.message}</span>
              </li>
            `)}
          </ul>
        </div>
      </div>
      <div class="status-bar" @click=${this._toggleStatusLog}>
        <button class="status-expand">▲</button>
        <span class="status-indicator" data-type=${this._status.type}></span>
        <span class="status-message">${this._status.message}</span>
        <span class="status-source">${this._renderVersionInfo()}</span>
      </div>
    `;
  }
}

customElements.define('edid-browser', EdidBrowser);
