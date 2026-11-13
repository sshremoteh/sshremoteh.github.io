/* NOVA MUSIC - Main Application Controller (ES5 / webOS 2.0 WebKit Compatible) */
(function(window, document) {
  'use strict';

  var Nova = window.Nova || {};
  window.Nova = Nova;

  function initApp() {
    // 1. Initialize Navigation
    if (Nova.Navigation) {
      Nova.Navigation.init();
    }

    // 2. Initialize Player
    if (Nova.Player) {
      Nova.Player.init();
    }

    // 3. Initialize UI
    if (Nova.UI) {
      Nova.UI.init();
    }

    // 4. Bind Now Playing controls
    bindNowPlayingControls();

    // 5. Initialize Repository Manager and load catalogs
    if (Nova.RepositoryManager) {
      Nova.RepositoryManager.init(function(err, tracks) {
        if (err) {
          if (Nova.UI) Nova.UI.showToast('Initial load notice: ' + err.message, 4000);
        }

        // Render initial Home view
        if (Nova.UI) {
          Nova.UI.renderView('home');
        }

        // Set initial TV focus to Home navigation item in sidebar
        setTimeout(function() {
          var homeNav = document.querySelector('.nav-item[data-target-view="home"]');
          if (homeNav && Nova.Navigation) {
            Nova.Navigation.setFocus(homeNav);
          }
        }, 100);
      });
    }
  }

  function bindNowPlayingControls() {
    // Back button in Now Playing
    var npBackBtn = document.getElementById('np-back-btn');
    if (npBackBtn) {
      npBackBtn.addEventListener('click', function() {
        if (Nova.UI) Nova.UI.handleBack();
      }, false);
    }

    // Play / Pause
    var npPlayBtn = document.getElementById('np-play-btn');
    if (npPlayBtn) {
      npPlayBtn.addEventListener('click', function() {
        if (Nova.Player) Nova.Player.togglePlay();
      }, false);
    }

    // Next
    var npNextBtn = document.getElementById('np-next-btn');
    if (npNextBtn) {
      npNextBtn.addEventListener('click', function() {
        if (Nova.Player) Nova.Player.playNext(true);
      }, false);
    }

    // Previous
    var npPrevBtn = document.getElementById('np-prev-btn');
    if (npPrevBtn) {
      npPrevBtn.addEventListener('click', function() {
        if (Nova.Player) Nova.Player.playPrev();
      }, false);
    }

    // Shuffle
    var npShuffleBtn = document.getElementById('np-shuffle-btn');
    if (npShuffleBtn) {
      npShuffleBtn.addEventListener('click', function() {
        if (Nova.Player) {
          var isShuffle = Nova.Player.toggleShuffle();
          if (isShuffle) npShuffleBtn.classList.add('active');
          else npShuffleBtn.classList.remove('active');
          if (Nova.UI) Nova.UI.showToast(isShuffle ? 'Shuffle: ON' : 'Shuffle: OFF');
        }
      }, false);
    }

    // Repeat
    var npRepeatBtn = document.getElementById('np-repeat-btn');
    if (npRepeatBtn) {
      npRepeatBtn.addEventListener('click', function() {
        if (Nova.Player) {
          var mode = Nova.Player.toggleRepeat();
          if (mode === 1) {
            npRepeatBtn.classList.add('active');
            npRepeatBtn.innerHTML = '&#8635; All';
            if (Nova.UI) Nova.UI.showToast('Repeat: ALL');
          } else if (mode === 2) {
            npRepeatBtn.classList.add('active');
            npRepeatBtn.innerHTML = '&#8635; 1';
            if (Nova.UI) Nova.UI.showToast('Repeat: ONE');
          } else {
            npRepeatBtn.classList.remove('active');
            npRepeatBtn.innerHTML = '&#8635; Off';
            if (Nova.UI) Nova.UI.showToast('Repeat: OFF');
          }
        }
      }, false);
    }

    // Favorite toggle
    var npFavBtn = document.getElementById('np-fav-btn');
    if (npFavBtn) {
      npFavBtn.addEventListener('click', function() {
        var state = Nova.Player ? Nova.Player.getState() : null;
        if (state && state.currentTrack && Nova.Storage) {
          var isFav = Nova.Storage.toggleFavorite(state.currentTrack.id);
          npFavBtn.innerHTML = isFav ? '&#9733;' : '&#9734;';
          if (Nova.UI) Nova.UI.showToast(isFav ? 'Added to Favorites' : 'Removed from Favorites');
        }
      }, false);
    }

    // Seek bar clicks / remote rewind & fast-forward
    var npProgressTrack = document.getElementById('np-progress-track');
    if (npProgressTrack) {
      npProgressTrack.addEventListener('click', function(e) {
        var rect = npProgressTrack.getBoundingClientRect();
        var clickX = e.clientX - rect.left;
        var ratio = Math.max(0, Math.min(clickX / rect.width, 1));
        var state = Nova.Player ? Nova.Player.getState() : null;
        if (state && state.duration > 0 && Nova.Player) {
          Nova.Player.seek(ratio * state.duration);
        }
      }, false);

      // Key navigation on seek bar
      npProgressTrack.addEventListener('keydown', function(e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode === 37) { // Left: rewind 5s
          e.preventDefault();
          e.stopPropagation();
          if (Nova.Player) Nova.Player.seekRelative(-5);
        } else if (keyCode === 39) { // Right: forward 5s
          e.preventDefault();
          e.stopPropagation();
          if (Nova.Player) Nova.Player.seekRelative(5);
        }
      }, false);
    }
  }

  // DOMContentLoaded or immediate execution
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp, false);
  } else {
    initApp();
  }

  Nova.init = initApp;
})(window, document);
