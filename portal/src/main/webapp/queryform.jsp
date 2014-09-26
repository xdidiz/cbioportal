<%-- 
    Document   : queryform
    Created on : Sep 26, 2014, 1:19:14 PM
    Author     : abeshoua
--%>

<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>
        <form id="main_query_form" action="index.do" method="get">
            <div id="step1">
                <h2>Select Cancer Study:</h2>
                <select id="cancer_study_id_sel" name="cancer_study_id">
                    <!-- Fill dynamically -->
                </select>
                <p id="cancer_study_description"></p>
                <button id="cancer_study_summary_btn">Study Summary</button>
            </div>
            <div id="step2cross">
                <h2>Select Data Type Priority:</h2>
                <div id="step2crossbtns">
                    <!-- Fill dynamically -->
                </div>
            </div>
            <div id="step2">
                <h2>Select Genomic Profiles:</h2>
                <div id="step2btns">
                    <!-- Fill dynamically -->
                </div>
            </div>
            <div id="step3">
                <h2>Select Patient/Case Set:</h2>
                <select id="case_set_id_sel" name="case_set_id">
                    <!-- Fill dynamically -->
                </select>
                <button id="build_case_set_btn">Build Case Set</button>
            </div>
            <div id="step4">
                <h2>Enter Gene Set:</h2>
                <a href="http://www.cbioportal.org/public-portal/onco_query_lang_desc.jsp">Advanced: Onco Query Language (OQL)</a>
                <select id="gene_set_choice_sel" name="gene_set_choice">
                    <!-- Fill dynamically -->
                </select>
                <button id="gene_set_mutsig_btn" type="button">Select From Recurrently Mutated Genes (MutSig)</button>
                <button id="gene_set_gistic_btn" type="button">Select Genes From Recurrent CNAs (Gistic)</button>
                <textarea id="oql_query_txt" name="oql_query" rows="5" cols="80" placeholder="Enter HUGO Gene Symbols or Gene Aliases (or full OQL)"></textarea>
            </div>
            <input id="main_submit_btn" type=""submit" name="Action" value="Submit">
        </form>
        <script type="text/javascript" src="https://code.jquery.com/jquery-1.11.1.min.js"></script>
        <script type="text/javascript" src="js/src/queryform.js"></script>
    </body>
</html>