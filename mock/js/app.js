var APP = angular.module('APP', ['$strap.directives']);

APP.directive("customPropertys", [function(){
	return {
		restrict: 'A'
		, template: '<div class="control-group" ng-repeat="one in list">' +
						'<div ng-if="one.type == 1">' +
			    			'<label class="control-label">{{one.name}}</label>' +
			    			'<div class="controls">' +
			    				'<input type="text" ng-model="form[one.id]" />' +
			    			'</div>' +
			    		'</div>' +
			    		'<div ng-if="one.type == 2">' +
			    			'<label class="control-label">{{one.name}}</label>' +
			    			'<div class="controls">' +
			    				'<select ng-model="form[one.id]">' +
			    					'<option ng-repeat="son in one.values" value="{{son.id}}">{{son.name}}</option>' +
			    				'</select>' +
			    			'</div>' +
			    		'</div>' +
			    		'<div ng-if="one.type == 3">' +
			    			'<span ng-init="form[one.id]=[]" />' +
			    			'<label class="control-label">{{one.name}}</label>' +
			    			'<div class="controls">' +
			    				'<label class="checkbox inline" ng-repeat="son in one.values">' +
			    					'<input type="checkbox" value="{{son.id}}" ng-model="form[one.id][$index]" /> {{son.name}}' +
			    				'</label>' +
			    			'</div>' +
			    		'</div>' +
		  			'</div>'
		, scope: {
			list: '='		//个性属性列表
			, form: '='		//表单域
		}
		, link: function(scope, element, attrs){
		}
	};
}]);

APP.controller('kpCtrl', ['$scope', '$http', function($scope, $http){

	var customPropertys;

	$scope.CPList = [];
	$scope.data = {};

	$scope.addCP = function addCP(){
		var id = 0;
		var name = $scope.CPName;
		$scope.CPName = '';

		//拿到属性的id
		angular.forEach(customPropertys, function(item, key){
			if(item == name){
				id = key;
				return false;
			}
		});

		//获取指定属性的结构
		$http.get('propertyInfo.php?id=' + id).success(function(response){
			//TODO 不允许重复添加，会因为id相同而导致表单域冲突
			$scope.CPList.push(response);
		});
	}; 

	//bootstrap自带的自动提示，功能简陋，推荐尝试https://github.com/pwarelis/Ajax-Typeahead
	$scope.typeaheadFn = function(query, callback) {
	    $http.get('customProperty.php?key=' + query).success(function(stations){

	    	customPropertys = stations;

	    	var arr = []; //插件不支持json，需要转成数组，但是丢失了属性键
	    	angular.forEach(stations, function(item){
	    		arr.push(item);
	    	});

	    	callback(arr);
	    });
	};

	$scope.submit = function submit(){
		console.log($scope.data);
	};
}]);
