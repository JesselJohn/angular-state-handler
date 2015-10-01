'use strict';

/**
 * @ngdoc function
 * @name frameworkApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the frameworkApp
 */
angular.module('frameworkApp')
  .controller('AboutCtrl', function ($scope, $stateHandle) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

	$scope.val = {
		prm:"initial"
	};

  $stateHandle.subscribe('about',"/about").response(function(params){
  	$scope.val.prm = "about";
  });

  $stateHandle.subscribe('about',"/contact").response(function(params){
    $stateHandle.setUserAuth(true);
  });

  var cRoute = $stateHandle.subscribe('about',"/c/:prms");

  cRoute.response(function(params){
  	$scope.val.prm = params.prms;
  });

  cRoute.response(function(params){
  	$scope.val.prm = params.prms;
  });
});
