/*
	Banner avatar: appears 2s after load and loops idle -> confused -> trying to lift.
	On the first scroll she is happy, then leaves (until the page is reloaded).
	After that, the laptop "contact buddy" shows at the right edge whenever the
	banner is out of view, and fades out again when you scroll back up to it.
*/
(function() {

	var banner = document.getElementById('banner'),
		avatarLink = document.querySelector('#banner .more'),
		buddy = document.getElementById('contact-buddy');

	if (!banner || !avatarLink || !buddy)
		return;

	var toggle = buddy.querySelector('.buddy-toggle'),
		reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
		threshold = 40,
		ready = false,
		started = false,
		handedOff = false;

	function setOpen(open) {
		buddy.classList.toggle('is-open', open);
		toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
	}

	// "In the first section" = the banner still covers more than the top third of the screen.
	function inBanner() {
		return banner.getBoundingClientRect().bottom > window.innerHeight * 0.35;
	}

	function updateBuddy() {
		if (!handedOff)
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

	window.setTimeout(function() {
		if (started)
			return;

		ready = true;
		avatarLink.classList.add('is-ready');
	}, 2000);

	// Reloaded somewhere down the page: skip straight to the buddy.
	if (window.pageYOffset >= threshold) {
		started = true;
		handOff();
	}

	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', updateBuddy);

	// Touch screens have no hover: tap the buddy to open or close the bubble.
	toggle.addEventListener('click', function() {
		setOpen(!buddy.classList.contains('is-open'));
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
