window.insertionQ = (function () {
    "use strict";

    var sequence = 100,
        isAnimationSupported = false,
        animationstring = 'animationName',
        keyframeprefix = '',
        domPrefixes = 'Webkit Moz O ms Khtml'.split(' '),
        pfx = '',
        elm = document.createElement('div'),
        options = {
            timeout: 20
        },
		MutationObserver = window.MutationObserver||window.WebKitMutationObserver||window.MozMutationObserver,
		observers = {};

    if (elm.style.animationName) {
        isAnimationSupported = true;
    }

    if (isAnimationSupported === false) {
        for (var i = 0; i < domPrefixes.length; i++) {
            if (elm.style[domPrefixes[i] + 'AnimationName'] !== undefined) {
                pfx = domPrefixes[i];
                animationstring = pfx + 'AnimationName';
                keyframeprefix = '-' + pfx.toLowerCase() + '-';
                isAnimationSupported = true;
                break;
            }
        }
    }

    function listen(selector, callback) {
        var styleAnimation, animationName = 'insQ_' + (sequence++);

        var eventHandler = function (event) {
            if (event.animationName === animationName || event[animationstring] === animationName) {
                callback(event.target);
            }
        };

        styleAnimation = document.createElement('style');
        styleAnimation.innerHTML = '@' + keyframeprefix + 'keyframes ' + animationName + ' {  from {  outline: 1px solid transparent  } to {  outline: 0px solid transparent }  }' +
            "\n" + selector + ' { animation-duration: 0.001s; animation-name: ' + animationName + '; ' +
            keyframeprefix + 'animation-duration: 0.001s; ' + keyframeprefix + 'animation-name: ' + animationName + '; ' +
            ' } ';

        document.head.appendChild(styleAnimation);

        var bindAnimationLater = setTimeout(function () {
            document.addEventListener('animationstart', eventHandler, false);
            document.addEventListener('MSAnimationStart', eventHandler, false);
            document.addEventListener('webkitAnimationStart', eventHandler, false);
            //event support is not consistent with DOM prefixes
        }, options.timeout); //starts listening later to skip elements found on startup. this might need tweaking

		if (MutationObserver
				&& navigator.userAgent.indexOf('Firefox') !== -1
				&& (selector.indexOf('select') !== -1 || selector.indexOf('input') !== -1)) {
			observe(selector, callback);
		}

        return {
            destroy: function () {
                clearTimeout(bindAnimationLater);
                if (styleAnimation) {
                    document.head.removeChild(styleAnimation);
                    styleAnimation = null;
                }
                document.removeEventListener('animationstart', eventHandler);
                document.removeEventListener('MSAnimationStart', eventHandler);
                document.removeEventListener('webkitAnimationStart', eventHandler);
            }
        };
    }

    function observe(selector, callback) {
		var observerName = 'observer_'+sequence;
		observers[observerName] = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (mutation.type === 'childList' && mutation.addedNodes.length) {
					for(var i=0; i<mutation.addedNodes.length; ++i) {
						if ($(mutation.addedNodes[i]).is(selector)) {
							callback(mutation.addedNodes[i]);
						} else {
							$(selector, mutation.addedNodes[i]).each(function(){
								callback(this);
							});
						}
					}
				}
			});
		});
		observers[observerName].observe(
			document.querySelector('body'),
			{childList:true,subtree:true}
		);
    }

    //insQ function
    var exports = function (selector) {
		if (isAnimationSupported && selector.match(/[^{}]/)) {
            return {
                every: function (callback) {
                    return listen(selector, callback);
                }
            };
        } else {
            return false;
        }
    };

    return exports;
})();