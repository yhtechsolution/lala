import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { Coordinates } from '../types/guesthouse';

export type LocationStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'error';

// Asks for permission only when the traveller chooses "Nearest to me", never at startup.
export function useCurrentLocation() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');

  const locate = useCallback(async () => {
    setStatus('locating');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setStatus('denied');
        return null;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const found = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setCoords(found);
      setStatus('ready');
      return found;
    } catch {
      // Location services switched off, or no position could be read in time.
      setStatus('error');
      return null;
    }
  }, []);

  return { coords, status, locate };
}
