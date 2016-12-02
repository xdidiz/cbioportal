// what is the previous cancer study that has been selected?
// this way we don't have to repeat queries
var CANCER_STUDY_SELECTED = -1;

// initialize and bind for
// gsva toggle button and gsva dialog box
var initGsvaDialogue = function() {
    "use strict";

    // initialize gsva button
    // as hidden, and with JQuery UI style
    $('#toggle_gsva_button').hide();
    $('#toggle_gsva_button').button();

    // set up modal dialog box for gsva table (step 3)
    $('#gsva_dialog').dialog({autoOpen: false,
        resizable: false,
        modal: true,
        minHeight: 315,
        minWidth: 636
        });

    // set listener for gsva select button
    $('#select_gsva').click(function() {
        $('#gsva_dialog').dialog('close');
    });

    // set listener for gsva cancel button
    $('#cancel_gsva').click(function() {

        // close dialog box
        $('#gsva_dialog').dialog('close');

    });

    // bind UI for gsva table -> update gene list
    $('#select_gsva').click(updateGeneList);

    listenCancerStudy_gsva();
};

//listen for a change in the selected cancer study and
//handle appropriately
//todo: refactor this
var listenCancerStudy_gsva = function() {
 $('#select_single_study').change( function() {

     // get the cancer study (i.e. tcga_gbm)
     var cancerStudyId = $('#select_single_study').val();

     // if the selected cancer study has gsva data,
     // show the gsva button
     if (window.json.cancer_studies[cancerStudyId].has_gsva_data) {
         $('#toggle_gsva_button').show();
     } else {
         $('#toggle_gsva_button').hide();
     }
 });
};

//Displays the modal dialog for the gsva table
var promptGsvaTable = function() {
    "use strict";

    // grab data to be sent to the server
    var cancerStudyId = $('#select_single_study').val();

    // open the dialog box
    $('#gsva_dialog').dialog('open');

    // this was the last cancer study selected,
    // no need to redo the query
    if (CANCER_STUDY_SELECTED === cancerStudyId) {
        return;
    }

    // save the selected cancer study for later
    CANCER_STUDY_SELECTED = cancerStudyId;

    // prepare data to be sent to server
    var data = {'selected_cancer_type': cancerStudyId };

    // show everything but loader image
    $('#gsva_dialog').children().show();
    $('#gsva_dialog #loader-img').hide();
    
    return;
};

//updates the gene_list based on the data given.
var updateGeneList = function() {
 "use strict";
 
 //Define three test gene sets
 var gene_sets = ['GENESET1', 'GENESET2', 'GENESET3'];

 // push all the genes in the gene_list onto a list
 var gene_list = $('#gene_list').val();

 // if gene_list is currently empty put the test Gene Sets.
 if (gene_list === "") {
	 $.each(gene_sets, function(index,value) {
		 gene_list += " "+value;
	 });
 } else {
     // append the test Gene Sets into the gene_list if they're not there
     $.each(gene_sets, function(index,value) {
    	 if ( gene_list.search(new RegExp(value, "i")) === -1 ) { //If gene set not found
    		 gene_list += " "+value;
    	 }
     });
 }

 // remove spaces in gene_list
 gene_list = $.trim(gene_list);
 gene_list = gene_list.replace(/\s{2,}/, " ");            // delete 2 or more spaces in a row and replace it by one space
 
 //Set the values into the text box for querying genes
 $('#gene_list').val(gene_list);
};

//todo: refactor this and put it in with other init functions in step3.json
$(document).ready( function () {
    "use strict";
    initGsvaDialogue();
});

