chrome.action.onClicked.addListener((tab) => {
  sendMessage(tab.id, 'toggle_resizer');
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  sendMessage(activeInfo.tabId, 'trigger_update_action_icon');
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    sendMessage(tabId, 'trigger_update_action_icon');
  }
});

function sendMessage(tabId, action) {
  chrome.tabs.sendMessage(tabId, {action}).catch((error) => {
    updateActionIcon(tabId, false);
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'update_action_icon') {
    updateActionIcon(sender.tab.id, request.isActive);
  }
});

function updateActionIcon(tabId, isActive) {
  const iconName = isActive ? 'icon_active' : 'icon_inactive';
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
