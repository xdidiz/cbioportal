
function CivicService() {
    
    var service = {
        
        getCivicGene: function(gene) {
            return $.ajax({
                type: 'GET',
                url: 'api-legacy/proxy/civicGenes/' + gene,
                dataType: 'json',
                contentType: 'application/json',
                data: {
                    identifier_type: 'entrez_symbol'
                }
            }).then(function(result) {
                if (_.isString(result)) {
                    result = $.parseJSON(result);
                }

                if (result.variants && result.variants.length > 0) {
                    var civicGeneId = result.id;
                    var civicVariants = {};
                    result.variants.forEach(function(variant) {
                        civicVariants[variant.name] = {
                            id: variant.id,
                            name: variant.name
                        };
                    });
                    return {
                        geneId: civicGeneId,
                        variants: civicVariants
                    };
                }
                
                return {};
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
