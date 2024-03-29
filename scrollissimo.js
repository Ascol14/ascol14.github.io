/**
 * Scrollissimo
 * Javascript plugin for smooth scroll-controlled animations
 * @version 0.6.0
 * @author frux <qdinov@yandex.ru>
 * @url https://github.com/Promo/scrollissimo
 */
 (function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports"], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports);
    } else {
        var mod = { exports: {} };
        factory(mod.exports);
        global.scrollissimo = mod.exports;
    }
})(this, function (exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.add = add;
    exports.knock = knock;
    var queues = [];
    var smoothQueues = [];
    var disableKnock = true;
    var previousScrollTop = 0;
    var enableSmoothing = (exports.enableSmoothing = true);
    var _isTouchMode = (exports._isTouchMode = "ontouchstart" in window);
    function getIntersection(from1, to1, from2, to2) {
        var f2 = Math.min(from2, to2);
        var t2 = Math.max(from2, to2);
        var f1 = from1;
        var t1 = to1;
        var n1 = void 0;
        var n2 = void 0;
        if (f2 <= f1 && t2 >= f1) {
            n1 = f1;
            n2 = Math.min(t2, t1);
        } else if (t2 >= t1 && f2 <= t1) {
            n1 = Math.max(f2, f1);
            n2 = Math.min(t2, t1);
        } else if (f2 >= f1 && t2 <= t1) {
            n1 = f2;
            n2 = t2;
        } else {
            return;
        }
        return from2 < to2 ? { from: n1, to: n2 } : { from: n2, to: n1 };
    }
    var Queue = function Queue(timeline, start, maxSpeed) {
        if (timeline) {
            this.params = { start: start || 0, duration: timeline.duration() || 0 };
            this.timeline = timeline.pause();
            if (!isNaN(maxSpeed)) {
                this._maxSpeed = maxSpeed;
                this._smoother = new Queue.Smoother(this, this._maxSpeed);
            }
        }
    };
    Queue.prototype.getIntersection = function (previousScrollTop, scrollTop) {
        return getIntersection(this.params.start, this.params.start + this.timeline.duration() * this.timeline.timeScale(), previousScrollTop, scrollTop);
    };
    Queue.prototype.render = function (scrollTop) {
        var tweenProgress = Math.round(((scrollTop - this.params.start) / this.timeline.duration()) * this.timeline.timeScale() * 1000) / 1000;
        if (tweenProgress < 0) {
            tweenProgress = 0;
        }
        if (tweenProgress > 1) {
            tweenProgress = 1;
        }
        this.timeline.progress(tweenProgress);
        return this;
    };
    Queue.Smoother = function (queue, maxSpeed) {
        this.status = "idle";
        this.animateTo = 0;
        this.maxSpeed = Number(maxSpeed);
        this.queue = queue;
    };
    Queue.Smoother.prototype.smooth = function (previousScrollTop, scrollTop) {
        var intersection = this.queue.getIntersection(previousScrollTop, scrollTop);
        if (intersection) {
            this.animateTo = intersection.to;
            this.animateFrom = this.animateFrom || intersection.from;
            if (this.status === "idle") {
                this.status = "busy";
                this.id = window.requestAnimationFrame(this.step.bind(this));
            }
            return this;
        }
    };
    Queue.Smoother.prototype.step = function () {
        var delta = this.animateTo - this.animateFrom;
        if (Math.abs(delta) > this.maxSpeed) {
            this.queue.render((this.animateFrom += this.maxSpeed * (delta > 0 ? 1 : -1)));
            window.requestAnimationFrame(this.step.bind(this));
        } else {
            this.queue.render(this.animateTo);
            this.status = "idle";
            this.animateFrom = this.animateTo;
        }
    };
    function add(timeline, start, maxSpeed) {
        if (isNaN(maxSpeed)) {
            queues.push(new Queue(timeline, start, maxSpeed));
        } else {
            smoothQueues.push(new Queue(timeline, start, maxSpeed));
        }
        return this;
    }
    function _render(scrollTop, enableSmoothing) {
        queues.forEach(function (queue) {
            queue.render(scrollTop);
        });
        smoothQueues.forEach(function (queue) {
            if (enableSmoothing) {
                queue._smoother.smooth(previousScrollTop, scrollTop);
            } else {
                queue.render(scrollTop);
            }
        });
    }
    function _catch(customScrollTop) {
        var scrollTop = isNaN(customScrollTop) ? window.pageYOffset : customScrollTop;
        _render(scrollTop, enableSmoothing);
        previousScrollTop = scrollTop;
    }
    function knock(customScrollTop) {
        if (!disableKnock) {
            _catch(customScrollTop);
            if (isNaN(customScrollTop)) {
                setTimeout(_catch, 10);
            }
        }
    }
    document.addEventListener("DOMContentLoaded", function () {
        var wheelStack = [];
        var spectateStartTime = Number(new Date());
        var _stepwiseDetector = void 0;
        setTimeout(function () {
            var startScrollTop = window.pageYOffset;
            previousScrollTop = startScrollTop;
            _render(startScrollTop, false);
            disableKnock = false;
        }, 100);
        if (_isTouchMode) {
            exports.enableSmoothing = enableSmoothing = false;
        } else {
            _stepwiseDetector = function stepwiseDetector(e) {
                var bigStepDetected = false;
                var i = void 0;
                if (wheelStack.length === 5) {
                    window.removeEventListener("wheel", _stepwiseDetector);
                }
                wheelStack.push(e.deltaY);
                if (Number(new Date()) - spectateStartTime <= 400) {
                    if (wheelStack.length === 5) {
                        for (i = 0; i < 5; i++) {
                            if (Math.abs(wheelStack[i]) > 100) {
                                bigStepDetected = true;
                                break;
                            }
                        }
                        exports.enableSmoothing = enableSmoothing = bigStepDetected;
                    }
                } else {
                    spectateStartTime = Number(new Date());
                    wheelStack = [];
                }
            };
            window.addEventListener("wheel", _stepwiseDetector);
        }
    });
    var _test = (exports._test = {
        _setRenderFunc: function _setRenderFunc(newRenderFunc) {
            Queue.prototype._render = newRenderFunc;
        },
        _getIntersection: getIntersection,
    });
});
