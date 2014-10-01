// Create Constants
var PROFILE_MUTATION = "PROFILE_MUTATION";
var PROFILE_MUTATION_EXTENDED = "PROFILE_MUTATION_EXTENDED";
var PROFILE_COPY_NUMBER_ALTERATION = "PROFILE_COPY_NUMBER_ALTERATION"
var PROFILE_MRNA_EXPRESSION = "PROFILE_MRNA_EXPRESSION";
var PROFILE_PROTEIN = "PROFILE_PROTEIN";
var PROFILE_RPPA = "PROFILE_RPPA";
var PROFILE_METHYLATION = "PROFILE_METHYLATION"

$(document).ready(function() {
    // Load portal metadata
    getJSONFade("portal_meta_data.json?partial_studies=true&partial_genesets=true", function(json) {
        window.metaDataJson = json;
        updateCancerStudySelector();
        updateGeneSetSelector();
    });
    $("#cancer_study_id_sel").change(function() {
        cancerStudySelected();
    });
    $("#gene_set_choice_sel").change(function() {
        geneSetSelected();
    });
    $("#case_set_id_sel").change(function() {
        caseSetSelected();
    });
});

// --- FUNCTIONS FOR STYLE/ANIMATION --- //
function getJSONFade(url, fun) {
    //wrapper for getJSON that does fading animation automatically
    $("#main_query_form").stop().fadeTo("fast",0.3);
    $.getJSON(url, function(json) {
        fun(json);
        $("#main_query_form").stop().fadeTo("fast",1);
    });
}

// --- FUNCTIONS THAT LOAD DATA --- // 
function cancerStudySelected() {
    var study = $("#cancer_study_id_sel").val();
    
    // hide/show appropriately
    if(study === "all") {
        $("#main_query_form #step2").hide();
        $("#main_query_form #step3").hide();
        $("#main_query_form #step2cross").show();
    } else {
        $("#main_query_form #step2").show();
        $("#main_query_form #step3").show();
        $("#main_query_form #step2cross").hide();
    }
    
    if(window.metaDataJson.cancer_studies[study].partial === "true") {
        getJSONFade("portal_meta_data.json?study_id="+study, function(json) {
            window.metaDataJson.cancer_studies[study] = json;
            updateCancerStudyInfo();
        });
    } else {
        updateCancerStudyInfo();
    }
}

function geneSetSelected() {
    var geneset = $("#gene_set_choice_sel").val();
    if(window.metaDataJson.gene_sets[geneset].gene_list === "" && geneset !== "user-defined-list") {
        getJSONFade("portal_meta_data.json?geneset_id="+geneset.replace(/\//g,""), function(json) {
            window.metaDataJson.gene_sets[geneset].gene_list = json.list;
            updateGeneSetInfo();
        });
    } else {
        updateGeneSetInfo();
    }
}

function caseSetSelected() {
    var caseset = $("#case_set_id_sel").val();
    if (caseset === "-1") {
        // user-defined
        $("#main_query_form #step3 #custom_case_list_section").show();
    } else {
        $("#main_query_form #step3 #custom_case_list_section").hide();
    }
}
// --- FUNCTIONS THAT UPDATE THE FORM --- //
function updateCancerStudySelector() {
    // First, add study groups, sorted in order except dmp is at top
    // 1) Sort
    var orderedTypes = [];
    $.each(window.metaDataJson.type_of_cancers, function(k,v) {
        orderedTypes.push({key:k, name:v});
    });
    orderedTypes.sort(function(x,y) {
        // dmp must be at the top!
        if (x.key === "dmp") {
            return Number.NEGATIVE_INFINITY;
        } else if (y.key === "dmp") {
            return Number.POSITIVE_INFINITY;
        } else {
            return x.name.localeCompare(y.name);
        }
    });
    // 2) Add
    $.each(orderedTypes, function(index, object) {
        $("#cancer_study_id_sel").append("<optgroup id='"+object.key+"-study-group' label='"+object.name+"'></optgroup>");
    });
    // Next, add cancer studies to the appropriate groups
    $.each(window.metaDataJson.cancer_studies, function(key, study) {
        // TODO: Skip over 'All' if we're in download tab
        var toAdd = $("<option value='"+key+"'>"+study.name+"</option>");
        if (key === "all") {
            $("#cancer_study_id_sel").prepend(toAdd);
        } else {
            var optGrpKey = study.type_of_cancer;
            //hack for dmp
            if (key.indexOf("_dmp_")>=0) {
                optGrpKey = "dmp";
            }
            $("#cancer_study_id_sel #"+optGrpKey+"-study-group").append(toAdd);
        }
    });
    // Take out option groups without children
    $("#cancer_study_id_sel optgroup:empty").remove();
    
    // Trigger selection
    $("#cancer_study_id_sel").change();
}

function updateGeneSetSelector() {
    var sel = $("#gene_set_choice_sel");
    $.each(window.metaDataJson.gene_sets, function(key, geneset) {
        var toAdd = $("<option value='"+key+"'>"+geneset.name+"</option>");
        if (key === "user-defined-list") {
            sel.prepend(toAdd);
        } else {
            sel.append(toAdd);
        }   
    });
    // Trigger selection
    sel.change();
}

function updateCancerStudyInfo() {
    // study summary, genomic profiles, case sets, gene set buttons, form action
    // Study summary
    var study = $("#cancer_study_id_sel").val();
    if(study === "all") {
        $("#main_query_form #step1 #cancer_study_description,#step1 #cancer_study_summary_btn").hide();
    } else { 
        $("#main_query_form #step1 #cancer_study_description,#step1 #cancer_study_summary_btn").show();
        $("#main_query_form #step1 #cancer_study_description").html(window.metaDataJson.cancer_studies[study].description);
        $("#main_query_form #step1 #cancer_study_summary_btn").attr("onclick","window.location.replace('/study.do?cancer_study_id="+study+"')");
    }
    // Genomic Profiles
    if (study !== "all") {
        updateGenomicProfileBtns();
    }
    // Case Sets
    updateCaseSetInfo();
    // Gene Set Buttons
    if (window.metaDataJson.cancer_studies[study].has_mutsig_data) {
        $("#main_query_form #step4 #gene_set_mutsig_btn").show();
    } else {
        $("#main_query_form #step4 #gene_set_mutsig_btn").hide();
    }
    if (window.metaDataJson.cancer_studies[study].has_gistic_data) {
        $("#main_query_form #step4 #gene_set_gistic_btn").show();
    } else {
        $("#main_query_form #step4 #gene_set_gistic_btn").hide();
    }
    // Form action
    /*if (study === "all") {
        $("#main_query_form").attr("action","cross_cancer.do");
    } else {
        $("#main_query_form").attr("action","index.do");
    }*/
    $("#main_submit_btn").attr("type","button");
    $("#main_submit_btn").attr("onclick","submitMainQueryForm()");
}

function updateGenomicProfileBtns() {
    var btnSection = $("#main_query_form #step2btns");
    // Clear existing options
    btnSection.empty();
    
    var analysisTab = true; // TODO
    var alterationTypes = ["MUTATION","MUTATION_EXTENDED","COPY_NUMBER_ALTERATION",
                           "PROTEIN_LEVEL", "MRNA_EXPRESSION", "METHYLATION",
                           "METHYLATION_BINARY", "PROTEIN_ARRAY_PROTEIN_LEVEL"];
    var classByAltType = [PROFILE_MUTATION, PROFILE_MUTATION_EXTENDED, PROFILE_COPY_NUMBER_ALTERATION,
                          PROFILE_PROTEIN, PROFILE_MRNA_EXPRESSION, PROFILE_METHYLATION, PROFILE_METHYLATION,
                           PROFILE_RPPA];
    var titleByAltType = ["Mutation","Mutation","Copy Number","Protein Level","mRNA Expression","DNA Methylation",
                           "DNA Methylation", "Protein/phosphoprotein level (by RPPA)"];
    var genomicProfiles = window.metaDataJson.cancer_studies[$("#cancer_study_id_sel").val()].genomic_profiles;
    var profilesByAltType = [];
    // Put genomic profiles into buckets
    for (var i=0; i<alterationTypes.length; i++) {
        profilesByAltType.push([]);
    }
    $.each(genomicProfiles, function(index, obj) {
        if (!analysisTab || obj.show_in_analysis_tab) {
            profilesByAltType[alterationTypes.indexOf(obj.alteration_type)].push(obj);
        }
    });
    // For each bucket, either put in a checkbox or a checkbox-radio group
    for (var i=0; i<profilesByAltType.length; i++) {
        var grp = profilesByAltType[i];
        if (grp.length === 0) {
            continue;
        }
        var targetClass = classByAltType[alterationTypes.indexOf(grp[0].alteration_type)];
        if (grp.length === 1) {
            btnSection.append(genomicProfileBtn("checkbox", grp[0], targetClass));
        } else if (grp.length > 1) {
            // TODO: checkbox-radio group interaction behavior
            btnSection.append("<input type='checkbox' class='" + targetClass + "'>"
                            + titleByAltType[alterationTypes.indexOf(grp[0].alteration_type)]
                            + " data. Select one of the profiles below:");
            btnSection.append("<br/>");
            for (var j=0; j<grp.length; j++) {
                btnSection.append("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
                btnSection.append(genomicProfileBtn("radio", grp[j], targetClass));
            }
        }
        if (targetClass === PROFILE_MRNA_EXPRESSION && analysisTab) {
            btnSection.append("<div id='z_score_threshold' class='score_threshold'>"
                            + "Enter a z-score threshold &#177: "
                            + "<input type='text' name='Z_SCORE_THRESHOLD' size='6'>"
                            + "</div>");
        }
        if (targetClass === PROFILE_RPPA && analysisTab) {
            btnSection.append("<div id='rppa_score_threshold' class='score_threshold'>"
                            + "Enter a RPPA z-score threshold &#177: "
                            + "<input type='text' name='RPPA_SCORE_THRESHOLD' size='6' >"
                            + "</div>");
        }
    }
    // TODO: download tab -> all radio buttons
    
    // If none available, set message and disable submit button
    if ($("#step2btns").is(":empty")) {
        // TODO: set message and disable submit button
    }
}

function genomicProfileBtn(btnType, profile, targetClass) {
    var paramName = "genetic_profile_ids";
    var analysisTab = true;//TODO
    if (analysisTab) {
        paramName += "_"+targetClass;
    }
    // TODO: tooltips
    var ret = "<input type='"+btnType+"' id='"+profile.id+"' name='"+paramName
            + "' class='"+targetClass+"' value='"+profile.id+"'>" + profile.name
            + "</input>  <img class='profile_help' src='images/help.png' title='"
            + profile.description + "'><br/>";
    return ret;
}

function updateGeneSetInfo() {
    var geneset = $("#gene_set_choice_sel").val();
    $("#main_query_form #step4 #oql_query_txt").val(window.metaDataJson.gene_sets[geneset].gene_list);
}

function updateCaseSetInfo() {
    //TODO (though probably not here): default case list
    // clear
    var study = window.metaDataJson.cancer_studies[$("#cancer_study_id_sel").val()];
    var selector = $("#case_set_id_sel");
    selector.empty();
    $.each(study.case_sets, function(ind, case_set) {
        selector.append("<option class='case_set_option' value='"
                                    + case_set.id +"' title='" + case_set.description
                                    + "'>" + case_set.name + " ("+ case_set.size +") </option>");
    });
    selector.append("<option class='case_set_option' value='-1' title='Specify your own case list'>"
                    + "User-defined Case List</option>");
    // check if cancer study has a clinical_free_form data to filter,
    // if there is data to filter, then enable "build custom case set" link,
    // otherwise disable the button
     $("#main_query_form").stop().fadeTo("fast",0.3);
    $.getJSON("ClinicalFreeForm.json", {studyId: $("#cancer_study_id_sel").val()},
                function(json) {
                    var dataToFilter = false;
                    if (json.freeFormData.length !== 0) {
                        var categorySet = json.categoryMap;
                        for (var category in categorySet) {
                            if (isEligibleForFiltering(categorySet[category])) {
                                dataToFilter = true;
                                break;
                            }
                        }
                    }
                    if (!dataToFilter) {
                        // no clinical_free_form data to filter for the current
                        // cancer study, so disable the button
                        $("#build_case_set_btn").hide();
                    } else {
                        $("#build_case_set_btn").show();
                    }
                    $("#main_query_form").stop().fadeTo("fast",1);
                }
            );
            
    // trigger
    $("#case_set_id_sel").change();
}

// DURING- and POST SUBMISSION

function submitMainQueryForm() {
    var profile_ids = [];
    $.each($("#step2 #step2btns :checked"), function(ind, obj) {
        if($(obj).is("[value]")) {
            // if it's not a "group checkbox"
            profile_ids.push($(obj).val());
        }
    });
    loadGeneticProfileData(profile_ids);
}

function loadGeneticProfileData(profile_ids) {
    // VERY SENSITIVE TO FORMAT OF RESPONSE!!!! NOT IN ANY WAY ROBUST TO CHANGES
    // isolate gene ids
    var geneList = oql.getGeneList($("#oql_query_txt").val());
    
    var typeCode = {"MUTATION_EXTENDED":"MUT", "COPY_NUMBER_ALTERATION":"CNA", "MRNA_EXPRESSION":"EXP", "PROTEIN_ARRAY_PROTEIN_LEVEL":"PROT"};
    var cnaEventCode = {"-2":"HOMDEL","-1":"HETLOSS","1":"GAIN","2":"AMP"};
    var dataPts = []; // data of form {sample: 'S1', gene: 'BRAF', genotype: {type:'MUT', data: 'V600E'}}
    
    $("#main_query_form").fadeTo("fast",0.3);
    var toLoad = profile_ids.length;
    $.each(profile_ids, function(index, id) {
        var profile;
        $.each(window.metaDataJson.cancer_studies[$("#cancer_study_id_sel").val()].genomic_profiles, function(ind, obj){
            if (obj.id === id) {
                profile = obj;
                return false; // break
            }
        });
        
        var type = typeCode[profile.alteration_type];
        $.get("/webservice.do?cmd=getProfileData&case_set_id="+$("#case_set_id_sel").val()+"&genetic_profile_id="+id+"&gene_list="+geneList.join(","),
                function(data) {
                    var rows = data.split('\n');
                    rows = $.map(rows, function(x,i) { return $.trim(x); });
                    var samples = rows[2].split(/\s/); // samples start at element index 2
                    for (var i=3; i<rows.length; i++) {
                        if (rows[i][0] === '#') {
                            continue;
                        }
                        var splitRow = rows[i].split(/\s/);
                        var geneName = splitRow[1];
                        for (var j=2; j<splitRow.length; j++) {
                            if(type === "MUT") {
                                if(splitRow[j] === "NaN" || splitRow[j]==="") {
                                    continue;
                                } else {
                                    var mutations = splitRow[j].split(',');
                                    for (var h=0; h<mutations.length; h++) {
                                        dataPts.push({sample:samples[j], gene:geneName, genotype:{type:"MUT", data:mutations[h], class:"PLACEHOLDER"}});
                                    }
                                }
                            } else if (type === "CNA") {
                                if(splitRow[j] === "NaN" || splitRow[j] === "" || splitRow[j] === "0") {
                                    continue;
                                } else {
                                    var event = cnaEventCode[splitRow[j]];
                                    dataPts.push({sample:samples[j], gene:geneName, genotype:{type:"CNA", data:event}});
                                }
                            } else if (type == "EXP") {
                                if(splitRow[j] === "NaN" || splitRow[j] === "") {
                                    continue;
                                } else {
                                    dataPts.push({sample:samples[j], gene:geneName, genotype:{type:"EXP", data:splitRow[j]}});
                                }
                            } else if (type == "PROT") {
                                if(splitRow[j] === "NaN" || splitRow[j] === "") {
                                    continue;
                                } else {
                                    dataPts.push({sample:samples[j], gene:geneName, genotype:{type:"PROT", data:splitRow[j]}});
                                }
                            }
                        }
                    }
                }).always(function() { toLoad -= 1; if (toLoad <= 0) { displayGeneticProfileData(compileSamples(dataPts)); } });
            });
    return dataPts;
}

function compileSamples(data) {
    // IN: List of data of the form {sample: 'S1', gene: 'BRAF', genotype: {type:'MUT', data: 'V600E'}}
    // OUT: Dict of data of the form 'S1':{'BRAF':<dict>} where 
    // <dict>={'AMP':<1 or 0>, 'HOMDEL':<1 or 0>, 'GAIN':<1 or 0>, 'HETLOSS':<1 or 0>, 'MUT':[...], 'EXP':<float>, 'PROT':<float>}
    var samples = {};
    for (var i=0; i<data.length; i++) {
        var datum = data[i];
        if (!(datum.sample in samples)) {
            samples[datum.sample] = {};
        }
        if (!(datum.gene in samples[datum.sample])) {
            samples[datum.sample][datum.gene] = {};
            samples[datum.sample][datum.gene] = {};
            samples[datum.sample][datum.gene]["AMP"] = 0;
            samples[datum.sample][datum.gene]["HOMDEL"] = 0;
            samples[datum.sample][datum.gene]["GAIN"] = 0;
            samples[datum.sample][datum.gene]["HETLOSS"] = 0;
            samples[datum.sample][datum.gene]["EXP"] = false;
            samples[datum.sample][datum.gene]["PROT"] = false;
            samples[datum.sample][datum.gene]["MUT"] = [];
        }
        if (datum.genotype.type === "CNA") {
            samples[datum.sample][datum.gene][datum.genotype.data] = 1;
        } else if (datum.genotype.type === "EXP" || datum.genotype.type === "PROT") {
            samples[datum.sample][datum.gene][datum.genotype.type] = parseFloat(datum.genotype.data);
        } else if (datum.genotype.type === "MUT") {
            samples[datum.sample][datum.gene]["MUT"].push({"name":datum.genotype.data, "class":datum.genotype.class});
        }
    }
    return samples;
}
function insertDefaults(query) {
    // insert defaults into empty gene statements
    
}
function displayGeneticProfileData(samples) {
    //IN: Compiled samples (output of compileSamples)
    var filteredData = oql.filter(oql.parseQuery($("#oql_query_txt").val()).return, samples);
    var filteredSamples = {};
    for (var i=0; i<filteredData.length; i++) {
        filteredSamples[filteredData[i]] = samples[filteredData[i]];
    }
    $("#main_query_form").stop().fadeTo("fast",1);
    $("#json_display").fadeOut("fast", function(){
        $("#json_display").html(jsonToHTML(filteredSamples));
        $("#json_display").fadeIn("fast");
    });
}

function jsonToHTML(json) {
  // source: http://www.ist.rit.edu/~jxs/services/JSON/ (processJSONData)
  var ret = "";
  var data = json;
  var thisList = document.createElement( "ul" );
  for( var key in data ) {
    if( data[ key ] != null ) {
      var thisItem = document.createElement( "li");
      var thisType = typeof data[ key ];
      if( thisType == "object" ) {
        thisItem.appendChild( document.createTextNode( key ) );
        thisItem.appendChild( jsonToHTML( data[ key ] ) );
      }
      else {
        thisItem.appendChild( document.createTextNode( key + " : " + data[ key ] + " [" + thisType + "]" ) );
      }
      thisList.appendChild( thisItem );
    }
  }
  return thisList;
}