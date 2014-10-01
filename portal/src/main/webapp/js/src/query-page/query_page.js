var app = angular.module('query-page-module',[]);
app.factory('Global', ['$http', function($http) {
    var vars = {metaDataJson:-1, cancer_study_id:"all",case_set_id:"-1", case_sets:[], gene_set_id:"user-defined-list", oql_query:""};
    var _updateCaseSets = function() {
            console.log("UPDATING CASE SETS");
            var ret = [];
            for (var i=0; i<vars.metaDataJson.cancer_studies[vars.cancer_study_id].case_sets.length; i++) {
                var set = vars.metaDataJson.cancer_studies[vars.cancer_study_id].case_sets[i];
                ret.push({id:set.id, label:set.name+' ( '+set.size+' ) '});
            }
            ret.push({id:'-1',label:'User-defined Case List'});
            vars.case_sets = ret;
        };
        
    return {
        vars: function() {
            return vars;
        },
        loadCurrentStudy: function() {
            var id = vars.cancer_study_id;
            $http({method:'GET', url:'/portal_meta_data.json?study_id='+id}).
                success(function(data,status,headers,config) {
                    vars.metaDataJson.cancer_studies[id] = data;
                    _updateCaseSets();
            });
        },
        loadStudy: function(id) {
            $http({method:'GET', url:'/portal_meta_data.json?study_id='+id}).
                success(function(data,status,headers,config) {
                    vars.metaDataJson.cancer_studies[id] = data;
                    _updateCaseSets();
            });
        },
        updateCaseSets: _updateCaseSets
    };
    }]);

app.filter('to_trusted', ['$sce', function($sce) {
            return function(text) {
                return $sce.trustAsHtml(text);
            };
        }]);
    
app.controller('mainController', ['$scope', 'Global', '$http', function($scope, Global, $http) {
        $scope.vars = Global.vars();
        angular.element(document).ready(function() {
            $http({method: 'GET', url: '/portal_meta_data.json?partial_studies=true&partial_genesets=true'}).
                    success(function(data, status, headers, config) {
                        $scope.vars.metaDataJson = data;
                        Global.loadCurrentStudy();
                    });
        });
}]);

app.controller('step1Controller', ['$http','$scope', 'Global', function($http,$scope, Global) {
        $scope.updateStudy = function() {
            // load if necessary
            if ($scope.vars.metaDataJson.cancer_studies[$scope.vars.cancer_study_id].partial === 'true' ) {
                Global.loadStudy($scope.vars.cancer_study_id);
            } else {
                // just update case sets
                Global.updateCaseSets();
            }
        };
        
        $scope.onChange = function() {
            $scope.updateStudy();
        };
}]);

app.controller('step2CrossController', ['$scope', 'Global', function($scope, Global) {
        $scope.dataPriorities = [{id:"pri_mutcna",label:"Mutation and CNA"},{id:"pri_mut",label:"Only Mutation"},{id:"pri_cna",label:"Only CNA"}];
        }]);
    
app.controller('step2Controller', ['$scope', 'Global', function($scope, Global) {
        }]);    
app.controller('step3Controller', ['$scope', 'Global', function($scope, Global) {
        
        }]);    
app.controller('step4Controller', ['$scope', 'Global', function($scope, Global) {
        var updateOqlQuery = function() {
            console.log("yo");
            $scope.vars.oql_query = "yo";
        };
        }]);    
        