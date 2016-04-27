(function(){
  'use strict';

  angular.module('kanban')
	.constant('kanbanConfig', {
		gitlabUrl: 'http://gitlab.com',
		endpoint: 'http://localhost:1234',
		connection: 'ws',
		kanbanClient: new ActionheroClient({
			url: 'http://localhost:1234'
		})
	});


})();