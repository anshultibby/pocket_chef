'use client';

import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { requestTrackingPermission } from '@/lib/tracking';

export function AnalyticsProvider() {
  const [canTrack, setCanTrack] = useState(false);

  useEffect(() => {
    const checkPermission = async () => {
      const hasPermission = await requestTrackingPermission();
      setCanTrack(hasPermission);
    };

    checkPermission();
  }, []);

  if (!canTrack) {
    return null;
  }

  return <Analytics />;
}
