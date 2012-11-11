ack.module("ack.tools.externalSite", function (e) {
    var f = function () {
        var a = this;
        a.onload = null;
        var c = document.createElement("div"),
            b = document.createElement("iframe");
        c.appendChild(b);
        b.style.height = "100%";
        b.style.width = "100%";
        b.style.border = "none";
        b.style.overflow = "visible";
        b.onload = function () {
            if (a.onload) a.onload()
        };
        c.style.overflow = "auto";
        c.style.webkitOverflowScrolling = "touch";
        var d = !0;
        c.onscroll = function () {
            b.style.border = d ? "0px solid transparent" : "none";
            d = !d
        };
        a.src = function (c) {
            b.src = c;
            return a
        };
        a.resize = function (b, d) {
            c.style.height = b;
            c.style.width = d;
            return a
        };
        a.appendToParent = function (b) {
            b.appendChild(c);
            return a
        };
        return a
    }, g = function () {
        var a = this;
        a.onload = null;
        var c = document.createElement("iframe");
        c.style.border = "none";
        c.onload = function () {
            if (a.onload) a.onload()
        };
        a.src = function (b) {
            c.src = b;
            return a
        };
        a.resize = function (b, d) {
            c.style.height = b;
            c.style.width = d;
            return a
        };
        a.appendToParent = function (b) {
            b.appendChild(c);
            return a
        };
        return a
    };
    e.create = function () {
        return ack.core.device.isIOS() ? new f : new g
    }
});