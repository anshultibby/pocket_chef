import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export async function requestCameraPermissions() {
  if (!Capacitor.isNativePlatform()) return true;
  
  const permissionState = await Camera.checkPermissions();
  
  if (permissionState.camera === 'prompt' || permissionState.camera === 'denied') {
    const request = await Camera.requestPermissions({
      permissions: ['camera', 'photos']
    });
    
    return request.camera === 'granted' && request.photos === 'granted';
  }
  
  return permissionState.camera === 'granted' && permissionState.photos === 'granted';
} 