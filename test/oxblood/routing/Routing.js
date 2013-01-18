define(

	[
		"OxBlood",
		"rosy/base/Class",
		"rosy/views/ViewManager",
		"./History",
		"./Transitions",
		"./routes"
	],

	function (OxBlood, Class, ViewManager, History, Transitions, routes) {

		/*global describe, expect, it, before, beforeEach, after, afterEach */

		"use strict";

		var REAL_URL = window.location.pathname + window.location.search,
			REAL_HASH = window.location.hash = "",
			HISTORY_SUPPORT = window.history && window.history.pushState;


		OxBlood.addRoutingTests(function () {

			describe("View Routing", function () {

				before(function (done) {
					ViewManager.initialize({
						fallbackMode : "soft",
						aliases : routes.aliases,
						viewGroups : routes.viewGroups
					});
					done();
				});

				it("should initialize successfully", function (done) {
					expect(ViewManager.initialized).to.equal(true);
					done();
				});

				it("should be able to change routes programatically", function (done) {
					ViewManager.changeRoute("/test1", "sync", function () {
						expect(ViewManager.getViewGroup("main").currentView.config.test).to.equal("test1");
						done();
					});
				});

				it("should support RegEx routes", function (done) {
					ViewManager.changeRoute("/testRegEx123131/", "sync", function () {
						expect(ViewManager.getViewGroup("main").currentView.config.test).to.equal("testRegEx");
						done();
					});
				});

				it("should be able to close view groups programatically", function (done) {
					ViewManager.closeViewGroup("main", function () {
						expect(ViewManager.getViewGroup("main").currentView).to.equal(null);
						done();
					});
				});

				it("should be able to change routes after closing a view group", function (done) {
					ViewManager.changeRoute("/test2", "sync", function () {
						expect(ViewManager.getViewGroup("main").currentView.config.test).to.equal("test2");
						done();
					});
				});

				it("should be able to close view groups with a null viewClass", function (done) {
					ViewManager.changeRoute("/nothing", "sync", function () {
						expect(ViewManager.getViewGroup("main").currentView).to.equal(null);
						done();
					});
				});

				it("should be able to cancel route changes with canClose()", function (done) {

					ViewManager.changeRoute("/canClose", "sync", function () {

						var view = ViewManager.getViewGroup("main").currentView;

						view.locked = true;

						ViewManager.changeRoute("/test1", "sync", function () {
							expect(ViewManager.getViewGroup("main").currentView).to.equal(view);
							view.locked = false;
							ViewManager.changeRoute("/test2", "sync", function () {
								expect(ViewManager.getViewGroup("main").currentView).to.not.equal(view);
								done();
							});
						});
					});
				});

				it("should be able to cancel route changes with update", function (done) {

					ViewManager.changeRoute("/update/1", "sync", function () {

						var route = ViewManager.getViewGroup("main").currentRoute;

						ViewManager.changeRoute("/update/100", "sync", function () {
							expect(ViewManager.getViewGroup("main").currentRoute).to.equal(route);
							ViewManager.changeRoute("/update/2", "sync", function () {
								expect(ViewManager.getViewGroup("main").currentRoute).to.not.equal(route);
								done();
							});
						});
					});
				});

				it("should be able to force refresh a route instead of piping to update()", function (done) {

					//  test 1 -> test single route with optional param
					ViewManager.changeRoute("/refresh/a", "sync", function () {

						var view = ViewManager.getViewGroup("main").currentView;

						ViewManager.changeRoute("/refresh/b", "sync", function () {

							expect(view.hasUpdated).to.equal(false); // should be skipping the update() method changing route
							expect(ViewManager.getViewGroup("main").currentView).to.not.equal(view); // should be a new view

							// test 2 -> test "routes" array
							ViewManager.changeRoute("/refresh-2", "sync", function () {
								view = ViewManager.getViewGroup("main").currentView;
								expect(view.hasUpdated).to.equal(false); // means we didn't call update()

								ViewManager.changeRoute("/refresh-3", "sync", function () {
									expect(view.hasUpdated).to.equal(false); // should be skipping the update() method changing route
									expect(ViewManager.getViewGroup("main").currentView).to.not.equal(view); // should be a new view

									done();
								});
							});
						});
					});
				});

				var history = new History();
				var transitions = new Transitions();

			});
		});
	}
);
