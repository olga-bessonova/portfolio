/*
	Banner avatar (desktop): appears 2s after load and loops idle -> confused -> trying to lift.
	On the first scroll she is happy, then leaves (until the page is reloaded).

	Contact buddy (laptop girl): shows at the right edge whenever the banner is out of view,
	fades out when you scroll back up to it. Hover/tap opens a "Let's connect" bubble.
	- Mouse: drag her anywhere (she hangs from the cursor while carried); a small x hides her.
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
	var HAND_X = 30, HAND_Y = 2,
		SIT_W = 90, SIT_H = 140;

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

	function updateBubbleSide() {
		var r = buddy.getBoundingClientRect();
		buddy.classList.toggle('bubble-right', r.left + r.width / 2 < window.innerWidth / 2);
	}

	function placeSitting(x, y) {
		buddy.style.left = clamp(x, 4, window.innerWidth - SIT_W - 4) + 'px';
		buddy.style.top = clamp(y, 60, window.innerHeight - SIT_H - 4) + 'px';
		updateBubbleSide();
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
		}

		if (pointer.dragging) {
			buddy.style.left = (event.clientX - HAND_X) + 'px';
			buddy.style.top = (event.clientY - HAND_Y) + 'px';
		}
	});

	function endPointer(event) {
		if (!pointer || event.pointerId !== pointer.id)
			return;

		if (pointer.dragging) {
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
