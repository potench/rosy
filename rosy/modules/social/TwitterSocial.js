/**
 *	Requires DOM elements:
 *	<meta property="twitter:app_id" content="XXXXXX"	/>
 *
 *	add [data-custom-social="twitter"] to automatically fire customTweet()
 *
 *	EXAMPLE
 *	<a
 *		data-custom-social-="twitter"						// REQUIred
 *		data-url="http://example.com"						// optional
 *		data-text="Some tweet you are sending"				// optional
 *	>Twitter</a>
 *
 *	Also, you can this.publish() a "custom-twitter-post" event to fire customTweet()
 *
 *	Example
 *	this.publish(TwitterSocial.POST, {url:"http://example.com", text : "Some Tweet Message"})
 *
 */

define([
	"../Module",
	"$"
	// Tracking stuff? Add it here
	// ("../tracking/GATracking" || "../tracking/OmnitureTracking")
], function (Module, $, Tracking) {

	"use strict";

	var EVENTS = {
		POST : "module/social/twitter/post",
		RENDER : "module/social/twitter/render",

		LOGIN : "module/social/twitter/login",
		LOGOUT : "module/social/twitter/logout",

		HANDLE_LOGIN : "module/social/twitter/handle-login",
		HANDLE_LOGOUT : "module/social/twitter/handle-logout",
		GET_STATUS : "module/social/twitter/get-status",
		POST_STATUS : "module/social/twitter/post-status"
	},

	APP_ID = $('[property="twitter:app_id"]').attr("content");

	return Module.extend({

		_twitter_url : "https://twitter.com/share?",

		vars : {
			debug : true
		},

		init : function () {

			this.loadJSDK();

			$("body").on("click", '[data-custom-social="twitter"]', this.customTweet);
			this.subscribe(EVENTS.POST,  this.customTweet);
			this.subscribe(EVENTS.RENDER, this.render);
		},

		onTwitterInit : function () {
			this.subscribe(EVENTS.LOGOUT, this.getLogout);

			if (window.twttr) {
				var that = this;
				window.twttr.anywhere(function (T) {
					T.bind("tweet", that.onTweet);
					T.bind("follow", that.onFollow);
					T.bind("authComplete", that.onAuthComplete);
					T.bind("signOut", that.onSignOut);

					that.subscribe(EVENTS.LOGIN, function () {
						T.signIn();
					});

					that.subscribe(EVENTS.POST_STATUS, function (e, data) {
						if (T.isConnected()) {
							T.Status.update(data.text);
						} else {
							that.customTweet(e, data);
						}
					});

					that.subscribe(EVENTS.GET_STATUS, function () {
						if (T.isConnected()) {
							that.onAuthComplete(null, T.currentUser);
						} else {
							that.onSignOut();
						}
					});
				});
			}
		},

		onAuthComplete : function (e, eData) {
			this.publish(EVENTS.HANDLE_LOGIN, [eData]);
		},

		onSignOut : function () {
			this.publish(EVENTS.HANDLE_LOGOUT);
		},

		getLogout : function () {
			if (window.twttr) {
				window.twttr.events.bind("tweet",  this.onTweet);
				window.twttr.events.bind("follow", this.onFollow);
			}
		},

		querystring : function (url) { // parses query-string
			var a = /\+/g,  // Regex for replacing addition symbol with a space
				r = /([^&=]+)=?([^&]*)/g,
				d = function (s) {
						return decodeURIComponent(s.replace(a, " "));
					},
				q = url || window.location.search.substring(1),
				qs = {},
				e = r.exec(q);

			while (e) {
				qs[d(e[1])] = d(e[2]);
				e = r.exec(q);
			}

			return qs;
		},

		log : function () {
			if (this.vars.debug && window.console) {
				console.log(arguments);
			}
		},

		// override this for tracking and such
		// fires from custom tweet AND from @anywhere plugins
		onTweet: function (e, eData) {
			var el = (e.currentTarget) ? $(e.currentTarget) : $(e.target),
				data = eData || el.data() || {},
				url = el.attr("src"),
				tweeturl = this.querystring(url).url;

			this.publish(Tracking.TRACK, [{
				type : "event",
				category: "twitter",
				action : "on-tweet",
				label : tweeturl
			}]);

			return data;
		},

		onFollow: function (e, eData) {
			var el = $(e.currentTarget),
				data = eData || el.data();

			this.publish(Tracking.TRACK, [{
				type : "event",
				category: "twitter",
				action : "on-follow",
				label : data.url
			}]);

			return data;
		},

		customTweet : function (e, eData) {
			// needs URL and text
			var el = $(e.currentTarget),
				data = eData || el.data(),
				url = this._twitter_url,
				i;

			data.url = data.url || window.location.href;
			data.text = data.text || document.title;

			for (i in data) {
				if (typeof(data[i]) === 'string') {
					url += "&" + i + "=" + encodeURIComponent(data[i]);
				}
			}

			// passing through the click event to avoid blockers
			window.open(url, "sharer", "toolbar=0,status=0,scrollbars=1,width=575,height=338");

			// fires onTweet
			this.onTweet(e, eData);
		},

		render : function () {
			$.ajax({
				url: "//platform.twitter.com/widgets.js",
				dataType: "script",
				cache: true
			});
		},

		loadJSDK : function () {
			$.ajax({
				dataType: "script",
				url: "//platform.twitter.com/anywhere.js?id=" + APP_ID + "&v=1",
				cache: true
			}).done(this.onTwitterInit);
		},

		destroy : function () {
			$(document).off("click", '[data-custom-social="twitter"]', this.customTweet);

			this.sup();
		}

	}, EVENTS);

});