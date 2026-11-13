/* NOVA MUSIC - Repository Manager (ES5 / webOS 2.0 WebKit Compatible) */
(function(window) {
  'use strict';

  var Nova = window.Nova || {};
  window.Nova = Nova;

  var repositories = [];
  var allTracks = [];
  var listeners = {
    change: [],
    error: []
  };

  // URL resolution helper compatible with WebKit 538.2
  function resolveUrl(relative, base) {
    if (!relative) return '';
    // Check if absolute URL (http:// or https://)
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(relative)) {
      return relative;
    }
    // If protocol-relative (//example.com)
    if (relative.indexOf('//') === 0) {
      return (window.location.protocol || 'https:') + relative;
    }
    // Base resolution
    var a = document.createElement('a');
    a.href = base || window.location.href;
    var protocol = a.protocol;
    var host = a.host;
    var pathname = a.pathname;

    // Ensure leading slash for pathname
    if (pathname.charAt(0) !== '/') {
      pathname = '/' + pathname;
    }

    if (relative.charAt(0) === '/') {
      return protocol + '//' + host + relative;
    }

    // Relative to directory of base
    var lastSlash = pathname.lastIndexOf('/');
    var dir = (lastSlash >= 0) ? pathname.substring(0, lastSlash + 1) : '/';
    return protocol + '//' + host + dir + relative;
  }

  // Safe XMLHttpRequest in ES5
  function fetchJson(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.timeout = 10000; // 10s timeout
    xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304 || (xhr.status === 0 && xhr.responseText)) {
          try {
            var data = JSON.parse(xhr.responseText);
            callback(null, data);
          } catch (err) {
            callback(new Error('Invalid JSON format in ' + url));
          }
        } else {
          callback(new Error('HTTP ' + xhr.status + ' loading ' + url));
        }
      }
    };

    xhr.ontimeout = function() {
      callback(new Error('Request timeout loading ' + url));
    };

    xhr.onerror = function() {
      callback(new Error('Network or CORS error loading ' + url));
    };

    try {
      xhr.send(null);
    } catch (e) {
      callback(new Error('Failed to send request: ' + e.message));
    }
  }

  var RepositoryManager = {
    init: function(callback) {
      var self = this;
      var savedRepos = Nova.Storage ? Nova.Storage.getRepositories() : [];

      if (!savedRepos || savedRepos.length === 0) {
        // Add default repository relative to current page
        var defaultRepoUrl = resolveUrl('repository.json', window.location.href);
        savedRepos = [{
          id: 'nova-official',
          name: 'NOVA Official Showcase',
          url: defaultRepoUrl,
          enabled: true
        }];
        if (Nova.Storage) {
          Nova.Storage.setRepositories(savedRepos);
        }
      }

      repositories = savedRepos;
      this.refreshAll(callback);
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

    getRepositories: function() {
      return repositories.slice(0);
    },

    getAllTracks: function() {
      return allTracks.slice(0);
    },

    getTrackById: function(trackId) {
      for (var i = 0; i < allTracks.length; i++) {
        if (allTracks[i].id === trackId) {
          return allTracks[i];
        }
      }
      return null;
    },

    addRepository: function(repoUrl, callback) {
      var self = this;
      if (!repoUrl || typeof repoUrl !== 'string') {
        if (callback) callback(new Error('Repository URL is required'));
        return;
      }

      var cleanUrl = repoUrl.trim();
      // Check duplicate URL
      for (var i = 0; i < repositories.length; i++) {
        if (repositories[i].url === cleanUrl) {
          if (callback) callback(new Error('Repository already exists'));
          return;
        }
      }

      // Fetch and validate repository descriptor
      fetchJson(cleanUrl, function(err, repoData) {
        if (err) {
          if (callback) callback(err);
          return;
        }

        if (!repoData || typeof repoData !== 'object') {
          if (callback) callback(new Error('Invalid repository metadata'));
          return;
        }

        var repoId = repoData.id || ('repo_' + Date.now());
        var repoName = repoData.name || 'Custom Repository';
        var tracksRef = repoData.tracks;

        if (!tracksRef) {
          if (callback) callback(new Error('Repository missing "tracks" field'));
          return;
        }

        var newRepo = {
          id: repoId,
          name: repoName,
          url: cleanUrl,
          enabled: true,
          trackCount: 0,
          lastUpdated: Date.now()
        };

        repositories.push(newRepo);
        if (Nova.Storage) {
          Nova.Storage.setRepositories(repositories);
        }

        self.loadSingleRepository(newRepo, function(loadErr) {
          self.rebuildTracks();
          if (callback) callback(loadErr, newRepo);
        });
      });
    },

    removeRepository: function(repoId, callback) {
      var index = -1;
      for (var i = 0; i < repositories.length; i++) {
        if (repositories[i].id === repoId) {
          index = i;
          break;
        }
      }

      if (index >= 0) {
        repositories.splice(index, 1);
        if (Nova.Storage) {
          Nova.Storage.setRepositories(repositories);
        }
        this.rebuildTracks();
        if (callback) callback(null);
      } else {
        if (callback) callback(new Error('Repository not found'));
      }
    },

    refreshAll: function(callback) {
      var self = this;
      var remaining = repositories.length;
      if (remaining === 0) {
        self.rebuildTracks();
        if (callback) callback(null, []);
        return;
      }

      for (var i = 0; i < repositories.length; i++) {
        (function(repo) {
          self.loadSingleRepository(repo, function() {
            remaining--;
            if (remaining === 0) {
              self.rebuildTracks();
              if (callback) callback(null, allTracks);
            }
          });
        })(repositories[i]);
      }
    },

    loadSingleRepository: function(repo, callback) {
      var self = this;
      if (!repo.enabled) {
        repo._cachedTracks = [];
        repo.trackCount = 0;
        if (callback) callback(null);
        return;
      }

      fetchJson(repo.url, function(err, repoData) {
        if (err) {
          repo.error = err.message;
          repo._cachedTracks = [];
          repo.trackCount = 0;
          if (callback) callback(err);
          return;
        }

        repo.name = repoData.name || repo.name;
        var tracksUrl = resolveUrl(repoData.tracks, repo.url);

        fetchJson(tracksUrl, function(tErr, tracksData) {
          if (tErr) {
            repo.error = tErr.message;
            repo._cachedTracks = [];
            repo.trackCount = 0;
            if (callback) callback(tErr);
            return;
          }

          var rawTracks = [];
          if (tracksData && Array.isArray(tracksData.tracks)) {
            rawTracks = tracksData.tracks;
          } else if (Array.isArray(tracksData)) {
            rawTracks = tracksData;
          }

          var validatedTracks = [];
          for (var j = 0; j < rawTracks.length; j++) {
            var raw = rawTracks[j];
            if (!raw || !raw.title || !raw.audio) continue;

            var trackId = raw.id || (repo.id + '_t_' + j);
            var audioUrl = resolveUrl(raw.audio, tracksUrl);
            var coverUrl = raw.cover ? resolveUrl(raw.cover, tracksUrl) : 'assets/covers/default_cover.svg';

            validatedTracks.push({
              id: trackId,
              title: String(raw.title),
              artist: String(raw.artist || 'Unknown Artist'),
              album: String(raw.album || 'Single'),
              cover: coverUrl,
              audio: audioUrl,
              format: String(raw.format || 'mp3').toLowerCase(),
              duration: typeof raw.duration === 'number' ? raw.duration : 0,
              repoId: repo.id,
              repoName: repo.name,
              repoUrl: repo.url
            });
          }

          repo.error = null;
          repo.trackCount = validatedTracks.length;
          repo._cachedTracks = validatedTracks;
          repo.lastUpdated = Date.now();

          if (callback) callback(null);
        });
      });
    },

    rebuildTracks: function() {
      var trackMap = {};
      var combined = [];

      for (var i = 0; i < repositories.length; i++) {
        var repo = repositories[i];
        if (!repo.enabled || !repo._cachedTracks) continue;

        for (var j = 0; j < repo._cachedTracks.length; j++) {
          var t = repo._cachedTracks[j];
          if (!trackMap[t.id]) {
            trackMap[t.id] = true;
            combined.push(t);
          }
        }
      }

      allTracks = combined;
      this.emit('change', { tracks: allTracks, repositories: repositories });
    }
  };

  Nova.RepositoryManager = RepositoryManager;
})(window);
