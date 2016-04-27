(function(){
  'use strict';

  angular
       .module('kanban')
       .controller('IssueController', [
          '$scope', 'backendService', '$mdDialog', '$q', '$state',
          IssueController
       ]);

  /**
   * Main Controller for the Angular Material Starter App
   * @param $scope
   * @param $mdSidenav
   * @param avatarsService
   * @constructor
   */
  function IssueController( $scope, backendService, $mdDialog, $q, $state ) {
    $scope.selected = null;
    $scope.issueCount = 0;
    $scope.showUnassigned = false;
    $scope.isLoadingDone = false;

    $scope.missingToken = !backendService.getToken();

    $scope.models = {
        lists: [
          {id: "backlog",             name: "Backlog",              emoticon: "",                        emoticonUrl: '',                              color: '#9D9BA2', items: []},
          {id: "workinprogress",      name: "WiP",                  emoticon: ":hammer:",                emoticonUrl: 'assets/img/emojione/1f528.png', color: '#FF523D', items: []},
          {id: "readytest",           name: "Ready (Test)",         emoticon: ":question:",              emoticonUrl: 'assets/img/emojione/2753.png',  color: '#FF9148', items: []},
          {id: "testinprogress",      name: "TiP",                  emoticon: ":microscope:",            emoticonUrl: 'assets/img/emojione/1f52c.png', color: '#58BB47', items: []},
          {id: "readycustomer",       name: "Ready (Customer)",     emoticon: ":ballot_box_with_check:", emoticonUrl: 'assets/img/emojione/2611.png',  color: '#4FC3FF', items: []},
          {id: "waitingforclearance", name: "WC",                   emoticon: ":checkered_flag:",        emoticonUrl: 'assets/img/emojione/1f3c1.png', color: '#6E51FF', items: []},
          {id: "closed",              name: "Closed",               emoticon: ":x:",                     emoticonUrl: '',                              color: '#676267', items: []}
        ]
    };

    $scope.milestones = [];

    /**
     * Load the selected projects issues
     * @param  {Number} projectid
     * @return {Promise}           Q-Promise
     */
    function loadIssues (projectid) {
      return backendService.exec('issue/list', {
        projectid: projectid
      })
        .then(function (data) {
          $scope.issueCount = data.issues.length;
          return assignItemsToLists(data.issues, $scope.models.lists);
        })
        .catch(function (err) {
          console.error(err);
        })
      ;
    }

    /**
     * Update a project issue
     * @param  {Number} projectid
     * @param  {Number} issueid   issue id (not iid)
     * @param  {Object} params    object with optional update properties (title, description, assignee_id, milestone_id, labels(comma-separated list of names), state_event("close"|"reopen"))
     * @return {[type]}           [description]
     */
    function updateIssue (projectid, issueid, params) {
      return backendService.exec('issue/set', {
        projectid: projectid,
        issueid: issueid,
        data: params
      })
        .then(function (data) {
          return true;
        })
        .catch(function (err) {
          console.error(err);
        })
      ;
    }

    /**
     * Assign items to lists based on emoticon in title
     * @param  {Object} items array if items to assign
     * @param  {Object} lists lists to assign items to
     * @return {Promise}       Q-Promise
     */
    function assignItemsToLists (items, lists) {
      return $q(function (resolve, reject) {
        // clear lists
        for (var h = lists.length; h--;) {
          lists[h].items.splice(0, lists[h].items.length);
        }

        var milestones = {};
        $scope.milestones.splice(0, $scope.milestones.length);

        // assign items anew
        for (var i = 0; i < items.length; i++) {
          // save milestone
          var milestoneId = (items[i].milestone) ? items[i].milestone.title : 'without_milestone';
          if (!milestones[milestoneId]) {
            milestones[milestoneId] = items[i].milestone || {};
          }

          for (var j = lists.length; j--;) {
            // assign item to list if title contains list emoticon
            var emoticonIndex = items[i].title.indexOf(lists[j].emoticon);
            if (emoticonIndex !== -1 || items[i].state == 'closed') {
              items[i].type = milestoneId;
              // add closed item
              if (items[i].state == 'closed') {
                items[i].displayTitle = items[i].title.replace(/^:[a-z0-9_]+:/, '');
                lists[lists.length-1].items.push(items[i]);
                break;
              }
              // add opened item
              items[i].displayTitle = items[i].title.slice(0, emoticonIndex) + items[i].title.slice(emoticonIndex + lists[j].emoticon.length);
              lists[j].items.push(items[i]);
              break;
            }
          }
        }

        // move unassigned swimlane to bottom
        for (var k in milestones) {
          if (k != 'without_milestone') {
            $scope.milestones.push({title: k, data: milestones[k]});
          }
        }
        $scope.milestones.push({title: 'without_milestone', data: milestones['without_milestone']});

        resolve(true);
      });
    }

    function updateIssueTitleAndAssignee (issue, column) {
      var newEmoticon = column.emoticon;
      var matches = issue.title.match(/^:[a-z0-9_]+:/);
      var oldEmoticon = (matches) ? matches[0] : '';

      var index = issue.title.indexOf(oldEmoticon);

      if (newEmoticon != oldEmoticon) {
        if (newEmoticon) {
          issue.title = newEmoticon + ' ' + issue.title.slice(index + oldEmoticon.length + ((oldEmoticon) ? 1 : 0));
        } else {
          issue.title = issue.title.slice(index + oldEmoticon.length + 1);
        }

        var user = backendService.getUser();
        var updateParams = {
          title: issue.title,
          assignee_id: (column.id != 'backlog') ? user.id : 0
        };
        console.log('issue', updateParams);
        return updateIssue(issue.project_id, issue.id, updateParams);
      } else {
        var deferred = $q.defer();
        deferred.resolve();
        return deferred.promise;
      }
    }

    /**
     * Show issue info dialog
     * @param  {Object} ev
     * @param  {Object} item
     */
    $scope.showAdvanced = function(ev, item) {
      item.description = item.description.replace(/\]\(\/uploads/g, '](' + backendService.getGitlabUrl() + '/' + $scope.selected.path_with_namespace + '/uploads');

      $mdDialog.show({
        locals: {
          project: $scope.selected,
          item: item
        },
        controller: DialogController,
        templateUrl: 'src/issue/view/issueDialog.html',
        parent: angular.element(document.body),
        targetEvent: ev,
        clickOutsideToClose:true
      })
      .then(function(answer) {
        // dialog save @TODO
      }, function() {
        // dialog cancel
      });
    };

    function DialogController($scope, $mdDialog, item, project) {
      $scope.item = item;
      $scope.project = project;
      $scope.hide = function() {
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $mdDialog.cancel();
      };
      $scope.answer = function(answer) {
        $mdDialog.hide(answer);
      };
    }

    function getProjectInfo (id) {
      return backendService.exec('project/show', {projectid: id})
        .then(function (data) {
          return data.project;
        })
        .catch(function (err) {
          console.error(err);
        })
      ;
    }

    var dragged = {};

    $scope.dragStart = function (index, column) {
      dragged = {index: index, column: column};
    };

    $scope.itemDrop = function (item, column, milestone) {
      dragged.column.items.splice(dragged.index, 1);
      if (column.id != 'closed') {
        updateIssueTitleAndAssignee(item, column);
      } else {
        updateIssue(item.project_id, item.id, {state_event: 'close'});
      }
      return item;
    };

    $scope.$on("socketMessage", function (scope, data) {
      console.log('Socket Message received', data, data.message.action);
      if (data.message.action == "updateView") {
        init();
      }
    });

    /**
     * Controller init
     */
    function init () {
      if (!backendService.getToken()) {
        $state.go('auth');
      } else {
        getProjectInfo($state.params.projectid)
          .then(function (projectdata) {
            // workaround for failed actionhero socket response
            if (!projectdata) {
              return init();
            }
            $scope.selected = projectdata;
            return loadIssues(projectdata.id);
          })
          .then(function () {
            $scope.isLoadingDone = true;
          })
        ;
      }
    }

    backendService.onReady(function () {
      init();
    });
  }

})();
