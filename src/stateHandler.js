/*
    cycle.js
    2015-02-25
    Public Domain.
    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html
    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*jslint eval, for */

/*property 
    $ref, apply, call, decycle, hasOwnProperty, length, prototype, push,
    retrocycle, stringify, test, toString
*/

if (typeof JSON.decycle !== 'function') {
  JSON.decycle = function decycle(object) {
    'use strict';

    // Make a deep copy of an object or array, assuring that there is at most
    // one instance of each object or array in the resulting structure. The
    // duplicate references (which might be forming cycles) are replaced with
    // an object of the form
    //      {$ref: PATH}
    // where the PATH is a JSONPath string that locates the first occurance.
    // So,
    //      var a = [];
    //      a[0] = a;
    //      return JSON.stringify(JSON.decycle(a));
    // produces the string '[{"$ref":"$"}]'.

    // JSONPath is used to locate the unique object. $ indicates the top level of
    // the object or array. [NUMBER] or [STRING] indicates a child member or
    // property.

    var objects = [], // Keep a reference to each unique object or array
      paths = []; // Keep the path to each unique object or array

    return (function derez(value, path) {

      // The derez recurses through the object, producing the deep copy.

      var i, // The loop counter
        name, // Property name
        nu; // The new object or array

      // typeof null === 'object', so go on if this value is really an object but not
      // one of the weird builtin objects.

      if (typeof value === 'object' && value !== null &&
        !(value instanceof Boolean) &&
        !(value instanceof Date) &&
        !(value instanceof Number) &&
        !(value instanceof RegExp) &&
        !(value instanceof String)) {

        // If the value is an object or array, look to see if we have already
        // encountered it. If so, return a $ref/path object. This is a hard way,
        // linear search that will get slower as the number of unique objects grows.

        for (i = 0; i < objects.length; i += 1) {
          if (objects[i] === value) {
            return {
              $ref: paths[i]
            };
          }
        }

        // Otherwise, accumulate the unique value and its path.

        objects.push(value);
        paths.push(path);

        // If it is an array, replicate the array.

        if (Object.prototype.toString.apply(value) === '[object Array]') {
          nu = [];
          for (i = 0; i < value.length; i += 1) {
            nu[i] = derez(value[i], path + '[' + i + ']');
          }
        } else {

          // If it is an object, replicate the object.

          nu = {};
          for (name in value) {
            if (Object.prototype.hasOwnProperty.call(value, name)) {
              nu[name] = derez(value[name],
                path + '[' + JSON.stringify(name) + ']');
            }
          }
        }
        return nu;
      }
      return value;
    }(object, '$'));
  };
}


if (typeof JSON.retrocycle !== 'function') {
  JSON.retrocycle = function retrocycle($) {
    'use strict';

    // Restore an object that was reduced by decycle. Members whose values are
    // objects of the form
    //      {$ref: PATH}
    // are replaced with references to the value found by the PATH. This will
    // restore cycles. The object will be mutated.

    // The eval function is used to locate the values described by a PATH. The
    // root object is kept in a $ variable. A regular expression is used to
    // assure that the PATH is extremely well formed. The regexp contains nested
    // * quantifiers. That has been known to have extremely bad performance
    // problems on some browsers for very long strings. A PATH is expected to be
    // reasonably short. A PATH is allowed to belong to a very restricted subset of
    // Goessner's JSONPath.

    // So,
    //      var s = '[{"$ref":"$"}]';
    //      return JSON.retrocycle(JSON.parse(s));
    // produces an array containing a single element which is the array itself.

    var px = /^\$(?:\[(?:\d+|\"(?:[^\\\"\u0000-\u001f]|\\([\\\"\/bfnrt]|u[0-9a-zA-Z]{4}))*\")\])*$/;

    (function rez(value) {

      // The rez function walks recursively through the object looking for $ref
      // properties. When it finds one that has a value that is a path, then it
      // replaces the $ref object with a reference to the value that is found by
      // the path.

      var i, item, name, path;

      if (value && typeof value === 'object') {
        if (Object.prototype.toString.apply(value) === '[object Array]') {
          for (i = 0; i < value.length; i += 1) {
            item = value[i];
            if (item && typeof item === 'object') {
              path = item.$ref;
              if (typeof path === 'string' && px.test(path)) {
                value[i] = eval(path);
              } else {
                rez(item);
              }
            }
          }
        } else {
          for (name in value) {
            if (typeof value[name] === 'object') {
              item = value[name];
              if (item) {
                path = item.$ref;
                if (typeof path === 'string' && px.test(path)) {
                  value[name] = eval(path);
                } else {
                  rez(item);
                }
              }
            }
          }
        }
      }
    }($));
    return $;
  };
}
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
        $provide.decorator(factoryName, factoryDecoratorFn);

        function factoryDecoratorFn($delegate) {
          return obj[factoryName] = $delegate;
        };
      }

      $provide.decorator("ngViewDirective", ngViewDirectiveDecoratorFn);

      function ngViewDirectiveDecoratorFn($delegate, $route, $location, $injector, $window, $stateHandle) {
        if ($route !== randomTemplateUrl) {
          var ngViewRef = $delegate[$delegate.length - 1],
            compileRef = ngViewRef.compile || function() {},
            link = function() {
              var current = $route.current;
              if (current.loadedTemplateUrl === randomTemplateUrl) {
                $stateHandle.pushStateOnStateChange($stateHandle.getPreviousUrl());
              }

              if (current.controllerSetting) {
                current.controller = $injector.invoke(current.controllerSetting);
              }

              ngViewRef.link.apply(null, arguments);
            };
          ngViewRef.compile = function() {
            compileRef.apply(ngViewRef, arguments);
            return link;
          };
        }

        return $delegate;
      };
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
                }, $factoriesForStateHandleProvider.$location.path());
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
      };

      function getSubscribersFn(pathExpr) {
        return identityHash[pathExpr];
      };

      function setUserAuthFn(bool) {
        userAuthenticated = true;
        return this;
      };

      function getUserAuthFn() {
        return userAuthenticated;
      };

      function setAuthParamsFn(path, route) {
        authParams.path = path;
        authParams.route = route;
        return this;
      };

      function getAuthParamsFn() {
        return authParams;
      };

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
      };

      return {
        $get: function() {
          return obj;
        }
      };
    }
  ]);

  app.run(['$route', '$location', function($route, $location){
    function getPropertyValueFromHistoryStateFn(prop){
      var historyState = $location.$$state;
      if (historyState && ('path' in historyState)) {
        if(routeHash[historyState.path] && (prop in routeHash[historyState.path])){
          return routeHash[historyState.path][prop];
        }else{
          var fallBackValue = undefined;
          for(var _a3 in routeHash){
            var regexp = new RegExp(routeHash[_a3].regexp),
              currentRoute = routeHash[_a3];
            if(prop in currentRoute){
              if(regexp.test(historyState.path)){
                return routeHash[_a3][prop];
              }
              if(fallBackValue===undefined){
                fallBackValue = routeHash[_a3][prop];
              }
            }
          }

          return fallBackValue;
        }
      }
    };
    routeHash = $route.routes;
    routeHash.getPropertyValue = getPropertyValueFromHistoryStateFn;
  }]);

  app.config(["$provide", "$routeProvider", "$httpProvider", "$locationProvider", "$stateHandleProvider", "$factoriesForStateHandleProvider",
    function($provide, $routeProvider, $httpProvider, $locationProvider, $stateHandleProvider, $factoriesForStateHandleProvider) {
      var $stateHandle = $stateHandleProvider.$get(),
        previousUrl = undefined,
        whenFn = cloneRouteProviderFn.call($stateHandleProvider, 'when'),
        otherwiseFn = cloneRouteProviderFn.call($stateHandleProvider, 'otherwise'),
        callbackTimeoutID = null;

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
            if (!('controller' in route || 'controllerSetting' in route)) {
              route.controllerSetting = function($stateHandle) {
                if ($stateHandle.route !== undefined) {
                  return $stateHandle.route.controller;
                } else if ($factoriesForStateHandleProvider.$location.$$state !== null) {
                  try{
                    // Throws error if controller property not found
                    return routeHash[$factoriesForStateHandleProvider.$location.$$state.path].controller;
                  }catch(err){
                    // If state path doesn't match paths in routeHash
                    // Possible that the route specified is an expression
                    // We can parse the routes and retrieve the controller property by matching paths with regex
                    return routeHash.getPropertyValue('controller');
                  }
                }
                return "";
              };
            }
          }

          functionRef.apply($routeProvider, arguments);
          return (that);
        };
      };

      function removeFn(path) {
        var $routeRef = $routeProvider.$get();
        path = path.replace(/\/$/i, "");
        delete($routeRef.routes[path]);
        delete($routeRef.routes[path + "/"]);
        return (this);
      };

      function removeCurrentFn() {
        var $routeRef = $routeProvider.$get();
        return (this.remove($routeRef.current.originalPath));
      };

      function reloadRouteFn() {
        $factoriesForStateHandleProvider.$route.reload();
      };

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
      };

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
      };

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

      $httpProvider.interceptors.push(function($q, $location, $timeout) {
        var cache = null;
        return {
          'request': function(config) {
            if (config.url.match(/\.(jpe?g|png|gif|bmp|html)$/gi) && config.url !== randomTemplateUrl && routeTemplateUrlCollection.indexOf(config.url) === -1) {
              return config || $q.when(config);
            }
            var currentRouteRef = $factoriesForStateHandleProvider.$route.current,
              subscribers = $stateHandle.getSubscribers(currentRouteRef.originalPath),
              authParamsRef = $stateHandle.getAuthParams();

            if (authParamsRef.path !== undefined && currentRouteRef.authentication && !$stateHandle.getUserAuth()) {
              $location.path(authParamsRef.path);
              return config.url === randomTemplateUrl ? cache : config;
            }

            $timeout.cancel(callbackTimeoutID);
            callbackTimeoutID = $timeout(function() {
              for (var a in subscribers) {
                var subscriberCallbacks = subscribers[a].callBacks;
                for (var i = 0, len = subscriberCallbacks.length; i < len; i++) {
                  subscriberCallbacks[i](currentRouteRef.params);
                }
              }
            });

            if (config.url === randomTemplateUrl) {
              if (cache !== null) {
                return cache;
              } else {
                var configRef = JSON.decycle(config);
                try {
                  // Throws error if templateUrl property not found
                  configRef.url = routeHash[$location.$$state.path].templateUrl;
                } catch (err) {
                  // If state path doesn't match paths in routeHash
                  // Possible that the route specified is an expression
                  // We can parse the routes and retrieve the controller property by matching paths with regex
                  configRef.url = routeHash.getPropertyValue('templateUrl');
                }
                return configRef;
              }
            }

            cache = config;
            $stateHandle.route = JSON.decycle($factoriesForStateHandleProvider.$route.current.$$route);
            previousUrl = $location.path();
            return config || $q.when(config);
          }
        }
      });

      $locationProvider.html5Mode(true);
    }
  ]);
}(window, window.angular);
