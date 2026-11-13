/* NOVA MUSIC - LocalStorage Manager (ES5 / webOS 2.0 WebKit Compatible) */
(function(window) {
  'use strict';

  var Nova = window.Nova || {};
  window.Nova = Nova;

  var memoryStore = {};
  var storageAvailable = false;
  var PREFIX = 'nova_music_v1_';

  // Safe localStorage detection
  try {
    var testKey = '__nova_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    storageAvailable = true;
  } catch (e) {
    storageAvailable = false;
  }

  var Storage = {
    isAvailable: function() {
      return storageAvailable;
    },

    get: function(key, defaultValue) {
      var fullKey = PREFIX + key;
      if (storageAvailable) {
        try {
          var item = window.localStorage.getItem(fullKey);
          if (item === null || item === undefined) {
            return defaultValue;
          }
          return JSON.parse(item);
        } catch (err) {
          return defaultValue;
        }
      } else {
        if (Object.prototype.hasOwnProperty.call(memoryStore, fullKey)) {
          return memoryStore[fullKey];
        }
        return defaultValue;
      }
    },

    set: function(key, value) {
      var fullKey = PREFIX + key;
      if (storageAvailable) {
        try {
          var serialized = JSON.stringify(value);
          window.localStorage.setItem(fullKey, serialized);
          return true;
        } catch (err) {
          // In case of quota exceeded, fallback to memory
          memoryStore[fullKey] = value;
          return false;
        }
      } else {
        memoryStore[fullKey] = value;
        return true;
      }
    },

    remove: function(key) {
      var fullKey = PREFIX + key;
      if (storageAvailable) {
        try {
          window.localStorage.removeItem(fullKey);
        } catch (err) {
          // Ignore
        }
      }
      delete memoryStore[fullKey];
    },

    // Helper getters/setters
    getRepositories: function() {
      return this.get('repositories', []);
    },

    setRepositories: function(repos) {
      return this.set('repositories', repos);
    },

    getFavorites: function() {
      return this.get('favorites', []);
    },

    setFavorites: function(favs) {
      return this.set('favorites', favs);
    },

    isFavorite: function(trackId) {
      var favs = this.getFavorites();
      for (var i = 0; i < favs.length; i++) {
        if (favs[i] === trackId) {
          return true;
        }
      }
      return false;
    },

    toggleFavorite: function(trackId) {
      var favs = this.getFavorites();
      var index = -1;
      for (var i = 0; i < favs.length; i++) {
        if (favs[i] === trackId) {
          index = i;
          break;
        }
      }
      if (index >= 0) {
        favs.splice(index, 1);
        this.setFavorites(favs);
        return false;
      } else {
        favs.push(trackId);
        this.setFavorites(favs);
        return true;
      }
    },

    getPlaylists: function() {
      return this.get('playlists', []);
    },

    setPlaylists: function(playlists) {
      return this.set('playlists', playlists);
    },

    getLastPlayed: function() {
      return this.get('last_played', null);
    },

    setLastPlayed: function(state) {
      return this.set('last_played', state);
    },

    getSettings: function() {
      return this.get('settings', {
        volume: 0.9,
        shuffle: false,
        repeatMode: 0 // 0: off, 1: all, 2: one
      });
    },

    setSettings: function(settings) {
      return this.set('settings', settings);
    }
  };

  Nova.Storage = Storage;
})(window);
