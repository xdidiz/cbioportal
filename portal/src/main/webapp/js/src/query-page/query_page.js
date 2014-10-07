var app = angular.module('query-page-module', ['ui.bootstrap','localytics.directives']);
app.directive('profileGroup', function () {
    return {
        restrict: 'A',
        replace: true,
        templateUrl: '/js/src/query-page/profileGroup.html',
    };
});
app.filter('to_trusted_html', ['$sce', function ($sce) {
        return function (text) {
            return $sce.trustAsHtml(text);
        };
    }]);

app.factory('DataManager', ['$http', '$q', function ($http, $q) {
        // This handles lazy loading of data. Thus, every method returns a promise
        //  that is immediately resolved iff the requested data has already been
        //  loaded.
        // This means that to ask for data, you call the corresponding function
        //  and attach a callback to it using 'then'.
        // For example, if I wanted data about the cancer study 'stud' and I want
        //  to do 'func(data)' once I get the data, I do the following:
        //      DataManager.cancerStudy(stud).then(func);
        //  where func takes the data as an argument.


        /* Variables (all private) */
        var _typesOfCancer = {};
        var _shortNames = {};
        var _geneSets = {}; // gene set id -> gene set object
        var _cancerStudies = {}; // study id -> study object
        var _cancerStudyStubs = {};
        var _caseSets = {}; // case set id -> list of case ids
        var _genomicProfiles = {}; // [genomic profile id,gene,case id] -> genomic profile data
        var initPromise = $q.defer();

        /* Initialization */
        $http.get('/portal_meta_data.json?partial_studies=true&partial_genesets=true').success(function (json) {
            angular.forEach(json.cancer_studies, function (value, key) {
                _cancerStudies[key] = value;
                _cancerStudyStubs[key] = value;
            });
            angular.forEach(json.gene_sets, function (value, key) {
                _geneSets[key] = value;
            });
            angular.forEach(json.short_names, function (value, key) {
                _shortNames[key] = value;
            });
            angular.forEach(json.type_of_cancers, function (value, key) {
                _typesOfCancer[key] = value;
            });
            initPromise.resolve();
        });

        /* Private Functions */
        var makeProfileDataPoints = function (case_id, gene, datum, altTypeCode) {
            // returns an array of the data points that come out of the given datum etc
            // has to be an array and not a singleton because the datum can be
            // comma-separated mutations
            var ret = [];
            switch (altTypeCode) {
                case "MUT":
                    if (datum !== "NaN" && datum !== "") {
                        var mutations = datum.split(',');
                        for (var i = 0; i < mutations.length; i++) {
                            ret.push({sample: case_id, gene: gene, genotype: {type: "MUT", data: mutations[i], class: "PLACEHOLDER"}});
                        }
                    }
                    break;
                case "CNA":
                    if (datum !== "NaN" && datum !== "" && datum !== "0") {
                        ret.push({sample: case_id, gene: gene, genotype: {type: "CNA", data: datum}});
                    }
                    break;
                case "EXP":
                case "PROT":
                    if (datum !== "NaN" && datum !== "") {
                        ret.push({sample: case_id, gene: gene, genotype: {type: altTypeCode, data: datum}});
                    }
                    break;
            }
            return ret;
        };
        /* Public Functions */
        var genomicProfiles = function (prof_ids, genes, case_ids) {
            // return: a map of [prof_id, gene, case_id] -> list of data points

            // figure out which we still need to load
            var toLoad = {}; //prof_id -> {genelist:list of genes, caselist:list of case_ids]
            // TODO: could do this more efficiently by covering the list of gene, case_id pairs with "rectangles" (cartesian products of sets) in the space
            //         and only loading ones we need. But its less efficient to make a ton of ajax calls than to make a single call that's bigger than we need
            angular.forEach(prof_ids, function (id) {
                toLoad[id] = {genelist: [], caselist: []};
            });
            angular.forEach(prof_ids, function (prof_id) {
                angular.forEach(genes, function (gene) {
                    angular.forEach(case_ids, function (case_id) {
                        _genomicProfiles[[prof_id, gene, case_id]] = [];
                        toLoad[prof_id].genelist.push(gene);
                        toLoad[prof_id].caselist.push(case_id);
                    });
                });
            });
            // make promise and load
            var q = $q.defer();
            // count how many we need to load
            var numberToLoad = Object.keys(toLoad).length;
            // load away
            var typeCode = {"MUTATION_EXTENDED": "MUT", "COPY_NUMBER_ALTERATION": "CNA", "MRNA_EXPRESSION": "EXP", "PROTEIN_ARRAY_PROTEIN_LEVEL": "PROT"};
            var cnaEventCode = {"-2": "HOMDEL", "-1": "HETLOSS", "1": "GAIN", "2": "AMP"};
            angular.forEach(toLoad, function (obj, profile_id) {
                if (obj.genelist.length > 0) {
                    var url = '/webservice.do?cmd=getProfileData&case_list=' + obj.caselist.join(",") +
                            '&genetic_profile_id=' + profile_id +
                            "&gene_list=" + obj.genelist.join(",");
                    $http.get(url).success(function (data, status, headers, config) {
                        var splitData = data.split('\n');
                        var sampleIds = splitData[2]; // begin at index 2
                        var altType = typeCode[splitData[1].split('\t')[1]];
                        for (var i = 3; i < splitData.length; i++) {
                            var row = splitData[i];
                            var cells = row.split('\t');
                            var gene = cells[1];
                            for (var j = 2; j < cells.length; j++) {
                                var sample = sampleIds[j];
                                var datum = cells[j];
                                if (altType === "CNA") {
                                    datum = cnaEventCode[datum];
                                }
                                _genomicProfiles[[profile_id, gene, sample]] += makeProfileDataPoints(sample, gene, datum, altType);
                            }
                        }
                        numberToLoad -= 1;
                        if (numberToLoad === 0) {
                            q.resolve(_genomicProfiles);
                        }
                    });
                } else {
                    numberToLoad -= 1;
                    if (numberToLoad === 0) {
                        q.resolve(_genomicProfiles);
                    }
                }
            });
            if (numberToLoad === 0) {
                q.resolve(_genomicProfiles);
            }
            return q.promise;
        };
        var caseSet = function (case_set_id) {
            var q = $q.defer();
            if (case_set_id in _caseSets) {
                q.resolve(_caseSets[case_set_id]);
            } else {
                $http.get('/webservice.do?cmd=getCaseList&case_set_id=' + case_set_id).
                        success(function (data, status, headers, config) {
                            var id = data.split('\t')[0];
                            var list = data.split('\t')[1].split(" ");
                            _caseSets[id] = list;
                            q.resolve(_caseSets[id]);
                        });
            }
            return q.promise;
        }
        var cancerStudy = function (id) {
            var q = $q.defer();
            if (_cancerStudies[id].partial === 'true') {
                $http.get('/portal_meta_data.json?study_id=' + id).
                        success(function (data, status, headers, config) {
                            _cancerStudies[id] = data;
                            q.resolve(_cancerStudies[id]);
                        });
            } else {
                q.resolve(_cancerStudies[id]);
            }
            return q.promise;
        };
        var geneSet = function (id) {
            var q = $q.defer();
            if (_geneSets[id].gene_list === '') {
                $http.get('/portal_meta_data.json?geneset_id=' + id).
                        success(function (data, status, headers, config) {
                            _geneSets[id].gene_list = data;
                            q.resolve(_geneSets[id]);
                        });
            } else {
                q.resolve(_geneSets[id]);
            }
            return q.promise;
        };

        return {
            /* Variables */
            initPromise: initPromise.promise,
            /* Functions */
            typesOfCancer: function () {
                var q = $q.defer();
                q.resolve(_typesOfCancer);
                return q.promise;
            },
            cancerStudyStubs: function () {
                var q = $q.defer();
                q.resolve(_cancerStudyStubs);
                return q.promise;
            },
            genomicProfiles: genomicProfiles,
            caseSet: caseSet,
            cancerStudy: cancerStudy,
            geneSet: geneSet
        };
    }]);

app.factory('FormVars', function () {
    return {
        cancer_study_id: 'all',
        data_priority: 'pri_mutcna',
        case_set_id: '-1',
        custom_case_list: '',
        oql_query: '',
        genomic_profiles:{},
        z_score_threshold:'',
        rppa_score_threshold:'',
    };
});

app.factory('AppVars', ['DataManager', '$q', function (DataManager, $q) {
        /* CONSTANTS */
        var alt_types = ["MUTATION", "MUTATION_EXTENDED", "COPY_NUMBER_ALTERATION", "PROTEIN_LEVEL",
            "MRNA_EXPRESSION", "METHYLATION", "METHYLATION_BINARY", "PROTEIN_ARRAY_PROTEIN_LEVEL"];
        var alt_descriptions = ["Mutation", "Mutation", "Copy Number", "Protein Level", "mRNA Expression",
            "DNA Methylation", "DNA Methylation", "Protein/phosphoprotein level (by RPPA)"];

        /* VARIABLES */
        var cancer_studies = {};
        var cancer_study_stubs = {};
        var data_priorities = [{id: 'pri_mutcna', label: 'Mutation and CNA'}, {id: 'pri_mut', label: 'Only Mutation'}, {id: 'pri_cna', label: 'Only CNA'}];
        var types_of_cancer = [];
        var profile_groups = {};
        var ordered_profile_groups = new Array(alt_types.length);
        var current_tab = 'analysis'; // 'analysis' or 'download'

        /* FUNCTIONS */
        var updateStudyInfo = function (study_id) {
            DataManager.cancerStudy(study_id).then(function (data) {
                cancer_studies[study_id] = data;
            });
        };

        var updateProfileGroups = function (study_id) {
            var q = $q.defer();
            DataManager.cancerStudy(study_id).then(function (study) {
                // Collect by type
                for (var i = 0; i < alt_types.length; i++) {
                    profile_groups[alt_types[i]] = {alt_type:alt_types[i], description: alt_descriptions[i], list: []};
                    ordered_profile_groups[i] = profile_groups[alt_types[i]]; // copy reference
                }
                for (var i = 0; i < study.genomic_profiles.length; i++) {
                    if (study.genomic_profiles[i].show_in_analysis_tab === true || current_tab === 'download') {
                        profile_groups[study.genomic_profiles[i].alteration_type].list.push(study.genomic_profiles[i]);
                    }
                }
                q.resolve();
            });
            return q.promise;
        };
        return {
            updateStudyInfo: updateStudyInfo,
            updateProfileGroups: updateProfileGroups,
            
            alt_types: alt_types,
            data_priorities: data_priorities,
            profile_groups: profile_groups,
            ordered_profile_groups: ordered_profile_groups,
            gene_set_id: '',
            error_msg: '',
            filtered_samples: {samples: {}, genes: [], query: '', categ: ["AMP", "GAIN", "HETLOSS", "HOMDEL", "MUT", "EXP", "PROT"]},
            types_of_cancer: types_of_cancer,
            cancer_study_stubs: cancer_study_stubs,
            cancer_studies: cancer_studies
        };
    }]);

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

app.controller('mainController2', ['$scope', 'DataManager', 'FormVars', 'AppVars', function ($scope, DataManager, FormVars, AppVars) {
        $scope.formVars = FormVars;
        $scope.appVars = AppVars;
        angular.element(document).ready(function () {
            // wait for datamanager to initialize before doing anything
            DataManager.initPromise.then(function () {
                DataManager.typesOfCancer().then(function (toc) {
                    $scope.appVars.types_of_cancer = toc;
                });
                DataManager.cancerStudyStubs().then(function (ccs) {
                    $scope.appVars.cancer_study_stubs = ccs;
                });
                $scope.$watch('formVars.cancer_study_id', function () {
                    var av = $scope.appVars;
                    av.updateStudyInfo($scope.formVars.cancer_study_id);
                    av.updateProfileGroups($scope.formVars.cancer_study_id).then(function() {
                        // clear selections
                        console.log($scope.formVars.genomic_profiles);
                        for (var i=0; i<av.alt_types.length; i++) {
                            $scope.formVars.genomic_profiles[av.alt_types[i]] = false;
                        }
                        console.log($scope.formVars.genomic_profiles);
                        // make default selections
                        if(av.profile_groups["MUTATION"].list.length > 0) {
                            console.log("checking mutation");
                            $scope.formVars.genomic_profiles["MUTATION"] = 
                                    av.profile_groups["MUTATION"].list[0].id;
                        }
                        if (av.profile_groups["MUTATION_EXTENDED"].list.length > 0) {
                            console.log("checking mutation extended");
                            $scope.formVars.genomic_profiles["MUTATION_EXTENDED"] = 
                                    av.profile_groups["MUTATION_EXTENDED"].list[0].id;
                        }
                        if (av.profile_groups["COPY_NUMBER_ALTERATION"].list.length > 0) {
                            console.log("checking copy number alteration");
                            $scope.formVars.genomic_profiles["COPY_NUMBER_ALTERATION"] = 
                                    av.profile_groups["COPY_NUMBER_ALTERATION"].list[0].id;
                        }
                    });
                });
            });

        });
    }]);


app.controller('mainController', ['$scope', 'Global', '$http', '$q', '$location', '$interval', 'DataManager', function ($scope, Global, $http, $q, $location, $interval, DataManager) {
        $scope.vars = Global.vars();
        $scope.dataPriorities = [{id: "pri_mutcna", label: "Mutation and CNA"}, {id: "pri_mut", label: "Only Mutation"}, {id: "pri_cna", label: "Only CNA"}];
        $scope.profileGroups = [];
        $scope.caseSets = [];
        $scope.profileHash = {};
        $scope.samples = {};

        angular.element(document).ready(function () {
            // wait for datamanager to initialize
            DataManager.initPromise.then(function () {
            });


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
        $scope.isEmpty = function (o) {
            return Object.keys(o).length === 0;
        };
        // for the view
        $scope.range = function (n) {
            return new Array(n);
        }
        $scope.Math = window.Math;
    }]);

app.directive('resize', function($window) {
    return function (scope, element, attrs) {
        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            return {
                'match': $window.matchMedia('(max-width: 1200px)').matches
            };
        };
        scope.$watch(scope.getWindowDimensions, function (value) {
            if(attrs.id === "cbioportal_logo") {
                var link = "images/cbioportal_logo.png";
                if(value.match) {
                    link = "images/cbioportal_icon.png";
                }else {
                    link = "images/cbioportal_logo.png";
                }
                scope.link = function() {
                    return link;
                };
            }
        }, true);
        
        w.bind('resize', function () {
            scope.$apply();
        });
    };
});