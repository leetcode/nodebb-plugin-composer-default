'use strict';
/* globals $, app, socket */

define('admin/plugins/composer-default', ['settings'], function(Settings) {

	var ACP = {};

	var escapeModify = function (values, key, reverse){
		if (!(key in values)) return;
		var matches = ['\n', '\t', '\r'];
		var targets = ['\\n', '\\t', '\\r'];
		if (reverse) {
			matches = ['\\\\n', '\\\\t', '\\\\r'];
			targets = ['\n', '\t', '\r'];
		}
		for (var i = 0; i < matches.length; ++i){
			values[key] = values[key].replace(new RegExp(matches[i], 'g'), targets[i]);
		}
	};

	var extractValues = function (formEl, v) {
		formEl = $(formEl);
		if (formEl.length) {
			var values = formEl.serializeObject();

			// "Fix" checkbox values, so that unchecked options are not omitted
			formEl.find('input[type="checkbox"]').each(function (idx, inputEl) {
				inputEl = $(inputEl);
				if (!inputEl.is(':checked')) {
					values[inputEl.attr('name')] = 'off';
				}
			});

			// Normalizing value of multiple selects
			formEl.find('select[multiple]').each(function(idx, selectEl) {
				selectEl = $(selectEl);
				values[selectEl.attr('name')] = JSON.stringify(selectEl.val());
			});

			for (var key in values) v[key] = values[key];
		}
		return v;
	};

	var loadValues = function (formEl, values) {
		// Parse all values. If they are json, return json
		for(var key in values) {
			if (values.hasOwnProperty(key)) {
				try {
					values[key] = JSON.parse(values[key]);
				} catch (e) {
					// Leave the value as is
				}
			}
		}

		$(formEl).deserialize(values);
		$(formEl).find('input[type="checkbox"]').each(function() {
			$(this).parents('.mdl-switch').toggleClass('is-checked', $(this).is(':checked'));
		});
		$(window).trigger('action:admin.settingsLoaded');
	};

	var saveConfig = function (hash, callback) {
		var values = {}
		values = extractValues($('.composer-default-settings'), values)
		values = extractValues($('.composer-default-settings-placeholder'), values)
		escapeModify(values, 'defaultPlaceHolder', false);

		socket.emit('admin.settings.set', {
			hash: hash,
			values: values
		}, function (err) {
			if (typeof callback === 'function') {
				callback();
			} else {
				app.alert({
					title: 'Settings Saved',
					type: 'success',
					timeout: 2500
				});
			}
		});
	};


	ACP.init = function() {
		socket.emit('admin.settings.get', {
			hash: 'composer-default'
		}, function (err, values) {
			escapeModify(values, 'defaultPlaceHolder', true);
			loadValues($('.composer-default-settings'), values);
			loadValues($('.composer-default-settings-placeholder'), values);
		});

		$('#save').on('click', function() {
			saveConfig('composer-default', function() {
				app.alert({
					type: 'success',
					alert_id: 'composer-default-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				});
			});
		});
	};

	return ACP;
});