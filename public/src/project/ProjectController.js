(function(){
  'use strict';

  angular
       .module('kanban')
       .controller('ProjectController', [
          '$scope', '$mdSidenav', '$mdBottomSheet', '$log', 'backendService', '$mdDialog', '$q', '$state', '$location',
          ProjectController
       ]);

  /**
   * Main Controller for the Angular Material Starter App
   * @param $scope
   * @param $mdSidenav
   * @param avatarsService
   * @constructor
   */
  function ProjectController( $scope, $mdSidenav, $mdBottomSheet, $log, backendService, $mdDialog, $q, $state, $location ) {
    $scope.projects = [ ];
    $scope.select = select;
    $scope.isLoadingDone = false;

    $scope.missingToken = !backendService.getToken();

    $scope.milestoneFilterBox = {value: true};

    $scope.columns = {
      "backlog":             { position: 1, name: "Backlog",          emoticon: "",                        emoticonUrl: '',                                                                                         color: '#9D9BA2'},
      "workinprogress":      { position: 2, name: "WiP",              emoticon: ":hammer:",                emoticonUrl: 'assets/img/emojione/1f528.png', color: '#FF523D'},
      "readytest":           { position: 3, name: "Ready (Test)",     emoticon: ":question:",              emoticonUrl: 'assets/img/emojione/2753.png',  color: '#FF9148'},
      "testinprogress":      { position: 4, name: "TiP",              emoticon: ":microscope:",            emoticonUrl: 'assets/img/emojione/1f52c.png', color: '#58BB47'},
      "readycustomer":       { position: 5, name: "Ready (Customer)", emoticon: ":ballot_box_with_check:", emoticonUrl: 'assets/img/emojione/2611.png',  color: '#4FC3FF'},
      "waitingforclearance": { position: 6, name: "WC",               emoticon: ":checkered_flag:",        emoticonUrl: 'assets/img/emojione/1f3c1.png', color: '#6E51FF'}
    };

    $scope.getColumnColor = function (columnKey) {
      return $scope.columns[columnKey].color;
    };

    $scope.getColumnIcon = function (columnKey) {
      return $scope.columns[columnKey].emoticonUrl;
    };

    $scope.getColumnName = function (columnKey) {
      return $scope.columns[columnKey].name;
    };

    $scope.getColumnOrder = function (columnKey) {
      return $scope.columns[columnKey].position;
    };

    $scope.getBarWidth = function (columnCount, issueCount) {
      if (issueCount && columnCount) {
        return columnCount / issueCount * 100;
      }
      return 0;
    };

    $scope.getMilestoneCount = function (stats) {
      return Object.keys(stats).length - 1;
    };

    /**
     * Select a project
     * @param menuId
     */
    function select ( selectedEntry, skipToggle ) {
      $scope.searchText = '';
    }

    $scope.changeMilestoneFilter = function () {
      $scope.isLoadingDone = false;
      $scope.projects = [];
      init($scope.milestoneFilterBox.value);
    };

    function fetchProjectsData (params) {
      return backendService.exec('project/list', params || {})
        .then(function (data) {
          return data.projects;
        })
        .catch(function (err) {
          console.error(err);
        })
      ;
    }

    function init (milestoneOnly) {
      if (!backendService.getToken()) {
        $state.go('auth');
      } else {
        fetchProjectsData({stats: true, withissues: true, milestoneonly: milestoneOnly})
          .then( function( projects ) {
            if (!projects || !projects.length) {
              return init($scope.milestoneFilterBox.value);
            }
            $scope.projects  = [].concat(projects);
            $scope.isLoadingDone = true;
            return true;
          });
      }
    }

    $scope.$on("socketMessage", function (scope, data) {
      console.log('Socket Message received', data, data.message.action);
      if (data.message.action == "updateView") {
        init($scope.milestoneFilterBox.value);
      }
    });

    backendService.onReady(function () {
      init($scope.milestoneFilterBox.value);
    });
  }

})();
