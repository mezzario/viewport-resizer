class ViewportResizer {
  constructor() {
    this.resizeHandle = null;
    this.isResizing = false;
    this.initialX = 0;
    this.initialWidth = 0;
    this.handleWidth = 14;
    this.leftCover = null;
    this.rightCover = null;
    this.iframe = null;
    this.currentWidth = this.getStoredWidth();
    this.overlay = null;
    this.widthLabel = null;

    this.handleWindowResize = this.handleWindowResize.bind(this);

    this.wrapWebsiteInIframe();
    this.addResizeHandle();
    this.addCoverElements();
    this.updateCoverElements();
    this.addOverlay();
    this.addWidthLabel();
    this.addEventListeners();
  }

  wrapWebsiteInIframe() {
    // Create iframe
    this.iframe = document.createElement('iframe');
    this.iframe.style.position = 'fixed';
    this.iframe.style.top = '0';
    this.iframe.style.left = '50%';
    this.iframe.style.transform = 'translateX(-50%)';
    this.iframe.style.width = `${this.currentWidth}px`;
    this.iframe.style.height = '100vh';
    this.iframe.style.border = 'none';
    this.iframe.src = window.location.href;

    // Replace entire HTML content with the iframe
    document.documentElement.innerHTML = '';
    document.documentElement.appendChild(this.iframe);
  }

  addResizeHandle() {
    this.resizeHandle = document.createElement('div');
    this.resizeHandle.className = 'viewport-resizer';
    this.resizeHandle.style.position = 'fixed';
    this.resizeHandle.style.right = `${window.innerWidth - (window.innerWidth / 2 + this.currentWidth / 2)}px`;
    this.resizeHandle.style.top = '0';
    this.resizeHandle.style.width = `${this.handleWidth}px`;
    this.resizeHandle.style.height = '100vh';
    this.resizeHandle.style.cursor = 'ew-resize';
    this.resizeHandle.style.zIndex = '10000';
    this.resizeHandle.style.backgroundColor = 'rgba(128, 128, 128, 0.7)';
    this.resizeHandle.style.margin = '0';
    this.resizeHandle.style.padding = '0';
    this.resizeHandle.style.borderRadius = '0';

    // Add grip lines
    const lineWidth = 1;
    const lineGap = 4;
    const totalLineWidth = lineWidth * 2 + lineGap;
    const lineHeight = 30;

    for (let i = 0; i < 2; i++) {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.top = '50%';
      line.style.transform = 'translateY(-50%)';
      line.style.height = `${lineHeight}px`;
      line.style.width = `${lineWidth}px`;
      line.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
      line.style.left = `${(this.handleWidth - totalLineWidth) / 2 + i * (lineWidth + lineGap)}px`;
      this.resizeHandle.appendChild(line);
    }

    document.documentElement.appendChild(this.resizeHandle);
  }

  addCoverElements() {
    this.leftCover = document.createElement('div');
    this.rightCover = document.createElement('div');

    const coverStyle = {
      position: 'fixed',
      top: '0',
      height: '100vh',
      backgroundColor: '#000',
      zIndex: '9998'
    };

    Object.assign(this.leftCover.style, coverStyle, { left: '0' });
    Object.assign(this.rightCover.style, coverStyle, { right: '0' });

    document.documentElement.appendChild(this.leftCover);
    document.documentElement.appendChild(this.rightCover);
  }

  addOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.style.position = 'fixed';
    this.overlay.style.top = '0';
    this.overlay.style.left = '50%';
    this.overlay.style.transform = 'translateX(-50%)';
    this.overlay.style.width = `${this.currentWidth}px`;
    this.overlay.style.height = '100vh';
    this.overlay.style.display = 'none';
    this.overlay.style.zIndex = '9999';
    document.documentElement.appendChild(this.overlay);
  }

  addWidthLabel() {
    this.widthLabel = document.createElement('div');
    this.widthLabel.style.position = 'fixed';
    this.widthLabel.style.top = '10px';
    this.widthLabel.style.right = '10px';
    this.widthLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.widthLabel.style.color = '#fff';
    this.widthLabel.style.padding = '5px 10px';
    this.widthLabel.style.borderRadius = '5px';
    this.widthLabel.style.fontSize = '12px';
    this.widthLabel.style.fontFamily = 'monospace'; // Added monospace font
    this.widthLabel.style.display = 'none';
    this.widthLabel.style.zIndex = '10001';
    document.documentElement.appendChild(this.widthLabel);
  }

  addEventListeners() {
    this.resizeHandle.addEventListener('mousedown', this.startResize.bind(this));
    this.resizeHandle.addEventListener('mouseenter', this.showWidthLabel.bind(this));
    this.resizeHandle.addEventListener('mouseleave', this.hideWidthLabel.bind(this));

    window.addEventListener('mousemove', this.resizeViewport.bind(this));
    window.addEventListener('mouseup', this.stopResize.bind(this));
    window.addEventListener('resize', this.handleWindowResize);
  }

  startResize(e) {
    this.isResizing = true;
    this.initialX = e.clientX;
    this.initialWidth = this.currentWidth;
    this.overlay.style.display = 'block';
    this.showWidthLabel();
  }

  resizeViewport(e) {
    if (this.isResizing) {
      const deltaX = e.clientX - this.initialX;
      this.currentWidth = Math.max(200, Math.min(this.initialWidth + deltaX * 2, window.innerWidth));

      this.iframe.style.width = `${this.currentWidth}px`;
      this.overlay.style.width = `${this.currentWidth}px`;

      // Update handle position without centering
      const handlePosition = window.innerWidth / 2 + this.currentWidth / 2;
      this.resizeHandle.style.right = `${window.innerWidth - handlePosition}px`;

      // Update cover elements
      this.updateCoverElements();

      this.updateWidthLabel();
    }
  }

  stopResize() {
    this.isResizing = false;
    this.overlay.style.display = 'none';
    this.hideWidthLabel();
    // Snap handle to the edge if close enough
    const handleRight = parseInt(this.resizeHandle.style.right);
    if (handleRight < 20) {
      this.resizeHandle.style.right = '0';
      this.currentWidth = window.innerWidth;
      this.iframe.style.width = `${this.currentWidth}px`;
    }
    this.updateCoverElements();

    // Update initial values for the next resize
    this.initialWidth = this.currentWidth;
    this.initialX = window.innerWidth - parseInt(this.resizeHandle.style.right) - this.handleWidth / 2;

    this.saveWidth();
  }

  updateCoverElements() {
    const coverWidth = Math.max(0, (window.innerWidth - this.currentWidth) / 2);
    this.leftCover.style.width = `${coverWidth}px`;
    this.rightCover.style.width = `${coverWidth}px`;
  }

  updateWidthLabel() {
    this.widthLabel.textContent = `${Math.round(this.currentWidth)}px`;
    const handlePosition = window.innerWidth / 2 + this.currentWidth / 2;
    this.widthLabel.style.right = `${window.innerWidth - handlePosition + this.handleWidth + 10}px`;
  }

  showWidthLabel() {
    if (!this.isResizing) {
      this.widthLabel.style.display = 'block';
      this.updateWidthLabel();
    }
  }

  hideWidthLabel() {
    if (!this.isResizing) {
      this.widthLabel.style.display = 'none';
    }
  }

  getStoredWidth() {
    const domain = new URL(window.location.href).hostname;
    const storedWidth = localStorage.getItem(`viewportWidth_${domain}`);
    return storedWidth ? parseInt(storedWidth) : window.innerWidth;
  }

  saveWidth() {
    const domain = new URL(window.location.href).hostname;
    localStorage.setItem(`viewportWidth_${domain}`, this.currentWidth);
  }

  handleWindowResize() {
    // Update currentWidth if window is narrower
    if (window.innerWidth < this.currentWidth) {
      this.currentWidth = window.innerWidth;
    }

    // Update iframe width
    this.iframe.style.width = `${this.currentWidth}px`;

    // Update handle position
    const handlePosition = Math.min(window.innerWidth, window.innerWidth / 2 + this.currentWidth / 2);
    this.resizeHandle.style.right = `${window.innerWidth - handlePosition}px`;

    // Update cover elements
    this.updateCoverElements();

    // Update width label position and content
    this.updateWidthLabel();

    // Update overlay width
    this.overlay.style.width = `${this.currentWidth}px`;
  }

  deactivate() {
    // Redirect to the current URL of the iframe
    window.location.href = this.iframe.contentWindow.location.href;
    window.removeEventListener('resize', this.handleWindowResize);
  }
}

let viewportResizer = null;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "toggle_resizer") {
    if (viewportResizer) {
      viewportResizer.deactivate();
      viewportResizer = null;
    } else {
      viewportResizer = new ViewportResizer();
    }
  }
});
