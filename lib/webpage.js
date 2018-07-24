'use strict';

var _index = require('./index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// script for the generic page

const $ = require('jquery');


var embedded = window.parent !== window;
if (embedded) {
    $("body").addClass("embedded");
    $("doc").addClass("embedded");
    $("#form").hide();
}
$("#url").keypress(function (event) {
    if (event.keyCode == 13) {
        window.location.hash = $(this).val();
    }
});
$(window).on('hashchange', function () {
    update();
});
update();
var url;
function update() {
    if (window.location.hash) {
        $("#form").hide();
        url = decodeURIComponent(window.location.hash.substring(1));
        var segments = url.split("$");
        if (segments[0]) {
            function render(schema) {
                try {
                    _index2.default.doc("doc", schema, segments[1], segments[0]).then(function () {
                        maybeExpand(segments);
                    });
                } catch (e) {
                    error("Could not parse schema: " + e.message + "<pre>" + $('<pre/>').text(schema).html() + "</pre>");
                }
            }

            if (/\.ts$/.test(segments[0])) {
                // TODO
                // require.config( { baseUrl: "../typson" } );
                // require(["lib/typson-schema"], function(typson) {
                //     typson.definitions(segments[0]).done(render);
                // });
            } else {
                $.get(segments[0]).done(render).fail(function (xhr, status, err) {
                    error("Could not load " + segments[0].replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
                        return '&#' + i.charCodeAt(0) + ';';
                    }) + ": " + status + " " + err);
                });
            }
        }
        function receiveMessage(event) {
            console.log(">", event);
            if (event.data.id && event.data.id == "docson") {
                if (event.data.type) {
                    try {
                        _index2.default.doc("doc", event.data.definitions, event.data.type).done(function () {
                            maybeExpand(segments);
                        });
                    } catch (e) {
                        error("Could not parse schema: " + e.message + "<pre>" + $('<pre/>').text(event.data.definitions).html() + "</pre>");
                    }
                }
                if (event.data.action == "resize") {
                    $("#doc").get(0).resized();
                }
                if (event.data.font) {
                    console.log(event.data.font);
                    $("#doc").css("font-family", event.data.font);
                }
            }
        }
        window.addEventListener("message", receiveMessage, false);
        var host = window.opener || window.parent;
        host.postMessage({ id: "docson", action: "ready", url: url }, "*");
    } else {
        $("#doc").empty();
        $("#form").show();
    }
}

function maybeExpand(segments) {
    if (segments.indexOf("expand") > 0) {
        $("#doc").find(".expand-button").html(" - ").attr("title", "Collapse all");
        $("#doc").find(".signature-type-expandable").addClass("signature-type-expanded");
        $("#doc").find(".box-container").show();
        $("#doc").find(".expand-button").attr("expanded", true);
    }
}

function error(message) {
    $("#form").show();
    $("#doc").html($("<div/>").addClass("error").html(message));
}

var doc = $('#doc').get(0);
if (embedded) {
    doc.onresize = function (width, height) {
        window.parent.postMessage({ id: "docson", action: "resized", url: url, width: width, height: height }, "*");
    };
}