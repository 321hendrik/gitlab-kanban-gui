(function(){
  'use strict';

  angular
       .module('kanban')
       .controller('AuthController', [
          '$scope', 'backendService', '$state', '$location',
          AuthController
       ]);

  /**
   * Main Controller for the Angular Material Starter App
   * @param $scope
   * @param $mdSidenav
   * @param avatarsService
   * @constructor
   */
  function AuthController( $scope, backendService, $state, $location ) {
    $scope.enteredToken = "";
    $scope.enterTokenMessages = [];
    $scope.missingToken = false;

    /**
     * Save the entered token to cookiestore and go to dashboard
     * @param  {String} entered
     */
    $scope.submitToken = function (entered) {
      $scope.enterTokenError = '';
      var token = entered || $scope.enteredToken;
      backendService.exec('validate', {token: token})
        .then(function (res) {
          backendService.setUser(res.user);
          $state.go('dashboard');
        })
        .catch(function (err) {
          $scope.enterTokenError = 'You entered an invalid token. Please try again.';
        })
      ;
    };

    function init () {
      $scope.missingToken = !backendService.getToken();
      if (!$scope.missingToken) {
        $state.go('dashboard');
      }
    }
    init();
  }

})();
