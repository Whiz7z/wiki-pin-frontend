chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received", message);
  console.log("Sender", sender);
  
  
  return sendResponse({ message: "Message received at background" });
});

console.log("Background script loaded");