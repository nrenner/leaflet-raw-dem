L.Util.get = function(url, cb) {
    var xhr = new XMLHttpRequest();

    xhr.open('GET', url, true);
    xhr.onload = function() {
        if ((xhr.status === 200 || xhr.status === 0) && xhr.responseText) {
            cb(null, xhr.responseText);
        } else {
            cb(L.Util._getError(xhr, url));
        }
    };
    xhr.onerror = function() {
        cb(L.Util._getError(xhr, url));
    };
    try {
        xhr.send();
    } catch(e) {
        cb(e);
    }
};

L.Util._getError = function(xhr, url) {
    var msg = 'Error getting "' + url + '"';
    if (xhr.responseText) {
      msg = xhr.responseText;
    } else if (xhr.status || xhr.statusText) {
      msg = xhr.status + ': ' + xhr.statusText;
    }
    return new Error(msg);
};