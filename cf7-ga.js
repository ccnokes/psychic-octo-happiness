jQuery(document).ready(function($) {
	var $doc = $(document);
	var form = $('.wpcf7-form');
	var inputs = $(form.find('.wpcf7-form-control:visible').not('.wpcf7-submit'));

	/**
	 * wrapper around ga()
	 */
	var track = function(category, label) {
		//for reference
		//ga('send', 'event', 'category', 'action', 'label', value);  // value is a number.

		//make sure GA is on the page
		if(!'ga' in window) {
			console.error('GA isn\'t loaded.');
		}

		ga('send', 'event', 'Contact Form - ' + category, 'form submit', label);
	};


	/**
	 * Track the basic, easy stuff
	 */
	$doc.on('mailsent.wpcf7', function() {
		track('Contact Form Submit Success');
		//fake pageview for convenience
		ga('send', 'pageview', {
			'page':'/contact-form-success-thanks',
			'title': 'Thanks!'
		});
	});

	$doc.on('invalid.wpcf7', function() {
		var invalids = getInvalidFields();
		track('Submit Invalid', invalids.join(', '));
	});

	$doc.on('mailfailed.wpcf7', function() {
		track('Submit Failed');
	});


	/**
	 * track form abandonment
	 */
	var userHasInteracted = (function() {
		var formInteract = false;
		
		//"interacted" = they've typed something
		inputs.on('keyup', function() {
			formInteract = true;
		});

		//reset if submitted contact form, regardless if worked or not
		$doc.on('mailfailed.wpcf7', function() {
			inputs.off('keyup');
			formInteract = false;
		});	

		$doc.on('mailsent.wpcf7', function() {
			inputs.off('keyup');
			formInteract = false;
		});
		
		//this way we can always return live reference to formInteract
		return function() {
			return formInteract;
		};
	})();

	/**
	 * get all the invalid fields as determined by WPCF7's JS
	 */
	function getInvalidFields() {
		var invalids = inputs.map(function(i, el) {
			var $el = $(el);
			if($el.hasClass('wpcf7-not-valid')) {
				return $el.attr('name');
			}
		});
		return invalids.toArray();
	}

	/**
	 * get incomplete fields
	 */
	function getUnfilledFields() {
		var unfilled = inputs.map(function(i, el) {
			var $el = $(el);
			var value = $el.val();
			if(!value) {
				return $el.attr('name');
			}
		});
		//return as plain old array, not jQuery object
		return unfilled.toArray();
	}

	/**
	 * Bring it together
	 * only track abandons if the user has interacted with the page
	 */
	function trackIncomplete() {
		if(userHasInteracted() === true) {
			var incomplete = getUnfilledFields();
			if(incomplete.length > 0) {
				//join array of incomplete fields into a string
				track('Abandon', incomplete.join(', '));
			}
		}
	}

	/**
	 * implement form abandonment tracking
	 */
	$(window).on('beforeunload', function() {
		trackIncomplete();
	});
});