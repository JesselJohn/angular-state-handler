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
        controllerAs: 'about'
      })
      .when('/c/:prms',{
        resolve:{
          message:function(){
            console.log('hello');
          }
        }
      },'cRoutes')
      .when('/contact', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'about'
      })
      .otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode(true);
  });

/*                                          *
 * Module to implement route state handling *
 *                                          */

    var app = angular.module( "stateHandler", [ "ngRoute" ] );

    app.config(
      function( $provide, $routeProvider, $httpProvider, $stateHandleProvider) {
        var $route = undefined,
            $timeout = undefined,
            reloadTimeoutId = undefined,
            randomTemplateUrl = "###" + (Math.random()*10/10) + "###";

        $provide.decorator( "$route", routeDecorator );
        $provide.decorator( "$timeout", timeoutDecorator );

        function cloneRouteProviderFunctions(prop){
          var that = this,
              functionRef = $routeProvider[prop];
          return function(path, route) {
            if(route!==undefined){
              if(!('templateUrl' in route || 'template' in route)){
                route.templateUrl = randomTemplateUrl;
              }
            }
            functionRef.apply( $routeProvider, arguments );
            try{
              $timeout.cancel(reloadTimeoutId);
              reloadTimeoutId = $timeout(this.reloadRoute,300,false);
            }catch(err){}
            return( that );
          };
        };

        

        function timeoutDecorator( $delegate ) {
          $timeout = $delegate;
          return $timeout;
        }

        function routeDecorator( $delegate ) {
          $route = $delegate;
          return $route;
        }

        $stateHandleProvider.remove = function( path ) {
          path = path.replace( /\/$/i, "" );
          delete( $route.routes[ path ] );
          delete( $route.routes[ path + "/" ] );
          return( this );
        };

        $stateHandleProvider.removeCurrent = function(){
          return( this.remove( $route.current.originalPath ) );
        }

        $stateHandleProvider.when = cloneRouteProviderFunctions.call($stateHandleProvider,'when');

        $stateHandleProvider.otherwise = cloneRouteProviderFunctions.call($stateHandleProvider,'otherwise');

        $stateHandleProvider.reloadRoute = function(){
          $route.reload();
        };

        $httpProvider.interceptors.push(function ($q, $location) {
          var cache = {};
            return {
                'request': function (config) {
                  if(config.url===randomTemplateUrl){
                    return cache;
                  }
                  cache = config;
                  return config || $q.when(config);
                }
            }
        });
      }
    );

    app.provider('$stateHandle',function($provide){
      var $browser = undefined,
        // enableRoute = enableRouteConfig(),
        identityHash = {},
        _constructor = function(id){
          this.id = id;
        },
        obj = {
          link:function(id){
            return identityHash[id] || (identityHash[id] = new _constructor(id));
          }
          // ,
          // disableRoute:disableRoute,
          // enableRoute:enableRoute
        };

      _constructor.prototype = {

      };

      $provide.decorator( "$browser", browserDecorator );

      function browserDecorator( $delegate ) {
        $browser = $delegate;
        return $browser;
      }

      // function disableRoute(){
      //   enableRoute = enableRouteConfig();
      //   $browser.onUrlChange = function () {};
      //   $browser.url = function () { return ""};
      // }

      // function enableRouteConfig(){
      //   try{
      //     var browserUrlChangeRef = $browser.onUrlChange,
      //         browserUrlRef = $browser.url;
      //     return function(){
      //       $timeout(function(){
      //         $browser.onUrlChange = browserUrlChangeRef;
      //         $browser.url = browserUrlRef;
      //       },300,false);
      //     };
      //   }catch(err){
      //     return function(){};
      //   }
      // }

      return {
        $get:function(){
          return obj;
        }
      };
    });