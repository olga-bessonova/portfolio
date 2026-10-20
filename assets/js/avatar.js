/*
	Banner avatar (desktop): appears 2s after load and loops idle -> confused -> trying to lift.
	On the first scroll she is happy, then leaves (until the page is reloaded).

	Contact buddy (laptop girl): shows at the right edge whenever the banner is out of view,
	fades out when you scroll back up to it. Hover/tap opens a "Let's connect" bubble.
	- Mouse: drag her anywhere (she hangs from the cursor and swings with inertia); a small x hides her.
	- Touch: swipe her to the right to dismiss.
	Hidden or dismissed, she stays away until the page is reloaded.
*/
(function() {

	var banner = document.getElementById('banner'),
		avatarLink = document.querySelector('#banner .more'),
		buddy = document.getElementById('contact-buddy');

	if (!banner || !avatarLink || !buddy)
		return;

	var toggle = buddy.querySelector('.buddy-toggle'),
		closeButton = buddy.querySelector('.buddy-close'),
		reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
		threshold = 40,
		ready = false,
		started = false,
		handedOff = false,
		dismissed = false;

	// Hanging sprite: where her raised hand is inside the 95x112 frame (see main.css).
	var HAND_X = 24, HAND_Y = 3,
		SIT_W = 57, SIT_H = 88;

	// --- Swing while carried: her body is a weight on a rod hanging from the cursor ---
	var sprite = buddy.querySelector('.buddy-sprite'),
		swing = null;

	function startSwing(x, y) {
		if (reduceMotion)
			return;

		var ROD = 58;
		swing = { px: x, py: y, bx: x, by: y + ROD, ox: x, oy: y + ROD, rod: ROD, last: performance.now(), raf: 0 };

		(function step(now) {
			if (!swing)
				return;

			var dt = Math.min(0.033, (now - swing.last) / 1000) || 0.016;
			swing.last = now;

			// Verlet: keep momentum (with a little air drag), pull down with gravity
			var vx = (swing.bx - swing.ox) * 0.94,
				vy = (swing.by - swing.oy) * 0.94;

			swing.ox = swing.bx;
			swing.oy = swing.by;
			swing.bx += vx;
			swing.by += vy + 2400 * dt * dt;

			// keep the rod length fixed
			var dx = swing.bx - swing.px,
				dy = swing.by - swing.py,
				len = Math.sqrt(dx * dx + dy * dy) || 1;

			swing.bx = swing.px + dx / len * swing.rod;
			swing.by = swing.py + dy / len * swing.rod;

			// body to the right of the hand = rotate counter-clockwise; squashed to a gentle +-18 degrees
			var raw = -Math.atan2(swing.bx - swing.px, swing.by - swing.py) * 180 / Math.PI,
				angle = 18 * Math.tanh(raw / 30);

			sprite.style.transform = 'rotate(' + angle.toFixed(2) + 'deg)' + (buddy.classList.contains('is-flipped') ? ' scaleX(-1)' : '');

			swing.raf = window.requestAnimationFrame(step);
		})(swing.last);
	}

	function moveSwing(x, y) {
		if (swing) {
			swing.px = x;
			swing.py = y;
		}
	}

	function stopSwing() {
		if (swing)
			window.cancelAnimationFrame(swing.raf);

		swing = null;
		sprite.style.transform = '';
	}

	function setOpen(open) {
		buddy.classList.toggle('is-open', open);
		toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
	}

	// "In the first section" = the banner still covers more than the top third of the screen.
	function inBanner() {
		return banner.getBoundingClientRect().bottom > window.innerHeight * 0.35;
	}

	function updateBuddy() {
		if (!handedOff || dismissed)
			return;

		var show = !inBanner();

		buddy.classList.toggle('is-visible', show);

		if (show)
			buddy.removeAttribute('aria-hidden');
		else {
			buddy.setAttribute('aria-hidden', 'true');
			setOpen(false);
		}
	}

	function handOff() {
		avatarLink.classList.add('is-gone');
		handedOff = true;
		updateBuddy();
	}

	function dismiss() {
		dismissed = true;
		setOpen(false);
		buddy.classList.remove('is-visible');
		buddy.setAttribute('aria-hidden', 'true');
		window.setTimeout(function() { buddy.classList.add('is-dismissed'); }, 500);
	}

	function onScroll() {
		if (!started && window.pageYOffset >= threshold) {
			started = true;

			// She only celebrates if she was already on screen.
			if (ready && !reduceMotion) {
				avatarLink.classList.add('is-happy');
				window.setTimeout(handOff, 2100);
			}
			else
				handOff();
		}

		updateBuddy();
	}

	// Phones hide the banner avatar entirely: hand straight over to the buddy.
	if (window.getComputedStyle(avatarLink).display === 'none') {
		started = true;
		handOff();
	}
	else
		window.setTimeout(function() {
			if (started)
				return;

			ready = true;
			avatarLink.classList.add('is-ready');
		}, 2000);

	// Reloaded somewhere down the page: skip straight to the buddy.
	if (!started && window.pageYOffset >= threshold) {
		started = true;
		handOff();
	}

	window.addEventListener('scroll', onScroll, { passive: true });

	// --- Carry (mouse) and swipe-to-dismiss (touch) ---

	var pointer = null,
		suppressClick = false;

	function clamp(value, min, max) {
		return Math.max(min, Math.min(max, value));
	}

	// Left half of the screen: bubble opens to her right and she is mirrored to face the page.
	function updateSide(centerX) {
		if (centerX === undefined) {
			var r = buddy.getBoundingClientRect();
			centerX = r.left + r.width / 2;
		}

		var left = centerX < window.innerWidth / 2;
		buddy.classList.toggle('bubble-right', left);
		buddy.classList.toggle('is-flipped', left);
	}

	function placeSitting(x, y) {
		buddy.style.left = clamp(x, 4, window.innerWidth - SIT_W - 4) + 'px';
		buddy.style.top = clamp(y, 60, window.innerHeight - SIT_H - 4) + 'px';
		updateSide();
	}

	// Load the hanging frames before the first drag so she never blinks.
	toggle.addEventListener('pointerenter', function preload() {
		(new Image()).src = 'images/avatar-hang.webp';
		toggle.removeEventListener('pointerenter', preload);
	});

	toggle.addEventListener('pointerdown', function(event) {
		if (event.pointerType === 'mouse' && event.button !== 0)
			return;

		// Mouse: stop the browser's own image drag / text selection from hijacking the carry.
		if (event.pointerType !== 'touch')
			event.preventDefault();

		pointer = { id: event.pointerId, type: event.pointerType, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, dragging: false, swiping: false, dx: 0 };
		toggle.setPointerCapture(event.pointerId);
	});

	document.addEventListener('dragstart', function(event) {
		if (pointer)
			event.preventDefault();
	});

	toggle.addEventListener('pointermove', function(event) {
		if (!pointer || event.pointerId !== pointer.id)
			return;

		var dx = event.clientX - pointer.x,
			dy = event.clientY - pointer.y;

		pointer.lastX = event.clientX;
		pointer.lastY = event.clientY;

		if (pointer.type === 'touch') {
			if (!pointer.swiping && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
				pointer.swiping = true;
				buddy.classList.add('is-swiping');
				setOpen(false);
			}

			if (pointer.swiping) {
				pointer.dx = Math.max(0, dx);
				buddy.style.transform = 'translate(' + pointer.dx + 'px, -50%)';
				buddy.style.opacity = String(Math.max(0, 1 - pointer.dx / 160));
			}

			return;
		}

		if (!pointer.dragging && Math.sqrt(dx * dx + dy * dy) > 5) {
			pointer.dragging = true;
			setOpen(false);
			buddy.classList.add('is-dragging', 'is-placed');
			startSwing(event.clientX, event.clientY);
		}

		if (pointer.dragging) {
			buddy.style.left = (event.clientX - HAND_X) + 'px';
			buddy.style.top = (event.clientY - HAND_Y) + 'px';
			updateSide(event.clientX);
			moveSwing(event.clientX, event.clientY);
		}
	});

	function endPointer(event) {
		if (!pointer || event.pointerId !== pointer.id)
			return;

		if (pointer.dragging) {
			stopSwing();
			buddy.classList.remove('is-dragging');
			// Sit down roughly where she was dropped (a cancelled pointer reports 0,0: use the last move).
			var x = event.type === 'pointercancel' ? pointer.lastX : event.clientX,
				y = event.type === 'pointercancel' ? pointer.lastY : event.clientY;

			placeSitting(x - SIT_W / 2, y - 20);
			suppressClick = true;
		}
		else if (pointer.swiping) {
			buddy.classList.remove('is-swiping');

			if (event.type !== 'pointercancel' && pointer.dx > 70) {
				buddy.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
				buddy.style.transform = 'translate(140%, -50%)';
				buddy.style.opacity = '0';
				dismiss();
			}
			else {
				buddy.style.transform = '';
				buddy.style.opacity = '';
			}

			suppressClick = true;
		}

		pointer = null;
	}

	toggle.addEventListener('pointerup', endPointer);
	toggle.addEventListener('pointercancel', endPointer);

	window.addEventListener('resize', function() {
		if (buddy.classList.contains('is-placed'))
			placeSitting(parseFloat(buddy.style.left) || 0, parseFloat(buddy.style.top) || 0);

		updateBuddy();
	});

	// --- Bubble open/close ---

	toggle.addEventListener('click', function() {
		if (suppressClick) {
			suppressClick = false;
			return;
		}

		setOpen(!buddy.classList.contains('is-open'));
	});

	closeButton.addEventListener('click', function(event) {
		event.stopPropagation();
		dismiss();
	});

	document.addEventListener('click', function(event) {
		if (!buddy.contains(event.target))
			setOpen(false);
	});

	document.addEventListener('keydown', function(event) {
		if (event.key === 'Escape')
			setOpen(false);
	});

})();
