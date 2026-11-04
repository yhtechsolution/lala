import { useEffect, useMemo, useRef } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { LeafletMapProps, leafletMapHtml } from './LeafletMapHtml';
import { colors } from '../theme';

export function LeafletMap({
  listings,
  selectedId,
  userPosition,
  height,
  onSelect,
  onError,
}: LeafletMapProps) {
  const map = useRef<WebView>(null);
  const listingsKey = JSON.stringify(listings);
  const positionKey = JSON.stringify(userPosition);
  const html = useMemo(
    () => leafletMapHtml(listings, userPosition),
    [listingsKey, positionKey],
  );
  const source = useMemo(() => ({ html }), [html]);
  const select = () =>
    map.current?.injectJavaScript(
      `window.selectPin?.(${JSON.stringify(selectedId)});true;`,
    );
  useEffect(select, [selectedId, html]);
  const receive = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as {
        type: string;
        id?: string;
      };
      if (message.type === 'select' && message.id) onSelect?.(message.id);
      if (message.type === 'error') onError?.();
      if (message.type === 'ready') select();
    } catch {
      // Ignore messages unrelated to the Leaflet map.
    }
  };
  return (
    <WebView
      ref={map}
      source={source}
      originWhitelist={['*']}
      onMessage={receive}
      onError={onError}
      javaScriptEnabled
      domStorageEnabled
      style={{ height, width: '100%', backgroundColor: colors.quietSurface }}
    />
  );
}
