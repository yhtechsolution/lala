import { Coordinates } from '../services/nearbyGuesthouses';

export type MapListing = {
  id: string;
  name: string;
  pricePerNight: number;
  location: Coordinates;
};

export type LeafletMapProps = {
  listings: MapListing[];
  selectedId?: string;
  userPosition?: Coordinates;
  height: number;
  onSelect?: (id: string) => void;
  onError?: () => void;
};

// Both the browser frame and native WebView run this same Leaflet page.
export function leafletMapHtml(
  listings: MapListing[],
  userPosition?: Coordinates,
) {
  const payload = JSON.stringify({ listings, userPosition }).replaceAll(
    '<',
    '\\u003c',
  );
  return `<!doctype html>
<html lang="en"><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
html,body,#map{width:100%;height:100%;margin:0;background:#f5efeb;overflow:hidden}
body{font-family:system-ui,sans-serif}
.leaflet-container{background:#f5efeb}
.leaflet-tile{filter:sepia(.28) saturate(.76) brightness(1.04)}
.leaflet-control-attribution{font-size:9px!important;background:rgba(255,255,255,.9)!important}
.price-pin{background:none;border:0;display:flex;align-items:center;justify-content:center}
.price-pin span{display:inline-block;white-space:nowrap;background:#fdfbf7;color:#321e10;border-radius:999px;padding:7px 12px;font-size:13px;font-weight:700;box-shadow:0 3px 9px #4a332429}
.price-pin.selected span{background:#4a3324;color:#fff;box-shadow:0 6px 16px #4a332466}
.position-dot{width:14px;height:14px;border:3px solid #fff;background:#c47c48;border-radius:50%;box-shadow:0 0 0 4px #c47c4855}
#recenter{position:absolute;z-index:1000;top:12px;right:12px;width:40px;height:40px;border:0;border-radius:50%;background:#fdfbf7;color:#321e10;font-size:20px;box-shadow:0 1px 4px #4a332429}
</style>
<script>window.__mapTimeout=setTimeout(function(){send('error')},15000);function send(type,id){var data=JSON.stringify({type:type,id:id});if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(data);else window.parent.postMessage(data,'*')}</script>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head><body><div id="map"></div><button id="recenter" type="button" aria-label="Recenter map">⌖</button>
<script>
(function(){
if(!window.L){send('error');return}
clearTimeout(window.__mapTimeout);
var data=${payload};
var origin=data.userPosition||data.listings[0]?.location||{lat:-22.3,lng:24.7};
var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([origin.lat,origin.lng],data.userPosition?11:14);
L.control.attribution({position:'topleft',prefix:false}).addTo(map);
var tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
  maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).addTo(map);
var loadedTiles=0;
tiles.on('tileload',function(){loadedTiles++});
setTimeout(function(){if(loadedTiles===0)send('error')},12000);
var markers={};
var selectedId='';
function icon(item,selected){
  var price='P '+Number(item.pricePerNight).toLocaleString('en-US',{maximumFractionDigits:0});
  return L.divIcon({className:'price-pin'+(selected?' selected':''),html:'<span>'+price+'</span>',iconSize:[94,32],iconAnchor:[47,36]});
}
data.listings.forEach(function(item){
  var marker=L.marker([item.location.lat,item.location.lng],{icon:icon(item,false),title:item.name}).addTo(map);
  marker.on('click',function(){select(item.id);send('select',item.id)});
  markers[item.id]=marker;
});
if(data.userPosition){
  L.marker([data.userPosition.lat,data.userPosition.lng],{
    icon:L.divIcon({className:'',html:'<div class="position-dot"></div>',iconSize:[20,20],iconAnchor:[10,10]}),
    title:'Your location'
  }).addTo(map);
}
function select(id){
  if(markers[selectedId]){
    var old=data.listings.find(function(item){return item.id===selectedId});
    if(old)markers[selectedId].setIcon(icon(old,false));
  }
  selectedId=id;
  var item=data.listings.find(function(value){return value.id===id});
  if(item&&markers[id]){markers[id].setIcon(icon(item,true));map.panTo([item.location.lat,item.location.lng])}
}
window.selectPin=select;
window.addEventListener('message',function(event){
  try{var message=JSON.parse(event.data);if(message.type==='select')select(message.id)}catch(_){}
});
document.getElementById('recenter').addEventListener('click',function(){map.setView([origin.lat,origin.lng],data.userPosition?11:14)});
setTimeout(function(){map.invalidateSize();send('ready')},100);
})();
</script></body></html>`;
}
