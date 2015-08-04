/**
 * DEM raster layer. Visualizes raw elevation data using canvas. 
 */
L.DemLayer = L.CanvasLayer.extend({

    options: {
        opacity: 0.9,
        textColor: 'rgb(218, 72, 0)',
        colorScale: L.colors['black - white'], // = ['black', 'white']
        autoScale: false,
        scaleMin: 0,
        scaleMax: 1000
    },

    initialize: function (options) {
        L.setOptions(this, options);
    },

    getBounds: function () { throw 'implement in subclass' },

    _redraw: function () {
        if (!(this._data && this._header)) {
            return;
        }

        var dataBounds, snapBounds, drawBounds, se, ctx, drawOrigin, range, stats, row, col, scale, domain,
            map = this._map,
            header = this._header,
            // TODO options.padding (but stats only for visible range?): .multiplyBy(1 + 0.5 * 2),
            size = map.getSize(),
            bounds = map.getBounds(),
            dataOrigin = L.latLng(header.ulymap, header.ulxmap),
            xdim = header.xdim,
            ydim = header.ydim,
            // raster pixel cell with 1/2 pixel offset (value coordinate is in center)
            xoff = xdim / 2,
            yoff = ydim / 2;

        //console.time('redraw');
            
        this._ctx = ctx = this._canvas.getContext('2d');
        ctx.clearRect(0, 0, size.x, size.y);

        dataBounds = this.getBounds();
        if (!bounds.intersects(dataBounds)) {
            return;
        }

        // TODO always manipulate pixels, use second canvas for point+label
        if (map.getZoom() < 16) {
            this._imageData = ctx.createImageData(this._canvas.width, this._canvas.height);
        } else {
            this._imageData = null;
        }
        
        // FIXME rework bounds calculations (missing last row/col, artefacts; one-offs)
        snapBounds = this._snapToRaster(bounds, dataOrigin, xdim, ydim);
        drawBounds = this._restrictToBounds(snapBounds, dataBounds);

        drawOrigin = drawBounds.getNorthWest();
        se = drawBounds.getSouthEast();
        //this._debugBounds(dataBounds, snapBounds, drawBounds, drawOrigin);

        // TODO map bounds
        range = this.getCellRange(drawBounds);
        if (this.options.autoScale) {
            stats = this.getStats(range);
            domain = [stats.min, stats.max];
        } else {
            domain = [this.options.scaleMin, this.options.scaleMax];
        }
        scale = chroma.scale(this.options.colorScale).mode('lab').domain(domain);

        row = this.calcPixelAxisRow(range, drawOrigin, xdim, ydim, xoff, yoff);
        col = this.calcPixelAxisColumn(range, drawOrigin, xdim, ydim, xoff, yoff);

        //console.time('drawGrid');
        this.drawGrid(range, row, col, scale);
        //console.timeEnd('drawGrid');

        if (this._imageData) {  
            ctx.putImageData(this._imageData, 0, 0);
        }

        //console.timeEnd('redraw');

        this._frame = null;
    },

    _snapToRaster: function (bounds, origin, xdim, ydim) {
        var sw = bounds.getSouthWest(),
            ne = bounds.getNorthEast();

        return L.latLngBounds(
            L.latLng(
                this._snap(sw.lat, origin.lat, ydim) - ydim,
                this._snap(sw.lng, origin.lng, xdim)),
            L.latLng(
                this._snap(ne.lat, origin.lat, ydim),
                this._snap(ne.lng, origin.lng, xdim) + xdim));
    },

    _snap: function (val, origin, dim) {
        return val - ((val - origin) % dim);
    },

    _restrictToBounds: function (drawBounds, dataBounds) {
        var sw = drawBounds.getSouthWest(),
            ne = drawBounds.getNorthEast(),
            sw2 = dataBounds.getSouthWest(),
            ne2 = dataBounds.getNorthEast();

        return L.latLngBounds(
            L.latLng(
                Math.max(sw.lat, sw2.lat),
                Math.max(sw.lng, sw2.lng)),
            L.latLng(
                Math.min(ne.lat, ne2.lat),
                Math.min(ne.lng, ne2.lng)));
    },

    // calculate x/column axis screen pixels
    calcPixelAxisColumn: function (range, drawOrigin, xdim, ydim, xoff, yoff) {
        var i, ulPoint, lrPoint,
            maxx = range.max.x,
            lng = drawOrigin.lng,
            col = [],
            map = this._map,
            latLng = L.latLng(drawOrigin.lat, drawOrigin.lng),
            ul = L.latLng(drawOrigin.lat + yoff, drawOrigin.lng),
            lr = L.latLng(drawOrigin.lat + yoff - ydim, drawOrigin.lng);

        for (i = range.min.x; i <= maxx; i++) {
            latLng.lng = lng;
            ul.lng = lng - xoff;
            lr.lng = lng - xoff + xdim;

            ulPoint = map.latLngToContainerPoint(ul);
            lrPoint = map.latLngToContainerPoint(lr);

            col.push({
                x: map.latLngToContainerPoint(latLng).x,
                ulx: ulPoint.x,
                width: lrPoint.x - ulPoint.x
            });
            
            lng += xdim;
        }

        return col;
    },

    // calculate y/row axis screen pixels
    calcPixelAxisRow: function (range, drawOrigin, xdim, ydim, xoff, yoff) {
        var i, ulPoint, lrPoint,
            maxy = range.max.y,
            lat = drawOrigin.lat,
            row = [],
            map = this._map,
            latLng = L.latLng(drawOrigin.lat, drawOrigin.lng),
            ul = L.latLng(drawOrigin.lat, drawOrigin.lng - xoff),
            lr = L.latLng(drawOrigin.lat, drawOrigin.lng - xoff + xdim);

        for (i = range.min.y; i <= maxy; i++) {
            latLng.lat = lat;
            ul.lat = lat + yoff;
            lr.lat = lat + yoff - ydim;

            ulPoint = map.latLngToContainerPoint(ul);
            lrPoint = map.latLngToContainerPoint(lr);

            row.push({
                y: map.latLngToContainerPoint(latLng).y,
                uly: ulPoint.y,
                height: lrPoint.y - ulPoint.y
            });
            
            lat -= ydim;
        }
        
        return row;
    },

    drawGrid: function (range, row, col, scale) {
        var rowi, i, coli, k, val, c, r, drawCell,
            maxy = range.max.y, 
            maxx = range.max.x,
            nodata = this._header.nodata,
            zoom = this._map.getZoom();

        if (this._imageData) {
            drawCell = this._drawCellPixels;
        } else {
            drawCell = this._drawCellRect;
        }

        for (rowi = range.min.y, i = 0; rowi <= maxy; rowi++, i++) {
            for (coli = range.min.x, k = 0; coli <= maxx; coli++, k++) {
                c = col[k];
                r = row[i];

                if (c.width === 0 || r.height === 0) {
                    continue;
                }

                val = this.getValueAtXY(coli, rowi);
                
                drawCell(val, c.ulx, r.uly, c.width, r.height, scale, nodata, this);

                if (c.width > 15) {
                    if (zoom > 17)  {
                        this._drawCrosshair(c.x, r.y);
                    }

                    this._drawText(zoom, c.x, r.y, val, nodata);
                }
            }
        }
    },

    _drawCellRect: function (val, x, y, width, height, scale, nodata, scope) {
        var ctx = scope._ctx;

        if (val !== nodata) {
            ctx.fillStyle = scale(val).css();
        } else {
            ctx.fillStyle = 'red';
        }
        ctx.fillRect(x, y, width, height);
    },

    _drawCellPixels: function (val, x, y, width, height, scale, nodata, scope) {
        var rgba;
        //if (width !== 1 || height !== 1) debugger;

        rgba = (val !== nodata) ? scale(val).rgba() : [255, 0, 0];
        rgba[3] = 255; // * this.options.opacity;
        scope._fillRect(x, y, width, height, rgba, scope);
    },

    _fillRect: function (ulx, uly, width, height, rgba, scope) {
        var data = scope._imageData.data,
            dataWidth = scope._imageData.width,
            x, y, i, xmax, ymax;

        for (x = ulx, xmax = x + width; x < xmax; x++) {
            for (y = uly, ymax = y + height; y < ymax; y++) {
                i = (y * dataWidth + x) * 4;
                data[i] = rgba[0];
                data[i + 1] = rgba[1];
                data[i + 2] = rgba[2];
                data[i + 3] = rgba[3];
            }
        }
    },

    _drawCrosshair: function (px, py) {
        var ctx = this._ctx,
            // canvas grid pos + 0.5 to get crisp single pixel line
            x = px + 0.5,
            y = py + 0.5,
            len = 3;

        ctx.strokeStyle = this.options.textColor;
        ctx.beginPath();
        ctx.moveTo(x - len, y);
        ctx.lineTo(x + len, y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, y - len);
        ctx.lineTo(x, y + len);
        ctx.stroke();
    },

    _drawText: function (zoom, x, y, val, nodata) {
        var ctx = this._ctx,
            isNodata = (val === nodata),
            text = isNodata ? (zoom > 17 ? 'no data' : 'n/d') : val;

        ctx.fillStyle = isNodata ? 'black' : this.options.textColor;
        ctx.font = (zoom > 18 ? 'Bold 10pt' : '8pt') + ' Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = zoom > 17 ? 'top' : 'middle';

        ctx.fillText(text, x, y + (zoom > 17 ? 6 : 0));
    },
            
    _debugBounds: function (dataBounds, snapBounds, drawBounds, drawOrigin) {
        if (this._debugLayers) this._map.removeLayer(this._debugLayers);
        this._debugLayers = L.featureGroup().addTo(this._map);
        this._debugLayers.addLayer(L.rectangle(dataBounds, { color: 'green' }));
        this._debugLayers.addLayer(L.rectangle(snapBounds));
        this._debugLayers.addLayer(L.rectangle(drawBounds, { color: 'yellow', weight: 2 }));
        this._debugLayers.addLayer(L.marker(drawOrigin));
        console.log('dataBounds = ' + dataBounds.toBBoxString());
    }
});
