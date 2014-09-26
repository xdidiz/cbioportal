$(document).ready(function() {
    // Load portal metadata
    $.getJSON("portal_meta_data.json?partial_studies=true&partial_genesets=true", function(json) {
        window.metaDataJson = json;
        populateCancerStudySelector();
    });
});

// --- FUNCTIONS FOR STYLE/ANIMATION --- //
// --- FUNCTIONS THAT LOAD DATA --- // 


// --- FUNCTIONS THAT POPULATE FORM WITH DATA --- //
function populateCancerStudySelector() {
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
}