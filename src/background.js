/* global chrome */

chrome.pageAction.onClicked.addListener(() => {
    chrome.tabs.create({
        url: chrome.runtime.getURL("window.html"),
        active: true
    });
});

const checkForValidUrl = (tabId, changeInfo, tab) => {
    if (tab.url && tab.url.indexOf("https://github.com") === 0) {
        chrome.pageAction.show(tabId);
    }
};

chrome.tabs.onUpdated.addListener(checkForValidUrl);
