(function(){
  'use strict';

  angular
       .module('kanban')
       .controller('AppController', [
          '$scope', 'backendService', '$state', '$location',
          AppController
       ]);

  /**
   * Main Controller for the Angular Material Starter App
   * @param $scope
   * @param $mdSidenav
   * @param avatarsService
   * @constructor
   */
  function AppController( $scope, backendService, $state, $location ) {

    $scope.gitlabUrl = backendService.getGitlabUrl();
    $scope.tardisUrl = backendService.getTardisUrl();

    $scope.user = {};

    $scope.getUser = function () {
      var user = backendService.getUser();
      if (user) {
        $scope.user.name = user.name;
        $scope.user.initials = user.username;
        $scope.user.avatar = user.avatar_url;
        return $scope.user;
      }
      delete $scope.user.name;
      delete $scope.user.initials;
      delete $scope.user.avatar;
      return $scope.user;
    };

    $scope.removeToken = function () {
      backendService.setUser('');
      $state.go('auth');
    };
  }

})();
