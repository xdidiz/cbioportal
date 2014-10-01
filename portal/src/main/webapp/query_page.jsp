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
    </head>
    <body>
        <div ng-controller="step123Controller">
            <div>
                <h2>Select Cancer Study:</h2>
                <select ng-model="vars.cancer_study_id" 
                        ng-options="csid as csobj.name group by vars.metaDataJson.type_of_cancers[csobj.type_of_cancer] for (csid, csobj) in vars.metaDataJson.cancer_studies"
                        ng-change="onChange()"
                        >
                </select>
                <p ng-hide="vars.cancer_study_id==='all'" ng-bind-html="vars.metaDataJson.cancer_studies[vars.cancer_study_id].description | to_trusted"></p>
                <button>Study Summary</button>
            </div>
            <div ng-show="vars.cancer_study_id === 'all'">
                <h2>Select Data Type Priority:</h2>
                <label ng-repeat="datap in dataPriorities">
                    <input type="radio" name="data_priority" ng-model="vars.data_priority" value="{{datap.id}}">{{datap.label}}
                </label>
            </div>
            <div ng-hide="vars.cancer_study_id === 'all'">
                <h2>Select Genomic Profiles:</h2>
                <div ng-repeat="prof in profiles">
                    <div profile-group="prof">
                    </div>
                </div>
            </div>
            <div ng-hide="vars.cancer_study_id === 'all'">
                <h2>Select Patient/Case Set:</h2>
                <select ng-model="vars.case_set_id"
                        ng-options="cs.id as cs.label for cs in caseSets"
                        >
                </select>
                <div ng-show="vars.case_set_id === '-1'">
                    <p>Enter case IDs below:</p>
                    <textarea ng-model="vars.custom_case_list" rows="6" cols="80"></textarea>
                </div>
            </div>
        </div>
        <div ng-controller="step4Controller">
            <h2>Enter Gene Set:</h2>
            <a href="http://www.cbioportal.org/public-portal/onco_query_lang_desc.jsp">Advanced: Onco Query Language (OQL)</a>
            <select ng-model="vars.gene_set_id"
                    ng-options="id as gs.name for (id,gs) in vars.metaDataJson.gene_sets"
                    ng-change="updateOqlQuery()"
                    >
            </select>
            <textarea ng-model="vars.oql_query" rows="6" cols="80" placeholder="Enter HUGO Gene Symbols or Gene Aliases"></textarea>
        </div>
        <button type="button">Submit</button>
        <p>The selected cancer study is {{vars.cancer_study_id}}</p><br>
        <p ng-show="vars.cancer_study_id === 'all'">The selected data priority is {{vars.data_priority}}</p><br>
        <p ng-hide="vars.cancer_study_id === 'all'">The selected genomic profiles are {{vars.data_priority}}</p><br>
        <p>The selected case set is {{vars.case_set_id}}</p>
        <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/angularjs/1.2.25/angular.min.js"></script>
        <script type="text/javascript" src="js/src/query-page/query_page.js"></script>
    </body>
</html>