(function($){
    var exports = window,
        AH = 'annoHash',
        LUT = {}; //XXX for testing

    exports.hash_node = function hash_node(x) {
        return $.data(x, AH) || parseInt($(x).html().substr(0,100).replace(/\W/g,''), 36);
    }

    function matches_path(pathstr) {
        var res;
        res = $(pathstr).filter(function(){ return $.data(this, AH) == n; });
        if (res[0]) {
            return res[0];
        }
        return null;
    }

    exports.get_node = function get_node(n, pathstr) {
        var res = LUT[n],
            path, working;
        if (!pathstr || !res || !res.push) {
            return res;
        } else {
            if($(pathstr).data(AH) == n) {
                return $(pathstr)[0];
            }
            path = pathstr.split('>');
            working = pathstr
            while(path.length > 0) {
                res = matches_path(working);
                if (res[0]) { return res[0]; }
                res = matches_path(working.substr(0, working.indexOf(/:nth\(\d+\)$/)));
                if (res[0]) { return res[0]; }
                path.pop();
                working = path.join('>');
            }
            return $(pathstr)[0] || $LUT[n][0]; //XXX not sure about this
        }
    }

    exports.path_node = function path_node(x) {
        var path = [];
        $(x).parentsUntil('body').andSelf().each(function(i, el){
            var str = el.nodeName.toLowerCase(),
                id = el.id || '',
                cls = (el.className || '').replace(/\s+/g,'.'),
                nth = '';

            str += id ? id = '#' + id : '';
            str += cls ? cls = '.' + cls : '';

            nth = $(el).prevAll(str).length;
            if (nth > 0 ) { str += ':nth('+ nth +')'; }
            path.unshift(str);
        });
        //the .andSelf() puts the self on the wrong end
        path.push(path.shift());
        return path.join('>');
    }

    $(function(){
        $('*').each(function(i, el) { //XXX problematic on large docs?
            var hash = hash_node(el);
            if (LUT[hash]) {
                if (!LUT[hash].push) { LUT[hash] = [LUT[hash]]; }
                LUT[hash].push(el);
            } else {
                LUT[hash] = el;
            }
            $.data(el, AH, hash_node(el));
        });
        window.$ = $; //XXX for testing
    });

})(jQuery.noConflict());
