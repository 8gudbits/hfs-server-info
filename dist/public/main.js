class ServerInfoPanel {
  constructor() {
    this.insertedElement = null;
    this.init();
  }

  init() {
    this.setupObserver();
  }

  setupObserver() {
    const observer = new MutationObserver(() => {
      const panel = document.querySelector("#user-panel");
      if (panel && !document.querySelector("#user-disk-info")) {
        this.updateInfo();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  formatBytes(bytes) {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }

  async fetchData(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      return null;
    }
  }

  createContainer() {
    const container = document.createElement("div");
    container.id = "user-disk-info";
    container.style.marginTop = "0.5em";
    container.style.paddingTop = "0.5em";
    container.style.borderTop = "1px solid var(--button-text)";
    container.style.color = "inherit";
    container.style.fontSize = "15px";
    container.style.lineHeight = "1.5";

    return container;
  }

  renderServerInfo(platform) {
    return `
            <div class="info-section">
                <div class="section-title">Server Info:</div>
                <div class="drive-container">
                    <div class="drive-item">Platform: ${platform}</div>
                </div>
            </div>
        `;
  }

  renderDiskInfo(disks) {
    if (!Array.isArray(disks)) {
      return `
                <div class="info-section">
                    <div class="section-title">Disk Info:</div>
                    <div class="drive-item error">Failed to load disk information</div>
                </div>
            `;
    }

    const diskItems = disks
      .map((disk) => {
        const used = disk.total - disk.free;
        const percentage = ((used / disk.total) * 100).toFixed(1);
        const freeFormatted = this.formatBytes(disk.free);
        const totalFormatted = this.formatBytes(disk.total);

        return `<div class="drive-item">${disk.name} | Free: ${freeFormatted}/${totalFormatted} - ${percentage}%</div>`;
      })
      .join("");

    return `
            <div class="info-section">
                <div class="section-title">Disk Info:</div>
                <div class="drive-container">${diskItems}</div>
            </div>
        `;
  }

  renderHFSInfo(status) {
    if (!status) {
      return `
                <div class="info-section">
                    <div class="section-title">HFS Info:</div>
                    <div class="hfs-list-item error">Failed to load HFS information</div>
                </div>
            `;
    }

    return `
            <div class="info-section">
                <div class="section-title">HFS Info:</div>
                <div class="hfs-list">
                    <div class="hfs-list-item">
                        <span class="hfs-label">Version:</span>
                        <span class="hfs-value">${status.version}</span>
                    </div>
                    <div class="hfs-list-item">
                        <span class="hfs-label">API:</span>
                        <span class="hfs-value">${status.apiVersion}</span>
                    </div>
                    <div class="hfs-list-item">
                        <span class="hfs-label">HTTP:</span>
                        <span class="hfs-value ${
                          status.http?.listening ? "status-on" : "status-off"
                        }">
                            ${status.http?.port} (${
      status.http?.listening ? "on" : "off"
    })
                        </span>
                    </div>
                    <div class="hfs-list-item">
                        <span class="hfs-label">HTTPS:</span>
                        <span class="hfs-value ${
                          status.https?.listening ? "status-on" : "status-off"
                        }">
                            ${status.https?.port} (${
      status.https?.listening ? "on" : "off"
    })
                        </span>
                    </div>
                    <div class="hfs-list-item">
                        <span class="hfs-label">RAM Used:</span>
                        <span class="hfs-value">${this.formatBytes(
                          status.ram
                        )}</span>
                    </div>
                    <div class="hfs-list-item">
                        <span class="hfs-label">Started:</span>
                        <span class="hfs-value">${new Date(
                          status.started
                        ).toLocaleString()}</span>
                    </div>
                </div>
            </div>
        `;
  }

  async updateInfo() {
    const panel = document.querySelector("#user-panel");
    if (!panel) return;

    if (this.insertedElement) {
      this.insertedElement.remove();
    }

    this.insertedElement = this.createContainer();
    this.insertedElement.textContent = "Loading...";
    panel.appendChild(this.insertedElement);

    const [status, disks] = await Promise.all([
      this.fetchData("/~/api/get_status"),
      this.fetchData("/~/api/get_disk_spaces"),
    ]);

    let html = "";

    if (status) {
      html += this.renderServerInfo(status.platform || "Unknown");
    }

    html += this.renderDiskInfo(disks);
    html += this.renderHFSInfo(status);

    this.insertedElement.innerHTML = html;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new ServerInfoPanel());
} else {
  new ServerInfoPanel();
}

