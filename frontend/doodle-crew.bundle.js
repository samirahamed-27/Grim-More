"use client";
var DoodleCrew = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/react/cjs/react.development.js
  var require_react_development = __commonJS({
    "node_modules/react/cjs/react.development.js"(exports, module) {
      "use strict";
      (function() {
        function defineDeprecationWarning(methodName, info) {
          Object.defineProperty(Component.prototype, methodName, {
            get: function() {
              console.warn(
                "%s(...) is deprecated in plain JavaScript React classes. %s",
                info[0],
                info[1]
              );
            }
          });
        }
        function getIteratorFn(maybeIterable) {
          if (null === maybeIterable || "object" !== typeof maybeIterable)
            return null;
          maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
          return "function" === typeof maybeIterable ? maybeIterable : null;
        }
        function warnNoop(publicInstance, callerName) {
          publicInstance = (publicInstance = publicInstance.constructor) && (publicInstance.displayName || publicInstance.name) || "ReactClass";
          var warningKey = publicInstance + "." + callerName;
          didWarnStateUpdateForUnmountedComponent[warningKey] || (console.error(
            "Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to `this.state` directly or define a `state = {};` class property with the desired state in the %s component.",
            callerName,
            publicInstance
          ), didWarnStateUpdateForUnmountedComponent[warningKey] = true);
        }
        function Component(props, context, updater) {
          this.props = props;
          this.context = context;
          this.refs = emptyObject;
          this.updater = updater || ReactNoopUpdateQueue;
        }
        function ComponentDummy() {
        }
        function PureComponent(props, context, updater) {
          this.props = props;
          this.context = context;
          this.refs = emptyObject;
          this.updater = updater || ReactNoopUpdateQueue;
        }
        function noop() {
        }
        function testStringCoercion(value) {
          return "" + value;
        }
        function checkKeyStringCoercion(value) {
          try {
            testStringCoercion(value);
            var JSCompiler_inline_result = false;
          } catch (e) {
            JSCompiler_inline_result = true;
          }
          if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(
              JSCompiler_inline_result,
              "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.",
              JSCompiler_inline_result$jscomp$0
            );
            return testStringCoercion(value);
          }
        }
        function getComponentNameFromType(type) {
          if (null == type) return null;
          if ("function" === typeof type)
            return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
          if ("string" === typeof type) return type;
          switch (type) {
            case REACT_FRAGMENT_TYPE:
              return "Fragment";
            case REACT_PROFILER_TYPE:
              return "Profiler";
            case REACT_STRICT_MODE_TYPE:
              return "StrictMode";
            case REACT_SUSPENSE_TYPE:
              return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
              return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
              return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
              return "ViewTransition";
          }
          if ("object" === typeof type)
            switch ("number" === typeof type.tag && console.error(
              "Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."
            ), type.$$typeof) {
              case REACT_PORTAL_TYPE:
                return "Portal";
              case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
              case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
              case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
              case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
              case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                  return getComponentNameFromType(type(innerType));
                } catch (x) {
                }
            }
          return null;
        }
        function getTaskName(type) {
          if (type === REACT_FRAGMENT_TYPE) return "<>";
          if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE)
            return "<...>";
          try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
          } catch (x) {
            return "<...>";
          }
        }
        function getOwner() {
          var dispatcher = ReactSharedInternals.A;
          return null === dispatcher ? null : dispatcher.getOwner();
        }
        function UnknownOwner() {
          return Error("react-stack-top-frame");
        }
        function hasValidKey(config) {
          if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return false;
          }
          return void 0 !== config.key;
        }
        function defineKeyPropWarningGetter(props, displayName) {
          function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = true, console.error(
              "%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)",
              displayName
            ));
          }
          warnAboutAccessingKey.isReactWarning = true;
          Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: true
          });
        }
        function elementRefGetterWithDeprecationWarning() {
          var componentName = getComponentNameFromType(this.type);
          didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = true, console.error(
            "Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."
          ));
          componentName = this.props.ref;
          return void 0 !== componentName ? componentName : null;
        }
        function ReactElement(type, key, props, owner, debugStack, debugTask) {
          var refProp = props.ref;
          type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type,
            key,
            props,
            _owner: owner
          };
          null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: false,
            get: elementRefGetterWithDeprecationWarning
          }) : Object.defineProperty(type, "ref", { enumerable: false, value: null });
          type._store = {};
          Object.defineProperty(type._store, "validated", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: 0
          });
          Object.defineProperty(type, "_debugInfo", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: null
          });
          Object.defineProperty(type, "_debugStack", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: debugStack
          });
          Object.defineProperty(type, "_debugTask", {
            configurable: false,
            enumerable: false,
            writable: true,
            value: debugTask
          });
          Object.freeze && (Object.freeze(type.props), Object.freeze(type));
          return type;
        }
        function cloneAndReplaceKey(oldElement, newKey) {
          newKey = ReactElement(
            oldElement.type,
            newKey,
            oldElement.props,
            oldElement._owner,
            oldElement._debugStack,
            oldElement._debugTask
          );
          oldElement._store && (newKey._store.validated = oldElement._store.validated);
          return newKey;
        }
        function validateChildKeys(node) {
          isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
        }
        function isValidElement(object) {
          return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
        }
        function escape(key) {
          var escaperLookup = { "=": "=0", ":": "=2" };
          return "$" + key.replace(/[=:]/g, function(match) {
            return escaperLookup[match];
          });
        }
        function getElementKey(element, index) {
          return "object" === typeof element && null !== element && null != element.key ? (checkKeyStringCoercion(element.key), escape("" + element.key)) : index.toString(36);
        }
        function resolveThenable(thenable) {
          switch (thenable.status) {
            case "fulfilled":
              return thenable.value;
            case "rejected":
              throw thenable.reason;
            default:
              switch ("string" === typeof thenable.status ? thenable.then(noop, noop) : (thenable.status = "pending", thenable.then(
                function(fulfilledValue) {
                  "pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
                },
                function(error) {
                  "pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
                }
              )), thenable.status) {
                case "fulfilled":
                  return thenable.value;
                case "rejected":
                  throw thenable.reason;
              }
          }
          throw thenable;
        }
        function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
          var type = typeof children;
          if ("undefined" === type || "boolean" === type) children = null;
          var invokeCallback = false;
          if (null === children) invokeCallback = true;
          else
            switch (type) {
              case "bigint":
              case "string":
              case "number":
                invokeCallback = true;
                break;
              case "object":
                switch (children.$$typeof) {
                  case REACT_ELEMENT_TYPE:
                  case REACT_PORTAL_TYPE:
                    invokeCallback = true;
                    break;
                  case REACT_LAZY_TYPE:
                    return invokeCallback = children._init, mapIntoArray(
                      invokeCallback(children._payload),
                      array,
                      escapedPrefix,
                      nameSoFar,
                      callback
                    );
                }
            }
          if (invokeCallback) {
            invokeCallback = children;
            callback = callback(invokeCallback);
            var childKey = "" === nameSoFar ? "." + getElementKey(invokeCallback, 0) : nameSoFar;
            isArrayImpl(callback) ? (escapedPrefix = "", null != childKey && (escapedPrefix = childKey.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
              return c;
            })) : null != callback && (isValidElement(callback) && (null != callback.key && (invokeCallback && invokeCallback.key === callback.key || checkKeyStringCoercion(callback.key)), escapedPrefix = cloneAndReplaceKey(
              callback,
              escapedPrefix + (null == callback.key || invokeCallback && invokeCallback.key === callback.key ? "" : ("" + callback.key).replace(
                userProvidedKeyEscapeRegex,
                "$&/"
              ) + "/") + childKey
            ), "" !== nameSoFar && null != invokeCallback && isValidElement(invokeCallback) && null == invokeCallback.key && invokeCallback._store && !invokeCallback._store.validated && (escapedPrefix._store.validated = 2), callback = escapedPrefix), array.push(callback));
            return 1;
          }
          invokeCallback = 0;
          childKey = "" === nameSoFar ? "." : nameSoFar + ":";
          if (isArrayImpl(children))
            for (var i = 0; i < children.length; i++)
              nameSoFar = children[i], type = childKey + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(
                nameSoFar,
                array,
                escapedPrefix,
                type,
                callback
              );
          else if (i = getIteratorFn(children), "function" === typeof i)
            for (i === children.entries && (didWarnAboutMaps || console.warn(
              "Using Maps as children is not supported. Use an array of keyed ReactElements instead."
            ), didWarnAboutMaps = true), children = i.call(children), i = 0; !(nameSoFar = children.next()).done; )
              nameSoFar = nameSoFar.value, type = childKey + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(
                nameSoFar,
                array,
                escapedPrefix,
                type,
                callback
              );
          else if ("object" === type) {
            if ("function" === typeof children.then)
              return mapIntoArray(
                resolveThenable(children),
                array,
                escapedPrefix,
                nameSoFar,
                callback
              );
            array = String(children);
            throw Error(
              "Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead."
            );
          }
          return invokeCallback;
        }
        function mapChildren(children, func, context) {
          if (null == children) return children;
          var result = [], count = 0;
          mapIntoArray(children, result, "", "", function(child) {
            return func.call(context, child, count++);
          });
          return result;
        }
        function lazyInitializer(payload) {
          if (-1 === payload._status) {
            var resolveDebugValue = null, rejectDebugValue = null, ioInfo = payload._ioInfo;
            null != ioInfo && (ioInfo.start = ioInfo.end = performance.now(), ioInfo.value = new Promise(function(resolve, reject) {
              resolveDebugValue = resolve;
              rejectDebugValue = reject;
            }));
            ioInfo = payload._result;
            var thenable = ioInfo();
            thenable.then(
              function(moduleObject) {
                if (0 === payload._status || -1 === payload._status) {
                  payload._status = 1;
                  payload._result = moduleObject;
                  var _ioInfo = payload._ioInfo;
                  if (null != _ioInfo) {
                    _ioInfo.end = performance.now();
                    var debugValue = null == moduleObject ? void 0 : moduleObject.default;
                    resolveDebugValue(debugValue);
                    _ioInfo.value.status = "fulfilled";
                    _ioInfo.value.value = debugValue;
                  }
                  void 0 === thenable.status && (thenable.status = "fulfilled", thenable.value = moduleObject);
                }
              },
              function(error) {
                if (0 === payload._status || -1 === payload._status) {
                  payload._status = 2;
                  payload._result = error;
                  var _ioInfo2 = payload._ioInfo;
                  null != _ioInfo2 && (_ioInfo2.end = performance.now(), _ioInfo2.value.then(noop, noop), rejectDebugValue(error), _ioInfo2.value.status = "rejected", _ioInfo2.value.reason = error);
                  void 0 === thenable.status && (thenable.status = "rejected", thenable.reason = error);
                }
              }
            );
            ioInfo = payload._ioInfo;
            if (null != ioInfo) {
              var displayName = thenable.displayName;
              "string" === typeof displayName && (ioInfo.name = displayName);
            }
            -1 === payload._status && (payload._status = 0, payload._result = thenable);
          }
          if (1 === payload._status)
            return ioInfo = payload._result, void 0 === ioInfo && console.error(
              "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))\n\nDid you accidentally put curly braces around the import?",
              ioInfo
            ), "default" in ioInfo || console.error(
              "lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))",
              ioInfo
            ), ioInfo.default;
          throw payload._result;
        }
        function resolveDispatcher() {
          var dispatcher = ReactSharedInternals.H;
          null === dispatcher && console.error(
            "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem."
          );
          return dispatcher;
        }
        function releaseAsyncTransition() {
          ReactSharedInternals.asyncTransitions--;
        }
        function startTransition(scope) {
          var prevTransition = ReactSharedInternals.T, currentTransition = {};
          currentTransition.types = null !== prevTransition ? prevTransition.types : null;
          currentTransition._updatedFibers = /* @__PURE__ */ new Set();
          ReactSharedInternals.T = currentTransition;
          try {
            var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals.S;
            null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
            "object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && (ReactSharedInternals.asyncTransitions++, returnValue.then(releaseAsyncTransition, releaseAsyncTransition), returnValue.then(noop, reportGlobalError));
          } catch (error) {
            reportGlobalError(error);
          } finally {
            null === prevTransition && currentTransition._updatedFibers && (scope = currentTransition._updatedFibers.size, currentTransition._updatedFibers.clear(), 10 < scope && console.warn(
              "Detected a large number of updates inside startTransition. If this is due to a subscription please re-write it to use React provided hooks. Otherwise concurrent mode guarantees are off the table."
            )), null !== prevTransition && null !== currentTransition.types && (null !== prevTransition.types && prevTransition.types !== currentTransition.types && console.error(
              "We expected inner Transitions to have transferred the outer types set and that you cannot add to the outer Transition while inside the inner.This is a bug in React."
            ), prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
          }
        }
        function addTransitionType(type) {
          var transition = ReactSharedInternals.T;
          if (null !== transition) {
            var transitionTypes = transition.types;
            null === transitionTypes ? transition.types = [type] : -1 === transitionTypes.indexOf(type) && transitionTypes.push(type);
          } else
            0 === ReactSharedInternals.asyncTransitions && console.error(
              "addTransitionType can only be called inside a `startTransition()` callback. It must be associated with a specific Transition."
            ), startTransition(addTransitionType.bind(null, type));
        }
        function enqueueTask(task) {
          if (null === enqueueTaskImpl)
            try {
              var requireString = ("require" + Math.random()).slice(0, 7);
              enqueueTaskImpl = (module && module[requireString]).call(
                module,
                "timers"
              ).setImmediate;
            } catch (_err) {
              enqueueTaskImpl = function(callback) {
                false === didWarnAboutMessageChannel && (didWarnAboutMessageChannel = true, "undefined" === typeof MessageChannel && console.error(
                  "This browser does not have a MessageChannel implementation, so enqueuing tasks via await act(async () => ...) will fail. Please file an issue at https://github.com/facebook/react/issues if you encounter this warning."
                ));
                var channel = new MessageChannel();
                channel.port1.onmessage = callback;
                channel.port2.postMessage(void 0);
              };
            }
          return enqueueTaskImpl(task);
        }
        function aggregateErrors(errors) {
          return 1 < errors.length && "function" === typeof AggregateError ? new AggregateError(errors) : errors[0];
        }
        function popActScope(prevActQueue, prevActScopeDepth) {
          prevActScopeDepth !== actScopeDepth - 1 && console.error(
            "You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one. "
          );
          actScopeDepth = prevActScopeDepth;
        }
        function recursivelyFlushAsyncActWork(returnValue, resolve, reject) {
          var queue = ReactSharedInternals.actQueue;
          if (null !== queue)
            if (0 !== queue.length)
              try {
                flushActQueue(queue);
                enqueueTask(function() {
                  return recursivelyFlushAsyncActWork(returnValue, resolve, reject);
                });
                return;
              } catch (error) {
                ReactSharedInternals.thrownErrors.push(error);
              }
            else ReactSharedInternals.actQueue = null;
          0 < ReactSharedInternals.thrownErrors.length ? (queue = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, reject(queue)) : resolve(returnValue);
        }
        function flushActQueue(queue) {
          if (!isFlushing) {
            isFlushing = true;
            var i = 0;
            try {
              for (; i < queue.length; i++) {
                var callback = queue[i];
                do {
                  ReactSharedInternals.didUsePromise = false;
                  var continuation = callback(false);
                  if (null !== continuation) {
                    if (ReactSharedInternals.didUsePromise) {
                      queue[i] = callback;
                      queue.splice(0, i);
                      return;
                    }
                    callback = continuation;
                  } else break;
                } while (1);
              }
              queue.length = 0;
            } catch (error) {
              queue.splice(0, i + 1), ReactSharedInternals.thrownErrors.push(error);
            } finally {
              isFlushing = false;
            }
          }
        }
        "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStart(Error());
        var REACT_ELEMENT_TYPE = /* @__PURE__ */ Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = /* @__PURE__ */ Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = /* @__PURE__ */ Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = /* @__PURE__ */ Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = /* @__PURE__ */ Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = /* @__PURE__ */ Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = /* @__PURE__ */ Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = /* @__PURE__ */ Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = /* @__PURE__ */ Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = /* @__PURE__ */ Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = /* @__PURE__ */ Symbol.for("react.memo"), REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = /* @__PURE__ */ Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = /* @__PURE__ */ Symbol.for("react.view_transition"), MAYBE_ITERATOR_SYMBOL = Symbol.iterator, didWarnStateUpdateForUnmountedComponent = {}, ReactNoopUpdateQueue = {
          isMounted: function() {
            return false;
          },
          enqueueForceUpdate: function(publicInstance) {
            warnNoop(publicInstance, "forceUpdate");
          },
          enqueueReplaceState: function(publicInstance) {
            warnNoop(publicInstance, "replaceState");
          },
          enqueueSetState: function(publicInstance) {
            warnNoop(publicInstance, "setState");
          }
        }, assign = Object.assign, emptyObject = {};
        Object.freeze(emptyObject);
        Component.prototype.isReactComponent = {};
        Component.prototype.setState = function(partialState, callback) {
          if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState)
            throw Error(
              "takes an object of state variables to update or a function which returns an object of state variables."
            );
          this.updater.enqueueSetState(this, partialState, callback, "setState");
        };
        Component.prototype.forceUpdate = function(callback) {
          this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
        };
        var deprecatedAPIs = {
          isMounted: [
            "isMounted",
            "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."
          ],
          replaceState: [
            "replaceState",
            "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."
          ]
        };
        for (fnName in deprecatedAPIs)
          deprecatedAPIs.hasOwnProperty(fnName) && defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
        ComponentDummy.prototype = Component.prototype;
        deprecatedAPIs = PureComponent.prototype = new ComponentDummy();
        deprecatedAPIs.constructor = PureComponent;
        assign(deprecatedAPIs, Component.prototype);
        deprecatedAPIs.isPureReactComponent = true;
        var isArrayImpl = Array.isArray, REACT_CLIENT_REFERENCE = /* @__PURE__ */ Symbol.for("react.client.reference"), ReactSharedInternals = {
          H: null,
          A: null,
          T: null,
          S: null,
          actQueue: null,
          asyncTransitions: 0,
          isBatchingLegacy: false,
          didScheduleLegacyUpdate: false,
          didUsePromise: false,
          thrownErrors: [],
          getCurrentStack: null,
          recentlyCreatedOwnerStacks: 0
        }, hasOwnProperty = Object.prototype.hasOwnProperty, createTask = console.createTask ? console.createTask : function() {
          return null;
        };
        deprecatedAPIs = {
          react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
          }
        };
        var specialPropKeyWarningShown, didWarnAboutOldJSXRuntime;
        var didWarnAboutElementRef = {};
        var unknownOwnerDebugStack = deprecatedAPIs.react_stack_bottom_frame.bind(
          deprecatedAPIs,
          UnknownOwner
        )();
        var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
        var didWarnAboutMaps = false, userProvidedKeyEscapeRegex = /\/+/g, reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
          if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
            var event = new window.ErrorEvent("error", {
              bubbles: true,
              cancelable: true,
              message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
              error
            });
            if (!window.dispatchEvent(event)) return;
          } else if ("object" === typeof process && "function" === typeof process.emit) {
            process.emit("uncaughtException", error);
            return;
          }
          console.error(error);
        }, didWarnAboutMessageChannel = false, enqueueTaskImpl = null, actScopeDepth = 0, didWarnNoAwaitAct = false, isFlushing = false, queueSeveralMicrotasks = "function" === typeof queueMicrotask ? function(callback) {
          queueMicrotask(function() {
            return queueMicrotask(callback);
          });
        } : enqueueTask;
        deprecatedAPIs = Object.freeze({
          __proto__: null,
          c: function(size) {
            return resolveDispatcher().useMemoCache(size);
          }
        });
        var fnName = {
          map: mapChildren,
          forEach: function(children, forEachFunc, forEachContext) {
            mapChildren(
              children,
              function() {
                forEachFunc.apply(this, arguments);
              },
              forEachContext
            );
          },
          count: function(children) {
            var n = 0;
            mapChildren(children, function() {
              n++;
            });
            return n;
          },
          toArray: function(children) {
            return mapChildren(children, function(child) {
              return child;
            }) || [];
          },
          only: function(children) {
            if (!isValidElement(children))
              throw Error(
                "React.Children.only expected to receive a single React element child."
              );
            return children;
          }
        };
        exports.Activity = REACT_ACTIVITY_TYPE;
        exports.Children = fnName;
        exports.Component = Component;
        exports.Fragment = REACT_FRAGMENT_TYPE;
        exports.Profiler = REACT_PROFILER_TYPE;
        exports.PureComponent = PureComponent;
        exports.StrictMode = REACT_STRICT_MODE_TYPE;
        exports.Suspense = REACT_SUSPENSE_TYPE;
        exports.ViewTransition = REACT_VIEW_TRANSITION_TYPE;
        exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals;
        exports.__COMPILER_RUNTIME = deprecatedAPIs;
        exports.act = function(callback) {
          var prevActQueue = ReactSharedInternals.actQueue, prevActScopeDepth = actScopeDepth;
          actScopeDepth++;
          var queue = ReactSharedInternals.actQueue = null !== prevActQueue ? prevActQueue : [], didAwaitActCall = false;
          try {
            var result = callback();
          } catch (error) {
            ReactSharedInternals.thrownErrors.push(error);
          }
          if (0 < ReactSharedInternals.thrownErrors.length)
            throw popActScope(prevActQueue, prevActScopeDepth), callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
          if (null !== result && "object" === typeof result && "function" === typeof result.then) {
            var thenable = result;
            queueSeveralMicrotasks(function() {
              didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
                "You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);"
              ));
            });
            return {
              then: function(resolve, reject) {
                didAwaitActCall = true;
                thenable.then(
                  function(returnValue) {
                    popActScope(prevActQueue, prevActScopeDepth);
                    if (0 === prevActScopeDepth) {
                      try {
                        flushActQueue(queue), enqueueTask(function() {
                          return recursivelyFlushAsyncActWork(
                            returnValue,
                            resolve,
                            reject
                          );
                        });
                      } catch (error$0) {
                        ReactSharedInternals.thrownErrors.push(error$0);
                      }
                      if (0 < ReactSharedInternals.thrownErrors.length) {
                        var _thrownError = aggregateErrors(
                          ReactSharedInternals.thrownErrors
                        );
                        ReactSharedInternals.thrownErrors.length = 0;
                        reject(_thrownError);
                      }
                    } else resolve(returnValue);
                  },
                  function(error) {
                    popActScope(prevActQueue, prevActScopeDepth);
                    0 < ReactSharedInternals.thrownErrors.length ? (error = aggregateErrors(
                      ReactSharedInternals.thrownErrors
                    ), ReactSharedInternals.thrownErrors.length = 0, reject(error)) : reject(error);
                  }
                );
              }
            };
          }
          var returnValue$jscomp$0 = result;
          popActScope(prevActQueue, prevActScopeDepth);
          0 === prevActScopeDepth && (flushActQueue(queue), 0 !== queue.length && queueSeveralMicrotasks(function() {
            didAwaitActCall || didWarnNoAwaitAct || (didWarnNoAwaitAct = true, console.error(
              "A component suspended inside an `act` scope, but the `act` call was not awaited. When testing React components that depend on asynchronous data, you must await the result:\n\nawait act(() => ...)"
            ));
          }), ReactSharedInternals.actQueue = null);
          if (0 < ReactSharedInternals.thrownErrors.length)
            throw callback = aggregateErrors(ReactSharedInternals.thrownErrors), ReactSharedInternals.thrownErrors.length = 0, callback;
          return {
            then: function(resolve, reject) {
              didAwaitActCall = true;
              0 === prevActScopeDepth ? (ReactSharedInternals.actQueue = queue, enqueueTask(function() {
                return recursivelyFlushAsyncActWork(
                  returnValue$jscomp$0,
                  resolve,
                  reject
                );
              })) : resolve(returnValue$jscomp$0);
            }
          };
        };
        exports.addTransitionType = addTransitionType;
        exports.cache = function(fn) {
          return function() {
            return fn.apply(null, arguments);
          };
        };
        exports.cacheSignal = function() {
          return null;
        };
        exports.captureOwnerStack = function() {
          var getCurrentStack = ReactSharedInternals.getCurrentStack;
          return null === getCurrentStack ? null : getCurrentStack();
        };
        exports.cloneElement = function(element, config, children) {
          if (null === element || void 0 === element)
            throw Error(
              "The argument must be a React element, but you passed " + element + "."
            );
          var props = assign({}, element.props), key = element.key, owner = element._owner;
          if (null != config) {
            var JSCompiler_inline_result;
            a: {
              if (hasOwnProperty.call(config, "ref") && (JSCompiler_inline_result = Object.getOwnPropertyDescriptor(
                config,
                "ref"
              ).get) && JSCompiler_inline_result.isReactWarning) {
                JSCompiler_inline_result = false;
                break a;
              }
              JSCompiler_inline_result = void 0 !== config.ref;
            }
            JSCompiler_inline_result && (owner = getOwner());
            hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key);
            for (propName in config)
              !hasOwnProperty.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
          }
          var propName = arguments.length - 2;
          if (1 === propName) props.children = children;
          else if (1 < propName) {
            JSCompiler_inline_result = Array(propName);
            for (var i = 0; i < propName; i++)
              JSCompiler_inline_result[i] = arguments[i + 2];
            props.children = JSCompiler_inline_result;
          }
          props = ReactElement(
            element.type,
            key,
            props,
            owner,
            element._debugStack,
            element._debugTask
          );
          for (key = 2; key < arguments.length; key++)
            validateChildKeys(arguments[key]);
          return props;
        };
        exports.createContext = function(defaultValue) {
          defaultValue = {
            $$typeof: REACT_CONTEXT_TYPE,
            _currentValue: defaultValue,
            _currentValue2: defaultValue,
            _threadCount: 0,
            Provider: null,
            Consumer: null
          };
          defaultValue.Provider = defaultValue;
          defaultValue.Consumer = {
            $$typeof: REACT_CONSUMER_TYPE,
            _context: defaultValue
          };
          defaultValue._currentRenderer = null;
          defaultValue._currentRenderer2 = null;
          return defaultValue;
        };
        exports.createElement = function(type, config, children) {
          for (var i = 2; i < arguments.length; i++)
            validateChildKeys(arguments[i]);
          var propName;
          i = {};
          var key = null;
          if (null != config)
            for (propName in didWarnAboutOldJSXRuntime || !("__self" in config) || "key" in config || (didWarnAboutOldJSXRuntime = true, console.warn(
              "Your app (or one of its dependencies) is using an outdated JSX transform. Update to the modern JSX transform for faster performance: https://react.dev/link/new-jsx-transform"
            )), hasValidKey(config) && (checkKeyStringCoercion(config.key), key = "" + config.key), config)
              hasOwnProperty.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (i[propName] = config[propName]);
          var childrenLength = arguments.length - 2;
          if (1 === childrenLength) i.children = children;
          else if (1 < childrenLength) {
            for (var childArray = Array(childrenLength), _i = 0; _i < childrenLength; _i++)
              childArray[_i] = arguments[_i + 2];
            Object.freeze && Object.freeze(childArray);
            i.children = childArray;
          }
          if (type && type.defaultProps)
            for (propName in childrenLength = type.defaultProps, childrenLength)
              void 0 === i[propName] && (i[propName] = childrenLength[propName]);
          key && defineKeyPropWarningGetter(
            i,
            "function" === typeof type ? type.displayName || type.name || "Unknown" : type
          );
          (propName = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++) ? (childArray = Error.stackTraceLimit, Error.stackTraceLimit = 10, childrenLength = Error("react-stack-top-frame"), Error.stackTraceLimit = childArray) : childrenLength = unknownOwnerDebugStack;
          return ReactElement(
            type,
            key,
            i,
            getOwner(),
            childrenLength,
            propName ? createTask(getTaskName(type)) : unknownOwnerDebugTask
          );
        };
        exports.createRef = function() {
          var refObject = { current: null };
          Object.seal(refObject);
          return refObject;
        };
        exports.forwardRef = function(render) {
          null != render && render.$$typeof === REACT_MEMO_TYPE ? console.error(
            "forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...))."
          ) : "function" !== typeof render ? console.error(
            "forwardRef requires a render function but was given %s.",
            null === render ? "null" : typeof render
          ) : 0 !== render.length && 2 !== render.length && console.error(
            "forwardRef render functions accept exactly two parameters: props and ref. %s",
            1 === render.length ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined."
          );
          null != render && null != render.defaultProps && console.error(
            "forwardRef render functions do not support defaultProps. Did you accidentally pass a React component?"
          );
          var elementType = { $$typeof: REACT_FORWARD_REF_TYPE, render }, ownName;
          Object.defineProperty(elementType, "displayName", {
            enumerable: false,
            configurable: true,
            get: function() {
              return ownName;
            },
            set: function(name) {
              ownName = name;
              render.name || render.displayName || (Object.defineProperty(render, "name", { value: name }), render.displayName = name);
            }
          });
          return elementType;
        };
        exports.isValidElement = isValidElement;
        exports.lazy = function(ctor) {
          ctor = { _status: -1, _result: ctor };
          var lazyType = {
            $$typeof: REACT_LAZY_TYPE,
            _payload: ctor,
            _init: lazyInitializer
          }, ioInfo = {
            name: "lazy",
            start: -1,
            end: -1,
            value: null,
            owner: null,
            debugStack: Error("react-stack-top-frame"),
            debugTask: console.createTask ? console.createTask("lazy()") : null
          };
          ctor._ioInfo = ioInfo;
          lazyType._debugInfo = [{ awaited: ioInfo }];
          return lazyType;
        };
        exports.memo = function(type, compare) {
          null == type && console.error(
            "memo: The first argument must be a component. Instead received: %s",
            null === type ? "null" : typeof type
          );
          compare = {
            $$typeof: REACT_MEMO_TYPE,
            type,
            compare: void 0 === compare ? null : compare
          };
          var ownName;
          Object.defineProperty(compare, "displayName", {
            enumerable: false,
            configurable: true,
            get: function() {
              return ownName;
            },
            set: function(name) {
              ownName = name;
              type.name || type.displayName || (Object.defineProperty(type, "name", { value: name }), type.displayName = name);
            }
          });
          return compare;
        };
        exports.startTransition = startTransition;
        exports.unstable_useCacheRefresh = function() {
          return resolveDispatcher().useCacheRefresh();
        };
        exports.use = function(usable) {
          return resolveDispatcher().use(usable);
        };
        exports.useActionState = function(action, initialState, permalink) {
          return resolveDispatcher().useActionState(
            action,
            initialState,
            permalink
          );
        };
        exports.useCallback = function(callback, deps) {
          return resolveDispatcher().useCallback(callback, deps);
        };
        exports.useContext = function(Context) {
          var dispatcher = resolveDispatcher();
          Context.$$typeof === REACT_CONSUMER_TYPE && console.error(
            "Calling useContext(Context.Consumer) is not supported and will cause bugs. Did you mean to call useContext(Context) instead?"
          );
          return dispatcher.useContext(Context);
        };
        exports.useDebugValue = function(value, formatterFn) {
          return resolveDispatcher().useDebugValue(value, formatterFn);
        };
        exports.useDeferredValue = function(value, initialValue) {
          return resolveDispatcher().useDeferredValue(value, initialValue);
        };
        exports.useEffect = function(create, deps) {
          null == create && console.warn(
            "React Hook useEffect requires an effect callback. Did you forget to pass a callback to the hook?"
          );
          return resolveDispatcher().useEffect(create, deps);
        };
        exports.useEffectEvent = function(callback) {
          return resolveDispatcher().useEffectEvent(callback);
        };
        exports.useId = function() {
          return resolveDispatcher().useId();
        };
        exports.useImperativeHandle = function(ref, create, deps) {
          return resolveDispatcher().useImperativeHandle(ref, create, deps);
        };
        exports.useInsertionEffect = function(create, deps) {
          null == create && console.warn(
            "React Hook useInsertionEffect requires an effect callback. Did you forget to pass a callback to the hook?"
          );
          return resolveDispatcher().useInsertionEffect(create, deps);
        };
        exports.useLayoutEffect = function(create, deps) {
          null == create && console.warn(
            "React Hook useLayoutEffect requires an effect callback. Did you forget to pass a callback to the hook?"
          );
          return resolveDispatcher().useLayoutEffect(create, deps);
        };
        exports.useMemo = function(create, deps) {
          return resolveDispatcher().useMemo(create, deps);
        };
        exports.useOptimistic = function(passthrough, reducer) {
          return resolveDispatcher().useOptimistic(passthrough, reducer);
        };
        exports.useReducer = function(reducer, initialArg, init) {
          return resolveDispatcher().useReducer(reducer, initialArg, init);
        };
        exports.useRef = function(initialValue) {
          return resolveDispatcher().useRef(initialValue);
        };
        exports.useState = function(initialState) {
          return resolveDispatcher().useState(initialState);
        };
        exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
          return resolveDispatcher().useSyncExternalStore(
            subscribe,
            getSnapshot,
            getServerSnapshot
          );
        };
        exports.useTransition = function() {
          return resolveDispatcher().useTransition();
        };
        exports.version = "19.3.1";
        "undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ && "function" === typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop && __REACT_DEVTOOLS_GLOBAL_HOOK__.registerInternalModuleStop(Error());
      })();
    }
  });

  // node_modules/react/index.js
  var require_react = __commonJS({
    "node_modules/react/index.js"(exports, module) {
      "use strict";
      if (false) {
        module.exports = null;
      } else {
        module.exports = require_react_development();
      }
    }
  });

  // components/ui/doodle-crew-footer-sunny.tsx
  var doodle_crew_footer_sunny_exports = {};
  __export(doodle_crew_footer_sunny_exports, {
    clamp: () => clamp,
    default: () => DoodleCrewFooter,
    hash: () => hash,
    layoutWord: () => layoutWord,
    lookAt: () => lookAt,
    seatPoint: () => seatPoint,
    stepFloater: () => stepFloater,
    timeline: () => timeline
  });
  var React = __toESM(require_react());
  var hash = (n) => {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  var clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  var layoutWord = (advances, tracking, fontSize) => {
    const x = [];
    const w = [];
    let at = 0;
    const gap = (Number.isFinite(tracking) ? tracking : 0) * fontSize;
    for (let i = 0; i < advances.length; i++) {
      const a = Number.isFinite(advances[i]) && advances[i] > 0 ? advances[i] : 0;
      x.push(at);
      w.push(a);
      at += a + (i < advances.length - 1 ? gap : 0);
    }
    return { x, w, width: Math.max(0, at) };
  };
  var seatPoint = (seat, letterX, letterW, cap, offset, scale) => {
    const x = letterX + letterW * (0.5 + (Number.isFinite(offset) ? offset : 0));
    if (seat === "top") return { x, y: -cap };
    if (seat === "behind") return { x, y: -cap + 30 * scale };
    return { x, y: 0 };
  };
  var lookAt = (ex, ey, tx, ty, max, reach) => {
    const dx = tx - ex;
    const dy = ty - ey;
    const d = Math.hypot(dx, dy);
    if (!Number.isFinite(d) || d < 1e-6 || max <= 0) return { x: 0, y: 0 };
    const k = max * Math.min(1, d / Math.max(1e-6, reach)) / d;
    return { x: dx * k, y: dy * k };
  };
  var stepFloater = (f, dt, t, w, h, px, py, radius, rand) => {
    const step = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.05);
    const m = 40;
    if (f.pop > 0) {
      f.pop -= step;
      if (f.pop <= 0) {
        f.pop = 0;
        f.x = rand() * w;
        f.y = -m;
        f.vx = 0;
        f.vy = f.fall;
      }
      return f;
    }
    const sway = Math.sin(t * 0.7 + f.phase) * 14;
    if (Number.isFinite(px) && Number.isFinite(py) && radius > 0) {
      const dx = f.x - px;
      const dy = f.y - py;
      const d = Math.hypot(dx, dy);
      if (d < radius && d > 0.01) {
        const k = (1 - d / radius) * (1 - d / radius) * 2400;
        f.vx += dx / d * k * step;
        f.vy += dy / d * k * step;
        f.vr += (dx > 0 ? 1 : -1) * k * 4e-3 * step;
      }
    }
    const ease = Math.min(1, step * 2.4);
    f.vx += (sway - f.vx) * ease;
    f.vy += (f.fall - f.vy) * ease;
    f.vr += (Math.sin(f.phase * 3) * 18 - f.vr) * Math.min(1, step * 0.8);
    f.x += f.vx * step;
    f.y += f.vy * step;
    f.rot = (f.rot + f.vr * step) % 360;
    if (f.y > h + m) {
      f.y = -m;
      f.x = rand() * w;
    } else if (f.y < -m * 3) {
      f.y = h + m;
    }
    if (f.x < -m) f.x = w + m;
    else if (f.x > w + m) f.x = -m;
    return f;
  };
  var timeline = (letters, crew, words, actions) => {
    const L = Math.max(0, Math.floor(letters) || 0);
    const C = Math.max(0, Math.floor(crew) || 0);
    const W = Math.max(0, Math.floor(words) || 0);
    const A = Math.max(0, Math.floor(actions) || 0);
    const letter = (i) => 160 + i * 80;
    const crewStart = letter(Math.max(0, L - 1)) + 420;
    const member = (j) => crewStart + j * 130;
    const doodles = crewStart + Math.max(0, C - 1) * 130 * 0.5;
    const copy = crewStart + 260;
    const word = (k) => copy + k * 45;
    const actionsStart = word(W) + 120;
    const action = (k) => actionsStart + k * 110;
    const total = Math.max(member(Math.max(0, C - 1)) + 720, action(Math.max(0, A - 1)) + 600, letter(Math.max(0, L - 1)) + 560);
    return { ground: 60, letter, crewStart, member, doodles, word, action, total };
  };
  var PRESETS = {
    auto: { background: "var(--color-background, #ffffff)", ink: "var(--color-foreground, #0d0d0d)", accent: "#ff6b2c" },
    paper: { background: "#ffffff", ink: "#0d0d0d", accent: "#ff6b2c" },
    night: { background: "#0e0e10", ink: "#f4f1ea", accent: "#ff8a3d" },
    riso: { background: "#f4f2ff", ink: "#2433c9", accent: "#ff4f8b" },
    sunny: { background: "#ffd94a", ink: "#141414", accent: "#e8402a" }
  };
  var DEFAULT_CREW = [
    { kind: "yeti", letter: 0, seat: "front", offset: -0.32, name: "Bruno", says: "Hungry. Got snacks?" },
    { kind: "bird", letter: 1, seat: "top", offset: 0.02, name: "Pip", says: "Tweet us! Seriously." },
    { kind: "mushroom", letter: 2, seat: "front", offset: 0.12, scale: 0.95, name: "Morel", says: "I'm a fun guy." },
    { kind: "kid", letter: 4, seat: "top", offset: -0.05, name: "Juno", says: "Up here! Best seat in the house." },
    { kind: "ghost", letter: 6, seat: "behind", offset: 0, name: "Boo", says: "Boo! \u2026sorry. Hi." },
    { kind: "cat", letter: 7, seat: "front", offset: 0.42, flip: true, name: "Patch", says: "Arr. Nice cursor." }
  ];
  var DEFAULT_COLUMNS = [
    { title: "Play", links: [{ label: "Download", href: "#" }, { label: "Patch notes", href: "#" }, { label: "Roadmap", href: "#" }, { label: "Wiki", href: "#" }] },
    { title: "Shop", links: [{ label: "Sticker packs", href: "#" }, { label: "Plushies", href: "#" }, { label: "Art prints", href: "#" }, { label: "Gift cards", href: "#" }] },
    { title: "Community", links: [{ label: "Discord", href: "#" }, { label: "Fan art", href: "#" }, { label: "Events", href: "#" }, { label: "Creators", href: "#" }] },
    { title: "Studio", links: [{ label: "About", href: "#" }, { label: "Careers", href: "#" }, { label: "Press kit", href: "#" }, { label: "Contact", href: "#" }] }
  ];
  var DEFAULT_ACTIONS = [
    { label: "Grab a sticker pack", href: "#", icon: "sandwich", variant: "outline" },
    { label: "Play free", href: "#", icon: "bolt", variant: "solid" }
  ];
  var DEFAULT_DOODLES = ["flame", "sandwich", "star", "flame", "heart", "sandwich", "bolt", "sparkle"];
  var ACCENT = { flame: "#ff7a1a", flameCore: "#ffd23f", gold: "#ffd23f", heart: "#ff5c7a", bread: "#f2c48d", crumb: "#fff1d6", leaf: "#5fb247", beak: "#ff9f1c", cap: "#ff4d4d" };
  var ART = {
    yeti: {
      k: 1,
      box: { l: -72, r: 60, t: -140, b: 6 },
      seat: "front",
      eyes: [
        { x: -15, y: -86, r: 8, pupil: 3.6, max: 3.6 },
        { x: 13, y: -88, r: 8, pupil: 3.6, max: 3.6 }
      ],
      body: (hatch) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("ellipse", { className: "dcf-shadow", cx: "0", cy: "2", rx: "54", ry: "5" }), /* @__PURE__ */ React.createElement("path", { d: "M-40 -92 C-62 -92 -70 -76 -68 -56 L-66 -30 C-64 -18 -54 -16 -44 -20 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M-40 -92 C-62 -92 -70 -76 -68 -56 L-66 -30 C-64 -18 -54 -16 -44 -20 Z", fill: hatch, stroke: "none" }), /* @__PURE__ */ React.createElement("path", { className: "n", d: "M-67 -64 C-58 -59 -50 -59 -43 -64" }), /* @__PURE__ */ React.createElement("path", { d: "M-30 -104 C-40 -112 -44 -124 -40 -138 C-32 -129 -22 -122 -13 -114 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M18 -114 C26 -124 36 -130 47 -133 C45 -120 41 -110 32 -101 Z" }), /* @__PURE__ */ React.createElement("path", { className: "n", d: "M-38 -124 L-28 -119 M39 -125 L33 -116" }), /* @__PURE__ */ React.createElement("path", { d: "M-44 -2 C-54 -28 -54 -66 -42 -90 C-32 -110 -14 -118 2 -118 C22 -118 40 -108 48 -88 C58 -64 58 -28 48 -2 C30 4 -26 4 -44 -2 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M40 -96 C54 -66 54 -30 46 -4 C40 -2 34 -1 30 0 C40 -30 42 -64 33 -101 Z", fill: hatch, stroke: "none" }), /* @__PURE__ */ React.createElement("path", { className: "n", d: "M-7 -117 C-5 -126 1 -128 3 -120 C5 -127 11 -126 11 -116" }), /* @__PURE__ */ React.createElement("path", { className: "n thin", d: "M-14 -24 l-3 4 M8 -40 l3 4 M14 -46 l3 3 M20 -30 l3 3" }), /* @__PURE__ */ React.createElement("path", { className: "n", d: "M-48 -62 C-22 -50 10 -32 49 -26 M-50 -52 C-24 -40 8 -22 49 -16" }), /* @__PURE__ */ React.createElement("rect", { x: "-12", y: "-46", width: "15", height: "13", rx: "2.5", transform: "rotate(26 -4.5 -39.5)" }), /* @__PURE__ */ React.createElement("path", { d: "M-46 -60 C-62 -50 -63 -29 -51 -19 C-45 -15 -38 -19 -40 -28 C-43 -36 -40 -46 -36 -52" }), /* @__PURE__ */ React.createElement("path", { d: "M46 -58 C61 -46 61 -26 51 -18 C45 -14 38 -18 40 -26 C43 -34 41 -44 37 -50" }), /* @__PURE__ */ React.createElement("path", { d: "M-37 -2 C-41 -14 -23 -19 -16 -7 C-14 0 -26 4 -37 -2 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M37 -2 C41 -14 23 -19 16 -7 C14 0 26 4 37 -2 Z" }), /* @__PURE__ */ React.createElement("path", { className: "n thin", d: "M-30 -4 l1 -4 M-24 -3 l1 -4 M30 -4 l-1 -4 M24 -3 l-1 -4" }), /* @__PURE__ */ React.createElement("path", { className: "n", d: "M-23 -98 L-9 -96 M6 -98 L20 -100" }), /* @__PURE__ */ React.createElement("path", { className: "n", d: "M-12 -70 C-6 -64 6 -64 12 -71" }), /* @__PURE__ */ React.createElement("path", { d: "M3 -66.5 L5.5 -60 L8 -67.5 Z" }))
    },
    kid: {
      k: 1.28,
      box: { l: -30, r: 30, t: -88, b: 42 },
      seat: "top",
      eyes: [
        { x: -6, y: -58, r: 0, pupil: 2.5, max: 1.8 },
        { x: 6.5, y: -58, r: 0, pupil: 2.5, max: 1.8 }
      ],
      body: (hatch) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M-15 -6 L-3 -6 C-3 8 -5 20 -6 30 L-15 30 C-15 18 -16 6 -15 -6 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M3 -6 L15 -6 C17 6 19 16 22 27 L12 30 C10 18 6 6 3 -6 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M3 -6 L15 -6 C17 6 19 16 22 27 L12 30 C10 18 6 6 3 -6 Z", fill: hatch, stroke: "none" }), /* @__PURE__ */ React.createElement("path", { className: "k", d: "M-17 30 C-20 34 -20 40 -14 41 L-2 41 C2 40 0 34 -5 30 Z" }), /* @__PURE__ */ React.createElement("path", { className: "k", d: "M11 29 C8 34 10 40 16 40 L26 38 C29 36 27 30 22 27 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M-20 -4 C-22 -20 -18 -38 -10 -44 L10 -44 C18 -38 22 -20 20 -4 Z" }), /* @__PURE__ */ React.createElement("path", { className: "n thick", d: "M-19.5 -14 L19.5 -14 M-18.5 -26 L18.5 -26 M-14 -36 L14 -36" }), /* @__PURE__ */ React.createElement("path", { className: "n", d: "M-18 -36 C-28 -28 -30 -14 -26 -5" }), /* @__PURE__ */ React.createElement("circle", { cx: "-26", cy: "-3", r: "4" }), /* @__PURE__ */ React.createElement("path", { className: "n", d: "M18 -36 C27 -30 30 -18 28 -7" }), /* @__PURE__ */ React.createElement("circle", { cx: "28", cy: "-4", r: "4" }), /* @__PURE__ */ React.createElement("circle", { cx: "-17", cy: "-58", r: "4" }), /* @__PURE__ */ React.createElement("circle", { cx: "17", cy: "-58", r: "4" }), /* @__PURE__ */ React.createElement("circle", { cx: "0", cy: "-60", r: "17" }), /* @__PURE__ */ React.createElement("path", { className: "n thin", d: "M-11 -52 l2 -2 M-8 -52 l2 -2 M8 -52 l2 -2 M11 -52 l2 -2" }), /* @__PURE__ */ React.createElement("path", { className: "n", d: "M-5 -50 C-2 -47 2 -47 5 -50" }), /* @__PURE__ */ React.createElement("path", { d: "M-15 -70 C-14 -87 14 -87 15 -70 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M-27 -68 C-16 -75 16 -75 27 -68 C18 -63 -18 -63 -27 -68 Z" }), /* @__PURE__ */ React.createElement("path", { className: "n thick", d: "M-14.5 -74 C-6 -77 6 -77 14.5 -74" }))
    },
    bird: {
      k: 1.22,
      box: { l: -34, r: 30, t: -62, b: 2 },
      seat: "top",
      eyes: [
        { x: 3, y: -30, r: 4.6, pupil: 2.3, max: 2 },
        { x: 12, y: -31, r: 4.6, pupil: 2.3, max: 2 }
      ],
      idle: "dcf-peck",
      body: (hatch) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { className: "n", d: "M-5 0 L-5 -7 M-9 0 L-1 0 M5 0 L5 -7 M1 0 L9 0" }), /* @__PURE__ */ React.createElement("path", { d: "M-17 -16 C-26 -18 -31 -14 -33 -9 C-26 -10 -20 -8 -15 -10 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M-18 -14 C-20 -30 -10 -40 2 -40 C16 -40 22 -28 20 -16 C18 -6 8 -4 0 -4 C-10 -4 -17 -8 -18 -14 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M-11 -25 C-3 -26 1 -18 -3 -13 C-9 -12 -15 -17 -11 -25 Z", fill: hatch }), /* @__PURE__ */ React.createElement("path", { className: "o", d: "M19 -30 L29 -27 L19 -23 Z" }), /* @__PURE__ */ React.createElement("path", { className: "a", d: "M-3 -38 L4 -59 L12 -37 Z" }), /* @__PURE__ */ React.createElement("path", { className: "n thin", d: "M-1 -44 L10 -46 M1 -51 L8 -52" }), /* @__PURE__ */ React.createElement("circle", { cx: "4", cy: "-60", r: "2.8" }))
    },
    cat: {
      k: 1.06,
      box: { l: -30, r: 52, t: -110, b: 4 },
      seat: "front",
      eyes: [{ x: 10, y: -76, r: 6, pupil: 2.8, max: 2.6 }],
      body: (hatch) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("ellipse", { className: "dcf-shadow", cx: "4", cy: "2", rx: "32", ry: "4" }), /* @__PURE__ */ React.createElement("g", { className: "dcf-tail" }, /* @__PURE__ */ React.createElement("path", { d: "M18 -4 C42 -4 52 -24 46 -44 C44 -51 36 -53 34 -46 C40 -30 34 -16 16 -14 Z" }), /* @__PURE__ */ React.createElement("path", { className: "n thin", d: "M40 -16 l5 4 M45 -30 l6 1 M43 -42 l6 -3" })), /* @__PURE__ */ React.createElement("path", { d: "M-22 0 C-28 -18 -24 -42 -14 -52 L14 -52 C24 -42 28 -18 22 0 C10 3 -10 3 -22 0 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M14 -46 C24 -36 26 -16 22 0 C18 1 14 2 12 2 C16 -14 16 -32 10 -46 Z", fill: hatch, stroke: "none" }), /* @__PURE__ */ React.createElement("path", { className: "n", d: "M-8 -30 L-9 -1 M8 -30 L9 -1" }), /* @__PURE__ */ React.createElement("path", { d: "M-16 1 C-16 -5 -3 -5 -3 1 Z M3 1 C3 -5 16 -5 16 1 Z" }), /* @__PURE__ */ React.createElement("path", { className: "a", d: "M-18 -55 C-6 -49 6 -49 18 -55 L17 -46 C6 -40 -6 -40 -17 -46 Z" }), /* @__PURE__ */ React.createElement("path", { className: "a", d: "M9 -45 L18 -32 L6 -37 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M-22 -86 L-25 -107 L-7 -96 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M8 -96 L23 -108 L22 -86 Z" }), /* @__PURE__ */ React.createElement("path", { className: "n thin", d: "M-20 -92 L-21 -101 M18 -101 L18 -92" }), /* @__PURE__ */ React.createElement("path", { d: "M-26 -70 C-28 -88 -16 -98 0 -98 C16 -98 28 -88 26 -70 C24 -56 12 -50 0 -50 C-12 -50 -24 -56 -26 -70 Z" }), /* @__PURE__ */ React.createElement("path", { className: "n thin", d: "M-4 -97 L-3 -90 M3 -97 L3 -91" }), /* @__PURE__ */ React.createElement("path", { className: "n", d: "M-26 -80 C-14 -83 4 -87 25 -93" }), /* @__PURE__ */ React.createElement("ellipse", { className: "k", cx: "-10", cy: "-76", rx: "7.5", ry: "6.5" }), /* @__PURE__ */ React.createElement("path", { className: "k", d: "M-2.5 -68 L2.5 -68 L0 -64.5 Z" }), /* @__PURE__ */ React.createElement("path", { className: "n", d: "M0 -64.5 C-1 -60.5 -5 -60.5 -6 -62.5 M0 -64.5 C1 -60.5 5 -60.5 6 -62.5" }), /* @__PURE__ */ React.createElement("path", { className: "n thin", d: "M-15 -66 L-29 -68 M-15 -63 L-28 -59 M15 -66 L29 -68 M15 -63 L28 -59" }))
    },
    ghost: {
      k: 1.3,
      box: { l: -26, r: 26, t: -70, b: 0 },
      seat: "behind",
      eyes: [
        { x: -8, y: -44, r: 6.5, pupil: 3.2, max: 3 },
        { x: 9, y: -44, r: 6.5, pupil: 3.2, max: 3 }
      ],
      idle: "dcf-bob",
      body: (hatch) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M-23 -14 L-23 -40 C-23 -59 -12 -67 0 -67 C12 -67 23 -59 23 -40 L23 -14 C12 -10 -12 -10 -23 -14 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M13 -61 C21 -54 23 -46 23 -36 L23 -15 L15 -13 L15 -36 C15 -46 15 -54 13 -61 Z", fill: hatch, stroke: "none" }), /* @__PURE__ */ React.createElement("path", { className: "n thin", d: "M-16 -56 C-12 -61 -6 -63 -2 -63" }), /* @__PURE__ */ React.createElement("path", { className: "k", d: "M-5 -33 C-3 -27 4 -27 6 -33 Z" }), /* @__PURE__ */ React.createElement("path", { className: "n thin", d: "M-17 -35 l3 -2 M-14 -34 l3 -2 M14 -35 l3 -2 M17 -34 l3 -2" })),
      front: () => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { d: "M-25 -32 C-27 -38 -21 -42 -17 -38 C-15 -42 -10 -41 -10 -36 L-11 -30 C-15 -28 -22 -28 -25 -32 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M25 -32 C27 -38 21 -42 17 -38 C15 -42 10 -41 10 -36 L11 -30 C15 -28 22 -28 25 -32 Z" }))
    },
    mushroom: {
      k: 1.12,
      box: { l: -27, r: 27, t: -56, b: 4 },
      seat: "front",
      eyes: [
        { x: -4.5, y: -16, r: 0, pupil: 1.9, max: 1.3 },
        { x: 4.5, y: -16, r: 0, pupil: 1.9, max: 1.3 }
      ],
      idle: "dcf-sway",
      body: (hatch) => /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("ellipse", { className: "dcf-shadow", cx: "0", cy: "2", rx: "18", ry: "3" }), /* @__PURE__ */ React.createElement("path", { className: "n", d: "M-10 -15 L-17 -9 M10 -15 L17 -11" }), /* @__PURE__ */ React.createElement("path", { d: "M-10 0 C-12 -10 -10 -22 -8 -28 L8 -28 C10 -22 12 -10 10 0 C4 2 -4 2 -10 0 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M5 -27 C9 -20 11 -10 10 0 C8 1 6 1.5 4 1.5 C6 -8 6 -18 2 -27 Z", fill: hatch, stroke: "none" }), /* @__PURE__ */ React.createElement("path", { className: "r", d: "M-25 -28 C-27 -45 -12 -55 0 -55 C12 -55 27 -45 25 -28 C14 -23 -14 -23 -25 -28 Z" }), /* @__PURE__ */ React.createElement("circle", { cx: "-12", cy: "-40", r: "4.2" }), /* @__PURE__ */ React.createElement("circle", { cx: "6", cy: "-46", r: "3.4" }), /* @__PURE__ */ React.createElement("circle", { cx: "15", cy: "-34", r: "3" }), /* @__PURE__ */ React.createElement("circle", { cx: "-2", cy: "-33", r: "2.4" }), /* @__PURE__ */ React.createElement("path", { className: "n", d: "M-2 -10 C-1 -8 1 -8 2 -10" }))
    }
  };
  var Doodle = ({ kind }) => {
    switch (kind) {
      case "flame":
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { fill: ACCENT.flame, d: "M0 14 C-9 14 -12 6 -10 0 C-8 -5 -4 -6 -4 -12 C1 -9 3 -5 2 -1 C4 -3 5 -6 5 -8 C10 -3 11 4 8 9 C6 12 3 14 0 14 Z" }), /* @__PURE__ */ React.createElement("path", { fill: ACCENT.flameCore, d: "M0 11.5 C-4 11.5 -6 8 -5 5 C-4 2 -1 1 -1 -3 C2 -1 4 3 3 6 C4 5 5 4 5 3 C7 6 5 11.5 0 11.5 Z" }));
      case "sandwich":
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { fill: ACCENT.bread, d: "M-13 5 L13 5 L12.5 9.5 C4 11 -4 11 -12.5 9.5 Z" }), /* @__PURE__ */ React.createElement("path", { fill: ACCENT.gold, d: "M-12 2 L12 2 L11 5 L5 5 L3 9 L1 5 L-12 5 Z" }), /* @__PURE__ */ React.createElement("path", { fill: "none", stroke: ACCENT.leaf, strokeWidth: "2.6", d: "M-13 1 q2.2 2.4 4.4 0 q2.2 2.4 4.4 0 q2.2 2.4 4.4 0 q2.2 2.4 4.4 0 q2.2 2.4 4.4 0 q2.2 2.4 4.4 0" }), /* @__PURE__ */ React.createElement("path", { fill: ACCENT.bread, d: "M-13 -1 C-14 -8 -10 -11 -6 -10 C-3 -13.5 3 -13.5 6 -10 C10 -11 14 -8 13 -1 Z" }), /* @__PURE__ */ React.createElement("path", { fill: "none", strokeWidth: "1.2", d: "M-6 -6 l1.5 -1 M0 -8 l1.5 -1 M6 -6 l1.5 -1" }));
      case "star":
        return /* @__PURE__ */ React.createElement("path", { fill: ACCENT.gold, d: "M0 -13 L3.6 -4.4 L13 -4 L5.8 2.2 L8.2 12 L0 6.6 L-8.2 12 L-5.8 2.2 L-13 -4 L-3.6 -4.4 Z" });
      case "heart":
        return /* @__PURE__ */ React.createElement("path", { fill: ACCENT.heart, d: "M0 11 C-6 6 -13 1 -13 -5 C-13 -10 -8 -13 -4 -11 C-2 -10 -1 -8 0 -6 C1 -8 2 -10 4 -11 C8 -13 13 -10 13 -5 C13 1 6 6 0 11 Z" });
      case "bolt":
        return /* @__PURE__ */ React.createElement("path", { fill: ACCENT.gold, d: "M3 -14 L-8 2 L-1 2 L-4 14 L8 -3 L1 -3 Z" });
      case "sparkle":
        return /* @__PURE__ */ React.createElement("path", { fill: "#8fdcff", d: "M0 -13 C1 -4 4 -1 13 0 C4 1 1 4 0 13 C-1 4 -4 1 -13 0 C-4 -1 -1 -4 0 -13 Z" });
      case "spiral":
        return /* @__PURE__ */ React.createElement("path", { fill: "none", d: "M0 0 C2 -2 4 0 3 3 C1 6 -4 5 -5 1 C-6 -4 -1 -8 4 -7 C9 -5 10 2 7 6" });
      case "plane":
        return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("path", { className: "dcf-paperfill", d: "M-13 -1 L13 -10 L4 12 L0 3 Z" }), /* @__PURE__ */ React.createElement("path", { fill: "none", d: "M0 3 L13 -10 M0 3 L-2 9 L2 5" }));
    }
    return null;
  };
  var DoodleIcon = ({ kind, size = 18 }) => /* @__PURE__ */ React.createElement("svg", { className: "dcf-icon", viewBox: "-16 -16 32 32", width: size, height: size, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement(Doodle, { kind }));
  var FONT_SIZE = 200;
  var DEFAULT_FONT = '"Arial Black", "Inter Display", Inter, "Helvetica Neue", Helvetica, Arial, sans-serif';
  var DEFAULT_SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
  var estimate = (word) => ({
    advances: Array.from(word).map((c) => (c === " " ? 0.3 : /[IJ1]/.test(c) ? 0.42 : /[MW]/.test(c) ? 0.98 : 0.76) * FONT_SIZE),
    cap: 0.73 * FONT_SIZE
  });
  var measure = (word, family) => {
    if (typeof document === "undefined") return null;
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return null;
    ctx.font = "900 " + FONT_SIZE + "px " + family;
    const chars = Array.from(word);
    const advances = [];
    let prev = 0;
    for (let i = 0; i < chars.length; i++) {
      const wNow = ctx.measureText(chars.slice(0, i + 1).join("")).width;
      advances.push(wNow - prev);
      prev = wNow;
    }
    const m = ctx.measureText(word.replace(/\s/g, "") || "H");
    const cap = m.actualBoundingBoxAscent > 0 ? m.actualBoundingBoxAscent : 0.73 * FONT_SIZE;
    return { advances, cap };
  };
  var useIso = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;
  var Link = ({ link, className }) => link.href ? /* @__PURE__ */ React.createElement("a", { className, href: link.href }, /* @__PURE__ */ React.createElement("span", null, link.label), /* @__PURE__ */ React.createElement("svg", { className: "dcf-squiggle", viewBox: "0 0 100 8", preserveAspectRatio: "none", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { pathLength: 1, d: "M1 5 C10 1 16 7 25 4 S40 1 50 4 S66 7 75 4 S90 1 99 4" }))) : /* @__PURE__ */ React.createElement("span", { className }, link.label);
  function DoodleCrewFooter({
    wordmark = "MISCHIEF",
    brand = "mischief",
    blurb = "We draw every frame by hand and ship a new chapter every season. Come make a little trouble with us.",
    tagline = "A hand-drawn world for the troublemaker in all of us.",
    columns = DEFAULT_COLUMNS,
    actions = DEFAULT_ACTIONS,
    copyright = "\xA9 2026 Mischief Games. Drawn by hand in Lisbon.",
    legal = [{ label: "Privacy", href: "#" }, { label: "Terms", href: "#" }, { label: "Cookies", href: "#" }],
    socials = [{ label: "Discord", href: "#" }, { label: "YouTube", href: "#" }, { label: "TikTok", href: "#" }, { label: "X", href: "#" }],
    backToTop = true,
    crew = DEFAULT_CREW,
    doodles = DEFAULT_DOODLES,
    doodleCount = 12,
    preset = "auto",
    palette,
    fontFamily = DEFAULT_FONT,
    serifFamily = DEFAULT_SERIF,
    tracking = -0.02,
    interactive = true,
    height = "760px",
    className
  }) {
    const uid = React.useId().replace(/[^a-zA-Z0-9_-]/g, "");
    const word = wordmark.toUpperCase();
    const chars = React.useMemo(() => Array.from(word), [word]);
    const colors = { ...PRESETS[preset] || PRESETS.auto, ...palette || {} };
    const rootRef = React.useRef(null);
    const svgRef = React.useRef(null);
    const worldRef = React.useRef(null);
    const crewLayerRefs = React.useRef([]);
    const eyeRefs = React.useRef([]);
    const doodleRefs = React.useRef([]);
    const [metrics, setMetrics] = React.useState(() => estimate(word));
    const [play, setPlay] = React.useState(false);
    const [reduced, setReduced] = React.useState(false);
    const [talking, setTalking] = React.useState(-1);
    const [hopping, setHopping] = React.useState(-1);
    const talkTimer = React.useRef(0);
    useIso(() => {
      const run = () => {
        const m = measure(word, fontFamily);
        if (m) setMetrics(m);
      };
      run();
      const fonts = typeof document !== "undefined" ? document.fonts : void 0;
      if (!fonts) return;
      let alive = true;
      fonts.ready.then(() => alive && run());
      fonts.addEventListener?.("loadingdone", run);
      return () => {
        alive = false;
        fonts.removeEventListener?.("loadingdone", run);
      };
    }, [word, fontFamily]);
    const layout = React.useMemo(() => layoutWord(metrics.advances, tracking, FONT_SIZE), [metrics, tracking]);
    const cap = metrics.cap;
    const placed = React.useMemo(
      () => crew.map((m, i) => {
        const art = ART[m.kind];
        if (!art || !chars.length) return null;
        const li = clamp(Math.floor(m.letter) || 0, 0, chars.length - 1);
        const scale = cap / 144 * art.k * (m.scale ?? 1);
        const seat = m.seat || art.seat;
        const p = seatPoint(seat, layout.x[li], layout.w[li], cap, m.offset ?? 0, scale);
        return { i, m, art, seat, scale, ...p, flip: m.flip ? -1 : 1 };
      }).filter(Boolean),
      [crew, chars.length, layout, cap]
    );
    const view = React.useMemo(() => {
      let l = 0;
      let r = layout.width;
      let t = -cap;
      let b = 30;
      for (const p of placed) {
        const bx = p.flip > 0 ? [p.art.box.l, p.art.box.r] : [-p.art.box.r, -p.art.box.l];
        l = Math.min(l, p.x + bx[0] * p.scale);
        r = Math.max(r, p.x + bx[1] * p.scale);
        t = Math.min(t, p.y + p.art.box.t * p.scale);
        b = Math.max(b, p.y + p.art.box.b * p.scale);
      }
      const pad = 24;
      return { x: l - pad, y: t - pad, w: r - l + pad * 2, h: b - t + pad * 2 };
    }, [layout, placed, cap]);
    const words = tagline.split(/\s+/).filter(Boolean);
    const tl = timeline(chars.length, placed.length, words.length, actions.length);
    const ground = React.useMemo(() => {
      const x0 = view.x + 6;
      const x1 = view.x + view.w - 6;
      let d = "M" + x0.toFixed(1) + " 6";
      const n = 14;
      for (let k = 1; k <= n; k++) {
        const x = x0 + (x1 - x0) * k / n;
        d += " Q" + (x - (x1 - x0) / n / 2).toFixed(1) + " " + (6 + (hash(k * 3.1) - 0.5) * 5).toFixed(1) + " " + x.toFixed(1) + " " + (6 + (hash(k * 7.7) - 0.5) * 2).toFixed(1);
      }
      let tufts = "";
      for (let k = 0; k < 22; k++) {
        const x = x0 + 20 + hash(k * 11.3) * (x1 - x0 - 40);
        const s = 0.7 + hash(k * 5.9) * 0.6;
        tufts += "M" + x.toFixed(1) + " 6 l" + (2 * s).toFixed(1) + " " + (-9 * s).toFixed(1) + " M" + (x + 3 * s).toFixed(1) + " 6 l" + (1 * s).toFixed(1) + " " + (-12 * s).toFixed(1) + " M" + (x + 6 * s).toFixed(1) + " 6 l" + (-1 * s).toFixed(1) + " " + (-7 * s).toFixed(1) + " ";
      }
      const pebbles = Array.from({ length: 9 }, (_, k) => ({ x: x0 + 40 + hash(k * 17.1) * (x1 - x0 - 80), y: 14 + hash(k * 2.3) * 8, r: 2 + hash(k * 9.4) * 2.6 }));
      return { d, tufts, pebbles };
    }, [view]);
    const doodleList = React.useMemo(() => {
      const kinds = doodles.length ? doodles : [];
      const n = kinds.length ? clamp(Math.floor(doodleCount) || 0, 0, 40) : 0;
      return Array.from({ length: n }, (_, k) => ({
        kind: kinds[k % kinds.length],
        size: 22 + hash(k * 4.7) * 14,
        seed: k
      }));
    }, [doodles, doodleCount]);
    const sim = React.useRef({
      floaters: [],
      w: 0,
      h: 0,
      px: NaN,
      py: NaN,
      inside: false,
      visible: false,
      gaze: [],
      seed: 1,
      start: 0
    });
    useIso(() => {
      const el = worldRef.current;
      if (!el) return;
      const s = sim.current;
      const size = () => {
        const r = el.getBoundingClientRect();
        const ow = s.w;
        const oh = s.h;
        s.w = r.width;
        s.h = r.height;
        if (s.floaters.length !== doodleList.length || !ow) {
          s.floaters = doodleList.map((d, k) => ({
            x: (0.04 + 0.92 * ((k + hash(k * 9.1) * 0.8) / Math.max(1, doodleList.length))) * r.width,
            y: (0.02 + hash(k * 3.3) * 0.56) * r.height,
            vx: 0,
            vy: 0,
            rot: (hash(k * 1.7) - 0.5) * 50,
            vr: (hash(k * 6.1) - 0.5) * 30,
            fall: 9 + hash(k * 2.9) * 16,
            phase: hash(k * 8.3) * Math.PI * 2,
            pop: 0
          }));
        } else if (ow && oh) {
          for (const f of s.floaters) {
            f.x *= r.width / ow;
            f.y *= r.height / oh;
          }
        }
        paintDoodles();
      };
      size();
      if (typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(size);
      ro.observe(el);
      return () => ro.disconnect();
    }, [doodleList]);
    const paintDoodles = () => {
      const s = sim.current;
      const k = clamp(s.w / 1100, 0.5, 1);
      for (let i = 0; i < s.floaters.length; i++) {
        const el = doodleRefs.current[i];
        const f = s.floaters[i];
        if (!el || !f) continue;
        let sc = k;
        let op = 1;
        if (f.pop > 0) {
          const age = 1.4 - f.pop;
          sc = k * (1 + Math.min(1, age / 0.3) * 0.7);
          op = Math.max(0, 1 - age / 0.3);
        }
        el.style.transform = "translate3d(" + f.x.toFixed(1) + "px," + f.y.toFixed(1) + "px,0) rotate(" + f.rot.toFixed(1) + "deg) scale(" + sc.toFixed(3) + ")";
        el.style.opacity = String(op);
      }
    };
    React.useEffect(() => {
      if (typeof window === "undefined" || !window.matchMedia) return;
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      const on = () => setReduced(mq.matches);
      on();
      mq.addEventListener?.("change", on);
      return () => mq.removeEventListener?.("change", on);
    }, []);
    React.useEffect(() => {
      const root = rootRef.current;
      if (!root) return;
      const s = sim.current;
      if (typeof IntersectionObserver === "undefined") {
        s.visible = true;
        setPlay(true);
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            s.visible = e.isIntersecting;
            if (e.isIntersecting && e.intersectionRatio > 0.12) setPlay(true);
          }
        },
        { threshold: [0, 0.12, 0.3] }
      );
      io.observe(root);
      return () => io.disconnect();
    }, []);
    React.useEffect(() => {
      if (play && !sim.current.start) sim.current.start = performance.now();
    }, [play]);
    React.useEffect(() => {
      if (typeof window === "undefined") return;
      const s = sim.current;
      let raf = 0;
      let last = performance.now();
      let boilAt = 0;
      let boil = 0;
      const rand = () => {
        s.seed = s.seed * 16807 % 2147483647;
        return s.seed / 2147483647;
      };
      const svgPoint = (svg, cx, cy) => {
        const m = svg.getScreenCTM();
        if (!m) return null;
        const inv = m.inverse();
        return { x: inv.a * cx + inv.c * cy + inv.e, y: inv.b * cx + inv.d * cy + inv.f };
      };
      const frame = (now) => {
        raf = requestAnimationFrame(frame);
        if (!s.visible || document.hidden) {
          last = now;
          return;
        }
        const dt = Math.min(0.05, (now - last) / 1e3);
        last = now;
        const t = now / 1e3;
        const svg = svgRef.current;
        const world = worldRef.current;
        let target = null;
        if (svg && s.inside && interactive) target = svgPoint(svg, s.px, s.py);
        for (let c = 0; c < placed.length; c++) {
          const p = placed[c];
          const g = s.gaze[c] ||= { x: 0, y: 0, tx: 0, ty: 0, next: 0, blinkAt: t + 1 + hash(c * 3.7) * 3, blink: 0 };
          if (!target && t > g.next) {
            const other = placed[(c + 1 + Math.floor(rand() * Math.max(1, placed.length - 1))) % placed.length];
            if (other && rand() < 0.45) {
              g.tx = other.x;
              g.ty = other.y - 60 * other.scale;
            } else {
              g.tx = p.x + (rand() - 0.5) * 900;
              g.ty = p.y - 80 * p.scale + (rand() - 0.5) * 500;
            }
            g.next = t + 1.4 + rand() * 2.6;
          }
          if (t > g.blinkAt) {
            g.blink = 0.16;
            g.blinkAt = t + 2.2 + rand() * 4;
          }
          g.blink = Math.max(0, g.blink - dt);
          const lid = g.blink > 0 ? 0.12 + Math.abs(g.blink - 0.08) / 0.08 * 0.88 : 1;
          const eyes = eyeRefs.current[c] || [];
          for (let e = 0; e < p.art.eyes.length; e++) {
            const eye = p.art.eyes[e];
            const ex = p.x + eye.x * p.scale * p.flip;
            const ey = p.y + eye.y * p.scale;
            const tx = target ? target.x : g.tx;
            const ty = target ? target.y : g.ty;
            const o = lookAt(ex, ey, tx, ty, eye.max, 220);
            const ref = eyes[e];
            if (!ref) continue;
            const key = "_o" + e;
            const prev = g[key] || { x: 0, y: 0 };
            const ease = Math.min(1, dt * (target ? 14 : 6));
            const nx = prev.x + (o.x * p.flip - prev.x) * ease;
            const ny = prev.y + (o.y - prev.y) * ease;
            g[key] = { x: nx, y: ny };
            if (ref.pupil) ref.pupil.setAttribute("transform", "translate(" + nx.toFixed(2) + " " + ny.toFixed(2) + ")");
            if (ref.blink) ref.blink.setAttribute("transform", "translate(0 " + (eye.y * (1 - lid)).toFixed(2) + ") scale(1 " + lid.toFixed(3) + ")");
          }
        }
        if (world && s.floaters.length) {
          const started = play && s.start ? now - s.start > tl.doodles || reduced : false;
          if (started) {
            const r = world.getBoundingClientRect();
            const px = s.inside && interactive ? s.px - r.left : NaN;
            const py = s.inside && interactive ? s.py - r.top : NaN;
            if (!reduced) for (const f of s.floaters) stepFloater(f, dt, t, s.w, s.h, px, py, 110, rand);
            paintDoodles();
          }
        }
        if (!reduced && now - boilAt > 125) {
          boilAt = now;
          boil = (boil + 1) % 3;
          const f = "url(#" + uid + "-boil" + boil + ")";
          for (const el of crewLayerRefs.current) if (el) el.setAttribute("filter", f);
        }
      };
      raf = requestAnimationFrame(frame);
      return () => cancelAnimationFrame(raf);
    }, [placed, play, reduced, interactive, uid, tl.doodles]);
    React.useEffect(() => () => window.clearTimeout(talkTimer.current), []);
    const onPointerMove = (e) => {
      const s = sim.current;
      s.px = e.clientX;
      s.py = e.clientY;
      s.inside = true;
    };
    const onPointerLeave = () => {
      sim.current.inside = false;
    };
    const poke = (c) => {
      if (!interactive) return;
      setTalking(c);
      setHopping(-1);
      requestAnimationFrame(() => setHopping(c));
      window.clearTimeout(talkTimer.current);
      talkTimer.current = window.setTimeout(() => {
        setTalking(-1);
        setHopping(-1);
      }, 2600);
    };
    const popDoodle = (k) => {
      if (!interactive) return;
      const f = sim.current.floaters[k];
      if (f && f.pop <= 0) {
        f.pop = 1.4;
        paintDoodles();
      }
    };
    const toTop = () => {
      if (typeof window === "undefined") return;
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    };
    const hatch = "url(#" + uid + "-hatch)";
    const vars = {
      "--dcf-bg": colors.background,
      "--dcf-ink": colors.ink,
      "--dcf-accent": colors.accent,
      "--dcf-serif": serifFamily,
      "--dcf-display": fontFamily,
      minHeight: height
    };
    const pct = (v, base, span) => ((v - base) / span * 100).toFixed(3) + "%";
    const renderCrew = (p, part) => /* @__PURE__ */ React.createElement("g", { key: p.i + part, transform: "translate(" + p.x.toFixed(2) + " " + p.y.toFixed(2) + ") scale(" + (p.scale * p.flip).toFixed(4) + " " + p.scale.toFixed(4) + ")" }, /* @__PURE__ */ React.createElement("g", { className: "dcf-arrive dcf-arrive-" + p.seat, style: { "--d": tl.member(p.i) + "ms" } }, /* @__PURE__ */ React.createElement("g", { className: "dcf-hopper" + (hopping === p.i ? " is-hop" : "") }, /* @__PURE__ */ React.createElement("g", { className: "dcf-art" + (p.art.idle ? " " + p.art.idle : ""), style: { "--i": p.i } }, part === "body" ? /* @__PURE__ */ React.createElement(React.Fragment, null, p.art.body(hatch), p.art.eyes.map((eye, e) => /* @__PURE__ */ React.createElement(
      "g",
      {
        key: e,
        ref: (el) => {
          ;
          (eyeRefs.current[p.i] ||= [])[e] = { ...eyeRefs.current[p.i]?.[e] || { pupil: null }, blink: el };
        }
      },
      eye.r > 0 && /* @__PURE__ */ React.createElement("circle", { cx: eye.x, cy: eye.y, r: eye.r }),
      /* @__PURE__ */ React.createElement(
        "g",
        {
          ref: (el) => {
            ;
            (eyeRefs.current[p.i] ||= [])[e] = { ...eyeRefs.current[p.i]?.[e] || { blink: null }, pupil: el };
          }
        },
        /* @__PURE__ */ React.createElement("circle", { className: "k", cx: eye.x, cy: eye.y, r: eye.pupil }),
        /* @__PURE__ */ React.createElement("circle", { className: "dcf-glint", cx: eye.x + eye.pupil * 0.35, cy: eye.y - eye.pupil * 0.4, r: eye.pupil * 0.32 })
      )
    ))) : p.art.front?.()))));
    return /* @__PURE__ */ React.createElement(
      "footer",
      {
        ref: rootRef,
        className: "dcf" + (className ? " " + className : ""),
        "data-play": play || reduced ? "1" : "0",
        "data-interactive": interactive ? "1" : "0",
        style: vars,
        onPointerMove,
        onPointerDown: onPointerMove,
        onPointerLeave
      },
      /* @__PURE__ */ React.createElement("style", null, CSS),
      /* @__PURE__ */ React.createElement("div", { className: "dcf-top dcf-rise", style: { "--d": "0ms" } }, /* @__PURE__ */ React.createElement("div", { className: "dcf-brand" }, /* @__PURE__ */ React.createElement("span", { className: "dcf-logo", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("svg", { viewBox: "-60 -150 120 120", width: "30", height: "30" }, /* @__PURE__ */ React.createElement("g", { className: "dcf-art" }, /* @__PURE__ */ React.createElement("path", { d: "M-30 -104 C-40 -112 -44 -124 -40 -138 C-32 -129 -22 -122 -13 -114 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M18 -114 C26 -124 36 -130 47 -133 C45 -120 41 -110 32 -101 Z" }), /* @__PURE__ */ React.createElement("path", { d: "M-44 -30 C-54 -56 -54 -70 -42 -90 C-32 -110 -14 -118 2 -118 C22 -118 40 -108 48 -88 C58 -68 56 -54 48 -30 Z" }), /* @__PURE__ */ React.createElement("circle", { className: "k", cx: "-15", cy: "-84", r: "5.5" }), /* @__PURE__ */ React.createElement("circle", { className: "k", cx: "13", cy: "-86", r: "5.5" }), /* @__PURE__ */ React.createElement("path", { className: "n", d: "M-12 -66 C-6 -60 6 -60 12 -67" })))), /* @__PURE__ */ React.createElement("span", { className: "dcf-brandname" }, brand)), blurb && /* @__PURE__ */ React.createElement("p", { className: "dcf-blurb" }, blurb), columns.length > 0 && /* @__PURE__ */ React.createElement("nav", { className: "dcf-cols", "aria-label": "Footer" }, columns.map((col) => /* @__PURE__ */ React.createElement("div", { className: "dcf-col", key: col.title }, /* @__PURE__ */ React.createElement("h3", { className: "dcf-coltitle" }, col.title), /* @__PURE__ */ React.createElement("ul", null, col.links.map((l) => /* @__PURE__ */ React.createElement("li", { key: l.label }, /* @__PURE__ */ React.createElement(Link, { link: l, className: "dcf-link" })))))))),
      /* @__PURE__ */ React.createElement("div", { className: "dcf-world", ref: worldRef }, /* @__PURE__ */ React.createElement("div", { className: "dcf-stage" }, /* @__PURE__ */ React.createElement("h2", { className: "dcf-sr" }, wordmark), /* @__PURE__ */ React.createElement(
        "svg",
        {
          ref: svgRef,
          className: "dcf-svg",
          viewBox: view.x.toFixed(1) + " " + view.y.toFixed(1) + " " + view.w.toFixed(1) + " " + view.h.toFixed(1),
          "aria-hidden": "false",
          role: "group",
          "aria-label": wordmark + " \u2014 meet the crew"
        },
        /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("pattern", { id: uid + "-hatch", width: "4.6", height: "4.6", patternUnits: "userSpaceOnUse", patternTransform: "rotate(38)" }, /* @__PURE__ */ React.createElement("line", { x1: "0", y1: "0", x2: "0", y2: "4.6", style: { stroke: "var(--dcf-ink)" }, strokeWidth: "1.25" })), [0, 1, 2].map((k) => /* @__PURE__ */ React.createElement("filter", { key: k, id: uid + "-boil" + k, x: "-10%", y: "-10%", width: "120%", height: "120%" }, /* @__PURE__ */ React.createElement("feTurbulence", { type: "fractalNoise", baseFrequency: "0.035", numOctaves: "2", seed: k * 7 + 3, result: "n" }), /* @__PURE__ */ React.createElement("feDisplacementMap", { in: "SourceGraphic", in2: "n", scale: "2.6", xChannelSelector: "R", yChannelSelector: "G" }))), /* @__PURE__ */ React.createElement("filter", { id: uid + "-ink", x: "-4%", y: "-6%", width: "108%", height: "112%" }, /* @__PURE__ */ React.createElement("feTurbulence", { type: "fractalNoise", baseFrequency: "0.045", numOctaves: "3", seed: "11", result: "edge" }), /* @__PURE__ */ React.createElement("feDisplacementMap", { in: "SourceGraphic", in2: "edge", scale: "5", xChannelSelector: "R", yChannelSelector: "G", result: "rough" }), /* @__PURE__ */ React.createElement("feTurbulence", { type: "fractalNoise", baseFrequency: "0.018 0.32", numOctaves: "2", seed: "4", result: "streak" }), /* @__PURE__ */ React.createElement("feColorMatrix", { in: "streak", type: "matrix", values: "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -16 5.6", result: "streakA" }), /* @__PURE__ */ React.createElement("feTurbulence", { type: "fractalNoise", baseFrequency: "0.7", numOctaves: "1", seed: "9", result: "speck" }), /* @__PURE__ */ React.createElement("feColorMatrix", { in: "speck", type: "matrix", values: "0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -24 7.0", result: "speckA" }), /* @__PURE__ */ React.createElement("feComposite", { in: "streakA", in2: "speckA", operator: "arithmetic", k1: "0", k2: "1", k3: "1", k4: "0", result: "holes" }), /* @__PURE__ */ React.createElement("feComposite", { in: "rough", in2: "holes", operator: "out" }))),
        /* @__PURE__ */ React.createElement("g", { ref: (el) => void (crewLayerRefs.current[0] = el) }, /* @__PURE__ */ React.createElement("g", { className: "dcf-ground" }, /* @__PURE__ */ React.createElement("path", { className: "dcf-draw", pathLength: 1, d: ground.d, style: { "--d": tl.ground + "ms" } }), /* @__PURE__ */ React.createElement("path", { className: "dcf-tufts dcf-fade", d: ground.tufts, style: { "--d": tl.ground + 500 + "ms" } }), ground.pebbles.map((pb, k) => /* @__PURE__ */ React.createElement("ellipse", { key: k, className: "dcf-pebble dcf-fade", cx: pb.x, cy: pb.y, rx: pb.r * 1.5, ry: pb.r, style: { "--d": tl.ground + 600 + "ms" } }))), placed.filter((p) => p.seat === "behind").map((p) => renderCrew(p, "body"))),
        chars.map(
          (c, i) => c === " " ? null : /* @__PURE__ */ React.createElement("g", { key: i, className: "dcf-letter", style: { "--d": tl.letter(i) + "ms", "--r": ((hash(i * 2.3) - 0.5) * 9).toFixed(2) + "deg" } }, /* @__PURE__ */ React.createElement("g", { className: "dcf-glyph" }, /* @__PURE__ */ React.createElement("text", { x: layout.x[i], y: 0, fontSize: FONT_SIZE, fontWeight: 900, style: { fontFamily }, filter: "url(#" + uid + "-ink)" }, c)), /* @__PURE__ */ React.createElement(
            "path",
            {
              className: "dcf-dust",
              d: "M" + (layout.x[i] - 6) + " -6 l-16 -6 M" + (layout.x[i] - 4) + " -16 l-12 -12 M" + (layout.x[i] + layout.w[i] + 6) + " -6 l16 -6 M" + (layout.x[i] + layout.w[i] + 4) + " -16 l12 -12"
            }
          ))
        ),
        /* @__PURE__ */ React.createElement("g", { ref: (el) => void (crewLayerRefs.current[1] = el) }, placed.filter((p) => p.seat === "behind").map((p) => renderCrew(p, "front")), placed.filter((p) => p.seat !== "behind").map((p) => renderCrew(p, "body"))),
        interactive && placed.map((p) => {
          const bx = p.flip > 0 ? [p.art.box.l, p.art.box.r] : [-p.art.box.r, -p.art.box.l];
          const top = p.seat === "behind" ? p.art.box.t : p.art.box.t;
          const bottom = p.seat === "behind" ? -30 : p.art.box.b;
          return /* @__PURE__ */ React.createElement(
            "rect",
            {
              key: "hit" + p.i,
              className: "dcf-hit",
              x: p.x + bx[0] * p.scale,
              y: p.y + top * p.scale,
              width: (bx[1] - bx[0]) * p.scale,
              height: (bottom - top) * p.scale,
              rx: 12,
              role: "button",
              tabIndex: 0,
              "aria-label": (p.m.name || p.m.kind) + (p.m.says ? ": " + p.m.says : ""),
              onClick: () => poke(p.i),
              onKeyDown: (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  poke(p.i);
                }
              }
            }
          );
        })
      ), /* @__PURE__ */ React.createElement("div", { className: "dcf-bubbles", "aria-live": "polite" }, placed.map(
        (p) => talking === p.i && p.m.says ? /* @__PURE__ */ React.createElement(
          "div",
          {
            key: p.i,
            className: "dcf-bubble" + (p.x > view.x + view.w * 0.72 ? " is-left" : ""),
            style: { left: pct(p.x, view.x, view.w), top: pct(p.y + p.art.box.t * p.scale - 6, view.y, view.h) }
          },
          p.m.says
        ) : null
      ))), doodleList.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "dcf-doodles", "aria-hidden": "true" }, doodleList.map((d, k) => /* @__PURE__ */ React.createElement(
        "div",
        {
          key: k,
          className: "dcf-doodle",
          ref: (el) => void (doodleRefs.current[k] = el),
          style: { width: d.size, height: d.size, marginLeft: -d.size / 2, marginTop: -d.size / 2 },
          onPointerDown: () => popDoodle(k)
        },
        /* @__PURE__ */ React.createElement("span", { className: "dcf-doodle-in", style: { "--d": tl.doodles + k * 70 + "ms" } }, /* @__PURE__ */ React.createElement("svg", { viewBox: "-16 -16 32 32", width: d.size, height: d.size }, /* @__PURE__ */ React.createElement(Doodle, { kind: d.kind })))
      ))), /* @__PURE__ */ React.createElement("div", { className: "dcf-cta" }, /* @__PURE__ */ React.createElement("p", { className: "dcf-tagline" }, words.map((w, k) => /* @__PURE__ */ React.createElement("span", { key: k, className: "dcf-word", style: { "--d": tl.word(k) + "ms" } }, w, " "))), actions.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "dcf-actions" }, actions.map((a, k) => {
        const inner = /* @__PURE__ */ React.createElement(React.Fragment, null, a.icon && /* @__PURE__ */ React.createElement(DoodleIcon, { kind: a.icon }), /* @__PURE__ */ React.createElement("span", null, a.label));
        const cls = "dcf-btn dcf-pop " + (a.variant === "outline" ? "is-outline" : "is-solid");
        const st = { "--d": tl.action(k) + "ms" };
        return a.href ? /* @__PURE__ */ React.createElement("a", { key: a.label, className: cls, style: st, href: a.href, onClick: a.onClick }, inner) : /* @__PURE__ */ React.createElement("button", { key: a.label, type: "button", className: cls, style: st, onClick: a.onClick }, inner);
      })))),
      /* @__PURE__ */ React.createElement("div", { className: "dcf-bar dcf-rise", style: { "--d": "120ms" } }, /* @__PURE__ */ React.createElement("p", { className: "dcf-copy" }, copyright), legal.length > 0 && /* @__PURE__ */ React.createElement("ul", { className: "dcf-inline" }, legal.map((l) => /* @__PURE__ */ React.createElement("li", { key: l.label }, /* @__PURE__ */ React.createElement(Link, { link: l, className: "dcf-link" })))), socials.length > 0 && /* @__PURE__ */ React.createElement("ul", { className: "dcf-inline dcf-socials" }, socials.map((l) => /* @__PURE__ */ React.createElement("li", { key: l.label }, /* @__PURE__ */ React.createElement(Link, { link: l, className: "dcf-link" })))), backToTop && /* @__PURE__ */ React.createElement("button", { type: "button", className: "dcf-totop", onClick: toTop }, /* @__PURE__ */ React.createElement("span", null, "Back to top"), /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", width: "18", height: "18", "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M12 20 C11 14 12.5 9 12 4 M6 10 C8 8 10 6 12 4 C14 6 16 8 18.5 9.5" }))))
    );
  }
  var CSS = ".dcf{position:relative;isolation:isolate;overflow:hidden;overflow:clip;width:100%;box-sizing:border-box;display:flex;flex-direction:column;background:var(--dcf-bg);color:var(--dcf-ink);font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Inter,Roboto,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;--dcf-soft:color-mix(in oklab,var(--dcf-ink) 62%,var(--dcf-bg));--dcf-line:color-mix(in oklab,var(--dcf-ink) 14%,var(--dcf-bg));--dcf-pad:clamp(16px,4vw,56px)}:where(.dcf) *,:where(.dcf) *::before,:where(.dcf) *::after{box-sizing:border-box}:where(.dcf) a{color:inherit;text-decoration:none}:where(.dcf) button{appearance:none;background:none;border:0;padding:0;margin:0;font:inherit;color:inherit;cursor:pointer}:where(.dcf) h2,:where(.dcf) h3,:where(.dcf) p,:where(.dcf) ul{margin:0;padding:0}:where(.dcf) ul{list-style:none}.dcf svg{max-width:none;overflow:visible}.dcf :focus-visible{outline:2px dashed var(--dcf-ink);outline-offset:4px;border-radius:6px}.dcf-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}.dcf-top{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,2fr);grid-template-rows:auto 1fr;column-gap:clamp(24px,5vw,80px);row-gap:14px;padding:clamp(28px,4.5vw,56px) var(--dcf-pad) 0;max-width:1360px;width:100%;margin:0 auto;position:relative;z-index:3}.dcf-brand{display:flex;align-items:center;gap:10px;grid-column:1;grid-row:1}.dcf-logo{display:grid;place-items:center;width:40px;height:40px;border-radius:999px;border:2px solid var(--dcf-ink);background:var(--dcf-bg);transform:rotate(-6deg);transition:transform .35s cubic-bezier(.3,1.6,.5,1)}.dcf-brand:hover .dcf-logo{transform:rotate(8deg) scale(1.06)}.dcf-brandname{font-weight:800;font-size:19px;letter-spacing:-.02em}.dcf-blurb{grid-column:1;grid-row:2;font-family:var(--dcf-serif);font-size:15px;line-height:1.55;color:var(--dcf-soft);max-width:34ch}.dcf-cols{grid-column:2;grid-row:1/span 2;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}.dcf-coltitle{font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px}.dcf-col li{margin:0 0 7px}.dcf-link{position:relative;display:inline-block;font-size:14px;font-weight:550;color:var(--dcf-soft);padding:2px 0;transition:color .2s}.dcf-link:hover{color:var(--dcf-ink)}.dcf-squiggle{position:absolute;left:-2px;right:-2px;bottom:-4px;width:calc(100% + 4px);height:7px;pointer-events:none}.dcf-squiggle path{fill:none;stroke:var(--dcf-accent);stroke-width:2.2;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .35s cubic-bezier(.4,0,.2,1)}.dcf-link:hover .dcf-squiggle path,.dcf-link:focus-visible .dcf-squiggle path{stroke-dashoffset:0}.dcf-world{position:relative;flex:1;display:flex;flex-direction:column;justify-content:flex-end;padding:clamp(22px,4vw,48px) var(--dcf-pad) 0;max-width:1360px;width:100%;margin:0 auto}.dcf-stage{position:relative;z-index:1}.dcf-svg{display:block;width:100%;height:auto;user-select:none;-webkit-user-select:none}.dcf-svg text{fill:var(--dcf-ink)}.dcf-art{fill:var(--dcf-bg);stroke:var(--dcf-ink);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}.dcf-art .n{fill:none}.dcf-art .k{fill:var(--dcf-ink)}.dcf-art .a{fill:var(--dcf-accent)}.dcf-art .o{fill:#ff9f1c}.dcf-art .r{fill:#ff4d4d}.dcf-art .thin{stroke-width:1.5}.dcf-art .thick{stroke-width:3.4}.dcf-art .dcf-glint{fill:var(--dcf-bg);stroke:none}.dcf-art .dcf-shadow{fill:var(--dcf-ink);stroke:none;opacity:.14}.dcf-ground path{fill:none;stroke:var(--dcf-ink);stroke-width:2.4;stroke-linecap:round}.dcf-ground .dcf-tufts{stroke-width:1.8}.dcf-pebble{fill:var(--dcf-bg);stroke:var(--dcf-ink);stroke-width:1.6}.dcf-dust{fill:none;stroke:var(--dcf-ink);stroke-width:3;stroke-linecap:round;opacity:0}.dcf-hit{fill:transparent;stroke:none;cursor:pointer;outline:none}.dcf-hit:focus-visible{stroke:var(--dcf-ink);stroke-width:2.5;stroke-dasharray:6 6}.dcf-glyph{transform-box:fill-box;transform-origin:50% 100%}.dcf[data-interactive='1'] .dcf-glyph:hover{animation:dcf-jiggle .6s cubic-bezier(.3,1.5,.5,1)}.dcf-art.dcf-bob{animation:dcf-bob 3.2s ease-in-out infinite}.dcf-art.dcf-sway{transform-box:fill-box;transform-origin:50% 100%;animation:dcf-swing 4s ease-in-out infinite}.dcf-art.dcf-peck{transform-box:fill-box;transform-origin:50% 100%;animation:dcf-peck 5.5s ease-in-out infinite}.dcf-tail{transform-box:fill-box;transform-origin:0% 100%;animation:dcf-tail 2.8s ease-in-out infinite}.dcf-hopper{transform-box:fill-box;transform-origin:50% 100%}.dcf-hopper.is-hop{animation:dcf-hop .62s cubic-bezier(.3,.7,.4,1)}.dcf-arrive{transform-box:fill-box;transform-origin:50% 100%}.dcf-bubbles{position:absolute;inset:0;pointer-events:none;z-index:2}.dcf-bubble{position:absolute;transform:translate(-50%,-100%) rotate(-2deg);transform-origin:50% 100%;background:var(--dcf-bg);color:var(--dcf-ink);border:2px solid var(--dcf-ink);border-radius:16px;padding:7px 12px;font-size:13px;font-weight:700;line-height:1.25;white-space:nowrap;box-shadow:3px 3px 0 var(--dcf-ink);animation:dcf-bubble .32s cubic-bezier(.3,1.6,.5,1) both;margin-top:-4px}.dcf-bubble::after{content:'';position:absolute;left:50%;bottom:-9px;width:14px;height:14px;background:var(--dcf-bg);border-right:2px solid var(--dcf-ink);border-bottom:2px solid var(--dcf-ink);transform:translateX(-50%) rotate(45deg) skew(8deg,8deg)}.dcf-bubble.is-left{transform:translate(-88%,-100%) rotate(2deg);transform-origin:88% 100%}.dcf-bubble.is-left::after{left:88%}.dcf-doodles{position:absolute;inset:0;pointer-events:none;z-index:2;overflow:hidden}.dcf-doodle{position:absolute;left:0;top:0;pointer-events:auto;cursor:pointer;will-change:transform;touch-action:manipulation}.dcf-doodle-in{display:block;width:100%;height:100%}.dcf[data-interactive='0'] .dcf-doodle{pointer-events:none}.dcf-doodle svg,.dcf-icon{display:block;stroke:var(--dcf-ink);stroke-width:1.9;stroke-linejoin:round;stroke-linecap:round}.dcf-doodle svg{width:100%;height:100%;filter:drop-shadow(2px 2px 0 color-mix(in oklab,var(--dcf-ink) 18%,transparent))}.dcf-paperfill{fill:var(--dcf-bg)}.dcf-cta{position:relative;z-index:3;display:flex;flex-direction:column;align-items:center;gap:20px;padding:clamp(20px,3vw,34px) 0 clamp(30px,4vw,48px);text-align:center}.dcf-tagline{font-family:var(--dcf-serif);font-size:clamp(17px,1.9vw,22px);line-height:1.4;letter-spacing:-.005em;max-width:44ch;text-wrap:balance}.dcf-word{display:inline-block;white-space:pre}.dcf-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:12px}.dcf-btn{display:inline-flex;align-items:center;gap:8px;height:46px;padding:0 20px 0 16px;border-radius:999px;border:2px solid var(--dcf-ink);font-size:14.5px;font-weight:750;letter-spacing:-.01em;box-shadow:0 3px 0 var(--dcf-ink);transition:transform .18s cubic-bezier(.3,1.4,.5,1),box-shadow .18s cubic-bezier(.3,1.4,.5,1)}.dcf-btn.is-outline{background:var(--dcf-bg);color:var(--dcf-ink)}.dcf-btn.is-solid{background:var(--dcf-ink);color:var(--dcf-bg);box-shadow:0 3px 0 var(--dcf-accent)}.dcf-btn.is-solid .dcf-icon{stroke:var(--dcf-bg)}.dcf-btn:hover{transform:translateY(-2px) rotate(-1.2deg);box-shadow:0 5px 0 var(--dcf-ink)}.dcf-btn.is-solid:hover{box-shadow:0 5px 0 var(--dcf-accent)}.dcf-btn:active{transform:translateY(2px);box-shadow:0 1px 0 var(--dcf-ink);transition-duration:.06s}.dcf-btn.is-solid:active{box-shadow:0 1px 0 var(--dcf-accent)}.dcf-btn:hover .dcf-icon{animation:dcf-wiggle .5s ease-in-out}.dcf-bar{position:relative;z-index:3;display:flex;flex-wrap:wrap;align-items:center;gap:10px 26px;padding:18px var(--dcf-pad) 22px;max-width:1360px;width:100%;margin:0 auto;border-top:1.5px dashed var(--dcf-line);font-size:13px}.dcf-copy{color:var(--dcf-soft);margin-right:auto}.dcf-inline{display:flex;flex-wrap:wrap;gap:4px 18px}.dcf-inline .dcf-link{font-size:13px}.dcf-socials .dcf-link{color:var(--dcf-ink);font-weight:700}.dcf-totop{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;padding:6px 12px;border-radius:999px;border:1.5px solid var(--dcf-ink);transition:transform .2s cubic-bezier(.3,1.5,.5,1)}.dcf-totop svg{fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}.dcf-totop:hover{transform:translateY(-2px)}.dcf-totop:hover svg{animation:dcf-up .6s ease-in-out infinite}.dcf[data-play='0'] .dcf-letter,.dcf[data-play='0'] .dcf-arrive,.dcf[data-play='0'] .dcf-word,.dcf[data-play='0'] .dcf-pop,.dcf[data-play='0'] .dcf-rise,.dcf[data-play='0'] .dcf-fade,.dcf[data-play='0'] .dcf-doodle-in{opacity:0}.dcf[data-play='0'] .dcf-draw{stroke-dasharray:1;stroke-dashoffset:1}.dcf-letter{transform-box:fill-box;transform-origin:50% 100%}.dcf[data-play='1'] .dcf-letter{animation:dcf-stamp .62s cubic-bezier(.2,.8,.25,1.15) var(--d) both}.dcf[data-play='1'] .dcf-dust{animation:dcf-dust .5s ease-out calc(var(--d) + .22s) both}.dcf[data-play='1'] .dcf-draw{stroke-dasharray:1;animation:dcf-draw 1.1s cubic-bezier(.6,0,.3,1) var(--d) both}.dcf[data-play='1'] .dcf-fade{animation:dcf-fade .6s ease-out var(--d) both}.dcf[data-play='1'] .dcf-arrive-front{animation:dcf-rise-up .75s cubic-bezier(.3,1.5,.5,1) var(--d) both}.dcf[data-play='1'] .dcf-arrive-top{animation:dcf-plop .8s cubic-bezier(.3,.9,.4,1) var(--d) both}.dcf[data-play='1'] .dcf-arrive-behind{animation:dcf-peek .9s cubic-bezier(.3,1.4,.5,1) var(--d) both}.dcf[data-play='1'] .dcf-word{animation:dcf-word .6s cubic-bezier(.2,.8,.3,1) var(--d) both}.dcf[data-play='1'] .dcf-pop{animation:dcf-popin .55s cubic-bezier(.3,1.6,.5,1) var(--d) both}.dcf[data-play='1'] .dcf-rise{animation:dcf-fadeup .7s cubic-bezier(.2,.8,.3,1) var(--d) both}.dcf[data-play='1'] .dcf-doodle-in{animation:dcf-fade .6s ease-out var(--d) both}@keyframes dcf-stamp{0%{opacity:0;transform:translateY(-34%) scale(1.28) rotate(var(--r))}55%{opacity:1;transform:translateY(2%) scale(.95,1.05) rotate(0deg)}75%{transform:translateY(0) scale(1.04,.95)}100%{opacity:1;transform:none}}@keyframes dcf-dust{0%{opacity:0;stroke-dasharray:0 40}30%{opacity:.9}100%{opacity:0;stroke-dasharray:14 40;stroke-dashoffset:-16}}@keyframes dcf-draw{to{stroke-dashoffset:0}}@keyframes dcf-fade{from{opacity:0}to{opacity:1}}@keyframes dcf-rise-up{0%{opacity:0;transform:translateY(30%) scale(.7,.3)}45%{opacity:1;transform:translateY(-8%) scale(.92,1.12)}70%{transform:translateY(0) scale(1.08,.92)}100%{opacity:1;transform:none}}@keyframes dcf-plop{0%{opacity:0;transform:translateY(-90%)}50%{opacity:1;transform:translateY(0) scale(1.1,.86)}68%{transform:translateY(-10%) scale(.96,1.04)}84%{transform:translateY(0) scale(1.03,.97)}100%{opacity:1;transform:none}}@keyframes dcf-peek{0%{opacity:0;transform:translateY(55%)}60%{opacity:1;transform:translateY(-6%)}100%{opacity:1;transform:none}}@keyframes dcf-word{from{opacity:0;transform:translateY(.6em) rotate(3deg)}to{opacity:1;transform:none}}@keyframes dcf-popin{0%{opacity:0;transform:translateY(10px) scale(.6) rotate(-4deg)}100%{opacity:1;transform:none}}@keyframes dcf-fadeup{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes dcf-jiggle{0%{transform:none}25%{transform:rotate(-4deg) scale(1.03,.97)}50%{transform:rotate(3deg) translateY(-3%)}75%{transform:rotate(-1.5deg)}100%{transform:none}}@keyframes dcf-hop{0%{transform:none}18%{transform:scale(1.12,.84)}45%{transform:translateY(-28%) scale(.94,1.08)}72%{transform:translateY(0) scale(1.1,.88)}86%{transform:scale(.97,1.03)}100%{transform:none}}@keyframes dcf-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}@keyframes dcf-swing{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2.5deg)}}@keyframes dcf-peck{0%,62%,100%{transform:none}66%{transform:rotate(14deg) translateY(2px)}70%{transform:none}74%{transform:rotate(12deg) translateY(2px)}78%{transform:none}}@keyframes dcf-tail{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-12deg)}}@keyframes dcf-bubble{from{opacity:0;scale:.6}to{opacity:1;scale:1}}@keyframes dcf-wiggle{0%,100%{transform:none}30%{transform:rotate(-14deg) scale(1.15)}60%{transform:rotate(10deg)}}@keyframes dcf-up{0%,100%{transform:none}50%{transform:translateY(-3px)}}@media (max-width:860px){.dcf-top{grid-template-columns:1fr;grid-template-rows:auto}.dcf-brand,.dcf-blurb,.dcf-cols{grid-column:1;grid-row:auto}.dcf-cols{grid-template-columns:repeat(2,minmax(0,1fr));margin-top:14px;row-gap:22px}.dcf-copy{width:100%;margin-right:0}}@media (max-width:480px){.dcf-btn{height:42px;font-size:13.5px;padding:0 16px 0 13px}.dcf-bubble{font-size:12px;padding:6px 10px}.dcf-totop span{display:none}}@media (prefers-reduced-motion:reduce){.dcf *,.dcf *::before,.dcf *::after{animation:none!important;transition:none!important}.dcf .dcf-letter,.dcf .dcf-arrive,.dcf .dcf-word,.dcf .dcf-pop,.dcf .dcf-rise,.dcf .dcf-fade,.dcf .dcf-doodle-in{opacity:1!important}.dcf .dcf-draw{stroke-dashoffset:0!important}.dcf .dcf-dust{opacity:0!important}}";
  return __toCommonJS(doodle_crew_footer_sunny_exports);
})();
/*! Bundled license information:

react/cjs/react.development.js:
  (**
   * @license React
   * react.development.js
   *
   * Copyright (c) Meta Platforms, Inc. and affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
