<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html;charset=utf-8"/>
        <link type="text/css" rel="stylesheet" href="css/bootstrap.min.css?09222014-1"/>
        <link rel="stylesheet" href="//code.jquery.com/ui/1.11.1/themes/smoothness/jquery-ui.css">
        <script type="text/javascript" src="js/lib/jquery.min.js?09222014-1"></script>
        <script type="text/javascript" src="js/lib/bootstrap.min.js?09222014-1"></script>
        <script>function popitup(url) {
                newwindow = window.open(url, 'name', 'height=700,width=800');
                if (window.focus) {
                    newwindow.focus()
                }
            }</script>
    </head>

    <body>
        <div id="body" class="container">
            <div id="summary" class="row">
                <div class="col-lg-9 col-md-9 col-sm-12 col-xs-12">
                </div>
            </div>
            <br />
            <div>
                <ul id="query-page-tabs" class="container nav nav-tabs">
                    <li class="active"><a data-toggle="tab" href="#analysis-tab">Query</a></li>
                    <li><a data-toggle="tab" href="#download-tab">Download Data</a></li>
                </ul>

                <div class="tab-content">
                    <div id="analysis-tab" class="tab-pane active">
                        <form id="query-form">
                            <div class="form-group" id="cancer-study-grp">
                                <label>Select Cancer Study:</label>
                                <select class="form-control" id="cancer-study-select">
                                    <option value="all">All Cancer Studies</option>
                                    <!-- fill dynamically -->
                                </select>
                                <div id="cancer-study-summary">
                                    <!-- fill dynamically with <p> describing and <button> for study summary -->
                                </div>
                            </div>
                            <div class="form-group" id="data-type-priority-grp">
                                <label>Select Data Type Priority:</label>
                                <div class="radio">
                                    <label>
                                        <input type="radio" name="data-type-priority-choice" id="data-type-priority-mut-cna" value="mut-cna" checked>
                                        Mutation and CNA
                                    </label>
                                </div>
                                <div class="radio">
                                    <label>
                                        <input type="radio" name="data-type-priority-choice" id="data-type-priority-mut" value="mut">
                                        Only Mutation
                                    </label>
                                </div>
                                <div class="radio">
                                    <label>
                                        <input type="radio" name="data-type-priority-choice" id="data-type-priority-cna" value="cna">
                                        Only CNA
                                    </label>
                                </div>
                            </div>
                            <div class="form-group" id="genomic-profiles-grp">
                                <label>Select Genomic Profiles:</label>
                                <div id="genomic-profiles-select">
                                    <!-- fill dynamically -->
                                </div>
                            </div>
                            <div class="form-group" id="case-set-grp">
                                <label>Select Patient/Case Set:</label>
                                <select class="form-control" id="case-set-select">
                                    <option val="all">All Tumors</option>
                                    <!-- fill dynamically -->
                                </select>
                            </div>
                            <div class="form-group" id="gene-set-grp">
                                <label> Enter Gene Set: </label>
                                <a href="#" onclick="return popitup('onco_query_lang_desc.jsp')">Advanced: Onco Query Language (OQL)</a>
                                <select class="form-control" id="gene-set-select">
                                    <option val="user-defined-list">User-defined List</option>
                                    <!-- fill dynamically -->
                                </select>
                                <button type="button" class="btn btn-default" id="gene-set-select-mutsig" onclick="alert('Not yet implemented');">Select From Recurrently Mutated Genes (MutSig)</button>
                                <button type="button" class="btn btn-default" id="gene-set-select-gistic" onclick="alert('Not yet implemented');">Select Genes from Recurrent CNAs (Gistic)</button>
                                <textarea class="form-control" id="gene-set-textarea" rows="5" placeholder="Enter HUGO Gene Symbols or Gene Aliases"></textarea>
                            </div>
                            <button type="submit" class="btn btn-default">Submit</button>
                        </form>


                    </div>

                    <div id="download-tab" class="tab-pane">
                        <p> DOWNLOAD TAB</p>
                    </div>

                </div>
            </div>
            <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/angularjs/1.2.25/angular.min.js"></script>
            <script type="text/javascript" src="//code.jquery.com/ui/1.11.1/jquery-ui.js"></script>
            <script type="text/javascript" src="js/src/query.js"></script>
        </div>
    </body>
</html>