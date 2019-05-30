(function() {
    var layerSwitcher;

    var map = new L.Map('map');
    map.setView([15, -10], 3);
    map.attributionControl.setPrefix('<a target="_blank" href="https://github.com/nrenner/leaflet-raw-dem">Leaflet-raw-DEM</a> | '
        + map.attributionControl.options.prefix);

    var osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 22,
        maxNativeZoom: 19,
        attribution : '© <a target="_blank" href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });
    osm.addTo(map);

    // COPYING: Please get your own Bing maps key at http://www.microsoft.com/maps/default.aspx
    var bing = new L.BingLayerExt();
    var bingKeyUrl = window.location.protocol === 'file:' ? 'bingkey.txt' : 'http://norbertrenner.de/key/bing.php';
    L.Util.get(bingKeyUrl, function (err, key) {
        if (err) {
            //console.log(err.message);
            layerSwitcher.removeLayer(bing);
            return;
        }

        bing._key = key;
        bing.loadMetadata();
    });

    var none = L.layerGroup();

    var graticule = L.grid({
        //redraw: 'moveend'
    });

    var graticule1deg = L.graticule({ 
        interval: 1 
    });

    layerSwitcher = L.control.layers({
        'OSM': osm,
        'Bing': bing,
        'none': none
    }, { 
        'Graticule 1°': graticule1deg,
        'Graticule (-z10)': graticule
    }, {
        position: 'topleft'
    });

    function fileParser(content, format) {
        var layer = new L.BilDem();
        layer.addTo(map);
        layer.addZip(content);
        return layer;
    }

    L.Control.FileLayerLoad.TITLE = 'Load local BIL file (.zip)';
    L.Control.FileLayerLoad.LABEL = '<img src="dist/noun_41075_cc.png" width="26px"'
        + ' style="-webkit-clip-path: inset(0 0 5px 0); -moz-clip-path: inset(0 0 5px 0); clip-path: inset(0 0 5px 0);">';
    var fileLayer = L.Control.fileLayerLoad({
        // File size limit in kb (default: 1024) ?
        fileSizeLimit: 100*1024,
        // Restrict accepted file formats (default: .geojson, .kml, and .gpx) ?
        formats: [
            '.zip'
        ],
        parsers: {
            'zip': fileParser
        },
        binaryFormats: ['zip']
    }).addTo(map);
    
    var optionsControl = new L.OptionsControl();

    layerSwitcher.addTo(map);
    map.on('overlayadd', function (e) {
        optionsControl.addLayer(e.layer);
    });
    map.on('overlayremove', function (e) {
        optionsControl.removeLayer(e.layer);
    });

    fileLayer.loader.on('data:loaded', function (e) {
        layerSwitcher.addOverlay(e.layer, e.filename);
        optionsControl.addLayer(e.layer);
    });
    fileLayer.loader.on('data:error', function (e) {
        console.error(e.error.stack);
    });

    map.addControl(new L.Control.Permalink({
        text: 'Permalink',
        position: 'bottomright'
        //layers: layersControl,
    }));

    /*
    L.control.coordinates({
        decimals:6,
        useLatLngOrder:true
    }).addTo(map);
    */
    L.control.coordinates({
        useDMS:true,
        labelTemplateLat:"N {y}",
        labelTemplateLng:"E {x}",
        useLatLngOrder:true
    }).addTo(map);

    L.control.scale().addTo(map);

    var params = new URLSearchParams(window.location.search);
    var url = params.get("url");
    if (url) {
        var demLayer = new L.BilDem(url);
        demLayer.addTo(map);
        optionsControl.addLayer(demLayer);
    }

})();
