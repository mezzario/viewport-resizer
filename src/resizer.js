(function () {
  const RESIZE_BAR_WIDTH = 14;
  const RESIZE_BAR_SNAP_DISTANCE = 10;
  const MIN_VIEWPORT_WIDTH = 50;
  const GRIP_LINES_COUNT = 2;
  const GRIP_LINE_HEIGHT = 30;
  const GRIP_LINE_WIDTH = 1;

  let isActive = false;
  let iframeEl, isResizing, initialX, initialWidth, currentWidth;
  let barEl, leftCoverEl, rightCoverEl, overlayEl, widthLabelEl;

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

  function removeChildrenExcept(parentEl, keepEl) {
    let childrenEls = Array.from(parentEl.childNodes);
    for (let childEl of childrenEls) {
      if (childEl !== keepEl) {
        parentEl.removeChild(childEl);
      }
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
    iframeEl = iframe;
    isResizing = false;
    initialX = 0;
    initialWidth = 0;
    currentWidth = getStoredWidth();

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
    barEl = document.createElement('div');
    barEl.className = 'viewport-resizer';
    barEl.style.position = 'fixed';
    barEl.style.right = `${
      window.innerWidth - (window.innerWidth / 2 + currentWidth / 2)
    }px`;
    barEl.style.top = '0';
    barEl.style.width = `${RESIZE_BAR_WIDTH}px`;
    barEl.style.height = '100vh';
    barEl.style.cursor = 'ew-resize';
    barEl.style.zIndex = '10000';
    barEl.style.backgroundColor = 'rgba(128, 128, 128, 0.7)';
    barEl.style.margin = '0';
    barEl.style.padding = '0';
    barEl.style.borderRadius = '0';
    disableSelection(barEl);

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
      barEl.appendChild(line);
    }

    barEl.addEventListener('mousedown', handleBarMouseDown);
    barEl.addEventListener('mouseenter', handleBarMouseEnter);
    barEl.addEventListener('mouseleave', handleBarMouseLeave);
    barEl.addEventListener('dblclick', handleBarDoubleClick);

    document.documentElement.appendChild(barEl);
  }

  function addCoverElements() {
    const coverStyle = {
      position: 'fixed',
      top: '0',
      height: '100vh',
      backgroundColor: '#000',
      zIndex: '9998',
    };

    leftCoverEl = document.createElement('div');
    Object.assign(leftCoverEl.style, coverStyle, {left: '0'});
    disableSelection(leftCoverEl);
    document.documentElement.appendChild(leftCoverEl);

    rightCoverEl = document.createElement('div');
    Object.assign(rightCoverEl.style, coverStyle, {right: '0'});
    disableSelection(rightCoverEl);
    document.documentElement.appendChild(rightCoverEl);
  }

  function addOverlay() {
    overlayEl = document.createElement('div');
    overlayEl.style.position = 'fixed';
    overlayEl.style.top = '0';
    overlayEl.style.left = '50%';
    overlayEl.style.transform = 'translateX(-50%)';
    overlayEl.style.height = '100vh';
    overlayEl.style.display = 'none';
    overlayEl.style.zIndex = '9999';
    disableSelection(overlayEl);

    document.documentElement.appendChild(overlayEl);
  }

  function addWidthLabel() {
    widthLabelEl = document.createElement('div');
    widthLabelEl.style.position = 'fixed';
    widthLabelEl.style.top = '10px';
    widthLabelEl.style.right = '10px';
    widthLabelEl.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    widthLabelEl.style.color = '#fff';
    widthLabelEl.style.padding = '5px 10px';
    widthLabelEl.style.borderRadius = '5px';
    widthLabelEl.style.fontSize = '12px';
    widthLabelEl.style.fontFamily = 'monospace';
    widthLabelEl.style.display = 'none';
    widthLabelEl.style.zIndex = '10001';
    disableSelection(widthLabelEl);

    document.documentElement.appendChild(widthLabelEl);
  }

  function resizeViewport(width = currentWidth) {
    currentWidth = width;

    iframeEl.style.width = `${currentWidth}px`;
    overlayEl.style.width = `${currentWidth}px`;
    barEl.style.right = `${
      window.innerWidth - (window.innerWidth / 2 + currentWidth / 2)
    }px`;

    updateCoverElements();
    updateWidthLabel();
  }

  function handleBarMouseDown(e) {
    isResizing = true;
    initialX = e.clientX;
    initialWidth = currentWidth;
    overlayEl.style.display = 'block';
    handleBarMouseEnter();
  }

  function handleWindowMouseMove(e) {
    if (!isResizing) return;

    resizeViewport(
      Math.max(
        MIN_VIEWPORT_WIDTH,
        Math.min(initialWidth + (e.clientX - initialX) * 2, window.innerWidth)
      )
    );
  }

  function handleWindowMouseUp() {
    isResizing = false;
    overlayEl.style.display = 'none';

    const barRight = parseInt(barEl.style.right);
    if (barRight < RESIZE_BAR_SNAP_DISTANCE) {
      resizeViewport(window.innerWidth);
    }
    saveWidth();

    // Update initial values for the next resize.
    initialWidth = currentWidth;
    initialX = window.innerWidth - barRight - RESIZE_BAR_WIDTH / 2;
  }

  function updateCoverElements() {
    const coverWidth = Math.max(0, (window.innerWidth - currentWidth) / 2);
    leftCoverEl.style.width = `${coverWidth}px`;
    rightCoverEl.style.width = `${coverWidth}px`;
  }

  function updateWidthLabel() {
    widthLabelEl.textContent = `${Math.round(currentWidth)}px`;
    widthLabelEl.style.right = `${
      window.innerWidth -
      (window.innerWidth / 2 + currentWidth / 2) +
      RESIZE_BAR_WIDTH +
      10
    }px`;
  }

  function handleBarMouseEnter() {
    if (isResizing) return;
    widthLabelEl.style.display = 'block';
    updateWidthLabel();
  }

  function handleBarMouseLeave() {
    if (isResizing) return;
    widthLabelEl.style.display = 'none';
  }

  function getStorageKey(paramName) {
    return `vpResExt_tgIm7_${paramName}`;
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
    if (window.innerWidth !== currentWidth) {
      localStorage.setItem(itemKey, currentWidth);
    } else {
      localStorage.removeItem(itemKey);
    }
  }

  function handleWindowResize() {
    resizeViewport(Math.min(getStoredWidth(), window.innerWidth));
  }

  function handleBarDoubleClick() {
    resizeViewport(window.innerWidth);
    saveWidth();
  }

  function deactivate() {
    isActive = false;
    window.location.href = iframeEl.contentWindow.location.href;
    window.location.reload();
  }

  function setupIframeNavigation() {
    // Handle full page loads.
    iframeEl.addEventListener('load', () => {
      updateWrapperUrl();
    });

    // Handle hash changes.
    iframeEl.contentWindow.addEventListener('hashchange', () => {
      updateWrapperUrl();
    });
  }

  function syncTitle() {
    const iframeDocument =
      iframeEl.contentDocument || iframeEl.contentWindow.document;
    const iframeTitle = iframeDocument.title;

    if (document.title !== iframeTitle) {
      document.title = iframeTitle;
    }
  }

  function updateWrapperUrl() {
    try {
      const iframeUrl = iframeEl.contentWindow.location.href;
      if (window.location.href !== iframeUrl) {
        history.replaceState(null, '', iframeUrl);
      }
      syncTitle();
    } catch (e) {}
  }

  function disableSelection(el) {
    el.style.userSelect = 'none';
    el.style.webkitUserSelect = 'none';
    el.style.msUserSelect = 'none';
  }

  function triggerUpdateActionIcon() {
    chrome.runtime.sendMessage({action: 'update_action_icon', isActive});
  }

  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    switch (request.action) {
      case 'toggle_resizer':
        if (isActive) {
          deactivate();
        } else {
          checkIframeSupport((iframeEl) => {
            if (!iframeEl) return;
            initialize(iframeEl);
            isActive = true;
            triggerUpdateActionIcon();
          });
        }
        break;
      case 'trigger_update_action_icon':
        triggerUpdateActionIcon();
        break;
      default:
        break;
    }
  });

  window.addEventListener('load', triggerUpdateActionIcon);
})();
