/*
	Skills tiles: a very soft note and a little pop when you hover (or tap) each tile,
	or when the contact buddy is dropped onto one. A button next to the heading mutes it.
	Synthesised with the Web Audio API, so there are no sound files to load. Browsers only allow
	sound after the visitor has interacted with the page (a click, tap or key press), so the bubbles
	start after the first click anywhere.
*/
(function() {

	var tiles = document.querySelectorAll('#three .features li.skill');

	if (!tiles.length)
		return;

	var AudioCtx = window.AudioContext || window.webkitAudioContext,
		ctx = null;

	if (!AudioCtx)
		return;

	function unlock() {
		if (!ctx)
			ctx = new AudioCtx();

		if (ctx.state === 'suspended')
			ctx.resume();
	}

	['pointerdown', 'keydown', 'touchstart'].forEach(function(type) {
		window.addEventListener(type, unlock, { passive: true });
	});

	// one very soft droplet: a short, quiet sine with a slight upward glide, through a low-pass filter.
	// Each tile gets its own note from a pentatonic scale, so moving across them sounds gentle.
	var NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5],
		muted = false;

	try { muted = window.localStorage.getItem('skillSoundMuted') === '1'; } catch (e) {}

	function bubble(index) {
		if (muted || !ctx || ctx.state !== 'running')
			return;

		var now = ctx.currentTime,
			note = NOTES[index % NOTES.length],
			osc = ctx.createOscillator(),
			filter = ctx.createBiquadFilter(),
			gain = ctx.createGain();

		osc.type = 'sine';
		osc.frequency.setValueAtTime(note * 0.94, now);
		osc.frequency.exponentialRampToValueAtTime(note, now + 0.03);

		filter.type = 'lowpass';
		filter.frequency.value = 1800;

		gain.gain.setValueAtTime(0.0001, now);
		gain.gain.exponentialRampToValueAtTime(0.035, now + 0.008);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

		osc.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + 0.14);
	}

	// mute / unmute button next to the Skills heading (remembered in this browser)
	var toggle = document.querySelector('#three .sound-toggle');

	function showMuted() {
		if (!toggle)
			return;

		var icon = toggle.querySelector('i');
		icon.className = 'fas ' + (muted ? 'fa-volume-mute' : 'fa-volume-up');
		toggle.setAttribute('aria-pressed', muted ? 'true' : 'false');
		toggle.setAttribute('aria-label', muted ? 'Unmute skill sounds' : 'Mute skill sounds');
		toggle.title = muted ? 'Sound off' : 'Sound on';
	}

	if (toggle) {
		showMuted();
		toggle.addEventListener('click', function() {
			muted = !muted;
			try { window.localStorage.setItem('skillSoundMuted', muted ? '1' : '0'); } catch (e) {}
			showMuted();
			toggle.blur();
		});
	}

	// pop a tile (visual) and play its bubble
	function pop(tile, index) {
		bubble(index);
		tile.classList.add('is-popped');
		window.setTimeout(function() { tile.classList.remove('is-popped'); }, 260);
	}

	Array.prototype.forEach.call(tiles, function(tile, index) {
		tile.addEventListener('pointerenter', function(event) {
			if (event.pointerType === 'mouse')
				bubble(index);
		});

		// touch: tapping a tile pops it and plays its bubble
		tile.addEventListener('pointerdown', function(event) {
			if (event.pointerType === 'mouse')
				return;

			unlock();
			pop(tile, index);
		});

		// the contact buddy was dropped onto this tile (see avatar.js)
		tile.addEventListener('buddydrop', function() {
			unlock();
			pop(tile, index);
		});
	});

})();
