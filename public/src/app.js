(function(){
  'use strict';

  angular
    .module('kanban', ['ui.router', 'ngMaterial', 'ngAnimate', 'picardy.fontawesome', 'dndLists', 'ngSanitize', 'btford.markdown', 'emoji', 'ngCookies'])
    .config(function($mdThemingProvider, $mdIconProvider, $stateProvider, $urlRouterProvider){

        // icons
        $mdIconProvider
            .icon("menu", "./assets/svg/menu.svg", 24)
        ;

        // material theme
        $mdThemingProvider
            .theme('default')
            .primaryPalette('green')
            .accentPalette('orange')
        ;

        // For unmatched routes
        $urlRouterProvider.otherwise('/');

        // Application routes
        $stateProvider
            .state('dashboard', {
                url: '/dashboard',
                templateUrl: '/src/project/view/dashboard.html'
            })
            .state('auth', {
                url: '/',
                templateUrl: '/src/auth/view/auth.html'
            })
            .state('issues', {
                url: '/{projectid}/issues',
                templateUrl: '/src/issue/view/issueBoard.html'
            })
        ;

    });

})();