import L from 'leaflet';

// ホスト用のアイコン（赤色）
// 元の青色アイコンの色違い(#e63333)を定義
export const customIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%2225%22 height%3D%2241%22 viewBox%3D%220 0 25 41%22%3E%3Cpath d%3D%22M12.5 0C5.6 0 0 5.6 0 12.5c0 10 12.5 28 12.5 28s20-5 12.5-28c0-6.9-5.6-12.5-12.5-12.5z%22 fill%3D%22%23e63333%22%2F%3E%3Ccircle cx%3D%2212.5%22 cy%3D%2212.5%22 r%3D%224%22 fill%3D%22%23fff%22%2F%3E%3C%2Fsvg%3E',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'fix-marker-size'
});

// ゲスト用のアイコン（青色）
export const guestIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNSIgaGVpZ2h0PSI0MSIgdmlld0JveD0iMCAwIDI1IDQxIj4KICAKICA8cGF0aCBkPSJNMTIuNSAwQzUuNiAwIDAgNS42IDAgMTIuNWMwIDEwIDEyLjUgMjggMTIuNSAyOHMyMC01IDEyLjUtMjhjMC02LjktNS42LTEyLjUtMTIuNS0xMi41eiIgZmlsbD0iIzMzNzJlNiIvPgogIDxjaXJjbGUgY3g9IjEyLjUiIGN5PSIxMi41IiByPSI0IiBmaWxsPSIjZmZmIi8+Cjwvc3ZnPg==',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  className: 'fix-marker-size'
});