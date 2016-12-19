/*
 * Copyright (c) 2016 The Hyve B.V.
 * This code is licensed under the GNU Affero General Public License,
 * version 3, or (at your option) any later version.
 */

/*
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

importScripts('clusterfck.min.js');
importScripts('../../../js/lib/jstat.min.js');


/**
 * "Routing" logic for this worker, based on given message.
 * 
 * @param m : message object with m.dimension (CASES or ENTITIES) and m.casesAndEntitites
 *      which is the input for the clustering method.
 */
onmessage = function(m) {
	console.log('Clustering worker received message');
	var result = null;
	if (m.data.dimension === "CASES") {
		result = hclusterCases(m.data.casesAndEntitites);
	} else if (m.data.dimension === "ENTITIES") {
		result = hclusterGeneticEntities(m.data.casesAndEntitites);
	} else {
		throw new Error("Illegal argument given to clustering-worker.js for m.data.dimension: " + m.data.dimension);
	}
	console.log('Posting clustering result back to main script');
	postMessage(result);
}

/**
 * Distance measure used in the clustering.
 */
var pearsonDist = function(item1, item2) {
	var seq1 = item1.orderedValueList;
	var seq2 = item2.orderedValueList;
	var r = jStat.corrcoeff(seq1, seq2);
	if (isNaN(r)) {
		r = 0; //will result in same distance as no correlation //TODO - calculate correlation only on items where there is data...?
	}
	return 1 - r;
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
 *   @return the reordered list of sample(or patient) ids, after clustering.
 */
var hclusterCases = function(casesAndEntitites) {
	var refEntityList = null;
	var inputItems = [];
	//add orderedValueList to all items, so the values are 
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
	var clusters = clusterfck.hcluster(inputItems, pearsonDist);
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
 * @param casesAndEntitites: same as used in hclusterCases above.
 * 
 * @return the reordered list of entity ids, after clustering. 
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
	var clusters = clusterfck.hcluster(inputItems, pearsonDist);
	return clusters.clusters(1)[0];
}