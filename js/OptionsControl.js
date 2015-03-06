L.OptionsControl = L.Class.extend({
    
    options: null,
    
    layers: [],
    
   	initialize: function (layer) {
        if (layer) {
            this.addLayer(layer);
        }
    },

    initGui: function () {
        var redraw, i, guiOpacity, colorKeys, obj, key,
            gui = new dat.GUI();

        guiOpacity = gui.add(this.options, 'opacity', 0, 1);
        guiOpacity.onChange(L.bind(function(value) {
            for (i = 0; i < this.layers.length; i++) {
                L.DomUtil.setOpacity(this.layers[i]._canvas, value);
            } 
        }, this));

        redraw = L.bind(function () {
            for (i = 0; i < this.layers.length; i++) {
                this.layers[i]._redraw();
            }
        }, this);

        // colorScale: dat.gui returns arrays as String (?), pass key as value
        colorKeys = Object.keys(L.colors);
        obj = {
            colorScale: null
        };
        for (key in L.colors) {
            if (L.colors[key] === this.options.colorScale) {
                obj.colorScale = key;
            };
        }
        gui.add(obj, 'colorScale', colorKeys).onFinishChange(L.bind(function (value) {
            this.options.colorScale = L.colors[value];
            redraw();
        }, this));

        gui.add(this.options, 'scaleMin').onFinishChange(redraw);
        gui.add(this.options, 'scaleMax').onFinishChange(redraw);
        gui.add(this.options, 'autoScale').onFinishChange(redraw);
    },

    addLayer: function (layer) {
        if (layer instanceof L.DemLayer) {
            this.layers.push(layer);
            this._setOptions(layer);
        }
    },

    removeLayer: function (layer) {
        var i = this.layers.indexOf(layer);
        if(i !== -1) {
            this.layers.splice(i, 1);
        }
    },

    _setOptions: function (layer) {
        if (this.options) {
            layer.options = this.options;
        } else {
            this.options = layer.options;
            this.initGui();
        }
    }
});