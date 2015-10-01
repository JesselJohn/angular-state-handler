"use strict";

!function(){
    var app = angular.module( "stateHandler", [ "ngRoute" ] );

    // Factories required to configure this module
    app.provider('$factoriesForStateHandle',["$provide",
      function($provide){
        var obj = {
            $get:function(){}
          };

        getFactoryReference("$route");
        getFactoryReference("$timeout");
        getFactoryReference("$location");

        function getFactoryReference(factoryName){
          $provide.decorator( factoryName, factoryDecorator );

          function factoryDecorator( $delegate ) {
            return obj[factoryName] = $delegate;
          };
        }

        $provide.decorator( "ngViewDirective", ngViewDirectiveDecorator );

        function ngViewDirectiveDecorator( $delegate, $route, $injector ) {
          var ngViewRef = $delegate[$delegate.length - 1],
            compileRef = ngViewRef.compile || function () {},
            link = function () {
              var current = $route.current;

              if (current.controllerSetting) {
                current.controller = $injector.invoke(current.controllerSetting);
              }

              ngViewRef.link.apply(null, arguments);
            };
          ngViewRef.compile = function () {
            compileRef.apply(ngViewRef, arguments);
            return link;
          };

          return $delegate;
        };
        return obj;
      }
    ]);

    // Provider to handle state based routing
    app.provider('$stateHandle',["$provide", "$factoriesForStateHandleProvider",
      function($provide, $factoriesForStateHandleProvider){
        var $browser = undefined,
          identityHash = {},
          userAuthenticated = false,
          authParams = {path:undefined,route:null},
          _constructor = function(subscriber,pathExpr){
            this.subscriber = subscriber;
            this.pathExpr = pathExpr;
            this.callBacks = [];
          },
          obj = {
            subscribe:function(subscriber,pathExpr){
              if(!(pathExpr in identityHash)){
                identityHash[pathExpr] = {};
              }else if(subscriber in identityHash[pathExpr]){
                identityHash[pathExpr][subscriber].callBacks.length = 0;
              }
              return identityHash[pathExpr][subscriber] || (identityHash[pathExpr][subscriber] = new _constructor(subscriber,pathExpr));
            },
            getSubscribers:function(pathExpr){
              return identityHash[pathExpr];
            },
            setUserAuth:function(bool){
              userAuthenticated = true;
              return this;
            },
            getUserAuth:function(){
              return userAuthenticated;
            },
            setAuthParams:function(path, route){
              authParams.path = path;
              authParams.route = route;
              return this;
            },
            getAuthParams:function(){
              return authParams;
            }
          };

        _constructor.prototype = {
          response:function(callback){
            this.callBacks.push(callback);
            if(this.pathExpr == $factoriesForStateHandleProvider.$route.current.originalPath){
              callback($factoriesForStateHandleProvider.$route.current.params);
            }
          }
        };

        return {
          $get:function(){
            return obj;
          }
        };
      }
    ]);

    app.config([ "$provide", "$routeProvider", "$httpProvider", "$locationProvider", "$stateHandleProvider", "$factoriesForStateHandleProvider",
      function($provide, $routeProvider, $httpProvider, $locationProvider, $stateHandleProvider, $factoriesForStateHandleProvider) {
        var $stateHandle = $stateHandleProvider.$get(),
          previousUrl = undefined,
          randomTemplateUrl = "###" + (Math.random()*10/10) + "###",
          whenFunction = cloneRouteProviderFunctions.call($stateHandleProvider,'when'),
          otherwiseFunction = cloneRouteProviderFunctions.call($stateHandleProvider,'otherwise');

        function executeCallbacks(){
          var that = this,
            callbacksRef = that.callBacks;
            for(var i=0,len = callbacksRef.length;i<len;i++){
              callbacksRef[i]();
            }
        };

        function cloneRouteProviderFunctions(prop){
          var that = this,
              functionRef = $routeProvider[prop];
          return function(path, route) {
            if(route!==undefined){
              if(!('templateUrl' in route || 'template' in route)){
                route.templateUrl = randomTemplateUrl;
              }
              if(!('controller' in route || 'controllerSetting' in route)){
                route.controllerSetting = function($stateHandle){
                  return $stateHandle.route.current.controller;
                };
              }
            }
            functionRef.apply( $routeProvider, arguments );
            return( that );
          };
        };

        function removeFunction( path ) {
          var $routeRef = $routeProvider.$get();
          path = path.replace( /\/$/i, "" );
          delete( $routeRef.routes[ path ] );
          delete( $routeRef.routes[ path + "/" ] );
          return( this );
        };

        function removeCurrentFunction(){
          var $routeRef = $routeProvider.$get();
          return( this.remove( $routeRef.current.originalPath ) );
        };

        function reloadRoute(){
          $factoriesForStateHandleProvider.$route.reload();
        };

        $stateHandle.remove = $stateHandleProvider.remove = removeFunction;
        $stateHandle.removeCurrent = $stateHandleProvider.removeCurrent = removeCurrentFunction;
        $stateHandle.when = $stateHandleProvider.when = whenFunction;
        $stateHandle.otherwise = $stateHandleProvider.otherwise = otherwiseFunction;
        $stateHandle.reloadRoute = $stateHandleProvider.reloadRoute = reloadRoute;
        $stateHandle.noAuth = $stateHandleProvider.noAuth = function(path, route){
          var that = this,
            authParamsPathRef = $stateHandle.getAuthParams().path;
          if(authParamsPathRef !== undefined){
            $stateHandleProvider.remove(authParamsPathRef);
          }
          $stateHandle.setAuthParams(path, route);

          if('authentication' in route){
            delete route['authentication'];
          }

          $stateHandleProvider.when(path, route);
          return that;
        };
        $stateHandle.resetRoute = function(callback){
          $factoriesForStateHandleProvider.$location.path(previousUrl);
        };

        $httpProvider.interceptors.push(function ($q, $location, $timeout) {
          var cache = {};
            return {
                'request': function (config) {
                  var currentRouteRef = $factoriesForStateHandleProvider.$route.current,
                    subscribers = $stateHandle.getSubscribers(currentRouteRef.originalPath);

                  if(currentRouteRef.authentication && !$stateHandle.getUserAuth()){
                    $location.path($stateHandle.getAuthParams().path);
                    return config.url===randomTemplateUrl?cache:config;
                  }
                  $timeout(function(){
                    for(var a in subscribers){
                      var subscriberCallbacks = subscribers[a].callBacks;
                      for(var i=0,len=subscriberCallbacks.length;i<len;i++){
                        subscriberCallbacks[i](currentRouteRef.params);
                      }
                    }
                  });
                  if(config.url===randomTemplateUrl){
                    return cache;
                  }
                  cache = config;
                  $stateHandle.route = angular.copy($factoriesForStateHandleProvider.$route);
                  previousUrl = $location.path();
                  return config || $q.when(config);
                }
            }
        });

        $locationProvider.html5Mode(true);
      }
    ]);
}();