/* NOVA MUSIC - TV Focus Management & Remote Control (ES5 / webOS 2.0 WebKit Compatible) */
(function(window, document) {
  'use strict';

  var Nova = window.Nova || {};
  window.Nova = Nova;

  var currentFocused = null;
  var lastContentFocus = null;
  var isNavLocked = false;
  var backCallbacks = [];

  // Key codes map
  var KEYS = {
    // Arrows
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    // Activation
    ENTER: 13,
    // Back / Exit
    BACKSPACE: 8,
    ESCAPE: 27,
    LG_BACK: 461,
    TIZEN_BACK: 10009,
    // Media controls
    MEDIA_PLAY_PAUSE: 179,
    MEDIA_PLAY: 415,
    MEDIA_PAUSE: 19,
    MEDIA_STOP: 413,
    MEDIA_NEXT: 417,
    MEDIA_PREV: 412,
    MEDIA_FAST_FORWARD: 473,
    MEDIA_REWIND: 472,
    // Color keys
    RED: 403,
    GREEN: 404,
    YELLOW: 405,
    BLUE: 406
  };

  var Navigation = {
    KEYS: KEYS,

    init: function() {
      var self = this;

      // Global keydown handler
      window.addEventListener('keydown', function(e) {
        self.handleKeyDown(e);
      }, false);

      // Support mouse/pointer (e.g. LG Magic Remote pointer)
      document.addEventListener('mouseover', function(e) {
        var target = self.findFocusableParent(e.target);
        if (target && target !== currentFocused) {
          self.setFocus(target, false);
        }
      }, false);

      document.addEventListener('click', function(e) {
        var target = self.findFocusableParent(e.target);
        if (target) {
          self.setFocus(target, false);
        }
      }, false);
    },

    findFocusableParent: function(element) {
      var el = element;
      while (el && el !== document.body) {
        if (el.classList && el.classList.contains('focusable') && !el.disabled && el.offsetParent !== null) {
          return el;
        }
        el = el.parentElement || el.parentNode;
      }
      return null;
    },

    getAllFocusable: function(container) {
      var root = container || document;
      var nodeList = root.querySelectorAll('.focusable:not([disabled])');
      var list = [];
      for (var i = 0; i < nodeList.length; i++) {
        var el = nodeList[i];
        // Check visibility
        if (el.offsetParent !== null && window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden') {
          list.push(el);
        }
      }
      return list;
    },

    getCurrentFocus: function() {
      return currentFocused;
    },

    setFocus: function(element, shouldScroll) {
      if (!element || element === currentFocused) {
        return;
      }

      if (currentFocused) {
        currentFocused.classList.remove('focused');
      }

      currentFocused = element;
      currentFocused.classList.add('focused');

      // If active element is an input or button, give browser focus
      if (typeof element.focus === 'function') {
        try {
          element.focus();
        } catch (err) {}
      }

      // Track last content focus for easy return from sidebar
      var zone = element.getAttribute('data-zone');
      if (zone && zone !== 'nav' && zone !== 'player') {
        lastContentFocus = element;
      }

      if (shouldScroll !== false) {
        this.scrollIntoView(element);
      }

      // Trigger custom onFocus callback if defined
      if (typeof element.onTvFocus === 'function') {
        element.onTvFocus();
      }
    },

    scrollIntoView: function(element) {
      if (!element) return;
      
      // Find scrollable parent container
      var parent = element.parentElement;
      while (parent && parent !== document.body) {
        var overflowY = window.getComputedStyle(parent).overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') {
          break;
        }
        parent = parent.parentElement;
      }

      if (!parent || parent === document.body) {
        // Default scroll
        try {
          if (typeof element.scrollIntoViewIfNeeded === 'function') {
            element.scrollIntoViewIfNeeded(false);
          } else {
            element.scrollIntoView(false);
          }
        } catch (e) {}
        return;
      }

      // Calculate relative position inside scrollable parent
      var elRect = element.getBoundingClientRect();
      var parentRect = parent.getBoundingClientRect();
      var margin = 60; // Keep 60px margin from top and bottom

      if (elRect.top < parentRect.top + margin) {
        parent.scrollTop -= (parentRect.top + margin - elRect.top);
      } else if (elRect.bottom > parentRect.bottom - margin) {
        parent.scrollTop += (elRect.bottom - (parentRect.bottom - margin));
      }
    },

    lockNavigation: function(lock) {
      isNavLocked = !!lock;
    },

    registerBackCallback: function(callback) {
      backCallbacks.push(callback);
    },

    unregisterBackCallback: function(callback) {
      var idx = backCallbacks.indexOf(callback);
      if (idx >= 0) {
        backCallbacks.splice(idx, 1);
      }
    },

    handleKeyDown: function(e) {
      var keyCode = e.keyCode || e.which;
      var key = e.key;

      // Handle Back action
      if (keyCode === KEYS.BACKSPACE || keyCode === KEYS.ESCAPE || keyCode === KEYS.LG_BACK || keyCode === KEYS.TIZEN_BACK || key === 'Backspace' || key === 'Escape' || key === 'Back') {
        // Prevent default browser history navigation
        e.preventDefault();
        e.stopPropagation();
        this.handleBack();
        return;
      }

      // Handle Media Keys
      if (keyCode === KEYS.MEDIA_PLAY_PAUSE || keyCode === KEYS.MEDIA_PLAY || keyCode === KEYS.MEDIA_PAUSE) {
        e.preventDefault();
        if (Nova.Player) {
          Nova.Player.togglePlay();
        }
        return;
      }

      if (keyCode === KEYS.MEDIA_NEXT || keyCode === KEYS.MEDIA_FAST_FORWARD) {
        e.preventDefault();
        if (Nova.Player) {
          Nova.Player.playNext(false);
        }
        return;
      }

      if (keyCode === KEYS.MEDIA_PREV || keyCode === KEYS.MEDIA_REWIND) {
        e.preventDefault();
        if (Nova.Player) {
          Nova.Player.playPrev();
        }
        return;
      }

      if (keyCode === KEYS.MEDIA_STOP) {
        e.preventDefault();
        if (Nova.Player) {
          Nova.Player.stop();
        }
        return;
      }

      if (isNavLocked) {
        return;
      }

      // Directional Navigation
      if (keyCode === KEYS.LEFT || key === 'ArrowLeft') {
        e.preventDefault();
        this.navigateDirection('left');
      } else if (keyCode === KEYS.RIGHT || key === 'ArrowRight') {
        e.preventDefault();
        this.navigateDirection('right');
      } else if (keyCode === KEYS.UP || key === 'ArrowUp') {
        e.preventDefault();
        this.navigateDirection('up');
      } else if (keyCode === KEYS.DOWN || key === 'ArrowDown') {
        e.preventDefault();
        this.navigateDirection('down');
      } else if (keyCode === KEYS.ENTER || key === 'Enter') {
        e.preventDefault();
        this.activateCurrent();
      }
    },

    activateCurrent: function() {
      if (currentFocused) {
        // Visual press feedback
        currentFocused.classList.add('pressed');
        setTimeout(function() {
          if (currentFocused) {
            currentFocused.classList.remove('pressed');
          }
        }, 150);

        // Click element
        currentFocused.click();
      }
    },

    handleBack: function() {
      // 1. Check if custom registered back callbacks exist (e.g. modals)
      if (backCallbacks.length > 0) {
        var topCallback = backCallbacks[backCallbacks.length - 1];
        if (topCallback()) {
          return;
        }
      }

      // 2. Delegate to UI manager
      if (Nova.UI && Nova.UI.handleBack) {
        if (Nova.UI.handleBack()) {
          return;
        }
      }

      // 3. Fallback: if in content zone, jump to sidebar nav
      if (currentFocused && currentFocused.getAttribute('data-zone') !== 'nav') {
        this.focusSidebar();
        return;
      }

      // 4. If in sidebar on Home, offer exit or return to MSX
      if (window.history && window.history.length > 1) {
        window.history.back();
      }
    },

    focusSidebar: function() {
      var activeNav = document.querySelector('.nav-item.active') || document.querySelector('.nav-item');
      if (activeNav) {
        this.setFocus(activeNav);
      }
    },

    restoreContentFocus: function() {
      if (lastContentFocus && document.body.contains(lastContentFocus) && window.getComputedStyle(lastContentFocus).display !== 'none') {
        this.setFocus(lastContentFocus);
        return true;
      }
      var firstContent = document.querySelector('#content-area .focusable:not([disabled])');
      if (firstContent) {
        this.setFocus(firstContent);
        return true;
      }
      return false;
    },

    navigateDirection: function(direction) {
      // Check for active modal
      var activeModal = document.querySelector('.modal-container.active');
      var scope = activeModal || document;

      var all = this.getAllFocusable(scope);
      if (all.length === 0) return;

      if (!currentFocused || !document.body.contains(currentFocused) || all.indexOf(currentFocused) === -1) {
        // Fallback to first focusable
        this.setFocus(all[0]);
        return;
      }

      var currentRect = currentFocused.getBoundingClientRect();
      var currentCenter = {
        x: currentRect.left + currentRect.width / 2,
        y: currentRect.top + currentRect.height / 2
      };

      var currentZone = currentFocused.getAttribute('data-zone');

      // Special Zone Transitions
      if (!activeModal) {
        // If navigating right from sidebar
        if (currentZone === 'nav' && direction === 'right') {
          if (this.restoreContentFocus()) {
            return;
          }
        }
      }

      var bestCandidate = null;
      var minDistance = Infinity;

      for (var i = 0; i < all.length; i++) {
        var candidate = all[i];
        if (candidate === currentFocused) continue;

        var candRect = candidate.getBoundingClientRect();
        var candCenter = {
          x: candRect.left + candRect.width / 2,
          y: candRect.top + candRect.height / 2
        };

        var dx = candCenter.x - currentCenter.x;
        var dy = candCenter.y - currentCenter.y;

        var isEligible = false;
        var mainDelta = 0;
        var crossDelta = 0;

        if (direction === 'left') {
          if (candCenter.x < currentCenter.x - 5) {
            isEligible = true;
            mainDelta = Math.abs(dx);
            crossDelta = Math.abs(dy);
          }
        } else if (direction === 'right') {
          if (candCenter.x > currentCenter.x + 5) {
            isEligible = true;
            mainDelta = Math.abs(dx);
            crossDelta = Math.abs(dy);
          }
        } else if (direction === 'up') {
          if (candCenter.y < currentCenter.y - 5) {
            isEligible = true;
            mainDelta = Math.abs(dy);
            crossDelta = Math.abs(dx);
          }
        } else if (direction === 'down') {
          if (candCenter.y > currentCenter.y + 5) {
            isEligible = true;
            mainDelta = Math.abs(dy);
            crossDelta = Math.abs(dx);
          }
        }

        if (isEligible) {
          // Weight cross-axis delta heavier so straight line navigation is preferred
          var dist = mainDelta + (crossDelta * 2.2);

          // Zone preference: give slight bonus to staying in same zone unless jumping zones intentionally
          var candZone = candidate.getAttribute('data-zone');
          if (candZone !== currentZone) {
            dist += 80;
          }

          if (dist < minDistance) {
            minDistance = dist;
            bestCandidate = candidate;
          }
        }
      }

      // Boundary transitions when no direct candidate is in that direction
      if (!bestCandidate && !activeModal) {
        // Going left from content to nav sidebar
        if (direction === 'left' && currentZone !== 'nav') {
          this.focusSidebar();
          return;
        }

        // Going down from content to player bar
        if (direction === 'down' && currentZone !== 'player') {
          var playerBtn = document.querySelector('#mini-player .focusable');
          if (playerBtn && window.getComputedStyle(document.getElementById('mini-player')).display !== 'none') {
            this.setFocus(playerBtn);
            return;
          }
        }

        // Going up from player bar to content
        if (direction === 'up' && currentZone === 'player') {
          if (this.restoreContentFocus()) {
            return;
          }
        }
      }

      if (bestCandidate) {
        this.setFocus(bestCandidate);
      }
    }
  };

  Nova.Navigation = Navigation;
})(window, document);
