$(document).ready(function () {
    // Put on loading appearance and get portal metadata
    $("#query-form").fadeTo("fast", 0.3);
    $.getJSON("/portal_meta_data.json?partial_studies=true&partial_genesets=true", function (json) {
        window.metadata = json;
        $("#cancer-study-select").change(function () {
            var studyId = $("#cancer-study-select").val();
            if (window.metadata.cancer_studies[studyId].partial) {
                $.getJSON("/portal_meta_data.json?study_id=" + studyId, function (json) {
                    window.metadata.cancer_studies[studyId] = json;
                    cancerStudySelected();
                });
            } else {
                cancerStudySelected();
            }
        });
        populateAndUpdateQueryForm();
        $("#query-form").stop().fadeTo("fast", 1);
        $(document).tooltip();

    });
    $.getJSON("/portal_meta_data.json", function (json) {
        window.fullMetaData = json;
    });
});

function populateAndUpdateQueryForm() {
    $("#query-form").fadeTo("fast", 0.3);
    $("#cancer-study-select").empty();
    for (var id in window.metadata.cancer_studies) {
        $("#cancer-study-select").append('<option value="' + id + '">' + window.metadata.cancer_studies[id].name + '</option>');
    }
    $("#cancer-study-select").trigger("change");
    $("#query-form").stop().fadeTo("fast", 1);
}


function cancerStudySelected() {
    if ($("#cancer-study-select").val() == "all") {
        $("#data-type-priority-grp").show();
    } else {
        $("#data-type-priority-grp").hide();
    }
    updateCancerStudySummary();
    populateGenomicProfiles();
}

function updateCancerStudySummary() {
    var study = window.metadata.cancer_studies[$("#cancer-study-select").val()];
    var newSummaryHTML = study.description;
    newSummaryHTML += '&nbsp;&nbsp;<button type="button" onclick="window.location.replace(\'study.do?cancer_study_id=' + $("#cancer-study-select").val() + '\')">Study summary</button>';
    $("#cancer-study-summary").html(newSummaryHTML);
}

function populateGenomicProfiles() {
    //populate genomic profiles section
    $("#genomic-profiles-select").empty();
    //sort profiles
    var altTypes = ["MUTATION", "MUTATION_EXTENDED", "COPY_NUMBER_ALTERATION", "PROTEIN_LEVEL",
        "MRNA_EXPRESSION", "METHYLATION", "METHYLATION_BINARY", "PROTEIN_ARRAY_PROTEIN_LEVEL"];
    var altNames = ["Mutation", "Mutation", "Copy Number", "Protein Level",
        "mRNA Expression", "DNA Methylation", "DNA Methylation", "Protein/phosphoprotein level (by RPPA)"];
    var profiles = window.metadata.cancer_studies[$("#cancer-study-select").val()].genomic_profiles;

    var analysisTab = $("ul#query-page-tabs .active a").attr("href") === "#analysis-tab";
    var altGroups = [];
    for (var i = 0; i < altTypes.length; i++) {
        altGroups.push([]);
    }
    ; // list of lists
    // put each profile into a bucket by type (can be thought of like radix sort)
    for (var i = 0; i < profiles.length; i++) {
        if (analysisTab && !(profiles[i].show_in_analysis_tab)) {
            continue;
        }
        altGroups[altTypes.indexOf(profiles[i].alteration_type)].push(profiles[i]);
    }
    // go through and add them in sorted order
    for (var i = 0; i < altGroups.length; i++) {
        if (altGroups[i].length === 0) {
            continue; //nothing to do
        } else if (altGroups[i].length === 1) {
            // only one => checkbox
            var prof = altGroups[i][0];
            $("#genomic-profiles-select").append(genomicProfileCheckbox(prof.name, prof.id, prof.description));
        } else {

            // radio buttons needed
        }
    }
}

function genomicProfileCheckbox(name, id, helptext) {
    var ret = '<div class="checkbox"><label><input type="checkbox"';
    if (id !== -1) {
        ret += ' id=' + id;
    }
    ret += '>' + name
    if (helptext !== -1) {
        ret += '  <img src="images/help.png" title="' + helptext + '">';
    }
    ret += '</label></div>';
    return ret;
}

