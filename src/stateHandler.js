/*
    Angular State Handler
    2015-10-12
    Public Domain.
    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

! function(window, angular, undefined) {
  "use strict";
  var app = angular.module("stateHandler", ["ngRoute"]),
    randomTemplateUrl = "###" + (Math.random() * 10 / 10) + "###",
    routeHash = {},
    routeTemplateUrlCollection = [],
    dummyElem = document.createElement("a");

  function getRelativePath(url) {
    dummyElem.href = url;
    return {
      path: dummyElem.pathname,
      fullPath: dummyElem.pathname + dummyElem.search
    };
  }

  // function generateSearchStringFromObject(obj) {
  //   var str = undefined;
  //   for (var a in obj) {
  //     if (str === undefined) {
  //       str = "?";
  //     } else {
  //       str += "&";
  //     }
  //     str += a + "=" + obj[a];
  //   }

  //   return str || "";
  // }

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
          setAuthParams: setAuthParamsFn,
          getAuthParams: getAuthParamsFn
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
        if (that.pathExpr == $factoriesForStateHandleProvider.$route.current.originalPath) {
          callback($factoriesForStateHandleProvider.$route.current.params);
        }
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

  app.run(['$route', '$location', '$rootScope', '$timeout', '$stateHandle', '$window', '$q', function($route, $location, $rootScope, $timeout, $stateHandle, $window, $q) {
    var previousUrl = undefined,
      searchUrl = undefined,
      callbackTimeoutId = null,
      isNewLoaded = true,
      userAuthenticated = undefined,
      deferred = $q.defer();

    $stateHandle.route = {};

    // function getPropertyValueFromHistoryStateFn(prop) {
    //   var historyState = $location.$$state;
    //   if (historyState && ('path' in historyState)) {
    //     if (routeHash[historyState.path] && (prop in routeHash[historyState.path])) {
    //       return routeHash[historyState.path][prop];
    //     }
    //   }
    //   var fallBackValue = undefined;
    //   for (var _a3 in routeHash) {
    //     var regexp = new RegExp(routeHash[_a3].regexp),
    //       currentRoute = routeHash[_a3];
    //     if (prop in currentRoute) {
    //       if (historyState && 'path' in historyState && regexp.test(historyState.path)) {
    //         if (prop in routeHash[_a3]) {
    //           return routeHash[_a3][prop];
    //         }
    //       }
    //       if (fallBackValue === undefined) {
    //         fallBackValue = routeHash[_a3][prop];
    //       }
    //     }
    //   }

    //   return fallBackValue;
    // }

    function getPrevUrlIfReloadWhenViewIsSetFn() {
      var historyState = $location.$$state;
      if (historyState && ('path' in historyState)) {
        return historyState.path;
      } else {
        for (var a in routeHash) {
          if (/\/$/.test(a) === true) {
            return a;
          }
        }
      }
    }

    $rootScope.$on('$routeChangeStart', function(event, newUrl, prevUrl) {
      var newUrl = newUrl;
      $stateHandle.route.prevUrl = prevUrl;
      $stateHandle.route.newUrl = newUrl;
      if (newUrl.templateUrl == randomTemplateUrl) {
        if (prevUrl === undefined) {
          var location = $location.path(),
            pathToSet = getPrevUrlIfReloadWhenViewIsSetFn();
          $stateHandle.path(pathToSet);
          $timeout(function() {
            $stateHandle.path(location, false);
          });
        } else {
          $stateHandle.path($location.path(), false);
          if (previousUrl !== undefined) {
            $location.state({
              path: previousUrl,
              searchString: searchUrl
            });
          }
        }
      } else {
        previousUrl = $location.path();
        searchUrl = $location.search();
      }
    });

    $rootScope.$on('$locationChangeStart', function(event, newUrl, prevUrl) {
      var callSubscribers = function(route) {
        var subscribers = $stateHandle.getSubscribers(route.originalPath);
        for (var a in subscribers) {
          var subscriberCallbacks = subscribers[a].callBacks;
          for (var i = 0, len = subscriberCallbacks.length; i < len; i++) {
            subscriberCallbacks[i](route.params);
          }
        }

        if (isNewLoaded && $stateHandle.route.prevUrl !== undefined && route.originalPath !== $stateHandle.route.prevUrl.originalPath) {
          callSubscribers($stateHandle.route.prevUrl);
        }
        isNewLoaded = false;
      };

      $timeout.cancel(callbackTimeoutId);
      callbackTimeoutId = $timeout(function() {
        if ($stateHandle.route && $stateHandle.route.newUrl.title !== undefined) {
          document.title = $stateHandle.route.newUrl.title;
        }
        callSubscribers($stateHandle.route.newUrl);
      }, 100);
    });

    function resetRouteFn(callback) {
      $stateHandle.path(previousUrl || ($location.$$state && $location.$$state.path ||
        function() {
          for (var _a in routeHash) {
            if (/\/$/.test(a) === true) {
              return a;
            }
          }
        }()
      ), false);

      $location.search($location.$$state.searchString);
    }

    function editLocationRouteFunctions(prop) {
      var original = $location[prop];
      return function(value, reload) {
        var ArrayPassedToApply = [];
        if (reload === false) {
          var lastRoute = $route.current,
            un = $rootScope.$on('$locationChangeSuccess', function() {
              $route.current = lastRoute;
              un();
            });
        }
        if (value !== undefined) {
          ArrayPassedToApply.push(value);
        }
        return original.apply($location, ArrayPassedToApply);
      }
    }

    function setUserAuthFn(bool) {
      userAuthenticated = bool;
      deferred.resolve(userAuthenticated);
      return this;
    }

    function ifUserAuthenticatedFn(callback) {
      if (userAuthenticated === undefined) {
        deferred.resolve(false);
      }
      deferred.promise.then(function(userAuthenticated) {
        callback(userAuthenticated);
        callback = function() {};
      });
    }

    $stateHandle.ifUserAuthenticated = ifUserAuthenticatedFn;
    $stateHandle.setUserAuth = setUserAuthFn;
    $stateHandle.resetRoute = resetRouteFn;
    $stateHandle.path = editLocationRouteFunctions("path");
    $stateHandle.search = editLocationRouteFunctions("search");

    routeHash = $route.routes;
    // routeHash.getPropertyValue = getPropertyValueFromHistoryStateFn;
  }]);

  app.config(["$provide", "$routeProvider", "$httpProvider", "$locationProvider", "$stateHandleProvider", "$factoriesForStateHandleProvider",
    function($provide, $routeProvider, $httpProvider, $locationProvider, $stateHandleProvider, $factoriesForStateHandleProvider) {
      var $stateHandle = $stateHandleProvider.$get(),
        whenFn = cloneRouteProviderFn.call($stateHandleProvider, 'when'),
        otherwiseFn = cloneRouteProviderFn.call($stateHandleProvider, 'otherwise'),
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

      $stateHandle.remove = $stateHandleProvider.remove = removeFn;
      $stateHandle.removeCurrent = $stateHandleProvider.removeCurrent = removeCurrentFn;
      $stateHandle.when = $stateHandleProvider.when = whenFn;
      $stateHandle.otherwise = $stateHandleProvider.otherwise = otherwiseFn;
      $stateHandle.reloadRoute = $stateHandleProvider.reloadRoute = reloadRouteFn;
      $stateHandle.noAuth = $stateHandleProvider.noAuth = noAuthFn;

      $locationProvider.html5Mode(true);
    }
  ]);
}(window, window.angular);
