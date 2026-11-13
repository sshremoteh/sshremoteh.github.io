var assert = require('assert');
var fs = require('fs');
var path = require('path');

console.log('--- RUNNING NOVA MUSIC INTEGRATION TESTS ---');

// 1. Test JSON Schema Validity
console.log('1. Checking JSON files validity...');
var startJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'start.json'), 'utf8'));
assert(startJson.name, 'start.json missing name');
assert(startJson.parameter, 'start.json missing parameter');
console.log('   [PASS] start.json is valid');

var menuJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'menu.json'), 'utf8'));
assert(menuJson.menu && menuJson.menu.length > 0, 'menu.json missing menu items');
assert(menuJson.menu[0].action, 'menu.json item missing action');
console.log('   [PASS] menu.json is valid');

var repoJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'repository.json'), 'utf8'));
assert(repoJson.name && repoJson.tracks, 'repository.json invalid structure');
console.log('   [PASS] repository.json is valid');

var tracksJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tracks.json'), 'utf8'));
assert(Array.isArray(tracksJson.tracks) && tracksJson.tracks.length > 0, 'tracks.json must contain non-empty tracks array');
for (var i = 0; i < tracksJson.tracks.length; i++) {
  var t = tracksJson.tracks[i];
  assert(t.id && t.title && t.audio, 'Track ' + i + ' missing mandatory fields');
  assert(fs.existsSync(path.join(__dirname, '..', t.audio)), 'Audio file does not exist: ' + t.audio);
  assert(fs.existsSync(path.join(__dirname, '..', t.cover)), 'Cover file does not exist: ' + t.cover);
}
console.log('   [PASS] tracks.json has ' + tracksJson.tracks.length + ' tracks with existing audio & cover files');

// 2. Test Storage logic
console.log('2. Testing Storage module...');
global.window = {};
require('../js/storage.js');
var Storage = window.Nova.Storage;

assert(Storage.isAvailable() === false, 'Should gracefully fallback to memory in headless Node');
Storage.set('test_key', { hello: 'world' });
assert.deepStrictEqual(Storage.get('test_key'), { hello: 'world' });

// Favorites
Storage.toggleFavorite('track01');
assert(Storage.isFavorite('track01') === true);
Storage.toggleFavorite('track01');
assert(Storage.isFavorite('track01') === false);
console.log('   [PASS] Storage in-memory fallback & favorites logic working');

// 3. Test Search logic
console.log('3. Testing Search engine...');
window.Nova.RepositoryManager = {
  getAllTracks: function() {
    return tracksJson.tracks;
  }
};
require('../js/search.js');
var Search = window.Nova.Search;

var searchResults = null;
Search.on('search', function(res) {
  searchResults = res;
});

Search.performSearch('starlight');
assert(searchResults && searchResults.tracks.length >= 1, 'Search for "starlight" should find track');
assert.strictEqual(searchResults.tracks[0].id, 'nova_track_001');

Search.performSearch('piano');
assert(searchResults && searchResults.tracks.length >= 1, 'Search for artist "piano" should find track');

Search.performSearch('dimens');
assert(searchResults && searchResults.tracks.length >= 1, 'Search for album "dimens" should find tracks');
console.log('   [PASS] Search engine matches title, artist, and album accurately');

// 4. Test Player logic
console.log('4. Testing Player engine...');
// Mock HTML5 Audio
global.Audio = function() {
  this.src = '';
  this.currentTime = 0;
  this.duration = 60;
  this.volume = 1.0;
  this.preload = '';
  this.listeners = {};
  this.addEventListener = function(evt, fn) {
    this.listeners[evt] = fn;
  };
  this.play = function() {
    if (this.listeners['play']) this.listeners['play']();
    return Promise.resolve();
  };
  this.pause = function() {
    if (this.listeners['pause']) this.listeners['pause']();
  };
  this.load = function() {};
  this.canPlayType = function(type) {
    return type.indexOf('mpeg') !== -1 ? 'probably' : '';
  };
};

require('../js/player.js');
var Player = window.Nova.Player;
Player.init();

assert.strictEqual(Player.formatTime(125), '2:05');
assert.strictEqual(Player.formatTime(0), '0:00');
assert(Player.checkCodecSupport('mp3'), 'MP3 support check');

Player.loadQueue(tracksJson.tracks, 0, false);
var state = Player.getState();
assert.strictEqual(state.currentTrack.id, 'nova_track_001');
assert.strictEqual(state.queue.length, tracksJson.tracks.length);

Player.playNext(false);
state = Player.getState();
assert.strictEqual(state.currentTrack.id, 'nova_track_002');

Player.playPrev();
state = Player.getState();
assert.strictEqual(state.currentTrack.id, 'nova_track_001');
console.log('   [PASS] Player queue, next, prev, and formatting working');

console.log('\n--- ALL INTEGRATION TESTS PASSED! ---');
