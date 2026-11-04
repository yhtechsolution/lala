import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { LeafletMapProps, leafletMapHtml } from './LeafletMapHtml';

export function LeafletMap({
  listings,
  selectedId,
  userPosition,
  height,
  onSelect,
  onError,
}: LeafletMapProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const listingsKey = JSON.stringify(listings);
  const positionKey = JSON.stringify(userPosition);
  const html = useMemo(
    () => leafletMapHtml(listings, userPosition),
    [listingsKey, positionKey],
  );
  useEffect(() => {
    frame.current?.contentWindow?.postMessage(
      JSON.stringify({ type: 'select', id: selectedId }),
      '*',
    );
  }, [selectedId, html]);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      try {
        const message = JSON.parse(event.data) as { type: string; id?: string };
        if (message.type === 'select' && message.id) onSelect?.(message.id);
        if (message.type === 'error') onError?.();
        if (message.type === 'ready')
          frame.current?.contentWindow?.postMessage(
            JSON.stringify({ type: 'select', id: selectedId }),
            '*',
          );
      } catch {
        // Ignore messages unrelated to this map frame.
      }
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [onSelect, onError, selectedId]);
  return (
    <View style={{ height, overflow: 'hidden', width: '100%' }}>
      <iframe
        ref={frame}
        srcDoc={html}
        title="Interactive guesthouse map"
        style={{ border: 0, width: '100%', height: '100%' }}
      />
    </View>
  );
}
