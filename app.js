// function getPageOffsets(){
//     var elements = document.querySelectorAll(".page");
//     var offsets = [];
//     for (var i = 0; i < elements.length; i++){
//         offsets.push(elements[i].offsetTop);
//     }
//     return offsets;
// }
//
// function getCurrentPage(){
//     var pageOffsets = getPageOffsets();
//     var curOffset = document.querySelector(".content").scrollTop;
//
//     var i;
//     for (i = 0; i < pageOffsets.length - 1; i++){
//         if (curOffset < 0.5*(pageOffsets[i] + pageOffsets[i+1])){
//             return i;
//         }
//     }
//     return i;
// }

// For page navigating in the future
// document.addEventListener("DOMContentLoaded", function(event) { 
//     document.querySelector(".content").onscroll = function(){
//         console.log("Page: " + getCurrentPage());
//     };
// });




/*
 * Mithril
 */

var home = {
    controller: function(){
        /*
         * Prettify composers display according to the following rules:
         */
        var _formatComposers = function(pieces){
            seenComposers = {};
            var lastComposer = null;
            for (var i = 0; i < pieces.length; i++){
                var current = pieces[i];
                var composer = current.composer.name;

                // If composer doesnt exist, ignore
                if (!composer) {}
                // If composer was last composer, don't show name or dates
                else if (composer === lastComposer){
                    current.composer.name = "";
                    current.composer.dates = "";
                }
                // If composer has been seen before, don't show dates
                else if (seenComposers[composer]){
                    current.composer.dates = "";
                }
                // Add to seen composers
                seenComposers[composer] = true;
                lastComposer = composer;
            }
            return pieces;
        };
        return {
            pieces: m.request({method: "GET", url: "recital.json"}).then(_formatComposers),

            /*
             * Converts hello *world*! -> hello <i>world</i>! in mithril
             * template
             *
             * Adds link to score if page number is specified
             */
            _format: function(s, page){
                /*
                 * Italicize
                 */
                var re = /\*/g;
                var result = [];
                var indexes = [];
                while (re.exec(s)){
                    indexes.push(re.lastIndex);
                }

                var prev_i = 0;
                var i;
                for (i = 0; i < indexes.length - 1; i+=2){

                    // First add non-italicized text (-1 to not include *)
                    result.push(s.substr(prev_i, indexes[i] - prev_i - 1));

                    // Add italicized text (-1 to not include *)
                    result.push(m("i", s.substr(indexes[i], indexes[i+1]-indexes[i] - 1)));

                    prev_i = indexes[i+1];
                }
                result.push(s.substr(prev_i));

                /*
                 * Add page
                 */
                if (typeof page !== "undefined"){
                    result.push(m("a.score[href='#page" + page + "']",{class:"arrow", onclick: function(){m.route("/score");}}, "\u2192"));
                }

                return result;
            },

            /*
             * Convert piece object to mithril template
             */
            _mithrilize_mvts: function(mvts){
                var self = this;
                return mvts.map(function(mvt){
                    return m("div", self._format(mvt.title, mvt.page));
                });
            },

            _mithrilize: function(piece){
                return m("div.block-group.piece-div", [
                    m("div.piece.block.hanging", [
                        this._format(piece.title, piece.page),
                        m("div.mvts", this._mithrilize_mvts(piece.mvts))
                    ]),
                    m("div.composer.block", [
                        m("div", piece.composer.name),
                        m("div", piece.composer.dates)
                    ]),
                ]);
            }
        };
    },

    view: function(ctrl){
        return [
            m("header.bar.bar-nav",[
                m("h1.title", "Recital Pal"),
                m("button.btn.btn-link.btn-nav.pull-right[data-transition='slide-out']", {
                    onclick: function(){m.route("/score");}
                },[
                    "Score ",
                    m("span.icon.icon-right-nav")
                ])
            ]),

            m("div.content[id='main']",
                /* For each piece */
                ctrl.pieces().map(function(item){
                    return ctrl._mithrilize(item);
                })
             )
        ];
    }
};

var Score = {};
Score.vm = {
    pieces: m.request({method: "GET", url: "recital.json"}),
    hello: m.prop("John"),
    scoreImages: m.prop([]),

    _imageExists: function(src){
        var img = new Image();
        var deferred = m.deferred();
        img.onload = function(){
            deferred.resolve(src);
        };
        img.onerror = function(){
            deferred.reject();
        };
        img.src = src;
        return deferred.promise;
    },

    _generateImages: function(i, arr, cb){
        var src = "/scores/score-" + i + ".png";

        var self = this;
        self._imageExists(src).then(function(result){
            var mdiv = m("div.page[id='page" + i + "']",
                    m("img[src='" + src + "']")
                    );
            self._generateImages(i+1, arr.concat([mdiv]), cb);
        })
        .then(null, function(error){
            console.log("Done");
            Score.vm.scoreImages(arr);

            // Callback
            cb();
        });
    },

    initImages: function(){
        m.startComputation();
        this._generateImages(0, [], function(){
            m.endComputation();
        });
    }
};
Score.controller = function(){
};
Score.view = function(ctrl){
    return [
        m("header.bar.bar-nav",[
            m("h1.title", "Recital Pal"),
            m("button.btn.btn-link.btn-nav.pull-left[data-transition='slide-in']", {
                onclick: function(){m.route("/");}
            },[
                m("span.icon.icon-left-nav"),
                " Program"
            ])
        ]),

        m("div.content", Score.vm.scoreImages())
    ];
};

Score.vm.initImages();


m.route(document.body, "/", {
    "/": home,
    "/score": Score,
});


window.oncontextmenu = function(event) {
     event.preventDefault();
     event.stopPropagation();
     return false;
};
