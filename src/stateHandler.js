/*
    Angular State Handler
    2015-10-12
    Public Domain.
    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

! function(window, angular, undefined) {
  // "use strict";
  var app = angular.module("stateHandler", ["ngRoute"]),
    randomTemplateUrl = "###" + (Math.random() * 10 / 10) + "###",
    routeHash = {},
    routeTemplateUrlCollection = [];

  // Factories required to configure this module
  app.provider('$factoriesForStateHandle', ["$provide",
    function($provide) {
      var obj = {
        $get: function() {}
      };

      getFactoryReferenceFn("$route");
      getFactoryReferenceFn("$timeout");
      getFactoryReferenceFn("$location");

      function getFactoryReferenceFn(factoryName) {
        $provide.decorator(factoryName, ['$delegate', factoryDecoratorFn]);

        function factoryDecoratorFn($delegate) {
          return obj[factoryName] = $delegate;
        };
      }

      return obj;
    }
  ]);

  // Provider to handle view and path state based on routing
  app.provider('$stateHandle', ["$provide", "$factoriesForStateHandleProvider",
    function($provide, $factoriesForStateHandleProvider) {
      var $browser = undefined,
        identityHash = {},
        userAuthenticated = false,
        authParams = {
          path: undefined,
          route: null
        },
        _constructor = function(subscriber, pathExpr) {
          this.subscriber = subscriber;
          this.pathExpr = pathExpr;
          this.callBacks = [];
        },
        obj = {
          subscribe: subscribeFn,
          getSubscribers: getSubscribersFn,
          setUserAuth: setUserAuthFn,
          getUserAuth: getUserAuthFn,
          setAuthParams: setAuthParamsFn,
          getAuthParams: getAuthParamsFn,
          pushStateOnStateChange: function(previousUrl) {
            if (previousUrl !== undefined) {
              var that = this;
              if (window.history && window.history.pushState) {
                window.history.pushState({
                  'path': previousUrl
                }, $factoriesForStateHandleProvider.$location.path(), $factoriesForStateHandleProvider.$location.path());
              }
            }
          }
        };

      function subscribeFn(subscriber, pathExpr) {
        if (!(pathExpr in identityHash)) {
          identityHash[pathExpr] = {};
        } else if (subscriber in identityHash[pathExpr]) {
          identityHash[pathExpr][subscriber].callBacks.length = 0;
        }

        return identityHash[pathExpr][subscriber] || (identityHash[pathExpr][subscriber] = new _constructor(subscriber, pathExpr));
      }

      function getSubscribersFn(pathExpr) {
        return identityHash[pathExpr];
      }

      function setUserAuthFn(bool) {
        userAuthenticated = true;
        return this;
      }

      function getUserAuthFn() {
        return userAuthenticated;
      }

      function setAuthParamsFn(path, route) {
        authParams.path = path;
        authParams.route = route;
        return this;
      }

      function getAuthParamsFn() {
        return authParams;
      }

      function subscriberResponseFn(callback) {
        var that = this;
        that.callBacks.push(callback);

        $factoriesForStateHandleProvider.$timeout(function() {
          if (that.pathExpr == $factoriesForStateHandleProvider.$route.current.originalPath) {
            callback($factoriesForStateHandleProvider.$route.current.params);
          }
        });
      };

      _constructor.prototype = {
        response: subscriberResponseFn
      }

      return {
        $get: function() {
          return obj;
        }
      };
    }
  ]);

  app.run(['$route', '$location', '$rootScope', '$timeout', '$stateHandle', '$window', function($route, $location, $rootScope, $timeout, $stateHandle, $window) {
    var isViewSet = false,
      previousUrl = undefined,
      rechangeLocation = false,
      newTempUrl = undefined,
      dummyElem = document.createElement("a"),
      callbackTimeoutID = null;

    function getPropertyValueFromHistoryStateFn(prop) {
      var historyState = $location.$$state;
      if (historyState && ('path' in historyState)) {
        if (routeHash[historyState.path] && (prop in routeHash[historyState.path])) {
          return routeHash[historyState.path][prop];
        }
      }
      var fallBackValue = undefined;
      for (var _a3 in routeHash) {
        var regexp = new RegExp(routeHash[_a3].regexp),
          currentRoute = routeHash[_a3];
        if (prop in currentRoute) {
          if (historyState && 'path' in historyState && regexp.test(historyState.path)) {
            if (prop in routeHash[_a3]) {
              return routeHash[_a3][prop];
            }
          }
          if (fallBackValue === undefined) {
            fallBackValue = routeHash[_a3][prop];
          }
        }
      }

      return fallBackValue;
    }

    $rootScope.$on('$routeChangeStart', function(event, newUrl, prevUrl) {
      var newUrl = newTempUrl || newUrl;

      if (newUrl.templateUrl == randomTemplateUrl) {
        $stateHandle.route = newUrl;
        event.preventDefault();
        isViewSet = true;
        $rootScope.$broadcast('$routeUpdate', $route);
        return;
      } else if (newTempUrl !== undefined) {
        newTempUrl = undefined;
        rechangeLocation = true;
      }
      if (isViewSet) {
        event.preventDefault();
        isViewSet = false;
        newTempUrl = newUrl;
        return;
      }

      $stateHandle.route = newUrl;
      previousUrl = $location.path();
    });

    $rootScope.$on('$locationChangeStart', function(event, newUrl, prevUrl) {
      var currentPath = function() {
          // console.log(rechangeLocation);
          dummyElem.href = rechangeLocation ? prevUrl : newUrl;
          return {
            path: dummyElem.pathname,
            fullPath: dummyElem.pathname + dummyElem.search
          };
        }(),
        callSubscribers = function(path) {
          var subscribers = $stateHandle.getSubscribers(path);
          $timeout(function() {
            for (var a in subscribers) {
              var subscriberCallbacks = subscribers[a].callBacks;
              for (var i = 0, len = subscriberCallbacks.length; i < len; i++) {
                subscriberCallbacks[i]($stateHandle.route.params);
              }
            }
          }, 0);
        };

      if (rechangeLocation) {
        rechangeLocation = false;
        callSubscribers(currentPath.path);
        $location.path(currentPath.path);
        return;
      }
      if (isViewSet) {
        callSubscribers(currentPath.path);
      }
    });

    routeHash = $route.routes;
    routeHash.getPropertyValue = getPropertyValueFromHistoryStateFn;
  }]);

  app.config(["$provide", "$routeProvider", "$httpProvider", "$locationProvider", "$stateHandleProvider", "$factoriesForStateHandleProvider",
    function($provide, $routeProvider, $httpProvider, $locationProvider, $stateHandleProvider, $factoriesForStateHandleProvider) {
      var $stateHandle = $stateHandleProvider.$get(),
        previousUrl = undefined,
        whenFn = cloneRouteProviderFn.call($stateHandleProvider, 'when'),
        otherwiseFn = cloneRouteProviderFn.call($stateHandleProvider, 'otherwise'),
        callbackTimeoutID = null,
        urlBeforeViewSet = undefined;

      function cloneRouteProviderFn(prop) {
        var that = this,
          functionRef = $routeProvider[prop];
        return function(path, route) {
          if (route !== undefined) {
            if (!('templateUrl' in route || 'template' in route)) {
              route.templateUrl = randomTemplateUrl;
            } else if ('templateUrl' in route) {
              if (routeTemplateUrlCollection.indexOf(route.templateUrl) === -1) {
                routeTemplateUrlCollection.push(route.templateUrl);
              }
            }
          }

          functionRef.apply($routeProvider, arguments);
          return (that);
        };
      }

      function removeFn(path) {
        var $routeRef = $routeProvider.$get();
        path = path.replace(/\/$/i, "");
        delete($routeRef.routes[path]);
        delete($routeRef.routes[path + "/"]);
        return (this);
      }

      function removeCurrentFn() {
        var $routeRef = $routeProvider.$get();
        return (this.remove($routeRef.current.originalPath));
      }

      function reloadRouteFn() {
        $factoriesForStateHandleProvider.$route.reload();
      }

      function noAuthFn(path, route) {
        var that = this,
          authParamsPathRef = $stateHandle.getAuthParams().path;

        if (authParamsPathRef !== undefined) {
          $stateHandleProvider.remove(authParamsPathRef);
        }

        $stateHandle.setAuthParams(path, route);

        if (route !== undefined && 'authentication' in route) {
          delete route['authentication'];
        }

        $stateHandleProvider.when(path, route || {});
        return that;
      }

      function resetRouteFn(callback) {
        var $locationRef = $factoriesForStateHandleProvider.$location;
        $locationRef.path(previousUrl || ($locationRef.$$state && $locationRef.$$state.path ||
          function() {
            for (var _a in routeHash) {
              if (routeHash[_a].templateUrl !== undefined) {
                return routeHash[_a].templateUrl;
              }
            }
          }()
        ));
      }

      $stateHandle.remove = $stateHandleProvider.remove = removeFn;
      $stateHandle.removeCurrent = $stateHandleProvider.removeCurrent = removeCurrentFn;
      $stateHandle.when = $stateHandleProvider.when = whenFn;
      $stateHandle.otherwise = $stateHandleProvider.otherwise = otherwiseFn;
      $stateHandle.reloadRoute = $stateHandleProvider.reloadRoute = reloadRouteFn;
      $stateHandle.noAuth = $stateHandleProvider.noAuth = noAuthFn;
      $stateHandle.resetRoute = resetRouteFn;
      $stateHandle.getPreviousUrl = function() {
        return previousUrl;
      };

      $locationProvider.html5Mode(true);
    }
  ]);
}(window, window.angular);
