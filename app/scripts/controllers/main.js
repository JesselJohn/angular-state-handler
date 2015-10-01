'use strict';

/**
 * @ngdoc function
 * @name frameworkApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the frameworkApp
 */
angular.module('frameworkApp')
  .controller('MainCtrl', function ($scope, $stateHandle) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    $scope.val = {
    	prm:0
    };

    $stateHandle.subscribe('main',"/c/:prms").response(function(params){
    	$scope.val.prm = params.prms;
	  });

	  $scope.close = function(){
	  	$stateHandle.resetRoute();
	  };
  });
