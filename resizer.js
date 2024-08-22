const HANDLE_WIDTH = 14;
const SNAP_HANDLE_DISTANCE = 10;
const MIN_VIEWPORT_WIDTH = 200;
const GRIP_LINE_HEIGHT = 30;

class ViewportResizer {
  constructor() {
    this.resizeHandle = null;
    this.isResizing = false;
    this.initialX = 0;
    this.initialWidth = 0;
    this.leftCover = null;
    this.rightCover = null;
    this.iframe = null;
    this.currentWidth = this.getStoredWidth();
    this.overlay = null;
    this.widthLabel = null;

    this.addIframe();
    this.addResizeHandle();
    this.addCoverElements();
    this.addOverlay();
    this.addWidthLabel();
    this.addEventListeners();

    this.resizeViewport();
  }

  addIframe() {
    // Create iframe
    this.iframe = document.createElement('iframe');
    this.iframe.style.position = 'fixed';
    this.iframe.style.top = '0';
    this.iframe.style.left = '50%';
    this.iframe.style.transform = 'translateX(-50%)';
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
    this.resizeHandle.style.right = `${
      window.innerWidth - (window.innerWidth / 2 + this.currentWidth / 2)
    }px`;
    this.resizeHandle.style.top = '0';
    this.resizeHandle.style.width = `${HANDLE_WIDTH}px`;
    this.resizeHandle.style.height = '100vh';
    this.resizeHandle.style.cursor = 'ew-resize';
    this.resizeHandle.style.zIndex = '10000';
    this.resizeHandle.style.backgroundColor = 'rgba(128, 128, 128, 0.7)';
    this.resizeHandle.style.margin = '0';
    this.resizeHandle.style.padding = '0';
    this.resizeHandle.style.borderRadius = '0';

    const lineWidth = 1;
    const lineGap = 4;
    const totalLineWidth = lineWidth * 2 + lineGap;
    for (let i = 0; i < 2; i++) {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.top = '50%';
      line.style.transform = 'translateY(-50%)';
      line.style.height = `${GRIP_LINE_HEIGHT}px`;
      line.style.width = `${lineWidth}px`;
      line.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
      line.style.left = `${
        (HANDLE_WIDTH - totalLineWidth) / 2 + i * (lineWidth + lineGap)
      }px`;
      this.resizeHandle.appendChild(line);
    }

    document.documentElement.appendChild(this.resizeHandle);
  }

  addCoverElements() {
    const coverStyle = {
      position: 'fixed',
      top: '0',
      height: '100vh',
      backgroundColor: '#000',
      zIndex: '9998',
    };

    this.leftCover = document.createElement('div');
    Object.assign(this.leftCover.style, coverStyle, {left: '0'});
    document.documentElement.appendChild(this.leftCover);

    this.rightCover = document.createElement('div');
    Object.assign(this.rightCover.style, coverStyle, {right: '0'});
    document.documentElement.appendChild(this.rightCover);
  }

  addOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.style.position = 'fixed';
    this.overlay.style.top = '0';
    this.overlay.style.left = '50%';
    this.overlay.style.transform = 'translateX(-50%)';
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
    this.resizeHandle.addEventListener('mousedown', this.startResize);
    this.resizeHandle.addEventListener('mouseenter', this.showWidthLabel);
    this.resizeHandle.addEventListener('mouseleave', this.hideWidthLabel);
    this.resizeHandle.addEventListener('dblclick', this.expandToFullWidth);

    window.addEventListener('mousemove', this.handleResize);
    window.addEventListener('mouseup', this.stopResize);
    window.addEventListener('resize', this.handleWindowResize);
  }

  resizeViewport = (width = this.currentWidth) => {
    this.currentWidth = width;

    this.iframe.style.width = `${this.currentWidth}px`;
    this.overlay.style.width = `${this.currentWidth}px`;
    this.resizeHandle.style.right = `${
      window.innerWidth - (window.innerWidth / 2 + this.currentWidth / 2)
    }px`;

    this.updateCoverElements();
    this.updateWidthLabel();
  };

  startResize = (e) => {
    this.isResizing = true;
    this.initialX = e.clientX;
    this.initialWidth = this.currentWidth;
    this.overlay.style.display = 'block';
    this.showWidthLabel();
  };

  handleResize = (e) => {
    if (this.isResizing) {
      this.resizeViewport(
        Math.max(
          MIN_VIEWPORT_WIDTH,
          Math.min(
            this.initialWidth + (e.clientX - this.initialX) * 2,
            window.innerWidth
          )
        )
      );
    }
  };

  stopResize = () => {
    this.isResizing = false;
    this.overlay.style.display = 'none';
    this.hideWidthLabel();

    const resizeHandleRight = parseInt(this.resizeHandle.style.right);
    if (resizeHandleRight < SNAP_HANDLE_DISTANCE) {
      this.resizeViewport(window.innerWidth);
    }
    this.saveWidth();

    // Update initial values for the next resize
    this.initialWidth = this.currentWidth;
    this.initialX = window.innerWidth - resizeHandleRight - HANDLE_WIDTH / 2;
  };

  updateCoverElements = () => {
    const coverWidth = Math.max(0, (window.innerWidth - this.currentWidth) / 2);
    this.leftCover.style.width = `${coverWidth}px`;
    this.rightCover.style.width = `${coverWidth}px`;
  };

  updateWidthLabel = () => {
    this.widthLabel.textContent = `${Math.round(this.currentWidth)}px`;
    this.widthLabel.style.right = `${
      window.innerWidth -
      (window.innerWidth / 2 + this.currentWidth / 2) +
      HANDLE_WIDTH +
      10
    }px`;
  };

  showWidthLabel = () => {
    if (!this.isResizing) {
      this.widthLabel.style.display = 'block';
      this.updateWidthLabel();
    }
  };

  hideWidthLabel = () => {
    if (!this.isResizing) {
      this.widthLabel.style.display = 'none';
    }
  };

  getStorageKey(paramName) {
    return `vpResExt_tgIm7_${paramName}`;
  }

  getStoredWidth() {
    const storedWidthStr = localStorage.getItem(this.getStorageKey('width'));
    const storedWidth = storedWidthStr
      ? parseInt(storedWidthStr)
      : window.innerWidth;
    return isNaN(storedWidth) ? window.innerWidth : storedWidth;
  }

  saveWidth() {
    const itemKey = this.getStorageKey('width');
    if (window.innerWidth !== this.currentWidth) {
      localStorage.setItem(itemKey, this.currentWidth);
    } else {
      localStorage.removeItem(itemKey);
    }
  }

  handleWindowResize = () => {
    this.resizeViewport(Math.min(this.getStoredWidth(), window.innerWidth));
  };

  expandToFullWidth = () => {
    this.resizeViewport(window.innerWidth);
    this.saveWidth();
  };

  deactivate() {
    // Redirect to the current URL of the iframe
    window.location.href = this.iframe.contentWindow.location.href;
    window.removeEventListener('resize', this.handleWindowResize);
  }
}

let viewportResizer = null;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'toggle_resizer') {
    if (viewportResizer) {
      viewportResizer.deactivate();
      viewportResizer = null;
    } else {
      viewportResizer = new ViewportResizer();
    }
  }
});
