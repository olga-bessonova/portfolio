/*
	Skills tiles: a watery bubble sound and a little pop when you hover (or tap) each tile,
	or when the contact buddy is dropped onto one.
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

	// one watery bubble: two quick rising chirps (the bubble forming, then popping) plus a soft click
	var noise = null;

	function chirp(at, from, to, length, volume) {
		var osc = ctx.createOscillator(),
			gain = ctx.createGain();

		osc.type = 'sine';
		osc.frequency.setValueAtTime(from, at);
		osc.frequency.exponentialRampToValueAtTime(to, at + length * 0.8);

		gain.gain.setValueAtTime(0.0001, at);
		gain.gain.exponentialRampToValueAtTime(volume, at + 0.006);
		gain.gain.exponentialRampToValueAtTime(0.0001, at + length);

		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(at);
		osc.stop(at + length + 0.02);
	}

	function click(at) {
		if (!noise) {
			noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
			var data = noise.getChannelData(0);
			for (var i = 0; i < data.length; i++)
				data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
		}

		var src = ctx.createBufferSource(),
			filter = ctx.createBiquadFilter(),
			gain = ctx.createGain();

		src.buffer = noise;
		filter.type = 'bandpass';
		filter.frequency.value = 2600;
		filter.Q.value = 1.2;
		gain.gain.value = 0.05;

		src.connect(filter);
		filter.connect(gain);
		gain.connect(ctx.destination);
		src.start(at);
	}

	function bubble(index) {
		if (!ctx || ctx.state !== 'running')
			return;

		var now = ctx.currentTime,
			pitch = 1 + (index % 6) * 0.08 + Math.random() * 0.05;

		chirp(now, 260 * pitch, 720 * pitch, 0.07, 0.10);
		chirp(now + 0.055, 520 * pitch, 1500 * pitch, 0.05, 0.08);
		click(now + 0.055);
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
