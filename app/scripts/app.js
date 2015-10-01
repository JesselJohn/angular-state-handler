'use strict';

/**
 * @ngdoc overview
 * @name frameworkApp
 * @description
 * # frameworkApp
 *
 * Main module of the application.
 */
angular
  .module('frameworkApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'stateHandler'
  ])
  .config(function ($routeProvider, $locationProvider, $httpProvider, $stateHandleProvider) {
    $stateHandleProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about',
        authentication: true
      })
      .when('/contact', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .when('/c/:prms',{
        resolve:{
          message:function(){
          }
        },
        authentication: true
      })
      .noAuth('/signin',{
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });