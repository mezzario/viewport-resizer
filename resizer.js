class ViewportResizer {
  constructor() {
    this.resizeHandle = null;
    this.isResizing = false;
    this.initialX = 0;
    this.initialWidth = 0;
    this.handleWidth = 10;
    this.leftCover = null;
    this.rightCover = null;
    this.preventTextSelection = this.preventTextSelection.bind(this);
  }

  init() {
    this.addResizeHandle();
    this.addCoverElements();
    this.addEventListeners();
  }

  addResizeHandle() {
    this.resizeHandle = document.createElement('div');
    this.resizeHandle.className = 'viewport-resizer';
    this.resizeHandle.style.position = 'fixed';
    this.resizeHandle.style.right = '0';
    this.resizeHandle.style.top = '0';
    this.resizeHandle.style.width = `${this.handleWidth}px`;
    this.resizeHandle.style.height = '100vh';
    this.resizeHandle.style.cursor = 'ew-resize';
    this.resizeHandle.style.zIndex = '9999';
    this.resizeHandle.style.backgroundColor = 'red';
    this.resizeHandle.style.margin = '0';
    this.resizeHandle.style.padding = '0';
    this.resizeHandle.style.borderRadius = '0';
    document.body.appendChild(this.resizeHandle);
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

    document.body.appendChild(this.leftCover);
    document.body.appendChild(this.rightCover);
  }

  addEventListeners() {
    this.resizeHandle.addEventListener('mousedown', this.startResize.bind(this));
    window.addEventListener('mousemove', this.resizeViewport.bind(this));
    window.addEventListener('mouseup', this.stopResize.bind(this));
    window.addEventListener('selectstart', this.preventTextSelection);
    window.addEventListener('dragstart', this.preventTextSelection);
  }

  startResize(e) {
    this.isResizing = true;
    this.initialX = e.clientX;
    this.initialWidth = parseInt(document.documentElement.style.width) || window.innerWidth;
  }

  resizeViewport(e) {
    if (this.isResizing) {
      const deltaX = e.clientX - this.initialX;
      const newWidth = Math.max(200, Math.min(this.initialWidth + deltaX * 2, window.innerWidth));

      document.documentElement.style.width = `${newWidth}px`;
      document.documentElement.style.marginLeft = 'auto';
      document.documentElement.style.marginRight = 'auto';

      // Update handle position
      const handlePosition = (window.innerWidth - newWidth) / 2 + newWidth;
      this.resizeHandle.style.right = `${window.innerWidth - handlePosition - this.handleWidth / 2}px`;

      // Update cover elements
      this.updateCoverElements();
    }
  }

  stopResize() {
    this.isResizing = false;
    // Snap handle to the edge if close enough
    const handleRight = parseInt(this.resizeHandle.style.right);
    if (handleRight < 20) {
      this.resizeHandle.style.right = '0px';
      document.documentElement.style.width = `${window.innerWidth}px`;
    }
    this.updateCoverElements();

    // Update initial values for the next resize
    this.initialWidth = parseInt(document.documentElement.style.width) || window.innerWidth;
    this.initialX = window.innerWidth - parseInt(this.resizeHandle.style.right) - this.handleWidth / 2;
  }

  updateCoverElements() {
    const viewportWidth = parseInt(document.documentElement.style.width) || window.innerWidth;
    const coverWidth = (window.innerWidth - viewportWidth) / 2;
    this.leftCover.style.width = `${coverWidth}px`;
    this.rightCover.style.width = `${coverWidth}px`;
  }

  preventTextSelection(e) {
    if (this.isResizing) {
      e.preventDefault();
    }
  }
}

const resizer = new ViewportResizer();
resizer.init();
