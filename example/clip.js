(function() {

    var map = new L.Map('map');
    map.setView([39.8282, 3.1160], 18);

    var osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 22,
        maxNativeZoom: 19,
        attribution : '© <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    osm.addTo(map);
    
    var none = L.layerGroup();

    var options = {
        opacity: 0.8,
        colorScale: L.colors['black - white'],
        autoScale: true
    };

    var clip = new L.BilDem('../data/n39_e003_1arc_v3_clip_bil.zip', options);
    clip.addTo(map);

    var layerSwitcher = L.control.layers({
        'OSM': osm,
        'none': none
    }, { 
        'n39_e003_1arc_v3 clipped': clip
    });
    layerSwitcher.addTo(map);

})();
