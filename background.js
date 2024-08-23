chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, {action: 'toggle_resizer'});
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'update_icon') {
    const {isActive} = request;
    if (isActive) {
      chrome.action.setIcon({path: 'icon_active_128.png'});
    } else {
      chrome.action.setIcon({path: 'icon_inactive_128.png'});
    }
  }
});
