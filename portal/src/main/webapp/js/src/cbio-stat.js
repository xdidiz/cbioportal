/*
 *  cbio statistics library
 */

if (cbio === undefined) {
    var cbio = {};
}

cbio.stat = (function() {
    
    // mean (µ)
    var mean = function(_inputArr) {
        var _sum = _.reduce(_inputArr, function(memo, num){ return memo + num; }, 0);
        return _sum / _inputArr.length;
    }

    // standard deviation (σ)
    var stDev = function(_inputArr) {
        var _mean = mean(_inputArr);
        var _squaredRef = _.map(_inputArr, function (_inputElem) {
            return Math.pow((_inputElem - _mean), 2);
        });
        var _squaredRefSum = 0;
        _.each(_squaredRef, function (_num_stDev) {
            _squaredRefSum += _num_stDev;
        });
        return Math.sqrt(_squaredRefSum / _inputArr.length - 1);
    }

    // z score
    /*
     * From TCGA:
     * A z-score for a sample indicates the number of standard deviations away 
     * from the mean of expression in the reference.  The formula is : 
     * z = (expression in tumor sample - mean expression in reference sample) / 
     * standard deviation of expression in reference sample
     * The reference here is all the diploid samples under a study.
     * 
     * @param _ref: mrna expression data of all diploid samples under queried study
     * @param _input: mrna expression data of all queried samples under queried study
     * @return _zscoreArr: array of zscore of the _input array
     */
    var zscore = function(_refArr, _inputArr) {
        var _refMean = mean(_refArr);
        var _refStDev = stDev(_refArr);

        // z = (x - u) / σ
        var _zscoreArr = [];
        _.each(_inputArr, function (_inputElem) {
            _zscoreArr.push((_inputElem - _refMean) / _refStDev);
        });

        return _zscoreArr;
    }
    
  //http://cdn.jsdelivr.net/jstat/latest/jstat.min.js
  //https://github.com/jstat/jstat
  /*
  var seq = jStat.seq( 0, 10, 11 );
  jStat.corrcoeff( seq, seq ) === 1;
  */

    var pearsonDist = function(seq1, seq2) {
    	var r = jStat.corrcoeff(seq1, seq2);
    	if (isNaN(r)) {
    		r = 0; //will result in same distance as no correlation //TODO - calculate correlation only on items where there is data...?
    	}
    	return 1 - r;
    }
    
    var internalPearsonDist = function(item1, item2) {
    	var seq1 = item1.orderedValueList;
    	var seq2 = item2.orderedValueList;
    	return pearsonDist(seq1, seq2);
    }
    
    /**
     * @param casesAndEntitites: Object with sample(or patient)Id and map 
     * of geneticEntity/value pairs. Example:
     *  
     * var a =
     *  {
     *    "TCGA-AO-AA98-01":
     *    {
     *    	"TP53": 0.045,
     *    	"BRA1": -0.89
     *    }
     *   },
     *   ...
     *   
     *   Use: cbio.stat.hclusterCases(a);
     */
    var hclusterCases = function(casesAndEntitites) {
    	var refEntityList = null;
    	var inputItems = [];
    	//add _orderedValueList to all items, so the values are 
    	//compared in same order:
    	for (var caseId in casesAndEntitites) {
    		if (casesAndEntitites.hasOwnProperty(caseId)) {
    			var caseObj = casesAndEntitites[caseId];
    			var inputItem = new Object();
    			inputItem.caseId = caseId;
    			inputItem.orderedValueList = [];
    			if (refEntityList == null) {
    				refEntityList = getRefList(caseObj);
    			}
    			for (var j = 0; j < refEntityList.length; j++) {
        			var entityId = refEntityList[j];
        			var value = caseObj[entityId];
        			inputItem.orderedValueList.push(value);
        		}
    			inputItems.push(inputItem);
    		}
    	}
    	var clusters = clusterfck.hcluster(inputItems, internalPearsonDist);
    	return clusters.clusters(1)[0];
    }
    
    var getRefList = function(caseItem) {
    	var result = [];
    	for (var entityId in caseItem) {
			if (caseItem.hasOwnProperty(entityId)) {
				result.push(entityId);
			}
		}
    	return result;
    }
    
    /**
     * @param samples: Object with geneticEntityId and map 
     * of sampleId/value pairs
     * 
     */
    var hclusterGeneticEntities = function(casesAndEntitites) {
    	var refEntityList = null;
    	var inputItems = [];
    	var refCaseIdList = [];
    	//add orderedValueList to all items, so the values are 
    	//compared in same order:
    	for (var caseId in casesAndEntitites) {
    		if (casesAndEntitites.hasOwnProperty(caseId)) {
    			var caseObj = casesAndEntitites[caseId];
    			if (refEntityList == null) {
    				refEntityList = getRefList(caseObj);
    			}
    			//refCaseIdList:
    			refCaseIdList.push(caseId);
    		}
    	}
    	//iterate over genes, and get sample values:
		for (var i = 0; i < refEntityList.length; i++) {
			var entityId = refEntityList[i];
   			var inputItem = new Object();
   			inputItem.entityId = entityId;
   			inputItem.orderedValueList = [];
   			for (var j = 0; j < refCaseIdList.length; j++) {
   				var caseId = refCaseIdList[j];
   				var caseObj = casesAndEntitites[caseId];
        		var value = caseObj[entityId];
        		inputItem.orderedValueList.push(value);
   	    	}
   	    	inputItems.push(inputItem);
    	}
    	var clusters = clusterfck.hcluster(inputItems, internalPearsonDist);
    	return clusters.clusters(1)[0];
    }
  	
    return {
        mean: mean,
        stDev: stDev,
        zscore: zscore,
        hclusterCases: hclusterCases,
        hclusterGeneticEntities: hclusterGeneticEntities,
        pearsonDist: pearsonDist        
    }
    
}());

if (typeof module !== 'undefined'){
    module.exports = cbio.stat;
}
