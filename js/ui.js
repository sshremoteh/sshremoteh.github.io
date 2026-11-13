/* NOVA MUSIC - UI Controller & DOM Renderer (ES5 / webOS 2.0 WebKit Compatible) */
(function(window, document) {
  'use strict';

  var Nova = window.Nova || {};
  window.Nova = Nova;

  var currentView = 'home';
  var previousView = null;
  var viewHistory = [];
  var currentDetailData = null; // for playlist or album detail

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var UI = {
    init: function() {
      var self = this;

      // Bind nav items in sidebar
      var navButtons = document.querySelectorAll('.nav-item');
      for (var i = 0; i < navButtons.length; i++) {
        (function(btn) {
          btn.addEventListener('click', function() {
            var view = btn.getAttribute('data-target-view');
            if (view) {
              self.switchView(view);
            }
          }, false);
        })(navButtons[i]);
      }

      // Bind mini player controls
      var miniPlayBtn = document.getElementById('mini-play-btn');
      if (miniPlayBtn) {
        miniPlayBtn.addEventListener('click', function() {
          if (Nova.Player) Nova.Player.togglePlay();
        }, false);
      }

      var miniPrevBtn = document.getElementById('mini-prev-btn');
      if (miniPrevBtn) {
        miniPrevBtn.addEventListener('click', function() {
          if (Nova.Player) Nova.Player.playPrev();
        }, false);
      }

      var miniNextBtn = document.getElementById('mini-next-btn');
      if (miniNextBtn) {
        miniNextBtn.addEventListener('click', function() {
          if (Nova.Player) Nova.Player.playNext(true);
        }, false);
      }

      var miniExpandBtn = document.getElementById('mini-expand-btn');
      if (miniExpandBtn) {
        miniExpandBtn.addEventListener('click', function() {
          self.switchView('now_playing');
        }, false);
      }

      // Wire up player event listeners
      if (Nova.Player) {
        Nova.Player.on('playState', function(data) {
          self.updatePlayState(data.isPlaying, data.track);
        });

        Nova.Player.on('trackChange', function(data) {
          self.updateCurrentTrack(data.track);
        });

        Nova.Player.on('timeUpdate', function(data) {
          self.updateProgress(data);
        });

        Nova.Player.on('queueChange', function(data) {
          self.updateQueueUI(data.queue, data.queueIndex);
        });

        Nova.Player.on('error', function(data) {
          self.showToast('Error: ' + data.message, 4000);
        });
      }

      // Wire repository events
      if (Nova.RepositoryManager) {
        Nova.RepositoryManager.on('change', function() {
          self.refreshCurrentView();
        });
      }

      // Wire search events
      if (Nova.Search) {
        Nova.Search.on('search', function(data) {
          if (currentView === 'search') {
            self.renderSearchResults(data);
          }
        });
      }
    },

    handleBack: function() {
      // 1. If inside modal, close modal
      var modal = document.querySelector('.modal-container.active');
      if (modal) {
        this.closeModal();
        return true;
      }

      // 2. If in now_playing, return to previous view
      if (currentView === 'now_playing') {
        var backView = previousView || 'home';
        this.switchView(backView, false);
        return true;
      }

      // 3. If in detail view (e.g. playlist detail or album detail), return to parent view
      if (currentDetailData) {
        var parentView = currentDetailData.parentView || 'library';
        currentDetailData = null;
        this.switchView(parentView, false);
        return true;
      }

      // 4. If in search with query, clear query
      if (currentView === 'search' && Nova.Search && Nova.Search.getQuery()) {
        Nova.Search.clear();
        return true;
      }

      // 5. If in non-home view, return to home
      if (currentView !== 'home') {
        this.switchView('home', true);
        return true;
      }

      return false; // Let navigation jump to sidebar
    },

    switchView: function(viewName, pushToHistory) {
      if (pushToHistory !== false && currentView !== viewName) {
        previousView = currentView;
      }

      currentView = viewName;
      currentDetailData = null;

      // Update sidebar nav buttons
      var navButtons = document.querySelectorAll('.nav-item');
      for (var i = 0; i < navButtons.length; i++) {
        var btn = navButtons[i];
        if (btn.getAttribute('data-target-view') === viewName) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }

      // Toggle fullscreen now playing mode
      var appEl = document.getElementById('app');
      var nowPlayingView = document.getElementById('now-playing-view');
      var miniPlayer = document.getElementById('mini-player');
      var contentArea = document.getElementById('content-area');

      if (viewName === 'now_playing') {
        appEl.classList.add('now-playing-active');
        nowPlayingView.style.display = 'block';
        contentArea.style.display = 'none';
        miniPlayer.style.display = 'none';
        this.renderNowPlaying();
        // Focus play/pause button in now playing
        var playBtn = document.getElementById('np-play-btn');
        if (playBtn && Nova.Navigation) {
          Nova.Navigation.setFocus(playBtn);
        }
      } else {
        appEl.classList.remove('now-playing-active');
        nowPlayingView.style.display = 'none';
        contentArea.style.display = 'block';

        // Show mini player if there is a current track
        var playerState = Nova.Player ? Nova.Player.getState() : null;
        if (playerState && playerState.currentTrack) {
          miniPlayer.style.display = 'block';
        }

        this.renderView(viewName);

        // Auto focus first item in content area
        setTimeout(function() {
          var firstEl = contentArea.querySelector('.focusable');
          if (firstEl && Nova.Navigation) {
            Nova.Navigation.setFocus(firstEl);
          } else if (Nova.Navigation) {
            Nova.Navigation.focusSidebar();
          }
        }, 50);
      }
    },

    refreshCurrentView: function() {
      if (currentView === 'now_playing') {
        this.renderNowPlaying();
      } else {
        this.renderView(currentView);
      }
    },

    renderView: function(viewName) {
      var contentArea = document.getElementById('content-area');
      if (!contentArea) return;

      switch (viewName) {
        case 'home':
          this.renderHome(contentArea);
          break;
        case 'search':
          this.renderSearch(contentArea);
          break;
        case 'library':
          this.renderLibrary(contentArea);
          break;
        case 'playlists':
          this.renderPlaylists(contentArea);
          break;
        case 'repositories':
          this.renderRepositories(contentArea);
          break;
        default:
          this.renderHome(contentArea);
      }
    },

    /* ==========================================================================
       HOME VIEW
       ========================================================================== */
    renderHome: function(container) {
      var allTracks = Nova.RepositoryManager ? Nova.RepositoryManager.getAllTracks() : [];
      var html = '<div class="view-header">';
      html += '<h1 class="view-title">Home</h1>';
      html += '<p class="view-subtitle">Explore music from all connected repositories</p>';
      html += '</div>';

      if (allTracks.length === 0) {
        html += '<div class="empty-state">';
        html += '<div class="empty-icon">&#9835;</div>';
        html += '<h3>No music loaded yet</h3>';
        html += '<p>Add your first repository or check network connection.</p>';
        html += '<button class="btn btn-primary focusable" data-zone="content" id="home-goto-repo-btn">Manage Repositories</button>';
        html += '</div>';
        container.innerHTML = html;

        var repoBtn = document.getElementById('home-goto-repo-btn');
        if (repoBtn) {
          var self = this;
          repoBtn.addEventListener('click', function() {
            self.switchView('repositories');
          }, false);
        }
        return;
      }

      // 1. Featured / Recently Added Tracks Carousel
      html += '<div class="section-row">';
      html += '<div class="section-header">';
      html += '<h2 class="section-title">Featured Tracks</h2>';
      html += '</div>';
      html += '<div class="cards-carousel">';
      for (var i = 0; i < Math.min(allTracks.length, 6); i++) {
        var t = allTracks[i];
        html += '<div class="card card-track focusable" data-zone="content" data-track-id="' + escapeHtml(t.id) + '" data-index="' + i + '">';
        html += '  <div class="card-cover-wrap">';
        html += '    <img class="card-cover" src="' + escapeHtml(t.cover) + '" alt="' + escapeHtml(t.title) + '" />';
        html += '    <div class="card-play-overlay"><span class="play-icon">&#9658;</span></div>';
        html += '  </div>';
        html += '  <div class="card-info">';
        html += '    <div class="card-title">' + escapeHtml(t.title) + '</div>';
        html += '    <div class="card-sub">' + escapeHtml(t.artist) + '</div>';
        html += '  </div>';
        html += '</div>';
      }
      html += '</div></div>';

      // 2. Albums Section
      var albums = this.groupTracksByAlbum(allTracks);
      if (albums.length > 0) {
        html += '<div class="section-row">';
        html += '<div class="section-header">';
        html += '<h2 class="section-title">Albums</h2>';
        html += '</div>';
        html += '<div class="cards-carousel">';
        for (var a = 0; a < albums.length; a++) {
          var alb = albums[a];
          html += '<div class="card card-album focusable" data-zone="content" data-album-name="' + escapeHtml(alb.name) + '">';
          html += '  <div class="card-cover-wrap">';
          html += '    <img class="card-cover" src="' + escapeHtml(alb.cover) + '" alt="' + escapeHtml(alb.name) + '" />';
          html += '  </div>';
          html += '  <div class="card-info">';
          html += '    <div class="card-title">' + escapeHtml(alb.name) + '</div>';
          html += '    <div class="card-sub">' + escapeHtml(alb.artist) + ' &bull; ' + alb.tracks.length + ' tracks</div>';
          html += '  </div>';
          html += '</div>';
        }
        html += '</div></div>';
      }

      // 3. All Tracks Table/List
      html += '<div class="section-row">';
      html += '<div class="section-header">';
      html += '<h2 class="section-title">All Songs</h2>';
      html += '</div>';
      html += this.renderTrackTableHtml(allTracks);
      html += '</div>';

      container.innerHTML = html;
      this.bindTrackCards(container, allTracks);
      this.bindAlbumCards(container, albums);
      this.bindTrackRows(container, allTracks);
    },

    /* ==========================================================================
       SEARCH VIEW
       ========================================================================== */
    renderSearch: function(container) {
      var self = this;
      var query = Nova.Search ? Nova.Search.getQuery() : '';

      var html = '<div class="view-header">';
      html += '<h1 class="view-title">Search</h1>';
      html += '<p class="view-subtitle">Search by track title, artist, or album</p>';
      html += '</div>';

      html += '<div class="search-layout">';

      // Left Column: Virtual Keyboard
      html += '<div class="search-keyboard-col">';
      html += '  <div class="search-input-display">';
      html += '    <span class="search-icon">&#128269;</span>';
      html += '    <input type="text" id="search-text-input" class="search-input-field focusable" data-zone="content" placeholder="Type letters below..." value="' + escapeHtml(query) + '" />';
      html += '  </div>';

      html += '  <div class="virtual-keyboard">';
      var rows = Nova.Search ? Nova.Search.KEYBOARD_ROWS : [];
      for (var r = 0; r < rows.length; r++) {
        html += '<div class="keyboard-row">';
        for (var c = 0; c < rows[r].length; c++) {
          var key = rows[r][c];
          var keyClass = 'key-btn focusable';
          if (key === 'SPACE') keyClass += ' key-wide';
          if (key === 'BACKSPACE' || key === 'CLEAR') keyClass += ' key-action';
          html += '<button class="' + keyClass + '" data-zone="content" data-key="' + escapeHtml(key) + '">' + escapeHtml(key) + '</button>';
        }
        html += '</div>';
      }
      html += '  </div>';
      html += '</div>';

      // Right Column: Results Container
      html += '<div class="search-results-col" id="search-results-container">';
      html += '  <div class="search-placeholder">Start typing to search your music library</div>';
      html += '</div>';

      html += '</div>';

      container.innerHTML = html;

      // Bind input events
      var inputEl = document.getElementById('search-text-input');
      if (inputEl) {
        inputEl.addEventListener('input', function(e) {
          if (Nova.Search) {
            Nova.Search.setQuery(inputEl.value);
          }
        }, false);
      }

      // Bind virtual keyboard buttons
      var keyButtons = container.querySelectorAll('.key-btn');
      for (var k = 0; k < keyButtons.length; k++) {
        (function(btn) {
          btn.addEventListener('click', function() {
            var char = btn.getAttribute('data-key');
            if (Nova.Search) {
              var newQ = Nova.Search.appendChar(char);
              if (inputEl) inputEl.value = newQ;
            }
          }, false);
        })(keyButtons[k]);
      }

      // If query already existed, perform initial search render
      if (query && Nova.Search) {
        Nova.Search.performSearch(query);
      }
    },

    renderSearchResults: function(data) {
      var container = document.getElementById('search-results-container');
      if (!container) return;

      var q = data.query;
      var tracks = data.tracks;

      if (!q) {
        container.innerHTML = '<div class="search-placeholder">Start typing to search your music library</div>';
        return;
      }

      if (tracks.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No results found for "' + escapeHtml(q) + '"</h3><p>Try searching for a different keyword</p></div>';
        return;
      }

      var html = '<div class="search-results-header">';
      html += '  <h3>Found ' + tracks.length + ' result' + (tracks.length === 1 ? '' : 's') + '</h3>';
      html += '</div>';

      html += this.renderTrackTableHtml(tracks);
      container.innerHTML = html;
      this.bindTrackRows(container, tracks);
    },

    /* ==========================================================================
       LIBRARY VIEW
       ========================================================================== */
    renderLibrary: function(container) {
      var allTracks = Nova.RepositoryManager ? Nova.RepositoryManager.getAllTracks() : [];
      var favs = Nova.Storage ? Nova.Storage.getFavorites() : [];

      var favoriteTracks = [];
      for (var i = 0; i < allTracks.length; i++) {
        if (favs.indexOf(allTracks[i].id) !== -1) {
          favoriteTracks.push(allTracks[i]);
        }
      }

      var albums = this.groupTracksByAlbum(allTracks);
      var artists = this.groupTracksByArtist(allTracks);

      var html = '<div class="view-header">';
      html += '<h1 class="view-title">Library</h1>';
      html += '<p class="view-subtitle">' + allTracks.length + ' tracks in your collection</p>';
      html += '</div>';

      // Sub-tabs navigation
      html += '<div class="subtabs-bar">';
      html += '<button class="subtab-btn focusable active" data-zone="content" data-tab="all">All Tracks (' + allTracks.length + ')</button>';
      html += '<button class="subtab-btn focusable" data-zone="content" data-tab="favs">Favorites (' + favoriteTracks.length + ')</button>';
      html += '<button class="subtab-btn focusable" data-zone="content" data-tab="albums">Albums (' + albums.length + ')</button>';
      html += '<button class="subtab-btn focusable" data-zone="content" data-tab="artists">Artists (' + artists.length + ')</button>';
      html += '</div>';

      html += '<div id="library-tab-content">';
      html += this.renderTrackTableHtml(allTracks);
      html += '</div>';

      container.innerHTML = html;
      this.bindTrackRows(container, allTracks);

      // Bind tab buttons
      var tabButtons = container.querySelectorAll('.subtab-btn');
      var self = this;
      for (var t = 0; t < tabButtons.length; t++) {
        (function(btn) {
          btn.addEventListener('click', function() {
            for (var b = 0; b < tabButtons.length; b++) {
              tabButtons[b].classList.remove('active');
            }
            btn.classList.add('active');
            var tab = btn.getAttribute('data-tab');
            var contentDiv = document.getElementById('library-tab-content');
            if (!contentDiv) return;

            if (tab === 'all') {
              contentDiv.innerHTML = self.renderTrackTableHtml(allTracks);
              self.bindTrackRows(contentDiv, allTracks);
            } else if (tab === 'favs') {
              if (favoriteTracks.length === 0) {
                contentDiv.innerHTML = '<div class="empty-state"><h3>No favorites yet</h3><p>Mark songs with the star button to add them here.</p></div>';
              } else {
                contentDiv.innerHTML = self.renderTrackTableHtml(favoriteTracks);
                self.bindTrackRows(contentDiv, favoriteTracks);
              }
            } else if (tab === 'albums') {
              contentDiv.innerHTML = self.renderAlbumsGridHtml(albums);
              self.bindAlbumCards(contentDiv, albums);
            } else if (tab === 'artists') {
              contentDiv.innerHTML = self.renderArtistsGridHtml(artists);
              self.bindArtistCards(contentDiv, artists);
            }
          }, false);
        })(tabButtons[t]);
      }
    },

    /* ==========================================================================
       PLAYLISTS VIEW
       ========================================================================== */
    renderPlaylists: function(container) {
      var self = this;
      var playlists = Nova.Storage ? Nova.Storage.getPlaylists() : [];

      var html = '<div class="view-header view-header-actions">';
      html += '<div>';
      html += '  <h1 class="view-title">Playlists</h1>';
      html += '  <p class="view-subtitle">Organize and curate your favorite selections</p>';
      html += '</div>';
      html += '<button class="btn btn-primary focusable" data-zone="content" id="create-playlist-btn">+ New Playlist</button>';
      html += '</div>';

      if (playlists.length === 0) {
        html += '<div class="empty-state">';
        html += '<div class="empty-icon">&#127926;</div>';
        html += '<h3>No playlists created</h3>';
        html += '<p>Create custom playlists to group songs you love.</p>';
        html += '</div>';
      } else {
        html += '<div class="cards-grid">';
        for (var p = 0; p < playlists.length; p++) {
          var pl = playlists[p];
          var count = pl.trackIds ? pl.trackIds.length : 0;
          html += '<div class="card card-playlist focusable" data-zone="content" data-playlist-id="' + escapeHtml(pl.id) + '">';
          html += '  <div class="card-cover-wrap playlist-cover-wrap">';
          html += '    <div class="playlist-art-icon">&#127925;</div>';
          html += '  </div>';
          html += '  <div class="card-info">';
          html += '    <div class="card-title">' + escapeHtml(pl.name) + '</div>';
          html += '    <div class="card-sub">' + count + ' tracks</div>';
          html += '  </div>';
          html += '</div>';
        }
        html += '</div>';
      }

      container.innerHTML = html;

      // Bind create playlist button
      var createBtn = document.getElementById('create-playlist-btn');
      if (createBtn) {
        createBtn.addEventListener('click', function() {
          self.showCreatePlaylistModal();
        }, false);
      }

      // Bind playlist cards
      var plCards = container.querySelectorAll('.card-playlist');
      for (var c = 0; c < plCards.length; c++) {
        (function(card) {
          card.addEventListener('click', function() {
            var plId = card.getAttribute('data-playlist-id');
            self.showPlaylistDetail(plId);
          }, false);
        })(plCards[c]);
      }
    },

    showPlaylistDetail: function(playlistId) {
      var self = this;
      var playlists = Nova.Storage ? Nova.Storage.getPlaylists() : [];
      var playlist = null;
      for (var i = 0; i < playlists.length; i++) {
        if (playlists[i].id === playlistId) {
          playlist = playlists[i];
          break;
        }
      }
      if (!playlist) return;

      currentDetailData = {
        type: 'playlist',
        id: playlistId,
        parentView: 'playlists'
      };

      var tracks = [];
      if (playlist.trackIds && Nova.RepositoryManager) {
        for (var j = 0; j < playlist.trackIds.length; j++) {
          var t = Nova.RepositoryManager.getTrackById(playlist.trackIds[j]);
          if (t) tracks.push(t);
        }
      }

      var container = document.getElementById('content-area');
      var html = '<div class="view-header view-header-actions">';
      html += '<div>';
      html += '  <button class="btn btn-secondary focusable" data-zone="content" id="playlist-back-btn">&larr; Back</button>';
      html += '  <h1 class="view-title" style="margin-top:16px;">' + escapeHtml(playlist.name) + '</h1>';
      html += '  <p class="view-subtitle">' + tracks.length + ' tracks &bull; Created ' + new Date(playlist.createdAt || Date.now()).toLocaleDateString() + '</p>';
      html += '</div>';
      html += '<div class="header-buttons">';
      if (tracks.length > 0) {
        html += '  <button class="btn btn-primary focusable" data-zone="content" id="playlist-play-all-btn">&#9658; Play All</button>';
      }
      html += '  <button class="btn btn-danger focusable" data-zone="content" id="playlist-delete-btn">Delete Playlist</button>';
      html += '</div>';
      html += '</div>';

      if (tracks.length === 0) {
        html += '<div class="empty-state"><h3>Playlist is empty</h3><p>Add songs to this playlist from song lists</p></div>';
      } else {
        html += this.renderTrackTableHtml(tracks, true, playlist.id);
      }

      container.innerHTML = html;
      this.bindTrackRows(container, tracks);

      var backBtn = document.getElementById('playlist-back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', function() {
          currentDetailData = null;
          self.renderPlaylists(container);
        }, false);
      }

      var playAllBtn = document.getElementById('playlist-play-all-btn');
      if (playAllBtn) {
        playAllBtn.addEventListener('click', function() {
          if (Nova.Player) {
            Nova.Player.loadQueue(tracks, 0, true);
          }
        }, false);
      }

      var delBtn = document.getElementById('playlist-delete-btn');
      if (delBtn) {
        delBtn.addEventListener('click', function() {
          if (confirm('Delete playlist "' + playlist.name + '"?')) {
            var updated = [];
            for (var k = 0; k < playlists.length; k++) {
              if (playlists[k].id !== playlist.id) {
                updated.push(playlists[k]);
              }
            }
            if (Nova.Storage) Nova.Storage.setPlaylists(updated);
            self.showToast('Playlist deleted');
            currentDetailData = null;
            self.renderPlaylists(container);
          }
        }, false);
      }
    },

    /* ==========================================================================
       REPOSITORIES VIEW
       ========================================================================== */
    renderRepositories: function(container) {
      var self = this;
      var repos = Nova.RepositoryManager ? Nova.RepositoryManager.getRepositories() : [];

      var html = '<div class="view-header view-header-actions">';
      html += '<div>';
      html += '  <h1 class="view-title">Repositories</h1>';
      html += '  <p class="view-subtitle">Manage music catalogs & URL sources</p>';
      html += '</div>';
      html += '<div class="header-buttons">';
      html += '  <button class="btn btn-secondary focusable" data-zone="content" id="refresh-repos-btn">&#8635; Refresh All</button>';
      html += '  <button class="btn btn-primary focusable" data-zone="content" id="add-repo-btn">+ Add Repository</button>';
      html += '</div>';
      html += '</div>';

      html += '<div class="repos-list">';
      for (var r = 0; r < repos.length; r++) {
        var repo = repos[r];
        html += '<div class="repo-card focusable" data-zone="content" data-repo-id="' + escapeHtml(repo.id) + '">';
        html += '  <div class="repo-info">';
        html += '    <div class="repo-name">' + escapeHtml(repo.name) + '</div>';
        html += '    <div class="repo-url">' + escapeHtml(repo.url) + '</div>';
        if (repo.error) {
          html += '    <div class="repo-error">&#9888; ' + escapeHtml(repo.error) + '</div>';
        } else {
          html += '    <div class="repo-status">&#10003; Loaded: ' + (repo.trackCount || 0) + ' tracks</div>';
        }
        html += '  </div>';
        html += '  <div class="repo-actions">';
        html += '    <button class="btn btn-sm btn-danger focusable repo-del-btn" data-zone="content" data-repo-id="' + escapeHtml(repo.id) + '">Remove</button>';
        html += '  </div>';
        html += '</div>';
      }
      html += '</div>';

      container.innerHTML = html;

      // Add repo button
      var addBtn = document.getElementById('add-repo-btn');
      if (addBtn) {
        addBtn.addEventListener('click', function() {
          self.showAddRepositoryModal();
        }, false);
      }

      // Refresh repos button
      var refreshBtn = document.getElementById('refresh-repos-btn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
          self.showToast('Refreshing catalogs...');
          if (Nova.RepositoryManager) {
            Nova.RepositoryManager.refreshAll(function(err) {
              if (err) self.showToast('Refresh error: ' + err.message);
              else self.showToast('Catalogs updated successfully');
              self.renderRepositories(container);
            });
          }
        }, false);
      }

      // Remove repo buttons
      var delBtns = container.querySelectorAll('.repo-del-btn');
      for (var d = 0; d < delBtns.length; d++) {
        (function(btn) {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = btn.getAttribute('data-repo-id');
            if (confirm('Remove this repository?')) {
              if (Nova.RepositoryManager) {
                Nova.RepositoryManager.removeRepository(id, function() {
                  self.showToast('Repository removed');
                  self.renderRepositories(container);
                });
              }
            }
          }, false);
        })(delBtns[d]);
      }
    },

    /* ==========================================================================
       NOW PLAYING (FULLSCREEN)
       ========================================================================== */
    renderNowPlaying: function() {
      var playerState = Nova.Player ? Nova.Player.getState() : null;
      var track = playerState ? playerState.currentTrack : null;

      var coverEl = document.getElementById('np-cover');
      var titleEl = document.getElementById('np-title');
      var artistEl = document.getElementById('np-artist');
      var albumEl = document.getElementById('np-album');
      var repoBadge = document.getElementById('np-repo-badge');
      var playBtn = document.getElementById('np-play-btn');
      var shuffleBtn = document.getElementById('np-shuffle-btn');
      var repeatBtn = document.getElementById('np-repeat-btn');
      var favBtn = document.getElementById('np-fav-btn');

      if (track) {
        if (coverEl) coverEl.src = track.cover;
        if (titleEl) titleEl.textContent = track.title;
        if (artistEl) artistEl.textContent = track.artist;
        if (albumEl) albumEl.textContent = track.album;
        if (repoBadge) repoBadge.textContent = track.repoName || 'Local';
        if (favBtn) {
          var isFav = Nova.Storage ? Nova.Storage.isFavorite(track.id) : false;
          favBtn.innerHTML = isFav ? '&#9733;' : '&#9734;';
          favBtn.title = isFav ? 'In Favorites' : 'Add to Favorites';
        }
      } else {
        if (titleEl) titleEl.textContent = 'No track playing';
        if (artistEl) artistEl.textContent = 'Select a track to start playback';
        if (albumEl) albumEl.textContent = '';
      }

      if (playBtn) {
        playBtn.innerHTML = (playerState && playerState.isPlaying) ? '&#10074;&#10074;' : '&#9658;';
      }

      if (shuffleBtn && playerState) {
        if (playerState.isShuffle) {
          shuffleBtn.classList.add('active');
        } else {
          shuffleBtn.classList.remove('active');
        }
      }

      if (repeatBtn && playerState) {
        if (playerState.repeatMode === 1) {
          repeatBtn.classList.add('active');
          repeatBtn.innerHTML = '&#8635; All';
        } else if (playerState.repeatMode === 2) {
          repeatBtn.classList.add('active');
          repeatBtn.innerHTML = '&#8635; 1';
        } else {
          repeatBtn.classList.remove('active');
          repeatBtn.innerHTML = '&#8635; Off';
        }
      }

      // Render Up Next / Queue list
      if (playerState) {
        this.updateQueueUI(playerState.queue, playerState.queueIndex);
      }
    },

    updateQueueUI: function(queue, activeIndex) {
      var queueContainer = document.getElementById('np-queue-list');
      if (!queueContainer) return;

      if (!queue || queue.length === 0) {
        queueContainer.innerHTML = '<div class="empty-queue">Queue is empty</div>';
        return;
      }

      var html = '';
      for (var i = 0; i < queue.length; i++) {
        var t = queue[i];
        var isCurrent = (i === activeIndex);
        html += '<div class="queue-item focusable ' + (isCurrent ? 'active' : '') + '" data-zone="now-playing" data-queue-index="' + i + '">';
        html += '  <div class="queue-item-idx">' + (isCurrent ? '&#9658;' : (i + 1)) + '</div>';
        html += '  <img class="queue-item-thumb" src="' + escapeHtml(t.cover) + '" alt="" />';
        html += '  <div class="queue-item-info">';
        html += '    <div class="queue-item-title">' + escapeHtml(t.title) + '</div>';
        html += '    <div class="queue-item-artist">' + escapeHtml(t.artist) + '</div>';
        html += '  </div>';
        html += '</div>';
      }

      queueContainer.innerHTML = html;

      // Bind queue item clicks
      var items = queueContainer.querySelectorAll('.queue-item');
      for (var j = 0; j < items.length; j++) {
        (function(el) {
          el.addEventListener('click', function() {
            var idx = parseInt(el.getAttribute('data-queue-index'), 10);
            if (Nova.Player) {
              Nova.Player.loadQueue(queue, idx, true);
            }
          }, false);
        })(items[j]);
      }
    },

    /* ==========================================================================
       PROGRESS & PLAY STATE UPDATES
       ========================================================================== */
    updatePlayState: function(isPlaying, track) {
      // Mini player button
      var miniPlayBtn = document.getElementById('mini-play-btn');
      if (miniPlayBtn) {
        miniPlayBtn.innerHTML = isPlaying ? '&#10074;&#10074;' : '&#9658;';
      }

      // Now Playing button
      var npPlayBtn = document.getElementById('np-play-btn');
      if (npPlayBtn) {
        npPlayBtn.innerHTML = isPlaying ? '&#10074;&#10074;' : '&#9658;';
      }

      // Highlight active track rows in visible tables
      var activeRows = document.querySelectorAll('.track-row.playing');
      for (var r = 0; r < activeRows.length; r++) {
        activeRows[r].classList.remove('playing');
      }

      if (track) {
        var newActive = document.querySelectorAll('.track-row[data-track-id="' + track.id + '"]');
        for (var n = 0; n < newActive.length; n++) {
          newActive[n].classList.add('playing');
        }
      }
    },

    updateCurrentTrack: function(track) {
      if (!track) return;

      // Update Mini Player
      var miniCover = document.getElementById('mini-cover');
      var miniTitle = document.getElementById('mini-title');
      var miniArtist = document.getElementById('mini-artist');
      var miniPlayer = document.getElementById('mini-player');

      if (miniCover) miniCover.src = track.cover;
      if (miniTitle) miniTitle.textContent = track.title;
      if (miniArtist) miniArtist.textContent = track.artist;

      if (miniPlayer && currentView !== 'now_playing') {
        miniPlayer.style.display = 'block';
      }

      // Update Now Playing view if active
      if (currentView === 'now_playing') {
        this.renderNowPlaying();
      }
    },

    updateProgress: function(data) {
      var percent = 0;
      if (data.duration > 0) {
        percent = (data.currentTime / data.duration) * 100;
      }

      // Mini player progress
      var miniBar = document.getElementById('mini-progress-fill');
      if (miniBar) {
        miniBar.style.width = percent + '%';
      }

      // Now playing progress
      var npBar = document.getElementById('np-progress-fill');
      if (npBar) {
        npBar.style.width = percent + '%';
      }

      var npCurTime = document.getElementById('np-current-time');
      if (npCurTime) {
        npCurTime.textContent = data.formattedCurrent;
      }

      var npDurTime = document.getElementById('np-total-time');
      if (npDurTime) {
        npDurTime.textContent = data.formattedDuration;
      }
    },

    /* ==========================================================================
       MODALS & DIALOGS
       ========================================================================== */
    showAddRepositoryModal: function() {
      var self = this;
      var defaultUrl = (window.location.protocol || 'https:') + '//' + window.location.host + window.location.pathname;
      if (defaultUrl.slice(-1) !== '/') {
        var lastSlash = defaultUrl.lastIndexOf('/');
        defaultUrl = defaultUrl.substring(0, lastSlash + 1);
      }
      var showcaseUrl = defaultUrl + 'repository.json';

      var html = '<div class="modal-box">';
      html += '  <h2 class="modal-title">Add Music Repository</h2>';
      html += '  <p class="modal-desc">Enter the public URL of a valid repository.json descriptor.</p>';
      html += '  <div class="modal-input-wrap">';
      html += '    <input type="text" id="add-repo-input" class="modal-input focusable" data-zone="modal" placeholder="https://example.com/repository.json" value="' + escapeHtml(showcaseUrl) + '" />';
      html += '  </div>';
      html += '  <div class="preset-links-title">Or load sample repository:</div>';
      html += '  <div class="preset-links">';
      html += '    <button class="btn btn-sm btn-secondary focusable preset-url-btn" data-zone="modal" data-url="' + escapeHtml(showcaseUrl) + '">Official Showcase (Default)</button>';
      html += '  </div>';
      html += '  <div class="modal-buttons">';
      html += '    <button class="btn btn-secondary focusable" data-zone="modal" id="modal-cancel-btn">Cancel</button>';
      html += '    <button class="btn btn-primary focusable" data-zone="modal" id="modal-confirm-add-btn">Add & Load</button>';
      html += '  </div>';
      html += '</div>';

      this.openModal(html);

      var input = document.getElementById('add-repo-input');
      var presetBtns = document.querySelectorAll('.preset-url-btn');
      for (var p = 0; p < presetBtns.length; p++) {
        (function(btn) {
          btn.addEventListener('click', function() {
            if (input) input.value = btn.getAttribute('data-url');
          }, false);
        })(presetBtns[p]);
      }

      var cancelBtn = document.getElementById('modal-cancel-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
          self.closeModal();
        }, false);
      }

      var confirmBtn = document.getElementById('modal-confirm-add-btn');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
          var url = input ? input.value : '';
          if (!url) {
            alert('Please enter a URL');
            return;
          }
          self.showToast('Adding repository...');
          if (Nova.RepositoryManager) {
            Nova.RepositoryManager.addRepository(url, function(err, newRepo) {
              if (err) {
                alert('Failed to add repository: ' + err.message);
              } else {
                self.showToast('Repository "' + newRepo.name + '" added!');
                self.closeModal();
                self.refreshCurrentView();
              }
            });
          }
        }, false);
      }
    },

    showCreatePlaylistModal: function() {
      var self = this;
      var html = '<div class="modal-box">';
      html += '  <h2 class="modal-title">Create New Playlist</h2>';
      html += '  <div class="modal-input-wrap">';
      html += '    <input type="text" id="new-playlist-input" class="modal-input focusable" data-zone="modal" placeholder="Playlist Name" value="My Favorites" />';
      html += '  </div>';
      html += '  <div class="modal-buttons">';
      html += '    <button class="btn btn-secondary focusable" data-zone="modal" id="modal-cancel-pl-btn">Cancel</button>';
      html += '    <button class="btn btn-primary focusable" data-zone="modal" id="modal-confirm-pl-btn">Create</button>';
      html += '  </div>';
      html += '</div>';

      this.openModal(html);

      var input = document.getElementById('new-playlist-input');
      var cancelBtn = document.getElementById('modal-cancel-pl-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
          self.closeModal();
        }, false);
      }

      var confirmBtn = document.getElementById('modal-confirm-pl-btn');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
          var name = input ? input.value.trim() : '';
          if (!name) {
            alert('Please enter a playlist name');
            return;
          }
          var playlists = Nova.Storage ? Nova.Storage.getPlaylists() : [];
          var newPl = {
            id: 'pl_' + Date.now(),
            name: name,
            createdAt: Date.now(),
            trackIds: []
          };
          playlists.push(newPl);
          if (Nova.Storage) Nova.Storage.setPlaylists(playlists);
          self.showToast('Playlist "' + name + '" created!');
          self.closeModal();
          self.refreshCurrentView();
        }, false);
      }
    },

    showAddToPlaylistModal: function(trackId) {
      var self = this;
      var playlists = Nova.Storage ? Nova.Storage.getPlaylists() : [];

      if (playlists.length === 0) {
        alert('No playlists exist yet. Please create a playlist first.');
        return;
      }

      var html = '<div class="modal-box">';
      html += '  <h2 class="modal-title">Add to Playlist</h2>';
      html += '  <div class="modal-pl-list">';
      for (var i = 0; i < playlists.length; i++) {
        var pl = playlists[i];
        html += '<button class="modal-pl-item focusable" data-zone="modal" data-pl-id="' + escapeHtml(pl.id) + '">' + escapeHtml(pl.name) + '</button>';
      }
      html += '  </div>';
      html += '  <div class="modal-buttons">';
      html += '    <button class="btn btn-secondary focusable" data-zone="modal" id="modal-cancel-add-pl">Cancel</button>';
      html += '  </div>';
      html += '</div>';

      this.openModal(html);

      var cancelBtn = document.getElementById('modal-cancel-add-pl');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
          self.closeModal();
        }, false);
      }

      var plItems = document.querySelectorAll('.modal-pl-item');
      for (var j = 0; j < plItems.length; j++) {
        (function(btn) {
          btn.addEventListener('click', function() {
            var plId = btn.getAttribute('data-pl-id');
            for (var k = 0; k < playlists.length; k++) {
              if (playlists[k].id === plId) {
                if (!playlists[k].trackIds) playlists[k].trackIds = [];
                if (playlists[k].trackIds.indexOf(trackId) === -1) {
                  playlists[k].trackIds.push(trackId);
                  if (Nova.Storage) Nova.Storage.setPlaylists(playlists);
                  self.showToast('Added to "' + playlists[k].name + '"');
                } else {
                  self.showToast('Already in playlist');
                }
                break;
              }
            }
            self.closeModal();
          }, false);
        })(plItems[j]);
      }
    },

    openModal: function(contentHtml) {
      var modalContainer = document.getElementById('modal-container');
      if (!modalContainer) return;

      modalContainer.innerHTML = contentHtml;
      modalContainer.classList.add('active');

      // Focus first focusable inside modal
      setTimeout(function() {
        var firstEl = modalContainer.querySelector('.focusable');
        if (firstEl && Nova.Navigation) {
          Nova.Navigation.setFocus(firstEl);
        }
      }, 50);
    },

    closeModal: function() {
      var modalContainer = document.getElementById('modal-container');
      if (!modalContainer) return;

      modalContainer.classList.remove('active');
      modalContainer.innerHTML = '';

      // Return focus to content
      if (Nova.Navigation) {
        Nova.Navigation.restoreContentFocus();
      }
    },

    showToast: function(message, durationMs) {
      var toast = document.getElementById('toast-notification');
      if (!toast) return;

      toast.textContent = message;
      toast.classList.add('visible');

      clearTimeout(this._toastTimeout);
      this._toastTimeout = setTimeout(function() {
        toast.classList.remove('visible');
      }, durationMs || 3000);
    },

    /* ==========================================================================
       HELPERS & BINDINGS
       ========================================================================== */
    groupTracksByAlbum: function(tracks) {
      var albumMap = {};
      var list = [];
      for (var i = 0; i < tracks.length; i++) {
        var t = tracks[i];
        var albName = t.album || 'Single';
        if (!albumMap[albName]) {
          albumMap[albName] = {
            name: albName,
            artist: t.artist,
            cover: t.cover,
            tracks: []
          };
          list.push(albumMap[albName]);
        }
        albumMap[albName].tracks.push(t);
      }
      return list;
    },

    groupTracksByArtist: function(tracks) {
      var artistMap = {};
      var list = [];
      for (var i = 0; i < tracks.length; i++) {
        var t = tracks[i];
        var artName = t.artist || 'Unknown Artist';
        if (!artistMap[artName]) {
          artistMap[artName] = {
            name: artName,
            cover: t.cover,
            tracks: []
          };
          list.push(artistMap[artName]);
        }
        artistMap[artName].tracks.push(t);
      }
      return list;
    },

    renderTrackTableHtml: function(tracks, isPlaylist, playlistId) {
      var self = this;
      var curTrack = Nova.Player ? Nova.Player.getState().currentTrack : null;

      var html = '<div class="tracks-table">';
      html += '  <div class="tracks-header-row">';
      html += '    <div class="th-num">#</div>';
      html += '    <div class="th-title">Title</div>';
      html += '    <div class="th-artist">Artist</div>';
      html += '    <div class="th-album">Album</div>';
      html += '    <div class="th-dur">Time</div>';
      html += '    <div class="th-actions">Actions</div>';
      html += '  </div>';

      for (var i = 0; i < tracks.length; i++) {
        var t = tracks[i];
        var isPlaying = curTrack && curTrack.id === t.id;
        var isFav = Nova.Storage ? Nova.Storage.isFavorite(t.id) : false;

        html += '<div class="track-row focusable ' + (isPlaying ? 'playing' : '') + '" data-zone="content" data-track-id="' + escapeHtml(t.id) + '" data-index="' + i + '">';
        html += '  <div class="td-num">' + (isPlaying ? '&#9658;' : (i + 1)) + '</div>';
        html += '  <div class="td-title">';
        html += '    <img class="td-thumb" src="' + escapeHtml(t.cover) + '" alt="" />';
        html += '    <span class="td-title-text">' + escapeHtml(t.title) + '</span>';
        html += '  </div>';
        html += '  <div class="td-artist">' + escapeHtml(t.artist) + '</div>';
        html += '  <div class="td-album">' + escapeHtml(t.album) + '</div>';
        html += '  <div class="td-dur">' + (Nova.Player ? Nova.Player.formatTime(t.duration) : '--:--') + '</div>';
        html += '  <div class="td-actions">';
        html += '    <button class="btn-action focusable star-btn ' + (isFav ? 'active' : '') + '" data-zone="content" data-track-id="' + escapeHtml(t.id) + '" title="Favorite">' + (isFav ? '&#9733;' : '&#9734;') + '</button>';
        html += '    <button class="btn-action focusable add-pl-btn" data-zone="content" data-track-id="' + escapeHtml(t.id) + '" title="Add to playlist">+</button>';
        if (isPlaylist && playlistId) {
          html += '    <button class="btn-action focusable remove-pl-btn" data-zone="content" data-track-id="' + escapeHtml(t.id) + '" data-pl-id="' + escapeHtml(playlistId) + '" title="Remove">&times;</button>';
        }
        html += '  </div>';
        html += '</div>';
      }
      html += '</div>';
      return html;
    },

    bindTrackRows: function(container, tracks) {
      var self = this;
      var rows = container.querySelectorAll('.track-row');
      for (var i = 0; i < rows.length; i++) {
        (function(row) {
          row.addEventListener('click', function(e) {
            // If clicked on an inner action button, don't play track
            if (e.target.classList.contains('btn-action') || e.target.parentElement.classList.contains('btn-action')) {
              return;
            }
            var idx = parseInt(row.getAttribute('data-index'), 10);
            if (Nova.Player) {
              Nova.Player.loadQueue(tracks, idx, true);
            }
          }, false);
        })(rows[i]);
      }

      // Star favorite buttons
      var starBtns = container.querySelectorAll('.star-btn');
      for (var s = 0; s < starBtns.length; s++) {
        (function(btn) {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = btn.getAttribute('data-track-id');
            if (Nova.Storage) {
              var isFav = Nova.Storage.toggleFavorite(id);
              btn.innerHTML = isFav ? '&#9733;' : '&#9734;';
              if (isFav) btn.classList.add('active');
              else btn.classList.remove('active');
              self.showToast(isFav ? 'Added to Favorites' : 'Removed from Favorites');
            }
          }, false);
        })(starBtns[s]);
      }

      // Add to playlist buttons
      var addPlBtns = container.querySelectorAll('.add-pl-btn');
      for (var a = 0; a < addPlBtns.length; a++) {
        (function(btn) {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = btn.getAttribute('data-track-id');
            self.showAddToPlaylistModal(id);
          }, false);
        })(addPlBtns[a]);
      }

      // Remove from playlist buttons
      var remBtns = container.querySelectorAll('.remove-pl-btn');
      for (var r = 0; r < remBtns.length; r++) {
        (function(btn) {
          btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var tId = btn.getAttribute('data-track-id');
            var plId = btn.getAttribute('data-pl-id');
            var playlists = Nova.Storage ? Nova.Storage.getPlaylists() : [];
            for (var p = 0; p < playlists.length; p++) {
              if (playlists[p].id === plId) {
                var idx = playlists[p].trackIds ? playlists[p].trackIds.indexOf(tId) : -1;
                if (idx >= 0) {
                  playlists[p].trackIds.splice(idx, 1);
                  if (Nova.Storage) Nova.Storage.setPlaylists(playlists);
                  self.showToast('Track removed from playlist');
                  self.showPlaylistDetail(plId);
                }
                break;
              }
            }
          }, false);
        })(remBtns[r]);
      }
    },

    bindTrackCards: function(container, tracks) {
      var cards = container.querySelectorAll('.card-track');
      for (var i = 0; i < cards.length; i++) {
        (function(card) {
          card.addEventListener('click', function() {
            var idx = parseInt(card.getAttribute('data-index'), 10);
            if (Nova.Player) {
              Nova.Player.loadQueue(tracks, idx, true);
            }
          }, false);
        })(cards[i]);
      }
    },

    bindAlbumCards: function(container, albums) {
      var self = this;
      var cards = container.querySelectorAll('.card-album');
      for (var i = 0; i < cards.length; i++) {
        (function(card) {
          card.addEventListener('click', function() {
            var albumName = card.getAttribute('data-album-name');
            for (var a = 0; a < albums.length; a++) {
              if (albums[a].name === albumName) {
                self.showAlbumDetail(albums[a]);
                break;
              }
            }
          }, false);
        })(cards[i]);
      }
    },

    showAlbumDetail: function(album) {
      var self = this;
      currentDetailData = {
        type: 'album',
        id: album.name,
        parentView: currentView
      };

      var container = document.getElementById('content-area');
      var html = '<div class="view-header view-header-actions">';
      html += '<div>';
      html += '  <button class="btn btn-secondary focusable" data-zone="content" id="album-back-btn">&larr; Back</button>';
      html += '  <h1 class="view-title" style="margin-top:16px;">' + escapeHtml(album.name) + '</h1>';
      html += '  <p class="view-subtitle">' + escapeHtml(album.artist) + ' &bull; ' + album.tracks.length + ' tracks</p>';
      html += '</div>';
      html += '<div class="header-buttons">';
      html += '  <button class="btn btn-primary focusable" data-zone="content" id="album-play-all-btn">&#9658; Play Album</button>';
      html += '</div>';
      html += '</div>';

      html += this.renderTrackTableHtml(album.tracks);

      container.innerHTML = html;
      this.bindTrackRows(container, album.tracks);

      var backBtn = document.getElementById('album-back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', function() {
          currentDetailData = null;
          self.renderView(currentView);
        }, false);
      }

      var playAllBtn = document.getElementById('album-play-all-btn');
      if (playAllBtn) {
        playAllBtn.addEventListener('click', function() {
          if (Nova.Player) {
            Nova.Player.loadQueue(album.tracks, 0, true);
          }
        }, false);
      }
    },

    bindArtistCards: function(container, artists) {
      var self = this;
      var cards = container.querySelectorAll('.card-artist');
      for (var i = 0; i < cards.length; i++) {
        (function(card) {
          card.addEventListener('click', function() {
            var artName = card.getAttribute('data-artist-name');
            for (var a = 0; a < artists.length; a++) {
              if (artists[a].name === artName) {
                self.showArtistDetail(artists[a]);
                break;
              }
            }
          }, false);
        })(cards[i]);
      }
    },

    showArtistDetail: function(artist) {
      var self = this;
      currentDetailData = {
        type: 'artist',
        id: artist.name,
        parentView: currentView
      };

      var container = document.getElementById('content-area');
      var html = '<div class="view-header view-header-actions">';
      html += '<div>';
      html += '  <button class="btn btn-secondary focusable" data-zone="content" id="artist-back-btn">&larr; Back</button>';
      html += '  <h1 class="view-title" style="margin-top:16px;">' + escapeHtml(artist.name) + '</h1>';
      html += '  <p class="view-subtitle">' + artist.tracks.length + ' tracks</p>';
      html += '</div>';
      html += '<div class="header-buttons">';
      html += '  <button class="btn btn-primary focusable" data-zone="content" id="artist-play-all-btn">&#9658; Play All</button>';
      html += '</div>';
      html += '</div>';

      html += this.renderTrackTableHtml(artist.tracks);

      container.innerHTML = html;
      this.bindTrackRows(container, artist.tracks);

      var backBtn = document.getElementById('artist-back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', function() {
          currentDetailData = null;
          self.renderView(currentView);
        }, false);
      }

      var playAllBtn = document.getElementById('artist-play-all-btn');
      if (playAllBtn) {
        playAllBtn.addEventListener('click', function() {
          if (Nova.Player) {
            Nova.Player.loadQueue(artist.tracks, 0, true);
          }
        }, false);
      }
    },

    renderAlbumsGridHtml: function(albums) {
      if (albums.length === 0) {
        return '<div class="empty-state"><h3>No albums found</h3></div>';
      }
      var html = '<div class="cards-grid">';
      for (var i = 0; i < albums.length; i++) {
        var alb = albums[i];
        html += '<div class="card card-album focusable" data-zone="content" data-album-name="' + escapeHtml(alb.name) + '">';
        html += '  <div class="card-cover-wrap">';
        html += '    <img class="card-cover" src="' + escapeHtml(alb.cover) + '" alt="' + escapeHtml(alb.name) + '" />';
        html += '  </div>';
        html += '  <div class="card-info">';
        html += '    <div class="card-title">' + escapeHtml(alb.name) + '</div>';
        html += '    <div class="card-sub">' + escapeHtml(alb.artist) + ' &bull; ' + alb.tracks.length + ' tracks</div>';
        html += '  </div>';
        html += '</div>';
      }
      html += '</div>';
      return html;
    },

    renderArtistsGridHtml: function(artists) {
      if (artists.length === 0) {
        return '<div class="empty-state"><h3>No artists found</h3></div>';
      }
      var html = '<div class="cards-grid">';
      for (var i = 0; i < artists.length; i++) {
        var art = artists[i];
        html += '<div class="card card-artist focusable" data-zone="content" data-artist-name="' + escapeHtml(art.name) + '">';
        html += '  <div class="card-cover-wrap artist-cover-wrap">';
        html += '    <img class="card-cover artist-avatar" src="' + escapeHtml(art.cover) + '" alt="' + escapeHtml(art.name) + '" />';
        html += '  </div>';
        html += '  <div class="card-info">';
        html += '    <div class="card-title">' + escapeHtml(art.name) + '</div>';
        html += '    <div class="card-sub">' + art.tracks.length + ' tracks</div>';
        html += '  </div>';
        html += '</div>';
      }
      html += '</div>';
      return html;
    }
  };

  Nova.UI = UI;
})(window, document);
