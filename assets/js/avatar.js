/*
	Banner avatar: loops "trying to lift the next section" while the page is at the top.
	On the first scroll she lifts it, celebrates and leaves (until the page is reloaded),
	and a small contact buddy appears in the bottom-right corner.
*/
(function() {

	var avatarLink = document.querySelector('#banner .more'),
		buddy = document.getElementById('contact-buddy');

	if (!avatarLink || !buddy)
		return;

	var toggle = buddy.querySelector('.buddy-toggle'),
		reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
		threshold = 40,
		started = false;

	function showBuddy() {
		avatarLink.classList.add('is-gone');
		buddy.classList.add('is-visible');
		buddy.removeAttribute('aria-hidden');
	}

	function onScroll() {
		if (started || window.pageYOffset < threshold)
			return;

		started = true;
		window.removeEventListener('scroll', onScroll);
		avatarLink.classList.add('is-happy');
		window.setTimeout(showBuddy, reduceMotion ? 0 : 1600);
	}

	// Reloaded somewhere down the page: skip straight to the buddy.
	if (window.pageYOffset >= threshold) {
		started = true;
		showBuddy();
	}
	else
		window.addEventListener('scroll', onScroll, { passive: true });

	// Touch screens have no hover: tap the buddy to open or close the bubble.
	function setOpen(open) {
		buddy.classList.toggle('is-open', open);
		toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
	}

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
