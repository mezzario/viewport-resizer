chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes('chrome://')) return;

  chrome.scripting
    .executeScript({
      target: {tabId: tab.id},
      func: toggleResizer,
    })
    .catch(() => {});
});

function toggleResizer() {
  const RESIZE_BAR_WIDTH = 14;
  const RESIZE_BAR_SNAP_DISTANCE = 10;
  const MIN_VIEWPORT_WIDTH = 50;
  const GRIP_LINES_COUNT = 2;
  const GRIP_LINE_HEIGHT = 30;
  const GRIP_LINE_WIDTH = 1;
  const DATA_KEY = '_viewport_resizer_ext_1fc339b9ae6148cd8425ff56d1204634';

  const data = window[DATA_KEY] || {
    isActive: false,
    isResizing: false,
    initialX: 0,
    initialWidth: 0,
  };
  window[DATA_KEY] = data;

  function checkIframeSupport(callback) {
    const iframeEl = document.createElement('iframe');
    iframeEl.style.display = 'none';
    document.body.appendChild(iframeEl);

    iframeEl.addEventListener('load', () => {
      handleIframeLoad(iframeEl, callback);
    });

    iframeEl.addEventListener('error', () => {
      handleIframeError(iframeEl, callback);
    });

    // Try to load the current page in the iframe.
    iframeEl.src = window.location.href;
  }

  function handleIframeLoad(iframeEl, callback) {
    try {
      // Try to access the iframe's content.
      const iframeDoc =
        iframeEl.contentDocument || iframeEl.contentWindow.document;

      // If we can access the content, it's loaded successfully.
      if (iframeDoc && iframeDoc.body) {
        handleIframeLoadSuccess(iframeEl, callback);
      } else {
        throw new Error('Unable to access iframe content.');
      }
    } catch (error) {
      // If we can't access the content, it's blocked.
      handleIframeError(iframeEl, callback, error);
    }
  }

  function handleIframeLoadSuccess(iframeEl, callback) {
    removeChildrenExcept(document.documentElement, document.body);
    removeChildrenExcept(document.body, iframeEl);

    iframeEl.style.display = '';
    iframeEl.style.position = 'fixed';
    iframeEl.style.top = '0';
    iframeEl.style.left = '50%';
    iframeEl.style.transform = 'translateX(-50%)';
    iframeEl.style.height = '100vh';
    iframeEl.style.border = 'none';

    callback(iframeEl);
  }

  function handleIframeError(iframeEl, callback, error) {
    document.body.removeChild(iframeEl);
    alert(
      'Viewport Resizer: ' +
        'this website cannot be resized due to security restrictions.'
    );
    callback(null);
  }

  function initialize(iframe) {
    data.isActive = true;
    data.iframeEl = iframe;
    data.currentWidth = getStoredWidth();

    disableSelection(document.body);

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('resize', handleWindowResize);

    addBar();
    addWidthLabel();
    addCoverElements();
    addOverlay();

    setupIframeNavigation();
    resizeViewport();
  }

  function addBar() {
    data.barEl = document.createElement('div');
    data.barEl.className = 'viewport-resizer';
    data.barEl.style.position = 'fixed';
    data.barEl.style.right = `${
      window.innerWidth - (window.innerWidth / 2 + data.currentWidth / 2)
    }px`;
    data.barEl.style.top = '0';
    data.barEl.style.width = `${RESIZE_BAR_WIDTH}px`;
    data.barEl.style.height = '100vh';
    data.barEl.style.cursor = 'ew-resize';
    data.barEl.style.zIndex = '10000';
    data.barEl.style.backgroundColor = 'rgba(128, 128, 128, 0.7)';
    data.barEl.style.margin = '0';
    data.barEl.style.padding = '0';
    data.barEl.style.borderRadius = '0';
    disableSelection(data.barEl);

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
      disableSelection(line);
      data.barEl.appendChild(line);
    }

    data.barEl.addEventListener('mousedown', handleBarMouseDown);
    data.barEl.addEventListener('mouseenter', handleBarMouseEnter);
    data.barEl.addEventListener('mouseleave', handleBarMouseLeave);
    data.barEl.addEventListener('dblclick', handleBarDoubleClick);

    document.documentElement.appendChild(data.barEl);
  }

  function addCoverElements() {
    const coverStyle = {
      position: 'fixed',
      top: '0',
      height: '100vh',
      backgroundColor: '#000',
      zIndex: '9998',
    };

    data.leftCoverEl = document.createElement('div');
    Object.assign(data.leftCoverEl.style, coverStyle, {left: '0'});
    disableSelection(data.leftCoverEl);
    document.documentElement.appendChild(data.leftCoverEl);

    data.rightCoverEl = document.createElement('div');
    Object.assign(data.rightCoverEl.style, coverStyle, {right: '0'});
    disableSelection(data.rightCoverEl);
    document.documentElement.appendChild(data.rightCoverEl);
  }

  function addOverlay() {
    data.overlayEl = document.createElement('div');
    data.overlayEl.style.position = 'fixed';
    data.overlayEl.style.top = '0';
    data.overlayEl.style.left = '50%';
    data.overlayEl.style.transform = 'translateX(-50%)';
    data.overlayEl.style.height = '100vh';
    data.overlayEl.style.display = 'none';
    data.overlayEl.style.zIndex = '9999';
    disableSelection(data.overlayEl);

    document.documentElement.appendChild(data.overlayEl);
  }

  function addWidthLabel() {
    data.widthLabelEl = document.createElement('div');
    data.widthLabelEl.style.position = 'fixed';
    data.widthLabelEl.style.top = '10px';
    data.widthLabelEl.style.right = '10px';
    data.widthLabelEl.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    data.widthLabelEl.style.color = '#fff';
    data.widthLabelEl.style.padding = '5px 10px';
    data.widthLabelEl.style.borderRadius = '5px';
    data.widthLabelEl.style.fontSize = '12px';
    data.widthLabelEl.style.fontFamily = 'monospace';
    data.widthLabelEl.style.display = 'none';
    data.widthLabelEl.style.zIndex = '10001';
    disableSelection(data.widthLabelEl);

    document.documentElement.appendChild(data.widthLabelEl);
  }

  function resizeViewport(width = data.currentWidth) {
    data.currentWidth = width;

    data.iframeEl.style.width = `${data.currentWidth}px`;
    data.overlayEl.style.width = `${data.currentWidth}px`;
    data.barEl.style.right = `${
      window.innerWidth - (window.innerWidth / 2 + data.currentWidth / 2)
    }px`;

    updateCoverElements();
    updateWidthLabel();
  }

  function handleBarMouseDown(e) {
    data.isResizing = true;
    data.initialX = e.clientX;
    data.initialWidth = data.currentWidth;
    data.overlayEl.style.display = 'block';
    handleBarMouseEnter();
  }

  function handleWindowMouseMove(e) {
    if (!data.isResizing) return;

    resizeViewport(
      Math.max(
        MIN_VIEWPORT_WIDTH,
        Math.min(
          data.initialWidth + (e.clientX - data.initialX) * 2,
          window.innerWidth
        )
      )
    );
  }

  function handleWindowMouseUp() {
    data.isResizing = false;
    data.overlayEl.style.display = 'none';

    const barRight = parseInt(data.barEl.style.right);
    if (barRight < RESIZE_BAR_SNAP_DISTANCE) {
      resizeViewport(window.innerWidth);
    }
    saveWidth();

    // Update initial values for the next resize.
    data.initialWidth = data.currentWidth;
    data.initialX = window.innerWidth - barRight - RESIZE_BAR_WIDTH / 2;
  }

  function handleBarMouseEnter() {
    if (data.isResizing) return;
    data.widthLabelEl.style.display = 'block';
    updateWidthLabel();
  }

  function handleBarMouseLeave() {
    if (data.isResizing) return;
    data.widthLabelEl.style.display = 'none';
  }

  function handleWindowResize() {
    resizeViewport(Math.min(getStoredWidth(), window.innerWidth));
  }

  function handleBarDoubleClick() {
    resizeViewport(window.innerWidth);
    saveWidth();
  }

  function updateCoverElements() {
    const coverWidth = Math.max(0, (window.innerWidth - data.currentWidth) / 2);
    data.leftCoverEl.style.width = `${coverWidth}px`;
    data.rightCoverEl.style.width = `${coverWidth}px`;
  }

  function updateWidthLabel() {
    data.widthLabelEl.textContent = `${Math.round(data.currentWidth)}px`;
    data.widthLabelEl.style.right = `${
      window.innerWidth -
      (window.innerWidth / 2 + data.currentWidth / 2) +
      RESIZE_BAR_WIDTH +
      10
    }px`;
  }

  function getStorageKey(paramName) {
    return `${DATA_KEY}_${paramName}`;
  }

  function getStoredWidth() {
    const storedWidthStr = localStorage.getItem(getStorageKey('width'));
    let storedWidth = storedWidthStr
      ? parseInt(storedWidthStr)
      : window.innerWidth;
    storedWidth = isNaN(storedWidth) ? window.innerWidth : storedWidth;
    storedWidth = Math.max(
      Math.min(window.innerWidth, storedWidth),
      MIN_VIEWPORT_WIDTH
    );
    return storedWidth;
  }

  function saveWidth() {
    const itemKey = getStorageKey('width');
    if (window.innerWidth !== data.currentWidth) {
      localStorage.setItem(itemKey, data.currentWidth);
    } else {
      localStorage.removeItem(itemKey);
    }
  }

  function deactivate() {
    data.isActive = false;
    window.location.href = data.iframeEl.contentWindow.location.href;
    window.location.reload();
  }

  function setupIframeNavigation() {
    // Handle full page loads.
    data.iframeEl.addEventListener('load', () => {
      updateWrapperUrl();
    });

    // Handle hash changes.
    data.iframeEl.contentWindow.addEventListener('hashchange', () => {
      updateWrapperUrl();
    });
  }

  function syncTitle() {
    const iframeDocument =
      data.iframeEl.contentDocument || data.iframeEl.contentWindow.document;
    const iframeTitle = iframeDocument.title;

    if (document.title !== iframeTitle) {
      document.title = iframeTitle;
    }
  }

  function updateWrapperUrl() {
    try {
      const iframeUrl = data.iframeEl.contentWindow.location.href;
      if (window.location.href !== iframeUrl) {
        history.replaceState(null, '', iframeUrl);
      }
      syncTitle();
    } catch (e) {}
  }

  function removeChildrenExcept(parentEl, keepEl) {
    let childrenEls = Array.from(parentEl.childNodes);
    for (let childEl of childrenEls) {
      if (childEl !== keepEl) {
        parentEl.removeChild(childEl);
      }
    }
  }

  function disableSelection(el) {
    el.style.userSelect = 'none';
    el.style.webkitUserSelect = 'none';
    el.style.msUserSelect = 'none';
  }

  if (data.isActive) {
    deactivate();
  } else {
    checkIframeSupport((iframeEl) => {
      if (iframeEl) {
        initialize(iframeEl);
      }
    });
  }
}
