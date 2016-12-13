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
    	debugger;
    	var seq1 = jStat.seq(seq1);
    	var seq2 = jStat.seq(seq2);
    	return 1 - jStat.corrcoeff(seq1, seq2);
    }
    
    var internalPearsonDist = function(item1, item2) {
    	var seq1 = item1.orderedValueList;
    	var seq2 = item2.orderedValueList;
    	return pearsonDist(seq1, seq2);
    }
    
    /**
     * @param samples: Object with sampleStableId and map 
     * of geneticEntity/value pairs. Example:
     * [
     *  {
     *    sampleStableId: TCGA-AO-AA98-01,
     *    entities: [TP53, BRCA1],
     *    entityValueMap: {
     *    	TP53: 0.045,
     *    	BRA1: -0.89
     *    }
     *  },
     *  {
     *    sampleStableId: TCGA-AO-AA98-01,
     *    entities: [... etc
     *  }
     * ]
     * 
     * or 
     * 
     *  {
     *    "TCGA-AO-AA98-01":
     *    {
     *    	"TP53": 0.045,
     *    	"BRA1": -0.89
     *    }
     *   },
     */
    var hclusterSamples = function(samplesAndGenes) {
    	var refEntityList = null;
    	var inputItems = [];
    	//add _orderedValueList to all items, so the values are 
    	//compared in same order:
    	for (var sample in samplesAndGenes) {
    		debugger;
    		if (samplesAndGenes.hasOwnProperty(sample)) {
    			var sampleObj = samplesAndGenes[sample];
    			var inputItem = new Object();
    			inputItem.sample = sample;
    			inputItem.orderedValueList = [];//wrong...has to be new object....
    			if (refEntityList == null)
    				refEntityList = getRefList(sampleObj);
    			for (var j = 0; j < refEntityList.length; j++) {
        			var geneName = refEntityList[j];
        			var value = sampleObj[geneName];
        			inputItem.orderedValueList.push(value);
        		}
    			inputItems.push(inputItem);
    		}
    	}
    	var clusters = clusterfck.hcluster(inputItems, internalPearsonDist);
    	return clusters.clusters(1);
    }
    
    var getRefList = function(sample) {
    	var result = [];
    	for (var gene in sample) {
			if (sample.hasOwnProperty(gene)) {
				result.push(gene);
			}
		}
    	return result;
    }
    
    /**
     * @param samples: Object with geneticEntityStableId and map 
     * of sampleStableId/value pairs
     * 
     */
    var hclusterGeneticEntities = function(samplesAndGenes) {
    	var refEntityList = samplesAndGenes[0];
    	//add _orderedValueList to all items, so the values are 
    	//compared in same order:
    	var genesAndSamples = [];
    	for (var i = 0; i < refEntityList.length; i++) {
    		var geneName = ""; //TODO
    		genesAndSamples[geneName] = new Object();
    		genesAndSamples[geneName]._orderedValueList = [];
    		for (var j = 0; j < samplesAndGenes.length; j++) {
    			genesAndSamples[geneName]._orderedValueList.push(samplesAndGenes[j][geneName]);
    		}
    	}
    	
    	var clusters = clusterfck.hcluster(genesAndSamples, internalPearsonDist);
    	return clusters.clusters(1);
    }
    

  //https://github.com/tayden/clusterfck
  //https://raw.githubusercontent.com/tayden/clusterfck/master/dist/clusterfck.min.js
  /*
  var clusters = clusterfck.hcluster(colors, clusterfck.EUCLIDEAN_DISTANCE,
  	clusterfck.AVERAGE_LINKAGE, threshold);


  var samples = [
                [20, 20, 80],
                [22, 22, 90],
                [250, 255, 253],
                [100, 54, 255]
             ];

  var clusters = clusterfck.hcluster(samples, pearsonDist);
  clusters.clusters(1);  //3
  */
  
  	
    
  	
    return {
        mean: mean,
        stDev: stDev,
        zscore: zscore,
        hclusterSamples: hclusterSamples,
        hclusterGeneticEntities: hclusterGeneticEntities,
        pearsonDist: pearsonDist        
    }
    
}());

if (typeof module !== 'undefined'){
    module.exports = cbio.stat;
}
