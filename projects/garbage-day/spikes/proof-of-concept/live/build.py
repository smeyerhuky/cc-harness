import re, os
OLD = 'replay/page.src.html'
old = open(OLD).read()

# ---------- CSS: reuse the first page's styles, class-based screen selectors ----------
css = old[old.index('<style>') + 7: old.index('</style>')]
for a, b in [('#scr-you .who', '.screen.you .who'), ('#scr-rival .who', '.screen.rival .who'),
             ('#scr-rival .screen-bar', '.screen.rival .screen-bar'), ('#scr-you .screen-body', '.screen.you .screen-body'),
             ('#scr-rival .screen-body', '.screen.rival .screen-body'), ('#scr-rival .next', '.screen.rival .next')]:
    assert a in css, a
    css = css.replace(a, b)
assert '#scr' not in css
css += open('live/extra.css').read()

# ---------- replay HTML: the first page's main block, ids prefixed with r- ----------
body = old[old.index('</style>'):]
rh = body[body.index('<div class="main">'): body.index('<div class="lower">')]
rh = rh.replace('class="screen" id="scr-you"', 'class="screen you" id="scr-you"').replace('class="screen" id="scr-rival"', 'class="screen rival" id="scr-rival"')
rh = re.sub(r'\b(id|for|aria-labelledby)="([^"]+)"', lambda m: f'{m.group(1)}="r-{m.group(2)}"', rh)
assert 'id="r-stage"' in rh and 'id="r-modal"' in rh

# ---------- replay JS: the first page's controller, scoped to #replay and using shared services ----------
js = old[old.rindex('<script>') + 8: old.rindex('</script>')]
js = js.strip()
assert js.startswith('(() => {') and js.endswith('})();')
js = js[len('(() => {'): -len('})();')]
js = js.replace("'use strict';", '', 1)

def cut(src, start, end, repl=''):
    i = src.index(start); j = src.index(end, i)
    return src[:i] + repl + src[j:]

js = js.replace("const $ = (s, el = document) => el.querySelector(s);",
                "const ROOT = document.getElementById('replay');\nconst $ = (s, el) => (el || ROOT).querySelector(s.replace(/#([A-Za-z])/g, '#r-$1'));")
js = cut(js, '/* ---------------- storage', '/* ---------------- tiny state machine', "let firstTry = store.get('quiz', {});\n\n")
js = cut(js, '/* ---------------- colors from tokens', '/* ---------------- animation plumbing', "const sprites = new Map();\nthemeHooks.push(() => sprites.clear());\n\n")
js = cut(js, 'function glyph(letter, size = 10) {', 'class BoardView {')
js = cut(js, 'const SVGNS =', 'const smMatch = drawMachine(')
js = cut(js, '/* ---------------- progress: xp + badges', '/* ---------------- the replay controller')
js = cut(js, "document.addEventListener('visibilitychange', () => {", 'function youLeftPlaceholder', '') if 'function youLeftPlaceholder' in js else js
vis = """document.addEventListener('visibilitychange', () => {
  if (document.hidden) youLeft();
  else if (pz && pz.by === 'you') youReturned();
});"""
assert vis in js; js = js.replace(vis, '')
for line in ["$('#soundBtn').onclick = (e) => { soundOn = !soundOn; e.currentTarget.setAttribute('aria-pressed', soundOn); e.currentTarget.textContent = soundOn ? 'Sound on' : 'Sound off'; if (soundOn) sfx.go(); };\n",
             "$('#resetBtn').onclick = () => { xp = 0; got = new Set(); firstTry = {}; store.set('xp', 0); store.set('badges', []); store.set('quiz', {}); renderXp(); renderBadges(); toast('Progress reset'); };\n"]:
    assert line in js, line[:40]; js = js.replace(line, '')
kd = "document.addEventListener('keydown', (e) => {\n  if (page.state === 'move') {"
assert kd in js
js = js.replace(kd, "document.addEventListener('keydown', (e) => {\n  if (activeSection !== 'replay') return;\n  if (page.state === 'move') {")
js = cut(js, '/* ---------------- attack lab', '/* ---------------- boot')
boot = js[js.index('/* ---------------- boot'):]
js = js[:js.index('/* ---------------- boot')] + """/* ---------------- boot ---------------- */
let onScreen = true;
try { new IntersectionObserver((es) => { onScreen = es.some((e) => e.isIntersecting); }).observe(stage); } catch (e) { /* no observer */ }
layout();
highlight(smMatch, match.state, null); highlight(smPiece, piece.state, null);
Object.entries(smPres.nodeEl).forEach(([id, g]) => g.classList.toggle('on', id === 'present'));
tokenPos();
$('#lastMatch').innerHTML = lastText(match); $('#lastPres').innerHTML = 'both players: present'; $('#lastPiece').innerHTML = lastText(piece);
requestAnimationFrame(loop);
enter(0);
return {
  onHidden() { youLeft(); },
  onVisible() { if (pz && pz.by === 'you') youReturned(); },
};
"""
dr = "  views.you.draw(now); views.rival.draw(now);"
assert dr in js
js = js.replace(dr, "  if (onScreen) { views.you.draw(now); views.rival.draw(now); }")
js = js.replace('document.querySelectorAll(', 'ROOT.querySelectorAll(')
js = js.replace('id="mv', 'id="r-mv')
# sanity: nothing left that the shared scope owns
for gone in ['function readColors', 'function beep', 'function award', 'function renderXp', 'function drawMachine', 'function glyph', 'function renderLab', 'window.claude']:
    assert gone not in js, gone

# ---------- assemble ----------
live_body = open('live/live-body.html').read().replace('<!--__REPLAY_HTML__-->', rh)
live_body = live_body.replace('<div class="stage lv" id="l-stage">', '<div class="stage lv asym" id="l-stage">')
app = open('live/app.js').read().replace('/*__REPLAY__*/', js)
gd = open('replay/engine.js').read().replace("if (typeof module !== 'undefined') module.exports = GD;\n", '')
lv = open('live/live-engine.js').read().replace("if (typeof module !== 'undefined') module.exports = LV;\n", '')
head = old[:old.index('<style>')].replace('<title>Garbage Day</title>', '<title>Garbage Day Live</title>')
page = head + '<style>' + css + '</style>\n' + live_body + '\n<script>\n' + gd + '</script>\n<script>\n' + lv + '</script>\n<script>\n' + app + '</script>\n'
open('live/garbage-day-live.html', 'w').write(page)
print('bytes', len(page))
ids = re.findall(r'\bid="([^"]+)"', page)
dups = {i for i in ids if ids.count(i) > 1}
print('duplicate ids:', dups or 'none')
