import L from 'leaflet';

export const customIcon = new L.Icon({
  iconUrl: '/marker-icon.png', // publicフォルダからのパス
  iconSize: [25, 41],         // アイコンのサイズ [幅, 高さ]
  iconAnchor: [12, 41],       // アイコンの「先端」がマップ上の座標と一致する位置
  popupAnchor: [1, -34],      // ポップアップ（吹き出し）が表示される位置
});

// Tailwind CSSの base style で img に max-width: 100% が適用されると
// Leafletマーカーの位置がずれるため、.leaflet-pane img に対して max-width を無効化
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .leaflet-pane img {
      max-width: none !important;
    }
  `;
  if (document.head) {
    document.head.appendChild(style);
  }
}