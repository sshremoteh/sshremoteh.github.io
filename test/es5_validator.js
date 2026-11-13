var fs = require('fs');
var path = require('path');
var acorn = require('acorn');

var jsDir = path.join(__dirname, '..', 'js');
var files = fs.readdirSync(jsDir).filter(function(f) {
  return f.slice(-3) === '.js';
});

console.log('Testing ' + files.length + ' JavaScript files for STRICT ES5 compliance...');
var hasError = false;

files.forEach(function(file) {
  var fullPath = path.join(jsDir, file);
  var code = fs.readFileSync(fullPath, 'utf8');

  try {
    acorn.parse(code, { ecmaVersion: 5 });
    console.log('  [PASS] ' + file + ' is 100% valid ES5');
  } catch (err) {
    console.error('  [FAIL] ' + file + ' has ES5 syntax error at line ' + err.loc.line + ', col ' + err.loc.column + ': ' + err.message);
    hasError = true;
  }
});

// Also test for CSS variables in css/style.css
var cssPath = path.join(__dirname, '..', 'css', 'style.css');
var cssCode = fs.readFileSync(cssPath, 'utf8');
if (/var\(--/.test(cssCode)) {
  console.error('  [FAIL] css/style.css contains CSS variables (var(--...)) which break on WebKit 538.2!');
  hasError = true;
} else {
  console.log('  [PASS] css/style.css has NO CSS variables (WebKit 538.2 compatible)');
}

if (/display:\s*grid/.test(cssCode)) {
  console.error('  [FAIL] css/style.css contains display:grid which breaks on WebKit 538.2!');
  hasError = true;
} else {
  console.log('  [PASS] css/style.css has NO CSS grid (WebKit 538.2 compatible)');
}

if (hasError) {
  console.error('\nES5 / WebKit compatibility checks FAILED!');
  process.exit(1);
} else {
  console.log('\nALL ES5 and WebKit 538.2 compatibility checks PASSED successfully!');
  process.exit(0);
}
