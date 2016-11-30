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
// Oleguer Plantalech and Sander Tan, The Hyve
// December 2016


// variable for the return DOM object returned by dataTable library
//var DATATABLE_FORMATTED = -1;

// what is the previous cancer study that has been selected?
// this way we don't have to repeat queries
var CANCER_STUDY_SELECTED = -1;

// todo: factor out #gsva_dialog

// initialize and bind for
// gsva toggle button and gsva dialog box
var initGsvaDialogue = function() {
    "use strict";

    // initialize gsva button
    // as hidden, and with JQuery UI style
    $('#toggle_gsva_dialog').hide();
    $('#toggle_gsva_dialog').button();

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

        // clear all checks
//        $('.Gsva :checkbox').attr('checked', false);
    });

    // bind UI for gsva table -> gene list
    $('#select_gsva').click(updateGeneSetList);

    // bind UI for gene list -> gsva table
//    $('#gene_list').change( function() {
//        if ($('gsva_dialog').dialog('isOpen')) {
//            updateGsvaTable();
//        }
//    });

};


//todo: rewrite this function. it is unnecessarily complex
//var gsva_to_tr = function(gsva) {
//    "use strict";
//    var click_append = $('<input>');
//    var tr = $('<tr>');
//    var td = $('<td>');
//
//    click_append.attr('type', 'checkbox');
//    click_append.attr('value', gsva.gene_symbol);
//
//
//    td.append(gsva.gene_symbol);
//    tr.append(td);
//
//    td = $('<td>');
//    td.append(gsva.num_muts);
//    tr.append(td);
//
//    td = $('<td>');
//    td.append(gsva.qval);
//    tr.append(td);
//
//    tr.append($('<td>').append(click_append));
//
//    return tr;
//};

// Displays the modal dialog for the gsva table
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

    // reset the gsva table if it has already been formatted
//    if (DATATABLE_FORMATTED !== -1) {
//
//        // remove dataTables formatting
//        DATATABLE_FORMATTED.fnDestroy();
//
//        // delete all elements
//        $('.Gsva tbody').empty();
//    }
//        $('#gsva_dialog').children().hide();
//        $('#gsva_dialog #loader-img').show();

//    // do AJAX
//    $.get('Gsva.json', data, function(gsvas) {
//        var i;
//        var len = gsvas.length;
//
//        // hide everything but the loader image
//        // this is here because of the *A* in AJAX
//        $('#gsva_dialog').children().hide();
//        $('#gsva_dialog #loader-img').show();
//
//        // append Gsva data to table
//        for (i = 0; i < len; i += 1) {
//            $('.Gsva tbody').append(gsva_to_tr(gsvas[i]));
//        }
//
//        // show everything but the loader image
//        $('#gsva_dialog').children().show();
//        $('#gsva_dialog #loader-img').hide();
//
//        // use dataTable jQuery plugin
//        // to style and add nice functionalities
//        DATATABLE_FORMATTED = $('.Gsva').dataTable( {
//            "sScrollY": "200px",
//            "bJQueryUI": true,
//            "aaSorting": [],
//            "bAuthWidth": false,
//            "aoColumns": [
//                null,
//                null,
//                { "sType" : "numeric"},
//                { "bSortable" : false, "sWidth": "5%" }
//            ],
//            "bPaginate": false,
//            "bFilter": false,
//            "iDisplayLength": 5,
//            "bRetrieve": true,
//            "bDestroy": true
//        } );
//
//        // force columns to align correctly
//        DATATABLE_FORMATTED.fnDraw();
//        DATATABLE_FORMATTED.fnDraw();
//
//        // bind UI for gene list -> gsva table
//        updateGsvaTable();
//
//        // create bindings for checkall gsva UI
//        checkallGsva();
//    });
//
    // show everything but loader image
    $('#gsva_dialog').children().show();
    $('#gsva_dialog #loader-img').hide();

    return;
};

// binds UI for checkall gsva checkbox
//var checkallGsva = function() {
//    // make checkall check all
//    $('#gsva_dialog .checkall').click(function() {
//        $(this).parents().find('.Gsva input').attr('checked', this.checked);
//    });
//
//    // checkall is checked iff. all gsvas are checked
//    $('.Gsva :not(.checkall):checkbox').click(function() {
//        // if a box is unchecked (namely *this* box)
//        // the checkall is unchecked
//        if (!this.checked) {
//            $('.Gsva .checkall').attr('checked', false);
//            return;
//        }
//        // check if the number of unchecked boxes equals 0
//        // if so, checkall should be checked
//        if ($('.Gsva input:not(.checkall):not(:checked)').length === 0) {
//            $('.Gsva .checkall').attr('checked', true);
//        }
//    });
//}

// updates the gene_list based on what happens in the Gsva table.
// gsva table (within gsva dialog box) -> gene list
var updateGeneSetList = function() {
    "use strict";

    // push all the genes in the gene_list onto a list
    var geneset_list = $('#geneset_list').val();

    // placeholder gene sets, necessary until the real selection method is implemented
    var example_gene_sets = ["AKT_UP.V1_DN", "CYCLIN_D1_KE_.V1_UP", "HINATA_NFKB_MATRIX"];

    // if gene_list is currently empty put all the checked gsva genes into it.
    if (geneset_list === "") {

        geneset_list = [];
//        $('.Gsva :not(.checkall):checked').map(function() {     // don't select the Select All checkbox
        $.each(example_gene_sets, function(index, value) {     // don't select the Select All checkbox
            geneset_list.push(value);
        });
        geneset_list = geneset_list.join(" ");
    }

    else {
        // look for the selected gsvas in gene_list
        // if they're not there, append them
//        $('.Gsva :not(.checkall):checked').each(function() {
        $.each(example_gene_sets, function(index, value) {
            var checked = value;

            if ( geneset_list.search(new RegExp(checked, "i")) === -1 ) {
                geneset_list = $.trim(geneset_list);
                checked = " " + checked;
                geneset_list += checked;
            }
        });
//        // look for the unselected gsvas in the gene_list
//        // if they're there, delete them
//        // you should be forced to know that your gene is recurrently mutated
//        $('.Gsva input:not(.checkall):not(:checked)').each(function() {
//            var unchecked = $(this).val();
//            if ( gene_list.search(new RegExp(unchecked, "i")) !== -1) {
//
//                // likely to be Onco Query
//                // delete the entire OncoQuery statement associated with an unselected gene
//                if (gene_list.search(':') !== -1) {
//                    var unchecked_regexp = new RegExp(new RegExp(unchecked).source + /\s*:\s*.*(\;|\n)/.source, "ig");
//                    console.log(unchecked_regexp);
//                    gene_list = gene_list.replace(unchecked_regexp, "");
//                }
//
//                // still want to remove the gene even if it is not part of a (nontrivial) onco query statement
//                var unchecked_regexp = new RegExp(new RegExp(unchecked).source + /\s?/.source, "ig");    // regexp of unchecked + \s
//                gene_list = gene_list.replace(unchecked_regexp, "");
//            }
//        });
    }

    $('#geneset_list').val(geneset_list);

    // remove spaces in gene_list
    geneset_list = $.trim(geneset_list);
    geneset_list = geneset_list.replace(/\s{2,}/, "");            // delete 2 or more spaces in a row
};

// updates the Gsva table based on what happens in the gene_list
// namely, a user's deletions or additions of genes
// gene_list -> Gsva table
//var updateGsvaTable = function() {
//    var gene_list = $('#gene_list').val();
//
//    // don't want to even look at Onco Queries like these,
//    gene_list = gene_list.replace(/DATATYPES.*(;|\n)\s?/g, "");
//
//    // likely to be Onco Query
//    if (gene_list.search(/:/) !== -1) {
//        var commands = gene_list.split("\n"),
//            commands_len = commands.length,
//            genes = [],
//            i;
//
//        for (i = 0; i < commands_len; i += 1) {
//            _commands = commands[i].split(";");
//
//            var _commands_len = _commands.length, j;
//            for (j = 0; j < _commands_len; j += 1) {
//                genes.push(_commands[j]
//                        .replace(/:.*/g, ""));
//            }
//        }
//        gene_list = genes;
//    }
//
//    else {
//        // split on " " and "\n"
//        gene_list = gene_list.split(" ").map(function(i) { return i.split("\n"); });
//        // flatten the list of lists
//        gene_list = gene_list.reduce(function(x,y) { return x.concat(y); });
//    }
//
//    // clear all checks
//    $('#gsva_dialog .Gsva :checkbox').attr('checked', false);
//
//    // if genes in the gene_list are added
//    // check them in the gsva table
//    var i,
//        gene_list_len = gene_list.length;
//    for (i = 0; i < gene_list_len; i += 1) {
//        // select gsva checkboxes that are in the gene list
//        $('#gsva_dialog .Gsva :checkbox[value=' +  gene_list[i].toUpperCase() + ']').
//            attr('checked', true);
//    }
//}

// todo: refactor this and put it in with other init functions in step3.json
$(document).ready( function () {
    "use strict";
    initGsvaDialogue();
});
