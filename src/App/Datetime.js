
/**
 * ---------------------------
 * Date utilities.
 * ---------------------------
 */

const Datetime = {
	
	/**
	 * Measures a time value against the nearest time unit.
	 *
	 * @param int time
	 *
	 * @return string
	 */
	ago: function(time) {
		var periods = ['sec', 'min', 'hr', 'day', 'wk', 'mon', 'yr', 'dec'];
		var lengths = ['1000', '60', '60', '24', '7', '4.35', '12', '10'];
		var now = Date.now();
		var differenceOriginal = now - time;
		var difference = differenceOriginal;
		var tense = 'ago';
		var k = 0;
		/*remember js time is in millisec. So first division (by 1000) gives us the difference in secs*/
		for(var i = 0; i < lengths.length && difference >= lengths[i]; i ++) {
			difference /= lengths[i];
			k = i;
		}
		difference = Math.round(difference);
		if(difference != 1) {
			periods[k] += periods[k] == 'day' ? 's' : 's.';
		} else {
			periods[k] += periods[k] == 'day' ? '' : '.';
		}
		if (differenceOriginal < 1000 * 60) {
			return 'Just Now';
		}
		return difference + ' ' + periods[k] + ' ' + tense;
	},
	
	/**
	 * Converts a worded time string to a timestamp value.
	 *
	 * @param string wordedStr
	 *
	 * @return int
	 */
	strToTime: function(wordedStr) {
		// It's already a timestamp value
		if (!isNaN(wordedStr * 1)) {
			return parseInt(wordedStr);
		}
		// It's not really worded
		if (!(wordedStr.indexOf('mons') > -1 || wordedStr.indexOf('days') > -1 || wordedStr.indexOf('hrs') > -1 || wordedStr.indexOf('mins') > -1 || wordedStr.indexOf('secs') > -1)) {
			return (new Date(wordedStr)).getTime();
		}
		// No wordedStr, get current time
		wordedStr = wordedStr.replace(/ /g, '');
		if (!wordedStr) {
			return Date.now();
		} else {
			// Input is human readable value: 5 days, +3 hrs, etc.
			var operator = null;
			if (wordedStr.substr(0, 1) === '-' || wordedStr.substr(0, 1) === '+') {
				operator = wordedStr.substr(0, 1);
				wordedStr = wordedStr.substr(1);
			}
			var value = parseInt(wordedStr.replace(/[^0-9]/g, ''));
			var unit = wordedStr.replace(/[0-9]/g, '');
			var timestamp/*secs*/ = value * 1000;
			// Currently 1 sec if input is 1
			if (unit == 'mins'|| unit == 'hrs'|| unit == 'days' || unit == 'mons') {
				// Currently 1 min if input is 1
				timestamp = timestamp * 60;
			}
			if (unit == 'hrs'|| unit == 'days' || unit == 'mons') {
				// Currently 1 hrs if input is 1
				timestamp = timestamp * 60;
			}
			if (unit == 'days' || unit == 'mons') {
				// Currently 1 day if input is 1
				timestamp = timestamp * 24;
			}
			if (unit == 'mons') {
				// Currently 1 month if input is 1
				timestamp = timestamp * 30;
			}
			// Add or subtract this timestamp value to or from current timestamp
			if (operator == '+' || operator == '-') {
				var date = new Date();
				timestamp = date.setTime(date.getTime() + (operator == '+' ? timestamp : -timestamp));
			}
			return timestamp;
		}
	},
};

/**
 * @export
 */
export default Datetime;