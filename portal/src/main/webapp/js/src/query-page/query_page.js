var app = angular.module('query-page-module', ['ui.bootstrap']);
app.directive('profileGroup', function () {
    return {
        restrict: 'A',
        replace: true,
        templateUrl: '/js/src/query-page/profileGroup.html',
    };
});
app.factory('Global', ['$http', '$q', function ($http, $q) {
        var vars = {metaDataJson: -1, cancer_study_id: "all", case_set_id: "-1", genomic_profiles: {}, gene_set_id: "user-defined-list", oql_query: "",
            current_tab: "analysis", filteredSamples: {samples: {}, query: "", genes: [], categ: ["AMP", "GAIN", "HETLOSS", "HOMDEL", "MUT", "EXP", "PROT"]}, errorMsg: "", custom_case_list: []};

        return {
            vars: function () {
                return vars;
            },
            metaDataJson: function () {
                var q = $q.defer();
                if (vars.metaDataJson === -1) {
                    $http({method: 'GET', url: '/portal_meta_data.json?partial_studies=true&partial_genesets=true'}).
                            success(function (data, status, headers, config) {
                                vars.metaDataJson = data;
                                q.resolve(vars.metaDataJson);
                            });
                } else {
                    q.resolve(vars.metaDataJson);
                }
                return q.promise;
            },
            study: function (id) {
                var q = $q.defer();
                if (vars.metaDataJson.cancer_studies[id].partial === 'true') {
                    $http({method: 'GET', url: '/portal_meta_data.json?study_id=' + id}).
                            success(function (data, status, headers, config) {
                                vars.metaDataJson.cancer_studies[id] = data;
                                q.resolve(vars.metaDataJson.cancer_studies[id]);
                            });
                } else {
                    q.resolve(vars.metaDataJson.cancer_studies[id]);
                }
                return q.promise;
            },
            geneList: function (id) {
                var q = $q.defer();
                if (vars.metaDataJson.gene_sets[id].gene_list === "") {
                    $http({method: 'GET', url: '/portal_meta_data.json?geneset_id=' + id.replace(/\//g, '')}).
                            success(function (data, status, headers, config) {
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

app.filter('to_trusted', ['$sce', function ($sce) {
        return function (text) {
            return $sce.trustAsHtml(text);
        };
    }]);

app.controller('mainController', ['$scope', 'Global', '$http', '$q', '$location', '$interval', function ($scope, Global, $http, $q, $location, $interval) {
        $scope.vars = Global.vars();
        $scope.dataPriorities = [{id: "pri_mutcna", label: "Mutation and CNA"}, {id: "pri_mut", label: "Only Mutation"}, {id: "pri_cna", label: "Only CNA"}];
        $scope.profileGroups = [];
        $scope.caseSets = [];
        $scope.profileHash = {};
        $scope.samples = {};

        angular.element(document).ready(function () {
            //load metadata
            Global.metaDataJson().then(function () {
                // do init stuff here
                $scope.syncFromUrl();
                $scope.$watch('vars.gene_set_id', function () {
                    Global.geneList($scope.vars.gene_set_id).then(function (json) {
                        if ($scope.vars.gene_set_id !== "user-defined-list") {
                            $scope.vars.oql_query = $scope.vars.metaDataJson.gene_sets[$scope.vars.gene_set_id].gene_list;
                        }
                    });
                });
                $scope.$watch('vars.cancer_study_id', $scope.updateStudy);
                $interval($scope.syncToUrl, 1000);
            });
        });
        $scope.syncToUrl = function () {
            var toEncode = {cancer_study_id: $scope.vars.cancer_study_id, case_set_id: $scope.vars.case_set_id, custom_case_list: $scope.vars.custom_case_list, gene_set_id: $scope.vars.gene_set_id,
                oql_query: $scope.vars.oql_query, genomic_profiles: $scope.vars.genomic_profiles, current_tab: $scope.vars.current_tab};
            $location.path(encodeURIComponent(JSON.stringify(toEncode)));
        }
        $scope.syncFromUrl = function () {
            // get data from url
            if ($location.path() !== "") {
                try {
                    var pathWithoutSlash = $location.path().substring(1);
                    var decoded = JSON.parse(decodeURIComponent(pathWithoutSlash));
                    $scope.vars.cancer_study_id = decoded.cancer_study_id;
                    $scope.vars.case_set_id = decoded.case_set_id;
                    $scope.vars.custom_case_list = decoded.custom_case_list;
                    $scope.vars.gene_set_id = decoded.gene_set_id;
                    $scope.vars.oql_query = decoded.oql_query;
                    $scope.vars.genomic_profiles = decoded.genomic_profiles;
                    $scope.vars.current_tab = decoded.current_tab;
                } catch (err) {
                }
            }
        }
        $scope.updateStudy = function () {
            // load if necessary
            Global.metaDataJson().then(function () {
                Global.study($scope.vars.cancer_study_id).then(function () {
                    $scope.updateCaseSets();
                    $scope.updateGenomicProfileGroups();
                });
            });
        };
        $scope.updateCaseSets = function () {
            var ret = [];
            for (var i = 0; i < $scope.vars.metaDataJson.cancer_studies[$scope.vars.cancer_study_id].case_sets.length; i++) {
                var set = $scope.vars.metaDataJson.cancer_studies[$scope.vars.cancer_study_id].case_sets[i];
                ret.push({id: set.id, label: set.name + ' (' + set.size + ') '});
            }
            ret.push({id: '-1', label: 'User-defined Case List'});
            $scope.caseSets = ret;
        };
        $scope.updateGenomicProfileGroups = function () {
            // Clear selected in global var
            $scope.vars.genomic_profiles = {};
            $scope.profileHash = {};
            // Collect by type
            var altTypes = ["MUTATION", "MUTATION_EXTENDED", "COPY_NUMBER_ALTERATION", "PROTEIN_LEVEL",
                "MRNA_EXPRESSION", "METHYLATION", "METHYLATION_BINARY", "PROTEIN_ARRAY_PROTEIN_LEVEL"];
            var altDescriptions = ["Mutation", "Mutation", "Copy Number", "Protein Level", "mRNA Expression",
                "DNA Methylation", "DNA Methylation", "Protein/phosphoprotein level (by RPPA)"];
            var profsByAltType = [];
            for (var i = 0; i < altTypes.length; i++) {
                profsByAltType.push({type: altTypes[i], description: altDescriptions[i], list: []});
                $scope.vars.genomic_profiles[altTypes[i]] = false;
            }
            Global.study($scope.vars.cancer_study_id).then(function (json) {
                for (var i = 0; i < json.genomic_profiles.length; i++) {
                    if (json.genomic_profiles[i].show_in_analysis_tab === true || $scope.vars.current_tab === "download") {
                        profsByAltType[altTypes.indexOf(json.genomic_profiles[i].alteration_type)].list.push(json.genomic_profiles[i]);
                        $scope.profileHash[json.genomic_profiles[i].id] = json.genomic_profiles[i];
                    }
                }
                //make default selections
                if (profsByAltType[altTypes.indexOf("MUTATION_EXTENDED")].list.length > 0) {
                    $scope.vars.genomic_profiles["MUTATION_EXTENDED"] = profsByAltType[altTypes.indexOf("MUTATION_EXTENDED")].list[0].id;
                }
                if (profsByAltType[altTypes.indexOf("COPY_NUMBER_ALTERATION")].list.length > 0) {
                    $scope.vars.genomic_profiles["COPY_NUMBER_ALTERATION"] = profsByAltType[altTypes.indexOf("COPY_NUMBER_ALTERATION")].list[0].id;
                }
                $scope.profileGroups = profsByAltType;
            });
        };
        $scope.loadAndFilterSampleData = function () {
            var gene_list = oql.getGeneList($scope.vars.oql_query);
            var profile_ids = Object.keys($scope.vars.genomic_profiles).
                    map(function (k) {
                        return $scope.vars.genomic_profiles[k];
                    }).
                    filter(function (x) {
                        return !!x;
                    });
            $scope.loadGeneticProfiles(profile_ids, gene_list).then(function (allData) {
                for (var i = 0; i < allData.length; i++) {
                    var parsed = $scope.parseData(allData[i].data, allData[i].type);
                    $scope.addData(parsed.sampleIds, parsed.data, gene_list);
                }
                $scope.filterSamples();
            });
        }
        $scope.loadGeneticProfiles = function (profile_ids, gene_list) {
            var profile_ids = Object.keys($scope.vars.genomic_profiles).
                    map(function (k) {
                        return $scope.vars.genomic_profiles[k];
                    }).
                    filter(function (x) {
                        return !!x;
                    });
            // VERY SENSITIVE TO FORMAT OF RESPONSE
            // isolate gene ids
            var typeCode = {"MUTATION_EXTENDED": "MUT", "COPY_NUMBER_ALTERATION": "CNA", "MRNA_EXPRESSION": "EXP", "PROTEIN_ARRAY_PROTEIN_LEVEL": "PROT"};


            var allData = [];  // data of form {sample: 'S1', gene: 'BRAF', genotype: {type:'MUT', data: 'V600E', class:'MISSENSE'}} etc
            var q = $q.defer();
            var done = 0;

            for (var i = 0; i < profile_ids.length; i++) {
                (function () {
                    var toLoad = $scope.profileHash[profile_ids[i]];
                    var type = typeCode[toLoad.alteration_type];
                    var url = '/webservice.do?cmd=getProfileData&case_set_id=' + $scope.vars.case_set_id + '&genetic_profile_id=' + profile_ids[i] + "&gene_list=" + gene_list.join(",");

                    $http({method: 'GET', url: url}).success(function (data) {
                        allData.push({data: data, type: type});
                        done++;
                        if (done === profile_ids.length) {
                            q.resolve(allData);
                        }
                    });

                })();
            }
            return q.promise;
        }
        $scope.parseData = function (data, type) {
            var dataPts = [];
            var cnaEventCode = {"-2": "HOMDEL", "-1": "HETLOSS", "1": "GAIN", "2": "AMP"};
            var rows = data.split('\n');
            rows = $.map(rows, function (x, i) {
                return $.trim(x);
            });
            var samples = rows[2].split(/\s/); // samples start at element index 2
            for (var i = 3; i < rows.length; i++) {
                if (rows[i][0] === '#') {
                    continue;
                }
                var splitRow = rows[i].split(/\s/);
                var geneName = splitRow[1];
                for (var j = 2; j < splitRow.length; j++) {
                    if (type === "MUT") {
                        if (splitRow[j] === "NaN" || splitRow[j] === "") {
                            continue;
                        } else {
                            var mutations = splitRow[j].split(',');
                            for (var h = 0; h < mutations.length; h++) {
                                dataPts.push({sample: samples[j], gene: geneName, genotype: {type: "MUT", data: mutations[h], class: "PLACEHOLDER"}});
                            }
                        }
                    } else if (type === "CNA") {
                        if (splitRow[j] === "NaN" || splitRow[j] === "" || splitRow[j] === "0") {
                            continue;
                        } else {
                            var event = cnaEventCode[splitRow[j]];
                            dataPts.push({sample: samples[j], gene: geneName, genotype: {type: "CNA", data: event}});
                        }
                    } else if (type == "EXP") {
                        if (splitRow[j] === "NaN" || splitRow[j] === "") {
                            continue;
                        } else {
                            dataPts.push({sample: samples[j], gene: geneName, genotype: {type: "EXP", data: splitRow[j]}});
                        }
                    } else if (type == "PROT") {
                        if (splitRow[j] === "NaN" || splitRow[j] === "") {
                            continue;
                        } else {
                            dataPts.push({sample: samples[j], gene: geneName, genotype: {type: "PROT", data: splitRow[j]}});
                        }
                    }
                }
            }
            return {sampleIds: samples.slice(2), data: dataPts};
        }
        $scope.addData = function (sampleIds, dataPts, gene_list) {
            // by default adds data, doesn't overwrite existing data
            var samples = $scope.samples;
            for (var i = 0; i < sampleIds.length; i++) {
                if (!(sampleIds[i] in samples)) {
                    samples[sampleIds[i]] = {};
                }
                for (var j = 0; j < gene_list.length; j++) {
                    if (!(gene_list[j] in samples[sampleIds[i]])) {
                        samples[sampleIds[i]][gene_list[j]] = {};
                        samples[sampleIds[i]][gene_list[j]] = {};
                        samples[sampleIds[i]][gene_list[j]]["AMP"] = 0;
                        samples[sampleIds[i]][gene_list[j]]["HOMDEL"] = 0;
                        samples[sampleIds[i]][gene_list[j]]["GAIN"] = 0;
                        samples[sampleIds[i]][gene_list[j]]["HETLOSS"] = 0;
                        samples[sampleIds[i]][gene_list[j]]["EXP"] = false;
                        samples[sampleIds[i]][gene_list[j]]["PROT"] = false;
                        samples[sampleIds[i]][gene_list[j]]["MUT"] = [];
                    }
                }
            }
            for (var i = 0; i < dataPts.length; i++) {
                var datum = dataPts[i];
                try {
                    if (datum.genotype.type === "CNA") {
                        samples[datum.sample][datum.gene][datum.genotype.data] = 1;
                    } else if (datum.genotype.type === "EXP" || datum.genotype.type === "PROT") {
                        samples[datum.sample][datum.gene][datum.genotype.type] = parseFloat(datum.genotype.data);
                    } else if (datum.genotype.type === "MUT") {
                        samples[datum.sample][datum.gene]["MUT"].push({"name": datum.genotype.data, "class": datum.genotype.class});
                    }
                } catch (err) {
                    console.log(samples[datum.sample])
                    console.log(datum);
                }
            }
        }
        $scope.insertDefaults = function (query) {
            //TODO: implement
            return query;
        }
        $scope.filterSamples = function () {
            var parsedQuery = oql.parseQuery($scope.insertDefaults($scope.vars.oql_query));
            if (parsedQuery.result === 0) {
                $scope.vars.errorMsg = "";
                $scope.vars.filteredSamples.samples = oql.filter(parsedQuery.return, $scope.samples).map(function (x) {
                    return {id: x, data: $scope.samples[x]};
                });
                $scope.vars.filteredSamples.query = $scope.vars.oql_query;
                $scope.vars.filteredSamples.genes = oql.getGeneList($scope.vars.filteredSamples.query);
                console.log($scope.vars.filteredSamples);
            } else {
                $scope.vars.errorMsg = "Errors on lines " + parsedQuery.return.map(function (x) {
                    return x.line + 1
                }).join(", ");
            }
        }

        // for the view
        $scope.range = function (n) {
            return new Array(n);
        }
        $scope.Math = window.Math;
    }]);