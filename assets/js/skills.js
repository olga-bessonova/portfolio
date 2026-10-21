/*
	Skills tiles: a soft "bloop" bubble sound when you hover (or tap) each tile.
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

	// one bubble: a sine "bloop" sweeping up in pitch, with a fast attack and short decay
	function bubble(index) {
		if (!ctx || ctx.state !== 'running')
			return;

		var now = ctx.currentTime,
			osc = ctx.createOscillator(),
			gain = ctx.createGain(),
			base = 380 + (index % 6) * 55 + Math.random() * 30;

		osc.type = 'sine';
		osc.frequency.setValueAtTime(base, now);
		osc.frequency.exponentialRampToValueAtTime(base * 2.3, now + 0.09);

		gain.gain.setValueAtTime(0.0001, now);
		gain.gain.exponentialRampToValueAtTime(0.14, now + 0.012);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

		osc.connect(gain);
		gain.connect(ctx.destination);
		osc.start(now);
		osc.stop(now + 0.18);
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
			bubble(index);
			tile.classList.add('is-popped');
			window.setTimeout(function() { tile.classList.remove('is-popped'); }, 220);
		});
	});

})();
