/* NOVA MUSIC - HTML5 Audio Player Engine (ES5 / webOS 2.0 WebKit Compatible) */
(function(window) {
  'use strict';

  var Nova = window.Nova || {};
  window.Nova = Nova;

  var audio = null;
  var queue = [];
  var originalQueue = [];
  var queueIndex = -1;
  var currentTrack = null;
  var isPlaying = false;
  var isShuffle = false;
  var repeatMode = 0; // 0: off, 1: all, 2: one
  var listeners = {
    playState: [],
    trackChange: [],
    timeUpdate: [],
    queueChange: [],
    error: []
  };

  function padZero(num) {
    return (num < 10 ? '0' : '') + num;
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds === null || seconds === undefined || seconds < 0) {
      return '0:00';
    }
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return mins + ':' + padZero(secs);
  }

  // Fisher-Yates shuffle array
  function shuffleArray(arr, keepFirstIndex) {
    var copy = arr.slice(0);
    var first = null;
    if (keepFirstIndex !== undefined && keepFirstIndex >= 0 && keepFirstIndex < copy.length) {
      first = copy.splice(keepFirstIndex, 1)[0];
    }
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    if (first !== null) {
      copy.unshift(first);
    }
    return copy;
  }

  var Player = {
    init: function() {
      var self = this;
      if (audio) return;

      audio = new Audio();
      audio.preload = 'metadata';

      // Restore saved settings
      var settings = Nova.Storage ? Nova.Storage.getSettings() : { volume: 0.9, shuffle: false, repeatMode: 0 };
      if (settings) {
        audio.volume = (typeof settings.volume === 'number') ? settings.volume : 0.9;
        isShuffle = !!settings.shuffle;
        repeatMode = (typeof settings.repeatMode === 'number') ? settings.repeatMode : 0;
      }

      // Event listeners
      audio.addEventListener('play', function() {
        isPlaying = true;
        self.emit('playState', { isPlaying: true, track: currentTrack });
      }, false);

      audio.addEventListener('pause', function() {
        isPlaying = false;
        self.emit('playState', { isPlaying: false, track: currentTrack });
      }, false);

      audio.addEventListener('timeupdate', function() {
        self.emit('timeUpdate', {
          currentTime: audio.currentTime || 0,
          duration: audio.duration || (currentTrack ? currentTrack.duration : 0) || 0,
          formattedCurrent: formatTime(audio.currentTime || 0),
          formattedDuration: formatTime(audio.duration || (currentTrack ? currentTrack.duration : 0) || 0)
        });
      }, false);

      audio.addEventListener('ended', function() {
        self.handleTrackEnded();
      }, false);

      audio.addEventListener('error', function(e) {
        var errMessage = 'Unknown playback error';
        if (audio.error) {
          switch (audio.error.code) {
            case 1: // MEDIA_ERR_ABORTED
              errMessage = 'Audio playback aborted';
              break;
            case 2: // MEDIA_ERR_NETWORK
              errMessage = 'Network error while loading audio';
              break;
            case 3: // MEDIA_ERR_DECODE
              errMessage = 'Audio decoding error: format may be corrupted';
              break;
            case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
              errMessage = 'Audio format not supported or URL unavailable';
              break;
            default:
              errMessage = 'Audio error code ' + audio.error.code;
          }
        }
        isPlaying = false;
        self.emit('playState', { isPlaying: false, track: currentTrack });
        self.emit('error', { message: errMessage, track: currentTrack });
      }, false);
    },

    on: function(event, callback) {
      if (listeners[event]) {
        listeners[event].push(callback);
      }
    },

    off: function(event, callback) {
      if (listeners[event]) {
        var idx = listeners[event].indexOf(callback);
        if (idx >= 0) {
          listeners[event].splice(idx, 1);
        }
      }
    },

    emit: function(event, data) {
      if (listeners[event]) {
        for (var i = 0; i < listeners[event].length; i++) {
          try {
            listeners[event][i](data);
          } catch (err) {}
        }
      }
    },

    checkCodecSupport: function(format) {
      if (!audio) this.init();
      var mimeMap = {
        'mp3': 'audio/mpeg',
        'm4a': 'audio/mp4; codecs="mp4a.40.2"',
        'aac': 'audio/aac',
        'ogg': 'audio/ogg; codecs="vorbis"',
        'wav': 'audio/wav'
      };
      var mime = mimeMap[format] || ('audio/' + format);
      return audio.canPlayType(mime);
    },

    loadQueue: function(tracks, startIndex, autoPlay) {
      if (!tracks || tracks.length === 0) return;
      this.init();

      originalQueue = tracks.slice(0);
      var idx = (typeof startIndex === 'number' && startIndex >= 0 && startIndex < tracks.length) ? startIndex : 0;

      if (isShuffle) {
        queue = shuffleArray(originalQueue, idx);
        queueIndex = 0;
      } else {
        queue = originalQueue.slice(0);
        queueIndex = idx;
      }

      this.emit('queueChange', { queue: queue, queueIndex: queueIndex });
      this.loadTrack(queue[queueIndex], autoPlay);
    },

    loadTrack: function(track, autoPlay) {
      if (!track || !track.audio) return;
      this.init();

      currentTrack = track;
      audio.src = track.audio;
      audio.load();

      this.emit('trackChange', { track: track, queueIndex: queueIndex });

      // Save state
      if (Nova.Storage) {
        Nova.Storage.setLastPlayed({
          trackId: track.id,
          queueIndex: queueIndex
        });
      }

      if (autoPlay) {
        this.play();
      }
    },

    play: function() {
      if (!audio) return;
      if (!currentTrack && queue.length > 0) {
        this.loadTrack(queue[0], true);
        return;
      }
      var playPromise = audio.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function(e) {
          // Autoplay policy prevented playback until user interaction
        });
      }
    },

    pause: function() {
      if (!audio) return;
      audio.pause();
    },

    togglePlay: function() {
      if (isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    },

    stop: function() {
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
    },

    playNext: function(isManual) {
      if (queue.length === 0) return;

      var nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 1 || isManual) { // Repeat All
          nextIndex = 0;
        } else {
          // End of queue and repeat is off
          this.pause();
          return;
        }
      }

      queueIndex = nextIndex;
      this.emit('queueChange', { queue: queue, queueIndex: queueIndex });
      this.loadTrack(queue[queueIndex], true);
    },

    playPrev: function() {
      if (queue.length === 0) return;

      // If played more than 3 seconds, restart current track
      if (audio && audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
      }

      var prevIndex = queueIndex - 1;
      if (prevIndex < 0) {
        prevIndex = queue.length - 1;
      }

      queueIndex = prevIndex;
      this.emit('queueChange', { queue: queue, queueIndex: queueIndex });
      this.loadTrack(queue[queueIndex], true);
    },

    handleTrackEnded: function() {
      if (repeatMode === 2) { // Repeat One
        if (audio) {
          audio.currentTime = 0;
          this.play();
        }
      } else {
        this.playNext(false);
      }
    },

    seek: function(seconds) {
      if (!audio || isNaN(seconds)) return;
      var duration = audio.duration || (currentTrack ? currentTrack.duration : 0) || 0;
      var clamped = Math.max(0, Math.min(seconds, duration));
      audio.currentTime = clamped;
    },

    seekRelative: function(deltaSeconds) {
      if (!audio) return;
      var newTime = (audio.currentTime || 0) + deltaSeconds;
      this.seek(newTime);
    },

    getVolume: function() {
      return audio ? audio.volume : 0.9;
    },

    setVolume: function(val) {
      if (!audio) this.init();
      var clamped = Math.max(0, Math.min(val, 1.0));
      audio.volume = clamped;
      if (Nova.Storage) {
        var s = Nova.Storage.getSettings();
        s.volume = clamped;
        Nova.Storage.setSettings(s);
      }
    },

    toggleShuffle: function() {
      isShuffle = !isShuffle;
      if (isShuffle) {
        queue = shuffleArray(originalQueue, queueIndex);
        queueIndex = 0;
      } else {
        // Restore original order and find current track index
        queue = originalQueue.slice(0);
        if (currentTrack) {
          for (var i = 0; i < queue.length; i++) {
            if (queue[i].id === currentTrack.id) {
              queueIndex = i;
              break;
            }
          }
        }
      }
      this.emit('queueChange', { queue: queue, queueIndex: queueIndex });
      if (Nova.Storage) {
        var s = Nova.Storage.getSettings();
        s.shuffle = isShuffle;
        Nova.Storage.setSettings(s);
      }
      return isShuffle;
    },

    toggleRepeat: function() {
      // 0: Off -> 1: All -> 2: One -> 0: Off
      repeatMode = (repeatMode + 1) % 3;
      if (Nova.Storage) {
        var s = Nova.Storage.getSettings();
        s.repeatMode = repeatMode;
        Nova.Storage.setSettings(s);
      }
      return repeatMode;
    },

    getState: function() {
      return {
        currentTrack: currentTrack,
        isPlaying: isPlaying,
        isShuffle: isShuffle,
        repeatMode: repeatMode,
        currentTime: audio ? audio.currentTime : 0,
        duration: audio ? audio.duration : 0,
        volume: audio ? audio.volume : 0.9,
        queue: queue,
        queueIndex: queueIndex
      };
    },

    formatTime: formatTime
  };

  Nova.Player = Player;
})(window);
