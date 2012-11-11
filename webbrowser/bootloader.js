var ack = ack || {};
ack.module = function (c, d) {
    "string" === typeof c && (c = c.split("."));
    for (var b = window, a = 0; a < c.length; a++) {
        var e = c[a];
        b[e] = b[e] || {};
        b = b[e]
    }
    d(b)
};
ack.namespaceLib = function (c) {
    ack.module("ack.lib", function (d) {
        d[c] = window[c];
        delete window[c]
    })
};
ack.module("ack.core.db", function (c) {
    var d = (new Date).getTime() + ":" + 1E9 * Math.random();
    c.MAX_LOCK_TIME = 5E3;
    c.MUTEX_BACKOFF_TIME = 10;
    var b = {
        get: function (e) {
            e = localStorage[e];
            return void 0 == e ? void 0 : e
        },
        exists: function (e) {
            return void 0 != localStorage[e]
        },
        set: function (e, a) {
            localStorage[e] = a
        },
        remove: function (e) {
            delete localStorage[e]
        },
        keys: function () {
            var e = [],
                a;
            for (a in localStorage) e.push(a);
            return e
        }
    }, a = {
        mutexes: {},
        create: function (e) {
            var a = d + "|" + (new Date).getTime();
            b.set(e, a);
            return a
        },
        remove: function (a) {
            b.remove(a)
        },
        get: function (a) {
            a = b.get(a);
            return void 0 === a ? void 0 : {
                owner: a.split("|")[0],
                time: parseInt(a.split("|")[1])
            }
        },
        isLocked: function (e) {
            if (!1 === b.exists(e)) return !1;
            e = a.get(e);
            return (new Date).getTime() - e.time < c.MAX_LOCK_TIME ? e.owner === d ? !1 : !0 : !1
        },
        same: function (a, b) {
            return ("object" === typeof a ? a.owner + "|" + a.time : a) === ("object" === typeof b ? b.owner + "|" + b.time : b)
        }
    };
    c.get = function (a) {
        a = b.get(a);
        return void 0 === a ? void 0 : JSON.parse(a)
    };
    c.set = function (a, c) {
        b.set(a, JSON.stringify(c))
    };
    c.remove = function (a) {
        b.remove(a)
    };
    c.exists = function (a) {
        return b.exists(a)
    };
    c.keys = function () {
        return b.keys()
    };
    c.startTransaction = function (b, f) {
        var d = b + "__MUTEX1__",
            h = b + "__MUTEX2__";
        if (a.isLocked(d) || a.isLocked(h)) setTimeout(function () {
            c.startTransaction(b, f)
        }, c.MUTEX_BACKOFF_TIME);
        else {
            var g = a.get(h),
                k = a.create(d);
            !1 === a.same(k, a.get(d)) || !1 === a.same(g, a.get(h)) ? setTimeout(function () {
                c.startTransaction(b, f)
            }, c.MUTEX_BACKOFF_TIME) : (g = a.create(h), !1 === a.same(k, a.get(d)) || !1 === a.same(g, a.get(h)) ? setTimeout(function () {
                c.startTransaction(b,
                f)
            }, c.MUTEX_BACKOFF_TIME) : (a.mutexes[b] = [k, g], f()))
        }
    };
    c.endTransaction = function (b) {
        var c = b + "__MUTEX1__",
            d = b + "__MUTEX2__";
        if (void 0 === a.mutexes[b]) throw "No transaction in progress for the key " + b;
        if (!1 === a.same(a.mutexes[b][0], a.get(c)) || !1 === a.same(a.mutexes[b][1], a.get(d))) throw "Mutex for " + b + " was changed by another process";
        a.remove(c);
        a.remove(d);
        delete a.mutexes[b]
    }
});
ack.module("ack.core.xdm", function (c) {
    c.State = {
        UNKNOWN: 0,
        ALIVE: 1,
        DEAD: 2
    };
    var d = function (b) {
        var a = this,
            e = c.State.UNKNOWN,
            f = {}, d = {}, h = {}, g = null,
            k = null,
            i = null,
            l = null,
            n = function (a) {
                if (a.source === b) for (var l = p(a.data), u = "null" === a.origin ? "*" : a.origin, a = 0; a < l.length; a++) {
                    var m = l[a],
                        n = m.name,
                        q = m.id,
                        r = m.params;
                    if (0 === m.type) {
                        if (f[n]) for (m = 0; m < f[n].length; m++) f[n][m](r)
                    } else if (1 === m.type) {
                        if (h[n]) h[n](r, function (a) {
                            b.postMessage(o(q, n, a, "object" === typeof a, 2), u)
                        })
                    } else 2 === m.type ? d[q] && (d[q](r), delete d[q]) : 3 === m.type ? "__alive__" === q && (b.postMessage(o("__alive__", "", "", !1, 4), u), e = c.State.ALIVE, clearTimeout(g), clearTimeout(k), i && (i(), i = null)) : 4 === m.type && "__alive__" === q && (e = c.State.ALIVE, clearTimeout(g), clearTimeout(k), i && (i(), i = null))
                }
            }, o = function (a, b, g, e, c) {
                var d = function (a) {
                    return "string" === typeof a ? escape(a) : null === a || void 0 === a ? "" : a
                };
                return ['<message id="' + d(a) + '" type="' + c + '">', "<name>" + d(b) + "</name>", "<params " + (e ? 'action="JSON.parse"' : "") + ">" + d(e ? JSON.stringify(g) : g) + "</params>", "</message>"].join("")
            },
            p = function (a) {
                for (var b = [], a = (new DOMParser).parseFromString(a, "text/xml").getElementsByTagName("message"), g = 0; g < a.length; g++) {
                    var e = a.item(g),
                        c = e.getElementsByTagName("params").item(0),
                        d = {};
                    d.id = unescape(e.getAttribute("id"));
                    d.type = parseInt(e.getAttribute("type"));
                    d.name = unescape(e.getElementsByTagName("name").item(0).textContent);
                    "JSON.parse" === c.getAttribute("action") ? (e = unescape(c.textContent), e = void 0 === e || "" === e ? null : e, d.params = JSON.parse(e)) : d.params = unescape(c.textContent);
                    b.push(d)
                }
                return b
            };
        a.destroy = function () {
            window.removeEventListener("message", n);
            clearTimeout(g);
            clearTimeout(k);
            b = null;
            e = c.State.DEAD;
            return a
        };
        a.emit = function (g, d, f) {
            if (e !== c.State.DEAD) {
                if (e === c.State.UNKNOWN) return setTimeout(function () {
                    a.emit(g, d, f)
                }, 25), a;
                f = void 0 === f ? !0 : f;
                b.postMessage(o(ack.core.util.generateUUID(), g, d, f, 0), "*");
                return a
            }
        };
        a.capture = function (b, g) {
            f[b] = void 0 === f[b] ? [] : f[b];
            f[b].push(g);
            return a
        };
        a.stopCapture = function (b, g) {
            f[b] = void 0 === f[b] ? [] : f[b];
            var e = !1;
            do for (var e = !1, c = 0; c < f[b].length; c++) if (f[b][c] === g) {
                f[b].splice(c, 1);
                e = !0;
                break
            }
            while (e);
            return a
        };
        a.request = function (g, f, h) {
            if (e !== c.State.DEAD) {
                if (e === c.State.UNKNOWN) return setTimeout(function () {
                    a.request(g, f, h)
                }, 25), a;
                var k = ack.core.util.generateUUID();
                d[k] = h;
                b.postMessage(o(k, g, f, "object" === typeof f, 1), "*");
                return a
            }
        };
        a.addResponder = function (b, g) {
            h[b] = g;
            return a
        };
        a.removeResponder = function (b) {
            delete h[b];
            return a
        };
        a.state = function () {
            return e
        };
        a.setAliveCallback = function (a) {
            i = a
        };
        a.setDeadCallback = function (a) {
            l = a
        };
        a.setDeadAndAliveCallback = function (a) {
            i = l = a
        };
        a.target = function () {
            return b
        };
        (function () {
            window.addEventListener("message", n, !1);
            g = setInterval(function () {
                b.postMessage(o("__alive__", "", "", !1, 3), "*")
            }, 25);
            k = setTimeout(function () {
                a.destroy();
                l && (l(), l = null)
            }, window.navigator.onLine ? 1E3 : 500)
        })();
        return a
    };
    c.create = function (b) {
        return new d(b)
    };
    c.createForUrl = function (b, a) {
        if (null === document.body) return setTimeout(function () {
            c.createForUrl(b, a)
        }, 10), null;
        var e = document.createElement("iframe");
        e.src = b;
        e.style.display = "none";
        document.body.appendChild(e);
        var d = c.create(e.contentWindow);
        setTimeout(function () {
            a(d)
        }, 0);
        return d
    }
});
ack.module("ack.core.device", function (c) {
    c.isIOS = function () {
        var c = navigator.userAgent.toLowerCase();
        return c.match(/(ipod|iphone|ipad)/) && -1 < c.indexOf("mobile")
    };
    c.isIBooks = function () {
        return c.isIOS() ? 0 === window.location.href.indexOf("x-ibooks-th") : !1
    };
    c.isSecure = function () {
        return -1 !== window.location.protocol.indexOf("https")
    };
    c.httpProtocol = function () {
        return c.isSecure() ? "https:" : "http:"
    };
    (function () {
        if (c.isIOS()) {
            var d = [],
                b = function (a) {
                    d.push({
                        node: a,
                        callback: setTimeout(function () {
                            if (void 0 === a.getAttribute("data-keepalive")) {
                                a.src =
                                    "data:image/x-ms-bmp;base64,Qk1KAAAAAAAAAEYAAAA4AAAAAQAAAP////8BACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/AAD/AAD/AAAAAAAA//////8%3D";
                                for (var b = 0; b < d.length; b++) if (d[b] && d[b].node === a) {
                                    d.splice(b, 1);
                                    break
                                }
                            }
                        }, 5E3)
                    })
                }, a = function (a) {
                    for (var b = 0; b < d.length; b++) if (d[b] && d[b].node === a) {
                        clearTimeout(d[b].callback);
                        d.splice(b, 1);
                        break
                    }
                };
            window.addEventListener("DOMNodeRemoved", function (a) {
                if (a.target.tagName && "img" === a.target.tagName.toLowerCase()) b(a.target);
                else if (a.target.getElementsByTagName) for (var c = a.target.getElementsByTagName("*"), d = 0; d < c.length; d++) "img" === c[d].tagName.toLowerCase() && b(a.target)
            }, !1);
            window.addEventListener("DOMNodeInserted", function (b) {
                if (b.target.tagName && "img" === b.target.tagName.toLowerCase()) a(b.target);
                else if (b.target.getElementsByTagName) for (var c = b.target.getElementsByTagName("*"), d = 0; d < c.length; d++) a(b.target)
            }, !1)
        }
    })()
});
ack.module("ack.core.ready", function (c) {
    var d = [],
        b = !1;
    document.addEventListener ? document.addEventListener("DOMContentLoaded", function () {
        document.removeEventListener("DOMContentLoaded", arguments.callee, !1);
        b = !0;
        for (var a = 0; a < d.length; a++) d[a]();
        d = []
    }, !1) : document.attachEvent && document.attachEvent("onreadystatechange", function () {
        if ("complete" === document.readyState) {
            document.detachEvent("onreadystatechange", arguments.callee);
            b = !0;
            for (var a = 0; a < d.length; a++) d[a]();
            d = []
        }
    });
    c.exec = function (a) {
        b ? a() : d.push(a)
    }
});
ack.module("ack.core.ajax", function (c) {
    c.timeout = 6E4;
    var d = function (b, a, d, f, j) {
        var h = /^(?:about|app|app\-storage|.+\-extension|file|res|widget|ibooks|ibook|x-ibooks-th):$/.test((/^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/.exec((-1 === b.indexOf("://") ? window.location.href : b).toLowerCase()) || [])[1]),
            g = new XMLHttpRequest,
            k = null,
            i = null;
        g.onreadystatechange = function () {
            4 === g.readyState && (clearTimeout(k), 200 <= g.status && 299 >= g.status ? d(g.responseText, g.status, g) : h && 0 === g.status && g.responseText.length ? d(g.responseText, 200, g) : i = h && 0 === g.status ? setTimeout(function () {
                f(g.responseText, g.status, g)
            }, 100) : setTimeout(function () {
                f(g.responseText, g.status, g)
            }, 0))
        };
        k = setTimeout(function () {
            g.abort()
        }, void 0 === j ? c.timeout : j);
        void 0 !== a ? (g.open("POST", b, !0), g.setRequestHeader("Content-type", "application/json")) : (g.open("GET", b, !0), a = null);
        try {
            g.send(a)
        } catch (l) {
            if (101 === l.code) clearTimeout(i), f("", - 1 * l.code, g);
            else if (1012 === l.code) clearTimeout(i), f("", 404, g);
            else throw l;
        }
        return g
    };
    c.get = function (b, a, c, f) {
        return d(b,
        void 0, a, c, f)
    };
    c.post = function (b, a, c, f, j) {
        return d(b, a, c, f, j)
    };
    c.getJSON = function (b, a, d, f) {
        var j = function (b, g, c) {
            b = null;
            try {
                b = JSON.parse(c.responseText)
            } catch (f) {}
            200 <= c.status && 299 >= c.status ? a(b, g, c) : d(b, g, c)
        };
        return c.get(b, j, j, f)
    };
    c.postJSON = function (b, a, d, f, j) {
        var h = function (a, b, c) {
            a = null;
            try {
                a = JSON.parse(c.responseText)
            } catch (h) {}
            200 <= c.status && 299 >= c.status ? d(a, b, c) : f(a, b, c)
        };
        return c.post(b, JSON.stringify(a), h, h, j)
    };
    c.JSONP = function (b, a, d, f, j, h) {
        h = void 0 === h ? 6E4 : h; - 1 === b.indexOf("?") && (b +=
            "?");
        for (var g in a) b += encodeURI(g) + "=" + encodeURI(a[g]) + "&";
        var k = ack.core.util.generateUUID().replace(/-/g, ""),
            b = b + (encodeURI(d) + "=ack.core.ajax.jsonp_res_" + k),
            i = document.createElement("script");
        i.type = "text/javascript";
        i.onerror = function () {
            j()
        };
        timeoutCallback = setTimeout(function () {
            j();
            delete c["jsonp_res_" + k];
            document.head.removeChild(i)
        }, h);
        c["jsonp_res_" + k] = function (a) {
            clearTimeout(timeoutCallback);
            delete c["jsonp_res_" + k];
            document.head.removeChild(i);
            f(a)
        };
        i.src = b;
        document.head.appendChild(i);
        return i
    }
});
ack.module("ack.core.util", function (c) {
    c.generateUUID = function () {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var b = 16 * Math.random() | 0;
            return ("x" == c ? b : b & 3 | 8).toString(16)
        })
    };
    c.getUrlArg = function (c, b) {
        var b = b || window.location.href,
            c = c.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]"),
            a = RegExp("[\\?&]" + c + "=([^&#]*)").exec(b);
        return null == a ? void 0 : a[1]
    };
    c.objectKeys = function (c) {
        var b = [],
            a;
        for (a in c) b.push(a);
        return b
    };
    c.objectLength = function (d) {
        return c.objectKeys(d).length
    };
    c.objectFirst = function (c) {
        for (var b in c) return {
            key: b,
            value: c[b]
        }
    };
    c.objectIterator = function (c, b) {
        for (var a in c) b(a, c[a])
    };
    c.arrayUniquePush = function (c, b, a) {
        for (var a = a || function (a, b) {
                return a === b
            }, e = 0; e < c.length; e++) if (a(c[e], b)) return;
        c.push(b)
    };
    c.BatchCallbackIndicator = function (c) {
        var b = 0;
        this.expectsCallback = function () {
            b++
        };
        this.callbackComplete = function () {
            b--;
            0 >= b && c()
        };
        return this
    }
});
ack.module("ack.client", function (c) {
    c.version = "1.12";
    var d = setInterval(function () {
        document.body && (document.body.style.display = "none", clearTimeout(d))
    }, 10),
        b = [],
        a = [],
        e = {
            hasLoaded: !1,
            callbacks: [],
            complete: function () {
                e.hasLoaded = !0;
                for (var c = 0; c < e.callbacks.length; c++) e.callbacks[c]();
                e.callbacks = [];
                clearTimeout(d);
                document.body.style.display = "block";
                window.widget && (window.widget.pauseAudioVisual = function () {
                    for (var a = 0; a < b.length; a++) b[a]()
                }, window.widget.didEnterWidgetMode = function () {
                    for (var b = 0; b < a.length; b++) a[b]()
                }, window.widget.notifyContentIsReady && window.widget.notifyContentIsReady())
            }
        };
    c.load = function (a, b) {
        ack.loader.start(a, function () {
            ack.core.ready.exec(function () {
                e.complete();
                b()
            })
        })
    };
    c.hasLoaded = function (a) {
        e.hasLoaded ? a() : e.callbacks.push(a)
    };
    c.pauseAudioVisual = function (a) {
        b.push(a)
    };
    c.didEnterWidgetMode = function (b) {
        a.push(b)
    }
});
ack.module("ack.widgetstore", function (c) {
    var d = window.__settings__ || {}, b = null,
        a = null,
        e = {
            save: function (a, b) {
                return ack.core.db.set("ack.widgetstore:" + a, b)
            },
            load: function (a) {
                return ack.core.db.get("ack.widgetstore:" + a)
            },
            clear: function (a) {
                return ack.core.db.remove("ack.widgetstore:" + a)
            },
            stores: function () {
                for (var a = ack.core.db.keys(), b = [], c = 0; c < a.length; c++) 0 === a[c].indexOf("ack.widgetstore:") && b.push(a[c].replace("ack.widgetstore:", ""));
                return b
            }
        }, f = {
            save: function (a, b, c, d) {
                a.request("save", {
                    widgetId: b,
                    store: c
                }, d)
            },
            load: function (a, b, c) {
                a.request("load", {
                    widgetId: b
                }, c)
            },
            clear: function (a, b, c) {
                a.request("delete", {
                    widgetId: b
                }, c)
            },
            stores: function (a, b) {
                a.request("widgetIds", null, b)
            }
        }, j = {
            save: function (a, b, c) {
                a.request("save", {
                    store: b
                }, c)
            },
            load: function (a, b) {
                a.request("load", {}, b)
            },
            clear: function (a, b) {
                a.request("delete", {}, b)
            }
        }, h = function (c, k) {
            if (null === b || b.state() === ack.core.xdm.State.UNKNOWN) setTimeout(function () {
                h(c, k)
            }, 10);
            else {
                var i = function (c, g) {
                    c === d.id && a ? g() : ack.core.xdm.createForUrl("https://" + c + "-widgetstore.bookry.com/widgets/store/", function (h) {
                        h.setDeadAndAliveCallback(function () {
                            var k = e.load(c) || {};
                            c === d.id && (a && (h.destroy(), h = a), a = h);
                            h.state() === ack.core.xdm.State.DEAD ? f.load(b, c, function (a) {
                                var a = a || {}, i;
                                for (i in a) k[i] = a[i];
                                f.save(b, c, k, function () {
                                    e.clear(c);
                                    if (c !== d.id) {
                                        var a = h.target();
                                        h.destroy();
                                        for (var b = document.getElementsByTagName("iframe"), f = 0; f < b.length; f++) if (b[f].contentWindow === a) {
                                            b[f].parentElement.removeChild(b[f]);
                                            break
                                        }
                                    }
                                    g()
                                })
                            }) : h.state() === ack.core.xdm.State.ALIVE && f.load(b, c, function (a) {
                                a = a || {};
                                j.load(h, function (i) {
                                    var i = i || {}, l;
                                    for (l in a) k[l] = a[l];
                                    for (l in i) k[l] = i[l];
                                    j.save(h, k, function () {
                                        e.clear(c);
                                        f.clear(b, c, function () {
                                            if (c !== d.id) {
                                                var a = h.target();
                                                h.destroy();
                                                for (var b = document.getElementsByTagName("iframe"), e = 0; e < b.length; e++) if (b[e].contentWindow === a) {
                                                    b[e].parentElement.removeChild(b[e]);
                                                    break
                                                }
                                            }
                                            g()
                                        })
                                    })
                                })
                            })
                        })
                    })
                };
                if (void 0 === k) {
                    var l = [];
                    f.stores(b, function (a) {
                        for (var b = a.concat(e.stores()), a = 0; a < b.length; a++) ack.core.util.arrayUniquePush(l, b[a]);
                        if (0 === l.length) c();
                        else {
                            b = new ack.core.util.BatchCallbackIndicator(c);
                            for (a = 0; a < l.length; a++) b.expectsCallback(), i(l[a], b.callbackComplete)
                        }
                    })
                } else i(k, c)
            }
        }, b = ack.core.xdm.createForUrl("https://widgetstore.bookry.com/widgets/store/", function (a) {
            b = a;
            a.setDeadAndAliveCallback(function () {
                h(function () {})
            })
        });
    h(function () {}, d.id);
    c.load = function (c) {
        var h = ack.core.xdm.State;
        a && a.state() === h.ALIVE ? j.load(a, function (a) {
            c(a || {})
        }) : b && b.state() === h.ALIVE ? f.load(b, d.id, function (a) {
            c(a || {})
        }) : c(e.load(d.id) || {})
    };
    c.save = function (c, h) {
        if ("object" !== typeof c) throw "Only object types are supported when saving to the widgetstore";
        var i = ack.core.xdm.State;
        a && a.state() === i.ALIVE ? j.save(a, c, h) : b && b.state() === i.ALIVE ? f.save(b, d.id, c, h) : (e.save(d.id, c), h())
    };
    c.clear = function (c) {
        var h = ack.core.xdm.State;
        a && a.state() === h.ALIVE ? j.clear(a, c) : b && xdm.shared.state() === h.ALIVE ? f.clear(b, d.id, c) : (e.clear(d.id), c())
    }
});
ack.module("ack.loader", function (c) {
    var d = function (c, d, e) {
        var f = c.indexOf(".js") === c.length - 3,
            j = c.indexOf(".css") === c.length - 4;
        if (d) f ? b(d, e) : j && a(d, e);
        else {
            var d = /^(?:about|app|app\-storage|.+\-extension|file|res|widget|ibooks|ibook|x-ibooks-th):$/.test((/^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/.exec((-1 === c.indexOf("://") ? window.location.href : c).toLowerCase()) || [])[1]),
                n = -1 < navigator.userAgent.toLowerCase().indexOf("chrome");
            !d && ack.core.util.getUrlArg("dev") && (c = -1 === c.indexOf("?") ? c + ("?r=" + ack.core.util.generateUUID()) : c + ("&r=" + ack.core.util.generateUUID()));
            var o = null,
                p = function () {
                    clearTimeout(o);
                    e && (e(), e = null)
                }, s = function () {
                    var a = document.createElement("script");
                    a.type = "text/javascript";
                    a.onload = p;
                    a.onerror = p;
                    a.src = c;
                    document.head.appendChild(a);
                    o = setTimeout(p, 5E3)
                }, t = function () {
                    var a = document.createElement("link");
                    a.rel = "stylesheet";
                    a.type = "text/css";
                    a.onload = p;
                    a.onerror = p;
                    a.href = c;
                    document.head.appendChild(a);
                    o = setTimeout(p, 5E3)
                };
            f ? n && d ? s() : ack.core.ajax.get(c, function (a) {
                b(a,
                e)
            }, function (a, b) {
                299 < b ? e() : s()
            }) : j && (n && d ? t() : ack.core.ajax.get(c, function (b) {
                a(b, e)
            }, function (a, b) {
                299 < b ? e() : t()
            }))
        }
    }, b = function (a, b) {
        window.execScript ? window.execScript(src) : window.eval.call(window, a);
        setTimeout(b, 0)
    }, a = function (a, b) {
        var c = document.createElement("style");
        c.innerHTML = a;
        document.head.appendChild(c);
        setTimeout(b, 0)
    }, e = function (a, b) {
        ack.updates.state() === ack.core.xdm.State.UNKNOWN ? setTimeout(function () {
            e(a, b)
        }, 10) : ack.updates.state() === ack.core.xdm.State.ALIVE ? j(a, b) : ack.updates.state() === ack.core.xdm.State.DEAD && f(a, b)
    }, f = function (a, b) {
        (function (c) {
            if (c >= a.length) b();
            else {
                var e = arguments.callee;
                0 == a[c].indexOf("__") ? e(c + 1) : d(a[c], void 0, function () {
                    e(c + 1)
                })
            }
        })(0)
    }, j = function (a, b) {
        ack.updates.componentsWithUpdates(a, function (c) {
            var e = {}, f = function () {
                (function (c) {
                    if (c >= a.length) b();
                    else {
                        var f = arguments.callee;
                        void 0 === e[a[c]] && 0 == a[c].indexOf("__") ? f(c + 1) : d(a[c], e[a[c]], function () {
                            f(c + 1)
                        })
                    }
                })(0)
            };
            if (c.length) for (var j = new ack.core.util.BatchCallbackIndicator(f), f = 0; f < c.length; f++)(function (a) {
                j.expectsCallback();
                ack.updates.updateComponent(a, function (b) {
                    e[a] = b;
                    j.callbackComplete()
                })
            })(c[f]);
            else f()
        })
    };
    c.start = function (a, b) {
        for (var c = ["AppleClasses/AppleWidget.js", "__settingsupdate__.js", "__coreupdates__.js", "lang.js", "ui.js"], d = 0; d < c.length; d++) ack.core.util.arrayUniquePush(a, c[d]);
        e(a, b)
    }
});
ack.module("ack.widgetstore.synchronous", function (c) {
    var d = void 0,
        b = 0;
    c.init = function (a, c) {
        c = c || 1E3;
        clearTimeout(null);
        ack.widgetstore.load(function (f) {
            d = f;
            setInterval(function () {
                ack.widgetstore.load(function (a) {
                    0 === b && (d = a)
                })
            }, c);
            a()
        })
    };
    c.load = function () {
        return d
    };
    c.save = function (a) {
        d = a;
        b += 1;
        ack.widgetstore.save(a, function () {
            b -= 1
        })
    };
    c.clear = function (a) {
        0 === b ? ack.widgetstore.clear(function () {
            d = void 0;
            a()
        }) : setTimeout(function () {
            c.clear(a)
        }, 100)
    }
});
ack.module("ack.updates", function (c) {
    var d = (new Date).getTime(),
        b = window.__settings__ || {}, a = ack.core.xdm.createForUrl("https://" + b.id + "-widget.bookry.com/widget/" + b.type + "/" + b.id + "/?device=ibooks", function (b) {
            a = b;
            a.capture("updates.available", function () {
                ack.client.hasLoaded(function () {
                    window.widget && window.widget.notifyContentIsReady && window.widget.notifyContentIsReady();
                    5E3 > (new Date).getTime() - d ? setTimeout(function () {
                        window.location.reload();
                        setInterval(function () {
                            window.location.reload()
                        }, 500)
                    },
                    500) : ack.ui && ack.ui.dialog && ack.ui.dialog.confirm ? ack.ui.dialog.confirm(ack.lang("Updates available"), ack.lang("Updates for this widget have been found. Would you like to apply them now?"), function () {
                        window.location.reload()
                    }) : confirm(ack.lang("Updates for this widget have been found. Would you like to apply them now?")) && window.location.reload()
                })
            })
        });
    c.componentsWithUpdates = function (b, d) {
        null === a ? setTimeout(function () {
            c.componentsWithUpdates(b, d)
        }) : a.request("updates.available", b, function (a) {
            d(a)
        })
    };
    c.updateComponent = function (b, d) {
        null === a ? setTimeout(function () {
            c.componentsWithUpdates(b, d)
        }) : a.request("updates.get", b, function (a) {
            d(a)
        })
    };
    c.state = function () {
        return null === a ? ack.core.xdm.State.UNKNOWN : a.state()
    }
});
ack.module("ack", function (c) {
    var d = {};
    c.lang = function (b) {
        if ("string" === typeof b) return d[b] ? d[b] : b;
        if ("object" === typeof b) for (var a in b) d[a] = b[a]
    };
    ack.client.hasLoaded(function () {
        for (var b = document.getElementsByClassName("ack-lang"), a = 0; a < b.length; a++) {
            var d = b[a];
            d.textContent && d.textContent.length && (d.textContent = c.lang(d.textContent));
            if (d.getAttribute("data-ack-lang-attributes")) for (var f = d.getAttribute("data-ack-lang-attributes").split(","), j = 0; j < f.length; j++) {
                var h = f[j];
                d.setAttribute(h, c.lang(d.getAttribute(h)))
            }
        }
    })
});
ack.module("ack.comms", function (c) {
    var d = [],
        b = [],
        a = null,
        e = "https://widgetcomms.bookry.com/widgets/comms/?widgetid=" + __settings__.id + "&bookid=" + __settings__.parentId + "&protocol=" + encodeURIComponent(window.location.protocol),
        f = ack.core.xdm.createForUrl(e, function (c) {
            f = c;
            f.capture("auth.loggedout", function () {
                ack.widgetstore.clear(function () {});
                a = null;
                for (var b = 0; b < d.length; b++) d[b]()
            });
            f.capture("auth.loggedin", function (c) {
                a = c;
                for (c = 0; c < b.length; c++) b[c](a)
            });
            f.request("auth.details", null, function (b) {
                a = b ? b : null
            })
        });
    c.reportAnalytic = function (a, b, c) {
        f.request("analytics.report", {
            type: a,
            data: b
        }, function () {
            c && c()
        })
    };
    c.request = function (a, b, c) {
        f.request("post", {
            method: a,
            params: b
        }, function (a) {
            c && c(a.response, a.status)
        })
    };
    c.authDetails = function () {
        return a
    };
    c.authLogin = function (a, b, d, e) {
        f.request("auth.login", {
            username: a,
            password: b
        }, function (a, b) {
            200 <= b && 299 >= b ? setTimeout(function () {
                d(c.authDetails())
            }, 10) : e(a)
        })
    };
    c.authLogout = function (a) {
        f.request("auth.logout", null, function () {
            a()
        })
    };
    c.authRegister = function (a,
    b, d, e, i) {
        f.request("auth.register", {
            username: a,
            password: d,
            email: b
        }, function (a, b) {
            200 <= b && 299 >= b ? setTimeout(function () {
                e(c.authDetails())
            }, 10) : i(a)
        })
    };
    c.onLoggedOut = function (a) {
        d.push(a)
    };
    c.onLoggedIn = function (a) {
        b.push(a)
    }
});