/* NOVA MUSIC - Search Engine & TV Keyboard (ES5 / webOS 2.0 WebKit Compatible) */
(function(window) {
  'use strict';

  var Nova = window.Nova || {};
  window.Nova = Nova;

  var currentQuery = '';
  var listeners = {
    search: []
  };

  // Keyboard layout for TV remote navigation
  var KEYBOARD_ROWS = [
    ['A', 'B', 'C', 'D', 'E', 'F', '1', '2', '3'],
    ['G', 'H', 'I', 'J', 'K', 'L', '4', '5', '6'],
    ['M', 'N', 'O', 'P', 'Q', 'R', '7', '8', '9'],
    ['S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0'],
    ['SPACE', 'BACKSPACE', 'CLEAR']
  ];

  var Search = {
    KEYBOARD_ROWS: KEYBOARD_ROWS,

    getQuery: function() {
      return currentQuery;
    },

    setQuery: function(query) {
      currentQuery = String(query || '');
      this.performSearch(currentQuery);
    },

    appendChar: function(char) {
      if (char === 'SPACE') {
        currentQuery += ' ';
      } else if (char === 'BACKSPACE') {
        if (currentQuery.length > 0) {
          currentQuery = currentQuery.substring(0, currentQuery.length - 1);
        }
      } else if (char === 'CLEAR') {
        currentQuery = '';
      } else {
        currentQuery += char;
      }
      this.performSearch(currentQuery);
      return currentQuery;
    },

    clear: function() {
      currentQuery = '';
      this.performSearch('');
    },

    on: function(event, callback) {
      if (listeners[event]) {
        listeners[event].push(callback);
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

    performSearch: function(query) {
      var q = (query || '').trim().toLowerCase();
      var allTracks = Nova.RepositoryManager ? Nova.RepositoryManager.getAllTracks() : [];

      if (!q) {
        this.emit('search', {
          query: '',
          tracks: allTracks,
          byTitle: [],
          byArtist: [],
          byAlbum: []
        });
        return;
      }

      var matchedTracks = [];
      var byTitle = [];
      var byArtist = [];
      var byAlbum = [];

      for (var i = 0; i < allTracks.length; i++) {
        var track = allTracks[i];
        var titleMatch = track.title && track.title.toLowerCase().indexOf(q) !== -1;
        var artistMatch = track.artist && track.artist.toLowerCase().indexOf(q) !== -1;
        var albumMatch = track.album && track.album.toLowerCase().indexOf(q) !== -1;

        if (titleMatch || artistMatch || albumMatch) {
          matchedTracks.push(track);
          if (titleMatch) byTitle.push(track);
          if (artistMatch) byArtist.push(track);
          if (albumMatch) byAlbum.push(track);
        }
      }

      this.emit('search', {
        query: query,
        tracks: matchedTracks,
        byTitle: byTitle,
        byArtist: byArtist,
        byAlbum: byAlbum
      });
    }
  };

  Nova.Search = Search;
})(window);
