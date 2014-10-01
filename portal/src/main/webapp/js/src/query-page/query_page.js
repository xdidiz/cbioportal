var app = angular.module('query-page-module',[]);
app.factory('Global', ['$http', '$q', function($http, $q) {
    var vars = {metaDataJson:-1, cancer_study_id:"all",case_set_id:"-1",  gene_set_id:"user-defined-list", oql_query:""};
    
    return {
        vars: function() {
            return vars;
        },
        metaDataJson: function() {
            var q = $q.defer();
            if (vars.metaDataJson === -1) {
                $http({method: 'GET', url: '/portal_meta_data.json?partial_studies=true&partial_genesets=true'}).
                        success(function(data, status, headers, config) {
                            vars.metaDataJson = data;
                            q.resolve(vars.metaDataJson);
                        });
            } else {
                q.resolve(vars.metaDataJson);
            }
            return q.promise;
        },
        study: function(id) {
            var q = $q.defer();
            if (vars.metaDataJson.cancer_studies[id].partial === 'true') {
                 $http({method:'GET', url:'/portal_meta_data.json?study_id='+id}).
                    success(function(data,status,headers,config) {
                        vars.metaDataJson.cancer_studies[id] = data;
                        q.resolve(vars.metaDataJson.cancer_studies[id]);
                    });        
            } else {
                q.resolve(vars.metaDataJson.cancer_studies[id]);
            }
            return q.promise;
        },
        geneList: function(id) {
            var q = $q.defer();
            if (vars.metaDataJson.gene_sets[id].gene_list === "") {
                $http({method:'GET', url:'/portal_meta_data.json?geneset_id='+id.replace(/\//g,'')}).
                    success(function(data,status,headers,config) {
                        vars.metaDataJson.gene_sets[id].gene_list = data.list.split(/\s/).join("; ")
                        q.resolve(vars.metaDataJson.gene_sets[id].gene_list);
                    });
            } else {
                q.resolve(vars.metaDataJson.gene_sets[id].gene_list);
            }
            return q.promise;
        },
        
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
            //load metadata
            Global.metaDataJson().then(function() {
                // do init stuff here
            });
        });
}]);


app.controller('step123Controller',['$http','$scope', 'Global', function($http,$scope, Global) {
        $scope.dataPriorities = [{id:"pri_mutcna",label:"Mutation and CNA"},{id:"pri_mut",label:"Only Mutation"},{id:"pri_cna",label:"Only CNA"}];
        $scope.updateStudy = function() {
            // load if necessary
            Global.metaDataJson().then(function() {
                Global.study($scope.vars.cancer_study_id).then(function() {
                    $scope.updateCaseSets();
                });
            });
        };
        $scope.updateCaseSets = function() {
            var ret = [];
            for (var i=0; i<$scope.vars.metaDataJson.cancer_studies[$scope.vars.cancer_study_id].case_sets.length; i++) {
                var set = $scope.vars.metaDataJson.cancer_studies[$scope.vars.cancer_study_id].case_sets[i];
                ret.push({id:set.id, label:set.name+' ('+set.size+') '});
            }
            ret.push({id:'-1',label:'User-defined Case List'});
            $scope.caseSets = ret;
        };
        $scope.onChange = function() {
            $scope.updateStudy();
        };
        $scope.profileGroups = [];
        $scope.caseSets = [];
}]);  

app.controller('step4Controller', ['$scope', 'Global', function($scope, Global) {
        $scope.updateOqlQuery = function() {
            //load if necessary
            Global.metaDataJson().then(function() {
                Global.geneList($scope.vars.gene_set_id).then(function(json) {
                    $scope.vars.oql_query = $scope.vars.metaDataJson.gene_sets[$scope.vars.gene_set_id].gene_list;
                });
            });
        };
        }]);    
        