const RESIZE_BAR_WIDTH = 14;
const RESIZE_BAR_SNAP_DISTANCE = 10;
const MIN_VIEWPORT_WIDTH = 50;
const GRIP_LINES_COUNT = 2;
const GRIP_LINE_HEIGHT = 30;
const GRIP_LINE_WIDTH = 1;

class ViewportResizer {
  constructor() {
    this.isResizing = false;
    this.initialX = 0;
    this.initialWidth = 0;
    this.currentWidth = this.getStoredWidth();

    this.addIframe();
    this.addBar();
    this.addWidthLabel();
    this.addCoverElements();
    this.addOverlay();

    this.addEventListeners();
    this.setupIframeNavigation();
    this.resizeViewport();
  }

  addIframe() {
    // Create iframe
    this.iframeEl = document.createElement('iframe');
    this.iframeEl.style.position = 'fixed';
    this.iframeEl.style.top = '0';
    this.iframeEl.style.left = '50%';
    this.iframeEl.style.transform = 'translateX(-50%)';
    this.iframeEl.style.height = '100vh';
    this.iframeEl.style.border = 'none';
    this.iframeEl.src = window.location.href;

    // Replace entire HTML content with the iframe
    document.documentElement.innerHTML = '';
    document.documentElement.appendChild(this.iframeEl);
  }

  addBar() {
    this.barEl = document.createElement('div');
    this.barEl.className = 'viewport-resizer';
    this.barEl.style.position = 'fixed';
    this.barEl.style.right = `${
      window.innerWidth - (window.innerWidth / 2 + this.currentWidth / 2)
    }px`;
    this.barEl.style.top = '0';
    this.barEl.style.width = `${RESIZE_BAR_WIDTH}px`;
    this.barEl.style.height = '100vh';
    this.barEl.style.cursor = 'ew-resize';
    this.barEl.style.zIndex = '10000';
    this.barEl.style.backgroundColor = 'rgba(128, 128, 128, 0.7)';
    this.barEl.style.margin = '0';
    this.barEl.style.padding = '0';
    this.barEl.style.borderRadius = '0';

    const totalLineWidth = GRIP_LINE_WIDTH * GRIP_LINES_COUNT;
    const lineGap =
      (RESIZE_BAR_WIDTH - totalLineWidth) / (GRIP_LINES_COUNT + 1);
    const totalWidth = totalLineWidth + lineGap * (GRIP_LINES_COUNT - 1);

    for (let i = 0; i < GRIP_LINES_COUNT; i++) {
      const line = document.createElement('div');
      line.style.position = 'absolute';
      line.style.top = '50%';
      line.style.transform = 'translateY(-50%)';
      line.style.height = `${GRIP_LINE_HEIGHT}px`;
      line.style.width = `${GRIP_LINE_WIDTH}px`;
      line.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
      line.style.left = `${
        (RESIZE_BAR_WIDTH - totalWidth) / 2 + i * (GRIP_LINE_WIDTH + lineGap)
      }px`;
      this.barEl.appendChild(line);
    }

    document.documentElement.appendChild(this.barEl);
  }

  addCoverElements() {
    const coverStyle = {
      position: 'fixed',
      top: '0',
      height: '100vh',
      backgroundColor: '#000',
      zIndex: '9998',
    };

    this.leftCoverEl = document.createElement('div');
    Object.assign(this.leftCoverEl.style, coverStyle, {left: '0'});
    document.documentElement.appendChild(this.leftCoverEl);

    this.rightCoverEl = document.createElement('div');
    Object.assign(this.rightCoverEl.style, coverStyle, {right: '0'});
    document.documentElement.appendChild(this.rightCoverEl);
  }

  addOverlay() {
    this.overlayEl = document.createElement('div');
    this.overlayEl.style.position = 'fixed';
    this.overlayEl.style.top = '0';
    this.overlayEl.style.left = '50%';
    this.overlayEl.style.transform = 'translateX(-50%)';
    this.overlayEl.style.height = '100vh';
    this.overlayEl.style.display = 'none';
    this.overlayEl.style.zIndex = '9999';
    document.documentElement.appendChild(this.overlayEl);
  }

  addWidthLabel() {
    this.widthLabelEl = document.createElement('div');
    this.widthLabelEl.style.position = 'fixed';
    this.widthLabelEl.style.top = '10px';
    this.widthLabelEl.style.right = '10px';
    this.widthLabelEl.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    this.widthLabelEl.style.color = '#fff';
    this.widthLabelEl.style.padding = '5px 10px';
    this.widthLabelEl.style.borderRadius = '5px';
    this.widthLabelEl.style.fontSize = '12px';
    this.widthLabelEl.style.fontFamily = 'monospace';
    this.widthLabelEl.style.display = 'none';
    this.widthLabelEl.style.zIndex = '10001';
    document.documentElement.appendChild(this.widthLabelEl);
  }

  addEventListeners() {
    this.barEl.addEventListener('mousedown', this.handleBarMouseDown);
    this.barEl.addEventListener('mouseenter', this.handleBarMouseEnter);
    this.barEl.addEventListener('mouseleave', this.handleBarMouseLeave);
    this.barEl.addEventListener('dblclick', this.handleBarDoubleClick);

    window.addEventListener('mousemove', this.handleWindowMouseMove);
    window.addEventListener('mouseup', this.handleWindowMouseUp);
    window.addEventListener('resize', this.handleWindowResize);
  }

  removeEventListeners() {
    this.barEl.removeEventListener('mousedown', this.handleBarMouseDown);
    this.barEl.removeEventListener('mouseenter', this.handleBarMouseEnter);
    this.barEl.removeEventListener('mouseleave', this.handleBarMouseLeave);
    this.barEl.removeEventListener('dblclick', this.handleBarDoubleClick);

    window.removeEventListener('mousemove', this.handleWindowMouseMove);
    window.removeEventListener('mouseup', this.handleWindowMouseUp);
    window.removeEventListener('resize', this.handleWindowResize);
  }

  resizeViewport = (width = this.currentWidth) => {
    this.currentWidth = width;

    this.iframeEl.style.width = `${this.currentWidth}px`;
    this.overlayEl.style.width = `${this.currentWidth}px`;
    this.barEl.style.right = `${
      window.innerWidth - (window.innerWidth / 2 + this.currentWidth / 2)
    }px`;

    this.updateCoverElements();
    this.updateWidthLabel();
  };

  handleBarMouseDown = (e) => {
    this.isResizing = true;
    this.initialX = e.clientX;
    this.initialWidth = this.currentWidth;
    this.overlayEl.style.display = 'block';
    this.handleBarMouseEnter();
  };

  handleWindowMouseMove = (e) => {
    if (!this.isResizing) return;

    this.resizeViewport(
      Math.max(
        MIN_VIEWPORT_WIDTH,
        Math.min(
          this.initialWidth + (e.clientX - this.initialX) * 2,
          window.innerWidth
        )
      )
    );
  };

  handleWindowMouseUp = () => {
    this.isResizing = false;
    this.overlayEl.style.display = 'none';
    this.handleBarMouseLeave();

    const barRight = parseInt(this.barEl.style.right);
    if (barRight < RESIZE_BAR_SNAP_DISTANCE) {
      this.resizeViewport(window.innerWidth);
    }
    this.saveWidth();

    // Update initial values for the next resize.
    this.initialWidth = this.currentWidth;
    this.initialX = window.innerWidth - barRight - RESIZE_BAR_WIDTH / 2;
  };

  updateCoverElements = () => {
    const coverWidth = Math.max(0, (window.innerWidth - this.currentWidth) / 2);
    this.leftCoverEl.style.width = `${coverWidth}px`;
    this.rightCoverEl.style.width = `${coverWidth}px`;
  };

  updateWidthLabel = () => {
    this.widthLabelEl.textContent = `${Math.round(this.currentWidth)}px`;
    this.widthLabelEl.style.right = `${
      window.innerWidth -
      (window.innerWidth / 2 + this.currentWidth / 2) +
      RESIZE_BAR_WIDTH +
      10
    }px`;
  };

  handleBarMouseEnter = () => {
    if (this.isResizing) return;
    this.widthLabelEl.style.display = 'block';
    this.updateWidthLabel();
  };

  handleBarMouseLeave = () => {
    if (this.isResizing) return;
    this.widthLabelEl.style.display = 'none';
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

  handleBarDoubleClick = () => {
    this.resizeViewport(window.innerWidth);
    this.saveWidth();
  };

  deactivate() {
    this.removeEventListeners();

    // Redirect to the current URL of the iframe.
    window.location.href = this.iframeEl.contentWindow.location.href;
    window.location.reload();
  }

  setupIframeNavigation() {
    // Handle full page loads.
    this.iframeEl.addEventListener('load', () => {
      this.updateWrapperUrl();
    });

    // Handle hash changes.
    this.iframeEl.contentWindow.addEventListener('hashchange', () => {
      this.updateWrapperUrl();
    });
  }

  updateWrapperUrl() {
    try {
      const iframeUrl = this.iframeEl.contentWindow.location.href;
      if (window.location.href !== iframeUrl) {
        history.replaceState(null, '', iframeUrl);
      }
    } catch (e) {}
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
