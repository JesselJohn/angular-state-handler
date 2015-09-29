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

    $scope.disableroute = $stateHandle.disableRoute
  });
