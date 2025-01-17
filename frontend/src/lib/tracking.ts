declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        tracking?: {
          postMessage: (message: string) => void;
        };
      };
    };
    [key: string]: unknown; // More specific than 'any' for dynamic properties
  }
}

export async function requestTrackingPermission(): Promise<boolean> {
  // Check if running in iOS app context with proper webkit bridge
  const tracking = window?.webkit?.messageHandlers?.tracking;
  
  if (!tracking?.postMessage) {
    console.log('No tracking bridge, defaulting to true');
    return true;
  }

  return new Promise((resolve) => {
    const callbackName = `handleTrackingResponse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    window[callbackName] = (authorized: boolean) => {
      console.log('Tracking permission response:', authorized);
      resolve(authorized);
      delete window[callbackName];
    };

    tracking.postMessage(JSON.stringify({
      action: 'requestPermission',
      callback: callbackName
    }));
  });
}

// Modify the existing track function to respect tracking permission
export async function track() {
  const canTrack = await requestTrackingPermission();
  if (!canTrack) {
    return;
  }
  
  // Your existing tracking logic here
}