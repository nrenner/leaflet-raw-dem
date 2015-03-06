(function() {

    var map = new L.Map('map');
    map.setView([39.5, 3], 10);

    map.attributionControl.setPrefix('<a target="_blank" href="https://github.com/nrenner/leaflet-raw-dem">Leaflet-raw-DEM</a> | '
        + map.attributionControl.options.prefix);

    var osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 22,
        maxNativeZoom: 19,
        attribution : '© <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    
    var none = L.layerGroup();
    none.addTo(map);

    var options = {
        opacity: 1,
        colorScale: L.colors['OceanLakeLandSno'],
        autoScale: false,
        scaleMin: -5,
        scaleMax: 1435
    };

    // sample upload for demo purposes; loads using XHR, requires CORS support when remote
    var baseurl = 'http://norbertrenner.de/dem/srtmgl1v3/';
    var west = new L.BilDem(baseurl + 'n39_e002_1arc_v3_bil.zip', options).addTo(map);
    var east = new L.BilDem(baseurl + 'n39_e003_1arc_v3_bil.zip', options).addTo(map);
    map.attributionControl.addAttribution('SRTM 1 Arc-Second Global v3 (~30m), ' 
         + '<a target="_blank" href="http://eros.usgs.gov/find-data">data available from the U.S. Geological Survey.</a> ');

    var optionsControl = new L.OptionsControl();
    optionsControl.addLayer(west);
    optionsControl.addLayer(east);

    var layerSwitcher = L.control.layers({
        'none': none,
        'OSM': osm 
    }, { 
        'n39_e002_1arc_v3_bil.zip': west,
        'n39_e003_1arc_v3_bil.zip': east
    }, {
        position: 'topleft'
    });
    layerSwitcher.addTo(map);

    map.addControl(new L.Control.Permalink({
        text: 'Permalink',
        position: 'bottomright'
        //layers: layersControl,
    }));

    L.control.scale().addTo(map);

})();
