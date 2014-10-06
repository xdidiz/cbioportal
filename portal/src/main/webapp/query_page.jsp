<%-- 
    Document   : query_page
    Created on : Sep 26, 2014, 1:19:14 PM
    Author     : abeshoua
--%>

<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html ng-app="query-page-module" ng-controller="mainController">
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <link type="text/css" rel="stylesheet" href="css/bootstrap-chosen.css"/>
        <link type="text/css" rel="stylesheet" href="css/chosen-spinner.css"/>
        <link type="text/css" rel="stylesheet" href="css/query_page.css"/>
    </head>
    <body>
        <jsp:include page="header.html" /> 
        <!-- STEP 1 -->
        <div class="container">
            <div class="row">
                <div class="col-lg-4 col-md-4 col-sm-4 col-xs-4 leftColumn"><span>Select Cancer Study:</span></div>
                <div class="col-lg-8 col-md-8 col-sm-8 col-xs-8">
                    <select chosen ng-model="vars.cancer_study_id" 
                    ng-options="csid as csobj.name group by vars.metaDataJson.type_of_cancers[csobj.type_of_cancer] for (csid, csobj) in vars.metaDataJson.cancer_studies"
                    >
                    </select>
                </div>
            </div>
            <div class="row hidden">
                <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
                    <p class="leftFloat" ng-hide="vars.cancer_study_id === 'all'" ng-bind-html="vars.metaDataJson.cancer_studies[vars.cancer_study_id].description | to_trusted"></p>
                    <button class="btn btn-sm leftFloat">Study Summary</button>
                </div>
            </div>
            <!-- STEP 2 (CROSS-STUDY) -->
            <div class="row" ng-show="vars.cancer_study_id === 'all'">
                <div class="col-lg-4 col-md-4 col-sm-4 col-xs-4 leftColumn"><span>Select Data Type Priority:</span></div>
                <div class="col-lg-8 col-md-8 col-sm-8 col-xs-8">
                    <label ng-repeat="datap in dataPriorities">
                        <input type="radio" name="data_priority" ng-model="vars.data_priority" value="{{datap.id}}">{{datap.label}}
                    </label>
                </div>
            </div>
            <!-- STEP 2 (SINGLE STUDY) -->
            <div class="row"  ng-hide="vars.cancer_study_id === 'all'">
                <div class="col-lg-4 col-md-4 col-sm-4 col-xs-4 leftColumn"><span>Select Genomic Profiles:</span></div>
                <div class="col-lg-8 col-md-8 col-sm-8 col-xs-8">
                    <div  ng-repeat="profgp in profileGroups">
                        <div profile-group>
                        </div>
                    </div>
                </div>
            </div>
            <!-- STEP 3 -->
            <div class="row"  ng-hide="vars.cancer_study_id === 'all'">
                <div class="col-lg-4 col-md-4 col-sm-4 col-xs-4 leftColumn"><span>Select Patient/Case Set:</span></div>
                <div class="col-lg-8 col-md-8 col-sm-8 col-xs-8">
                    <select ng-model="vars.case_set_id"
                            ng-options="cs.id as cs.label for cs in caseSets"
                            >
                    </select>
                    <div ng-show="vars.case_set_id === '-1'">
                        <textarea ng-model="vars.custom_case_list" rows="6" cols="80" placeholder="Enter case IDs"></textarea>
                    </div>
                </div>

            </div>
            <!-- STEP 4 -->
            <div class="row">
                <div class="col-lg-4 col-md-4 col-sm-4 col-xs-4 leftColumn"><span>Enter Gene Set:</span></div>
                <div class="col-lg-8 col-md-8 col-sm-8 col-xs-8">
                    <select ng-model="vars.gene_set_id"
                    ng-options="id as gs.name for (id,gs) in vars.metaDataJson.gene_sets"
                    >
                    </select>
                    <textarea ng-model="vars.oql_query" rows="6" cols="80" placeholder="Enter HUGO Gene Symbols or Gene Aliases"></textarea>
                </div>
            </div>
            <div class="row">
                <div class="col-lg-4 col-md-4 col-sm-4 col-xs-4 leftColumn"></div>
                <div class="col-lg-8 col-md-8 col-sm-8 col-xs-8">
                    <button type="button" class="btn btn-mskcc btn-sm" ng-click="loadAndFilterSampleData()">Submit</button>
                    <button type="button" class="btn btn-mskcc btn-sm" ng-click="syncToUrl()">Update URL</button>
                    <button type="button" class="btn btn-mskcc btn-sm" ng-click="syncFromUrl()">Get From URL</button>
                </div>
            </div>
            <div class="row">
                <p ng-show="vars.errorMsg.length > 0" style="color:red">{{vars.errorMsg}}</p>
            </div>
            <div class="row">
                <table class="table table-responsive table-striped">
                    <tbody>
                        <tr>
                            <td rowspan="2">Sample\ Gene</td>
                            <td ng-repeat="gene in vars.filteredSamples.genes" colspan="7">{{gene}}</td>
                        </tr>
                        <tr>
                            <td ng-repeat="i in range(7 * vars.filteredSamples.genes.length) track by $index">
                                {{vars.filteredSamples.categ[$index % 7]}}
                            </td>
                        </tr>
                        <tr ng-repeat="samp in vars.filteredSamples.samples">
                            <td>{{samp.id}}</td>
                            <td ng-repeat="i in range(7 * vars.filteredSamples.genes.length) track by $index">
                                {{samp.data[vars.filteredSamples.genes[Math.floor($index / 7)]][vars.filteredSamples.categ[$index % 7]]}}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <!--<p ng-hide="vars.cancer_study_id === 'all'">The selected genomic profiles are {{vars.genomic_profiles}}</p>
        <br><br>
        <p>The selected cancer study is {{vars.cancer_study_id}}</p>
        <p ng-show="vars.cancer_study_id === 'all'">The selected data priority is {{vars.data_priority}}</p>
        <p>The selected case set is {{vars.case_set_id}}</p>-->
        <script type="text/javascript" src="js/src/query-page/angular.min.js"></script>
        <script type="text/javascript" src="js/src/query-page/ui-bootstrap-0.11.2.min.js"></script>
        <script type="text/javascript" src="js/lib/jquery.min.js"></script>
        <script type="text/javascript" src="js/lib/chosen-angular.js"></script>
        <script type="text/javascript" src="js/lib/oql-parser.js"></script>
        <script type="text/javascript" src="js/lib/oql.js"></script>
        <script type="text/javascript" src="js/src/query-page/query_page.js"></script>
    </body>
</html>