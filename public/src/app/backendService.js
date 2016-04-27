(function(){
  'use strict';

  angular.module('kanban')
         .service('backendService', ['$q', 'kanbanConfig', '$cookieStore', '$rootScope', backendService]);

  /**
   * Backend DataService
   * @constructor
   */
  function backendService($q, kanbanConfig, $cookieStore, $rootScope){
    var subscribed = false;
    var isConnected = false;
    var readyCallbacks = [];

    function getUser () {
      return $cookieStore.get('user');
    }

    function setUser (user) {
      $cookieStore.put('user', user);
    }

    function getToken () {
      var user = getUser();
      if (user && user.private_token) {
        return user.private_token;
      }
      return null;
    }

    kanbanConfig.kanbanClient.on('say', function (data) {
      if (data.room == 'defaultRoom') {
        $rootScope.$broadcast('socketMessage', data);
      }
    });

    kanbanConfig.kanbanClient.on('connected', function (data) {
      isConnected = true;
      // inform the onReady queue
      if (readyCallbacks) {
          var callback;
          while (callback = readyCallbacks.shift()) {
              setTimeout(callback, 1);
          }
      }
    });

    kanbanConfig.kanbanClient.on('disconnected', function (data) {
      isConnected = false;
    });

    kanbanConfig.kanbanClient.connect(function(err, data) {
      if (err) {
        console.log("connection failure", err);
      }
      kanbanConfig.kanbanClient.roomAdd("defaultRoom");
      console.log('connection established');
    });

    /**
     * Execute a server action.
     * @param  {String} action
     * @param  {Object} params
     * @return {Promise} Q-Promise
     */
    function exec(action, params) {
      return $q(function(resolve, reject) {
        params = params || {};

        params.token = params.token || getUser().private_token;

        kanbanConfig.kanbanClient.action(action, params, function(p1, p2) {

          // handle errors
          if (p1.error) {
            return reject(p1.error);
          }

          resolve(p1);
        });
      });
    }

    function getGitlabUrl () {
      return kanbanConfig.gitlabUrl;
    }

    function getTardisUrl () {
      return kanbanConfig.tardisUrl;
    }

    /**
     * provide a callback trigger when the service becomes fully available
     * @param {Function} callback
     */
    function onReady (callback) {

        // already ready
        if (isConnected) {
            return callback();
        }

        readyCallbacks.push(callback);
    }

    // Promise-based API
    return {
      onReady: onReady,
      getUser: getUser,
      setUser: setUser,
      getToken: getToken,
      getGitlabUrl: getGitlabUrl,
      getTardisUrl: getTardisUrl,
      exec : exec
    };
  }

})();