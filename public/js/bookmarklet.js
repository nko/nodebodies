(function() {
    var loadedCount = 0;
    var scripts  = arguments[0] || [];
    var head = window.document.getElementsByTagName('head')[0];
    if(window.CITATIONS) return;
    window.CITATIONS = true;

    var getScript=function(url,success){
        var script= window.document.createElement('script');
        var done  = false;
        
        script.src=url;
        script.text='jQuery.noConflict( true );';
        script.onload=script.onreadystatechange = function(){
            if ( !done && (!this.readyState ||
                 this.readyState==='loaded' || 
                 this.readyState==='complete') )
            {
                done=true;
                success();
            }
        };
        head.appendChild(script);
    };

    function preloadComplete() {
        if (window.bookmarkletPreloaderDone) {
            bookmarkletPreloaderDone('%_CURRENT_URL_%');
        }
 
        window.bookmarkletSourceUrl = '%_CURRENT_URL_%';
    }

    function handleLoad() {
        loadedCount++;
        if (loadedCount === scripts.length) {
            preloadComplete();
        }
    }
    
    var existingScripts = document.getElementsByTagName('script');
    
    while(existingScripts.length)
    {
       existingScripts[0].parentNode.removeChild(existingScripts[0]); 
    }
    
    for (var i =0; i<scripts.length; i++) {
        getScript(scripts[i], handleLoad);
    }
})(['%_SCRIPTS_%']);
