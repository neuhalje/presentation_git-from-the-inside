/*!
 * git-from-the-inside  0.0.1
 * https://github.com/neuhalje/git-from-the-inside
 * CC-BY-SA-4.0
 *
 * Copyright (C) 2020 Jens Neuhalfen, https://neuhalfen.name/
*/


function GraphvizAnimation(targetElementSelector, arg) {

    // console.log(`GraphvizAnimation(${targetElementSelector},${arg})`);

    const colors = d3.schemeTableau10;
    const that =  {
        targetElementSelector : targetElementSelector,
        continueLooping : true,
        loopCount : 0,
        scale : 0, // factor for scaling. Read from the target element@scale
        dotIndex  : 0,
        slide  : null,
        d3selection  : null,
        graphviz  : null,
        dots : [],
        attributer : function (datum, index, nodes) {
                      var selection = d3.select(this);

                      if (datum.tag === "svg") {
                          var parent = nodes[index].parentNode;
                          var width = parent.offsetWidth;
                          var height = parent.offsetHeight;

                        // FIXME: magic 100: make sure we are  not cut off on the left side
                          var x = 100;
                          var y = 0

                          selection
                              .attr("width", width + "px")
                              .attr("height", height + "px")
                          .attr("viewBox", -x + " " + -y + " " + (width / that.scale) + " " + (height / that.scale));

                          datum.attributes.width = width + "px";
                          datum.attributes.height = height + "px";
                          datum.attributes.viewBox = -x + " " + -y + " " + (width / that.scale) + " " + (height / that.scale);
                      }
        },

        render: function() {
                if (that.d3selection && that.continueLooping) {
                    var dotLines = that.dots[that.dotIndex];
                    // console.log(`render for dotIndex == ${that.dotIndex} and dot == "${dotLines}."`);
                    that.graphviz
                    .fit(true)
                        .renderDot(dotLines)
                        .on("end", function () {
                            that.dotIndex = (that.dotIndex + 1) % that.dots.length;
                            if (that.dotIndex === 0) {
                              that.loopCount++;
                            }

                            if(that.continueLooping) {
                                that.render();
                            };
                        });
                }
            },

        transitionFactory : function() {
            //var isLast = that.dotIndex == that.dots.length - 1;
            var delay = 0;

            var isLast = (that.dotIndex === 0);
            if (isLast) {
                delay = (that.loopCount > 0) ? 6000 : 0;
            } else {
              delay = 1000;
            }
            console.log(`DELAY:  dotIndex=${that.dotIndex}, isLast=${isLast}, delay=${delay}`);

            return d3.transition("main")
                .ease(d3.easeLinear)
                .delay(delay)
                .duration(500);
        },

        onEnter : function(slide) {
                var target = document.querySelectorAll(that.targetElementSelector)[0];
                var w = target.offsetWidth;
                var h = target.offsetHeight;

                // console.log(`Starting the renderer for ${slide.id} into element ${that.targetElementSelector}. w=${w},h=${h}`);
                that.slide = slide;

                that.dotIndex = 0;
                that.continueLooping = true;
                that.d3selection = d3.select(that.targetElementSelector);

                that.scale = target.getAttribute("scale") || 1;

                that.graphviz = that.d3selection.graphviz();
                that.graphviz
                    .logEvents(false)
                    .transition(that.transitionFactory)
                    .width(w)
                    .height(h)
                    .fit(true)
                    .tweenShapes(false)
                    .on("initEnd", that.render)
                    .attributer(that.attributer);
            },
        onLeave :  function() {
           that.continueLooping = false;
           if (that.slide) {
               console.log(`Interrupting animation for slide ${that.slide.id}`);
               that.d3selection.selectAll("*").interrupt();
           }
           that.slide = null;
           that.d3selection = null;
           that.graphviz = null;
        },
    };

    if (arg) {
      var parentOfSteps = document.getElementById(arg);
      if (parentOfSteps) {
        for (let animStep of parentOfSteps.querySelectorAll('step')) {
          that.dots.push(animStep.textContent);
        }
      }
    }
    return that;
}

// -----------------------------------------------------

 function generate_d3graphviz(slide) {
   console.log(`Changing to slide ${slide.id}`);

   slide.querySelectorAll('graphviz').forEach(
        function(element) {
          console.log(`Rendering ${element}`);

          var t = d3.transition()
              .duration(750)
              .ease(d3.easeLinear);

          var graphviz = element.textContent;
          var targetId = element.getAttribute("target");
          var target = document.getElementById(targetId);
          // console.log(`Rendering ${graphviz} into ${targetId} / ${target}`);
          var w = target.offsetWidth;
          var h = target.offsetHeight;


          d3.select(`#${targetId}`).graphviz()
            .transition(t)
            .width(w)
            .height(h)
            .fit(true)
            .renderDot(graphviz)
            .on("end", function () {
                      });
        })
    }

var d3graphviz = window.d3graphviz || {
  slideCallbacks  : [],
  activeCallback : null,
  registerSlideCallbacks :  function (document) {
        const that = window.d3graphviz;

        document.querySelectorAll('section').forEach(
          function(section) {
            section.querySelectorAll('callback').forEach(
                function(callbackElem) {
                  // var dataState = section.getAttribute("data-state");
                  var slideId = section.id;
                  var callbackName = callbackElem.getAttribute("cbFactory") || "GraphvizAnimation";
                  var callbackArg = callbackElem.getAttribute("arg") || null;

                  if (callbackName) {
                    var callbackPtr = window[callbackName];
                    if (callbackPtr) {
                      var targetElementSelector = callbackElem.getAttribute("targetElementSelector");
                      // console.log(`Registering callback "${callbackName}" for element ${targetElementSelector} in section with id  ${slideId}`);
                      that.slideCallbacks[slideId] = callbackPtr(targetElementSelector, callbackArg);
                    } else {
                      console.log(`FAILED to registering callback "${callbackName}" for section with id ${slideId}: function not found`);
                    }
                  }
                })
          });
          console.log(`Registered callbacks: ${that.slideCallbacks}`);
  },

    id: 'd3graphviz',
    init: function(deck) {
      Reveal.addEventListener( 'ready',
                               function(event) {
                                 console.log("Reveal is ready");
                               } );

      this.registerSlideCallbacks(document);

      Reveal.on('slidetransitionend', event => {
        generate_d3graphviz(event.currentSlide)

        const that = window.d3graphviz;

        var slideId = event.currentSlide.id;

        if (that.activeCallback) {
          console.log(`Calling onLeave`);
          that.activeCallback.onLeave();
          that.activeCallback = null;
        }

        var cb = that.slideCallbacks[slideId];

        if (cb) {
          console.log(`Calling callback for section with id ${slideId}`);
          //cb.onEnter.call(cb, event.currentSlide);
          cb.onEnter(event.currentSlide);
          that.activeCallback = cb;
        } else {
          console.log(`No callback for section with id ${slideId}`);
        }
      });
      return this;
    }
};

console.log("Starting 3dgraphviz plugin");
Reveal.registerPlugin( 'd3graphviz', d3graphviz );
