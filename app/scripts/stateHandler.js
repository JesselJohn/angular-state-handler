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

    app.config([ "$provide", "$routeProvider", "$httpProvider", "$stateHandleProvider", "$factoriesForStateHandleProvider",
      function($provide, $routeProvider, $httpProvider, $stateHandleProvider, $factoriesForStateHandleProvider) {
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
          path = path.replace( /\/$/i, "" );
          delete( $factoriesForStateHandleProvider.$route.routes[ path ] );
          delete( $factoriesForStateHandleProvider.$route.routes[ path + "/" ] );
          return( this );
        };

        function removeCurrentFunction(){
          return( this.remove( $factoriesForStateHandleProvider.$route.current.originalPath ) );
        };

        function reloadRoute(){
          $factoriesForStateHandleProvider.$route.reload();
        };

        $stateHandle.remove = $stateHandleProvider.remove = removeFunction;
        $stateHandle.removeCurrent = $stateHandleProvider.removeCurrent = removeCurrentFunction;
        $stateHandle.when = $stateHandleProvider.when = whenFunction;
        $stateHandle.otherwise = $stateHandleProvider.otherwise = otherwiseFunction;
        $stateHandle.reloadRoute = $stateHandleProvider.reloadRoute = reloadRoute;
        $stateHandle.resetRoute = function(callback){
          $factoriesForStateHandleProvider.$location.path(previousUrl);
        };

        $httpProvider.interceptors.push(function ($q, $location, $timeout) {
          var cache = {};
            return {
                'request': function (config) {
                  var currentRouteRef = $factoriesForStateHandleProvider.$route.current,
                    subscribers = $stateHandle.getSubscribers(currentRouteRef.originalPath);
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
      }
    ]);
}();