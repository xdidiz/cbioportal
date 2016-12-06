
function CivicService() {
    
    var civicGenes = {};
    var finishedLoading = false;
    
    function retrieveAllCivicGenes() {
        return $.ajax({
            type: 'GET',
            url: 'api-legacy/proxy/civicGenes/',
            dataType: 'json',
            contentType: 'application/json',
        }).then(function(result) {
            if (_.isString(result)) {
                result = $.parseJSON(result);
            }
            
            if (result.records) {
                result.records.forEach(function(record) {
                    if (record.variants && record.variants.length > 0) {
                        var civicGene = {
                            id: record.id,
                            variants: {} 
                        };
                        civicGenes[record.name] = civicGene;
                        var variants = civicGene.variants;
                        record.variants.forEach(function(variant) {
                            variants[variant.name] = {
                                id: variant.id,
                                name: variant.name
                            };
                        });
                    }
                });
            }

            finishedLoading = true;
        });
    }
    
    var promise = retrieveAllCivicGenes();
    
    var service = {
        
        getCivicGene: function(gene) {
            return promise.then(function() {
                return civicGenes[gene];
            });
        },
        
        getMatchingCivicVariants: function(civicVariants, proteinChange) {
            var matchingCivicVariants = [];
            var civicVariant = civicVariants[proteinChange];
            if (typeof civicVariant !== 'undefined') {
                matchingCivicVariants.push(civicVariant);
            }
            //TODO: search for matches other than the literal match
            return matchingCivicVariants;
        },
        
        getCivicVariant: function(civicVariant) {
            var deferred = $.Deferred();

            if (civicVariant.description) {
                // Variant info has already been loaded
                deferred.resolve();
            }
            else {
                $.ajax({
                        type: 'GET',
                        url: 'api-legacy/proxy/civicVariants/' + civicVariant.id,
                        dataType: 'json',
                        contentType: 'application/json'
                    })
                    .done(function (result) {
                        if (_.isString(result)) {
                            result = $.parseJSON(result);
                        }
                        civicVariant.description = result.description;

                        // Aggregate evidence items per type
                        civicVariant.evidence = {};
                        var evidence = civicVariant.evidence;
                        result.evidence_items.forEach(function (evidenceItem) {
                            var evidenceType = evidenceItem.evidence_type;
                            if (evidence.hasOwnProperty(evidenceType)) {
                                evidence[evidenceType] += 1;
                            }
                            else {
                                evidence[evidenceType] = 1;
                            }
                        });
                        deferred.resolve();
                    })
                    .fail(function () {
                        deferred.reject();
                    });
            }

            return deferred.promise();
        }
    }
    return service;
}
