/*
 * Copyright (c) 2016 The Hyve B.V.
 * This code is licensed under the GNU Affero General Public License,
 * version 3, or (at your option) any later version.
 *
 * This file is part of cBioPortal.
 *
 * cBioPortal is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// This code is based on mutsig.js written by Gideon Dresdner 
// Sander Tan, Oleguer Plantalech and Pieter Lukasse, The Hyve
// December 2016

// what is the previous cancer study that has been selected?
// this way we don't have to repeat queries
var CANCER_STUDY_SELECTED = -1;


// initialize and bind for
// geneset toggle button and geneset dialog box
var initGenesetDialogue = function() {
    "use strict";

    // initialize geneset button
    // as hidden, and with JQuery UI style
    $('#toggle_geneset_dialog').hide();
    $('#toggle_geneset_dialog').button();

    // set up modal dialog box for geneset table (step 3)
    $('#geneset_dialog').dialog({autoOpen: false,
        resizable: false,
        modal: true,
        minHeight: 315,
        minWidth: 636
        });

    // set listener for geneset select button
    $('#select_geneset').click(function() {
        $('#geneset_dialog').dialog('close');
    });

    // set listener for geneset cancel button
    $('#cancel_geneset').click(function() {

        // close dialog box
        $('#geneset_dialog').dialog('close');

    });

    // initialise tree
    initialize_geneset_jstree();
    
    // bind UI for geneset table -> gene list
    $('#select_geneset').click(updateGenesetList);    
};

var initialize_geneset_jstree = function (data) {
	var data = [
	  		{
			    "id": "Custom Gene sets",
			    "genesets": [
			 		 {"genesetId": "UNITTEST_GENESET1", 
			 		  "name": "UNITTEST_GENESET1",
			 		  "description": "description of UNITTEST_GENESET1",
					  "refLink": "http://www.broadinstitute.org/gsea/msigdb/cards/GLI1_UP.V1_DN",
			 		  "representativeScore": 0.08,
			 		  "nrGenes": 2
			 		 }
			 		],
			   "parent": null,
			  },
			  {
			    "id": "Different Gene sets from Random Institute",
			    "genesets": [
			 		 {"genesetId": "UNITTEST_GENESET2", 
			 		  "name": "UNITTEST_GENESET2",
					  "description": "description of UNITTEST_GENESET2",
					  "refLink": "http://www.broadinstitute.org/gsea/msigdb/cards/GLI1_UP.V1_DN",
			 		  "representativeScore": 0.83,
			 		  "nrGenes": 5
			 		 },
			 		 {"genesetId": "UNITTEST_GENESET3", 
			 		  "name": "UNITTEST_GENESET3",
					  "description": "description of UNITTEST_GENESET3",
					  "refLink": "http://www.broadinstitute.org/gsea/msigdb/cards/GLI1_UP.V1_DN",
			 		  "representativeScore": -0.548,
			 		  "nrGenes": 180
			 		 }
					],
			   "parent": null,
			  },
			  {
			    "id": "Institutes Subcategory 1",
			    "genesets": [
			 		 {"genesetId": "UNITTEST_GENESET4", 
			 		  "name": "UNITTEST_GENESET4",
					  "description": "description of UNITTEST_GENESET4",
					  "refLink": "http://www.broadinstitute.org/gsea/msigdb/cards/GLI1_UP.V1_DN",
			 		  "representativeScore": 0.82,
			 		  "nrGenes": 6
			 		 }
					],
			   "parent": "Different Gene sets from Random Institute"
			  },
			  {
			    "id": "Institutes Subcategory 2",
			    "genesets": [
			 		 {"genesetId": "UNITTEST_GENESET1", 
			 		  "name": "UNITTEST_GENESET1",
					  "description": "description of UNITTEST_GENESET1",
					  "refLink": "http://www.broadinstitute.org/gsea/msigdb/cards/GLI1_UP.V1_DN",
			 		  "representativeScore": 0.23,
			 		  "nrGenes": 2
			 		 },
			 		 {"genesetId": "UNITTEST_GENESET8", 
			 		  "name": "UNITTEST_GENESET8",
					  "description": "description of UNITTEST_GENESET8",
					  "refLink": "http://www.broadinstitute.org/gsea/msigdb/cards/GLI1_UP.V1_DN",
			 		  "representativeScore": 0.72,
			 		  "nrGenes": 2000
			 		 },
			 		 {"genesetId": "UNITTEST_GENESET10", 
			 		  "name": "UNITTEST_GENESET10",
					  "description": "description of UNITTEST_GENESET10",
					  "refLink": "http://www.broadinstitute.org/gsea/msigdb/cards/GLI1_UP.V1_DN",
			 		  "representativeScore": 0.67,
			 		  "nrGenes": 12
			 		 }
					],
			   "parent": "Different Gene sets from Random Institute"
			  }
			];
	
	// Loop over JSON file to make it flat to input it in jsTree
	var flatData = [];
	
	// Leafs can be non-unique, therefor a unique ID is necessary,
	// because selecting a duplicate leaf results in a visualization issue.
	var leafId = 0;

	for (var i = 0; i < data.length; i++ ) {		
		// First read in the node
		nodeId = data[i].id;
		nodeName = data[i].id;
		nodeParent = data[i].parent;
		
		if (nodeParent == null) {
			nodeParent = "#";
		}
		flatData.push({
			id : nodeId.toString(),
			parent : nodeParent,
			text : nodeName,
			name : nodeName,
			geneset : false,
			state : {
				opened : true,
				selected : false,
			}
		});
		
		// Second read in the genesets in the node
		for (var j = 0; j < data[i].genesets.length; j++ ) {
			genesetId = leafId ++;
			genesetName = data[i].genesets[j].genesetId;
			genesetDescription = data[i].genesets[j].description;
			genesetRepresentativeScore = data[i].genesets[j].representativeScore;
			genesetReflink = data[i].genesets[j].reflink;
			genesetNrGenes = data[i].genesets[j].nrGenes;

			var genePlurality;
			var genesetNameText;
			
			// Decide if it tree description show geneset or genesets
			if (genesetNrGenes == 1) {
				genePlurality = 'gene';
			} else if (genesetNrGenes > 1) {
				genePlurality = 'genes';
			} else {
				genePlurality = '';
				genesetNrGenes = '';
			}
			
			// Add nr of genes to leaf
			genesetNameText = genesetNrGenes + ' ' + genePlurality;
			
			// Add score to leaf
			if (genesetRepresentativeScore != null) {
				genesetNameText = genesetNameText + ', ' +  genesetRepresentativeScore + ' representative GSVA score';
			}

			// Build label and add styling
			genesetNameText = genesetName + '<span style="font-weight:normal;font-style:italic;"> ' + genesetNameText + '</span>';
			
			flatData.push({
				// Add compulsary characteristics
				id : genesetId.toString(),
				parent : nodeId,
				text: genesetNameText, 
				state : {
					selected : false
				},
			
				// Also add data which might be useful later
				name: genesetName,
				description : genesetDescription,
				representativeScore : genesetRepresentativeScore,
				reflink : genesetReflink,
				geneset : true,
				
			});
		}
	}


	$('#jstree_genesets').jstree({
		"plugins": ['checkbox', 'search'],
		"checkbox": {},
		"core" : {
			"data" : flatData,
			"themes": {
				"icons":false
			} 
		}
	});
	$('#jstree_genesets').jstree(true).open_all();
}	


// Displays the modal dialog for the geneset table
var promptGenesetTable = function() {
    "use strict";

    // grab data to be sent to the server
    var cancerStudyId = $('#select_single_study').val();

    // open the dialog box
    $('#geneset_dialog').dialog('open');

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
    $('#geneset_dialog').children().show();
    $('#geneset_dialog #loader-img').hide();

    return;
};


// updates the gene_list based on what happens in the Geneset table.
// geneset table (within geneset dialog box) -> gene list
var updateGenesetList = function() {
    "use strict";

    // push all the genes in the gene_list onto a list
    var genesetList = $('#geneset_list').val();

    // placeholder gene sets, necessary until the real selection method is implemented
    //var selectedGenesets = ["MORF_ATRX", "MORF_ATOX1"];
    
    // Create list of objects with selected gene sets
    var selectedGenesets = [];
	var selectedBoxes = $('#jstree_genesets').jstree("get_selected", true);
	for (var i = 0; i < selectedBoxes.length; i++ ){
		
		// Check if selected box is not a node
		if (selectedBoxes[i].original.geneset) {
			var boxName = selectedBoxes[i].original.name;
			
			// Select a geneset only once
			if (selectedGenesets.indexOf(boxName) == -1) {
				selectedGenesets.push(boxName);
			}
		}
	}
	

    // if gene_list is currently empty put all the checked geneset genes into it.
    if (genesetList === "") {
        genesetList = [];
        $.each(selectedGenesets, function(index, value) {     // don't select the Select All checkbox
            genesetList.push(value);
        });
        genesetList = genesetList.join(" ");
    }

    else {
        // look for the selected genesets in gene_list
        // if they're not there, append them
        $.each(selectedGenesets, function(index, value) {
            var checked = value;

            if ( genesetList.search(new RegExp(checked, "i")) === -1 ) {
                genesetList = $.trim(genesetList);
                checked = " " + checked;
                genesetList += checked;
            }
        });
    }

    $('#geneset_list').val(genesetList);

    // remove spaces in gene_list
    genesetList = $.trim(genesetList);
    genesetList = genesetList.replace(/\s{2,}/, "");            // delete 2 or more spaces in a row
};


// todo: refactor this and put it in with other init functions in step3.json
$(document).ready( function () {
    "use strict";
    initGenesetDialogue();
});
