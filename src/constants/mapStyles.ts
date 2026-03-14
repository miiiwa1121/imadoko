export const MAP_STYLES = [
  { name: "淡色地図 (GSI)", url: "https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png", attribution: "&copy; 国土地理院", maxNativeZoom: 18 },
  { name: "OSM Japan", url: "https://tile.openstreetmap.jp/{z}/{x}/{y}.png", attribution: "&copy; OpenStreetMap", maxNativeZoom: 18 },
  { name: "CARTO Voyager", url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png", attribution: "&copy; CARTO", maxNativeZoom: 20 },
  { name: "Esri World Imagery", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", attribution: "&copy; Esri", maxNativeZoom: 18 }
];

export const getThumbnail = (url: string) => {
  return url
    .replace("{s}", "a")
    .replace("{z}", "16")
    .replace("{x}", "58208")
    .replace("{y}", "25800")
    .replace("{r}", "");
};
