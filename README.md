Leaflet-raw-DEM
===============

A first attempt at reading and visualizing raw elevation data with Leaflet using Canvas.

Supports reading zipped DEM (Digital Elevation Model) files in the [ESRI BIL](http://resources.arcgis.com/en/help/main/10.1/index.html#//009t00000010000000) (Band interleaved by line) raster format (single band only), e.g. as provided by [USGS EarthExplorer](http://earthexplorer.usgs.gov/) for SRTM 1 Arc-Second Global.

Renders the data as raster grid, similar (yet very basic) to what desktop GIS like QGIS and uDig do, but in the Browser. With elevation labels on high zooms.

File viewer:
* [index.html](http://nrenner.github.io/leaflet-raw-dem/)  
  * Open local zipped BIL files (*_bil.zip) using the file dialog or drag&drop
  * append `?url=` parameter to zipped BIL file, e.g.  
    http://nrenner.github.io/leaflet-raw-dem/?url=http://norbertrenner.de/dem/cgiar-csi-4.1/srtm_40_04_bil.zip#zoom=17&lat=44.447457&lon=15.18232


Examples:
* [example/mallorca.html](http://nrenner.github.io/leaflet-raw-dem/example/mallorca.html) - [detail](http://nrenner.github.io/leaflet-raw-dem/example/mallorca.html#zoom=18&lat=39.828352&lon=3.115423) (building)  
Two SRTM 1-arc v3 files (1.9 MB and 2.5 MB) as example, loading may takes a few seconds
* [example/clip.html](http://nrenner.github.io/leaflet-raw-dem/example/clip.html)  
Minimal example using a 6*3 grid sample file, no extra dependencies, for development

## Status

A work in progress on hold, known issues, needs validation and testing. Provided as is, not sure if continued or maintained (low priority).

[See also](#see-also) for alternatives.

## Limitations

* only single band BIL files supported
* assuming 16-bit signed integers and Little-endian (Intel) byte-order
* Spherical Mercator (EPSG 3857) only (?)
* only linear color scale supported right now
* ...

### Known issues

* border artefacts
* viewport not always fully covered at last row/column
* ...

## Usage

Convert other formats to BIL using ``gdal_translate`` with the [GDAL EHdr](http://www.gdal.org/frmt_various.html#EHdr) format, e.g.:

    mkdir tmp
    gdal_translate -of EHdr srtm_37_05/srtm_37_05.tif tmp/srtm_37_05.bil
    zip -j srtm_37_05_bil.zip tmp/*
    rm -r tmp

## Build

Requires [Node and npm](http://nodejs.org/) (or [io.js](https://iojs.org)), [Bower](http://bower.io/) and [Gulp](http://gulpjs.com/):

    npm install -g bower
    npm install -g gulp

Install:

    npm install
    bower install

Build:

    gulp

Develop:

    gulp watch


## To-do

* hgt format (basically the same with the header derived from the file name)
* Web Worker
* autoScale/stats across multiple layers
* ...

## See also

* [Leaflet.TileLayer.GL - Iván Sánchez Ortega](https://gitlab.com/IvanSanchez/Leaflet.TileLayer.GL): Apply WebGL shaders to your LeafletJS tile layers
* [stuartmatthews/leaflet-geotiff](https://github.com/stuartmatthews/leaflet-geotiff): Leaflet plugin for displaying geoTIFF raster data
* [IHCantabria/Leaflet.CanvasLayer.Field](https://github.com/IHCantabria/Leaflet.CanvasLayer.Field): Load and style Raster files in Leaflet (geotiff & asciigrid)
* [tangrams/heightmapper](https://github.com/tangrams/heightmapper): interactive heightmaps from terrain data
  * [What a Relief: Global Test Pilots Wanted · Mapzen](https://mapzen.com/blog/elevation/)    
* [Weather-gridGL](http://briegn1.github.io/weather-gridGL/): Examples of how to convert gridded data into LeafletJS WebGL overlays
* [GeoTIFF/georaster-layer-for-leaflet](https://github.com/GeoTIFF/georaster-layer-for-leaflet): Display GeoTIFFs and soon other types of raster on your Leaflet Map
* [geotiffjs/geotiff.js](https://github.com/geotiffjs/geotiff.js): a small library to parse TIFF files for visualization or analysis
* [xlhomme/GeotiffParser.js](https://github.com/xlhomme/GeotiffParser.js)

OpenLayers

* [OpenLayers Shaded Relief example](http://openlayers.org/en/latest/examples/shaded-relief.html)
* [maptilerlabs/terrain-demos](https://github.com/maptilerlabs/terrain-demos): Demonstration of terrain RGB tiles (OL & Mapbox GL JS)
* [Visualizing GeoTIFF Tiles with OpenLayers – EOX](https://eox.at/2018/01/visualizing-geotiff-tiles-with-openlayers/)
* [buddebej/ol3-dem](https://github.com/buddebej/ol3-dem) - WebGL, eu-dem, png data tiles  
  [elasticterrain](https://github.com/buddebej/elasticterrain) - SRTM 1-arc + additional, png data tiles

More
* [Realistic terrain with custom styling](https://blog.mapbox.com/realistic-terrain-with-custom-styling-ce1fe98518ab): Mapbox GL JS hillshade layer from [Terrain-RGB tiles](https://blog.mapbox.com/global-elevation-data-6689f1d0ba65) 
  * [enable hypsometric tinting from raster-dem sources · Issue #6245 · mapbox/mapbox-gl-js](https://github.com/mapbox/mapbox-gl-js/issues/6245)
  * [Dynamic hill shading in the browser](https://www.mapbox.com/blog/dynamic-hill-shading/) (old demo)
* [Terrain building with three.js](http://blog.thematicmapping.org/2013/10/terrain-building-with-threejs.html)
* [WCS i threejs](http://labs.kartverket.no/wcs-i-threejs/) - WCS, tiff-js, three.js (FOSS4G 2014 talk)
* [Turfjs/turf-isobands](https://github.com/Turfjs/turf-isobands)
* [Animated heatmaps and grids with Turf ](https://www.mapbox.com/blog/heatmaps-and-grids-with-turf/)

## License

Copyright (c) 2015 Norbert Renner, licensed under the [MIT License (MIT)](LICENSE)
