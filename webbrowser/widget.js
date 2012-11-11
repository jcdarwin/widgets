ack.module("ack.widget", function (d) {
    d.init = function () {
        ack.ui.loading.show("iframefirstload");
        var a = ack.tools.externalSite.create();
        a.src(__settings__.start);
        a.onload = function () {
            ack.ui.loading.hide("iframefirstload");
            document.body.style.webkitTransform = "rotate(0deg)";
            setTimeout(function () {
                document.body.style.webkitTransform = "none"
            }, 10);
            a.onload = function () {}
        };
        a.appendToParent(document.getElementById("ack-widget"));
        if (!1 === window.navigator.onLine) {
            var c = function () {
                a.src(__settings__.start);
                window.removeEventListener("online",
                c)
            };
            window.addEventListener("online", c)
        }
        window.onresize = function () {
            a.resize(window.innerHeight - ack.ui.toolbarHeightPx + "px", "100%")
        };
        window.onresize();
        var b = document.createElement("img");
        b.src = "toolbar-button.png";
        b.onclick = function () {
            a.src(__settings__.start)
        };
        ack.ui.toolbar.addToolbarItem(b)
    }
});