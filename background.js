chrome.action.onClicked.addListener((tab) => {
  if (
    tab.url.startsWith('chrome://') ||
    tab.url.startsWith('chrome-extension://') ||
    tab.url.includes('chrome.google.com/webstore')
  ) {
    updateActionIcon(tab.id, 'icon_inactive');
    return;
  }

  chrome.tabs.sendMessage(tab.id, {action: 'toggle_resizer'}).catch((error) => {
    console.error('Error sending message:', error);
    updateActionIcon(tab.id, 'icon_inactive');
  });
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  updateActionIcon(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    updateActionIcon(tabId);
  }
});

const tabStates = new Map();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'update_icon') {
    tabStates.set(sender.tab.id, request.isActive);
    updateActionIcon(sender.tab.id);
  }
});

function updateActionIcon(tabId, iconName = null) {
  if (!iconName) {
    iconName = !!tabStates.get(tabId) ? 'icon_active' : 'icon_inactive';
  }
  chrome.action.setIcon({
    path: {
      16: `assets/${iconName}_16.png`,
      32: `assets/${iconName}_32.png`,
      48: `assets/${iconName}_48.png`,
      128: `assets/${iconName}_128.png`,
    },
    tabId: tabId,
  });
}
