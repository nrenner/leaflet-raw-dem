/**
 * Reads elevation data from ESRI BIL (Band Interleaved by Line) raster format.
 * 
 * Very basic implementation that only supports a single band, assumes 16-bit signed integers
 * and Little-endian (Intel) byte-order.
 *
 * http://resources.arcgis.com/en/help/main/10.1/index.html#//009t00000010000000
 * http://downloads.esri.com/support/whitepapers/other_/eximgav.pdf
 * http://www.gdal.org/frmt_various.html#EHdr
 */
 L.BilDem = L.DemLayer.extend({
  
    initialize: function (url, options) {
        this._url = url;
        L.setOptions(this, options);
    },

    onAdd: function (map) {
        L.DemLayer.prototype.onAdd.call(this, map);
        
        if (this._url && !(this._data && this._header)) {
            this.load();
        }
    },

    /* TODO don't reload on remove/add (doesn't work with FileLayer, got content not file object)
    onRemove: function (map) {
        L.DemLayer.prototype.onRemove.call(this, map);

        this._dataView = null;
        this._data = null;
        this._header = null;
    },
    */

    load: function () {
        var url = this._url,
            callback = L.bind(function(err) {
                if (err) {
                    throw err;
                }

                if (this._data && this._header) {
                    this._loaded();
                }
            }, this);

        if (url.search(/.zip$/) !== -1) {
            this.loadZip(url, callback);
        } else {
            this.loadBIL(url, callback);
            this.loadHeader(url.replace('.bil', '.hdr'), callback);
        }
    },

    _loaded: function () {
        console.log('loaded');
        this._redraw();
    },

    _get: function (url, binary, callback) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', url, true);
        if (binary) {
            xhr.responseType = 'arraybuffer';
        }
        xhr.onload = function(e) {
            console.timeEnd(url);
            if (xhr.status === 200 || xhr.status === 0) {
                callback(null, binary ? xhr.response : xhr.responseText);
            }
        };
        xhr.onerror = function(e) {
            callback(new Error('Error loading ' + url + '(' + xhr.status + ')'));
        };
        console.time(url);
        xhr.send();
    },

    addBIL: function (data) {
        this._data = data;
        // assuming little-endian, see getValueAtXY
        //this._dataView = new DataView(this._data);
        this._dataView = new Int16Array(this._data);
        console.log('bil loaded: byteLength = ' + this._data.byteLength);
    },

    loadBIL: function (url, callback) {
        this._get(url, true, L.bind(function(err, data) {
            this.addBIL(data);
            callback();
        }, this));
    },

    addHeader: function (data) {
        this._header = this.parseHeader(data);
        console.log('hdr loaded: ', this._header);
    },

    loadHeader: function (url, callback) {
        this._get(url, false, L.bind(function(err, data) {
            this.addHeader(data);
            callback();
        }, this));
    },

    addZip: function (data) {
        var zip, filtered, bil, hdr;

        function filter(extension) {
            filtered = zip.filter(function (relativePath, file){
                return (relativePath.search('\.' + extension + '$') !== -1);
            });

            if (filtered.length === 1) {
                return filtered[0];
            }
            return null;
        }

        zip = new JSZip(data);

        bil = filter('bil');
        if (bil) {
            this.addBIL(bil.asArrayBuffer());
        } else {
            //return callback(new Error('bil file not found in ' + url));
            return console.error('bil file not found in ' + url);
        }

        hdr = filter('hdr');
        if (hdr) {
            this.addHeader(hdr.asText());
        } else {
            //return callback(new Error('hdr file not found in ' + url));
            return console.error('hdr file not found in ' + url);
        }

        //callback();
        this._loaded();
    },

    loadZip: function (url) {
        this._get(url, true, L.bind(function(err, data) {
            if (err) {
                return console.error(err);
            }

            this.addZip(data);
        }, this));
    },

    parseHeader: function (text) {
        var header = {},
            re = /\s+/,
            // 'nodata' SRTM-specific? Not in ESRI spec.
            keywords = ['nrows', 'ncols', 'nbands', 'nbits', 'pixeltype', 'byteorder', 'layout', 'skipbytes', 'ulxmap', 'ulymap', 'xdim', 'ydim', 'bandrowbytes', 'totalrowbytes', 'bandgapbytes', 'nodata'],
            ints = ['nrows', 'ncols', 'nbands', 'nbits', 'skipbytes', 'bandrowbytes', 'totalrowbytes', 'bandgapbytes', 'nodata'],
            floats = ['ulxmap', 'ulymap', 'xdim', 'ydim'],
            lines = text.split('\n'),
            i, len, line, key, value;

        for (i = 0, len = lines.length; i < len; i++) {
            line = lines[i].split(re);
            key = line[0].toLowerCase();
            value = line[1];

            // ignore lines not starting with a keyword (comments)
            if (keywords.indexOf(key) !== -1) {
                if (ints.indexOf(key) !== -1) {
                    header[key] = parseInt(value);
                } else if (floats.indexOf(key) !== -1) {
                    header[key] = parseFloat(value);
                } else {
                    header[key] = value;
                }
            }
        }

        return header;
    },

    getBounds: function () {
        var h = this._header;

        return L.latLngBounds(
            L.latLng(h.ulymap - h.nrows * h.ydim, h.ulxmap),
            L.latLng(h.ulymap, h.ulxmap + h.ncols * h.xdim));
    },

    // returns Bounds in raster cell coordinates, not screen pixels
    getCellRange: function (latLngBounds) {
        return L.bounds(
           this.getCellXY(latLngBounds.getNorthWest()),
           this.getCellXY(latLngBounds.getSouthEast()).subtract([1, 1]));
    },

    // returns Point in raster cell coordinates, not screen pixels
    getCellXY: function (latLng) {
        var nrows = this._header.nrows,
            ulymap = this._header.ulymap,
            ulxmap = this._header.ulxmap,
            lat = latLng.lat,
            lng = latLng.lng,
            ydim = this._header.ydim,
            xdim = this._header.xdim;

        // FIXME floor/ceil?
        return L.point(
            Math.round((lng - ulxmap) / xdim),
            /*nrows - */ Math.round((ulymap - lat) / ydim));
    },

    getValueAtLatLng: function (latLng) {
        var cell = this.getCellXY(latLng);

        return this.getValueAtXY(cell.x, cell.y);
    },

    getValueAtXY: function (x, y) {
        var ncols = this._header.ncols,
            index, val;

        // assuming:
        // 
        // BYTEORDER      I         (I—Intel® = little endian, 
        //                           M—Motorola® = big endian)
        // NBITS          16
        // PIXELTYPE      SIGNEDINT

        index = (y * ncols) + x;
        val = this._dataView[index];

        //console.log('x/y: ' + x + ', ' + y + ', i:' + index * 2 + ' = ' + val);
        return val;
    },

    getStats: function (range) {
        var s, row, col, val,
            maxy = range.max.y,
            maxx = range.max.x,
            data = this._dataView, 
            ncols = this._header.ncols,
            nodata = this._header.nodata;

        //console.time('stats');

        s = {
            min: Number.MAX_VALUE,
            max: Number.MIN_VALUE
        };

        for (row = range.min.y; row <= maxy; row++) {
            for (col = range.min.x; col <= maxx; col++) {
                // inlining getValueAtXY for better performance
                val = data[(row * ncols) + col];

                if (val !== nodata) {
                    s.min = Math.min(s.min, val);
                    s.max = Math.max(s.max, val);
                }
            }
        }

        //console.timeEnd('stats');
        //console.log('stats: min = ' + s.min + ', max = ' + s.max);
        return s;
    }

});