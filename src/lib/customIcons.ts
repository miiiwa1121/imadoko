import L from 'leaflet';

export const customIcon = new L.Icon({
  iconUrl: '/marker-icon.png', // publicフォルダからのパス
  iconSize: [25, 41],         // アイコンのサイズ [幅, 高さ]
  iconAnchor: [12, 41],       // アイコンの「先端」がマップ上の座標と一致する位置
  popupAnchor: [1, -34],      // ポップアップ（吹き出し）が表示される位置
});