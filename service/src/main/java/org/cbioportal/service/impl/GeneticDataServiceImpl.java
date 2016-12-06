/*
 * Copyright (c) 2016 The Hyve B.V.
 * This code is licensed under the GNU Affero General Public License (AGPL),
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

package org.cbioportal.service.impl;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.cbioportal.model.GeneticData;
import org.cbioportal.model.GeneticDataSamples;
import org.cbioportal.model.GeneticDataValues;
import org.cbioportal.model.GeneticEntity;
import org.cbioportal.model.GeneticProfile;
import org.cbioportal.model.GeneticProfile.GeneticAlterationType;
import org.cbioportal.model.Sample;
import org.cbioportal.model.meta.BaseMeta;
import org.cbioportal.persistence.GeneticDataRepository;
import org.cbioportal.persistence.GeneticEntityRepository;
import org.cbioportal.persistence.GeneticProfileRepository;
import org.cbioportal.persistence.SampleRepository;
import org.cbioportal.service.GeneticDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class GeneticDataServiceImpl implements GeneticDataService {

    @Autowired
    private GeneticDataRepository geneticDataRepository;
    
    @Autowired
    private GeneticProfileRepository geneticProfileRepository;
    
    @Autowired
    private GeneticEntityRepository geneticEntityRepository;
    
    @Autowired
    private SampleRepository sampleRepository;
    
    @Override
    public List<GeneticData> getAllGeneticDataInGeneticProfile(String geneticProfileId, String projectionName, Integer pageSize,
			Integer pageNumber) {
    	//get samples:  //TODO ? -  pageSize, pageNumber are not really used in these 2 methods. Maybe remove for clarity? Paging is implemented manually in the loop below.
    	GeneticDataSamples samples = geneticDataRepository.getGeneticDataSamplesInGeneticProfile(geneticProfileId, pageSize, pageNumber);
    	//get list of genes and respective sample values:
    	List<GeneticDataValues> geneticItemListAndValues =  geneticDataRepository.getGeneticDataValuesInGeneticProfile(geneticProfileId, null, pageSize, pageNumber);
    	
    	//get genetic profile info:
    	GeneticProfile geneticProfile = geneticProfileRepository.getGeneticProfile(geneticProfileId);
    	
    	List<GeneticData> result = new ArrayList<GeneticData>();
    	//merge the values and samples into a list of GeneticData items:
    	String[] sampleInternalIdsList = samples.getOrderedSamplesList().split(",");
    	Map<Integer,Sample> sampleIdToStableIdMap = getSampleStableIdsList(geneticProfile, sampleInternalIdsList);
    	//variables for simple paging implementation:
    	int itemIdx = 0;
    	Integer start = calculateOffset(pageSize, pageNumber);
    	Integer end = null;
    	if (start != null) {
    		end = start + pageSize;
    	}
    	//iterate over geneListAndValues and samples and match items together, 
    	//producing the final list of GeneticData items:
    	for (GeneticDataValues geneDataValues : geneticItemListAndValues) {
    		String[] values = geneDataValues.getOrderedValuesList().split(",");
    		for (int i = 0; i < values.length; i++) {
    			//if start/end are null or if the item is part of the specified page, add:
    			if (end == null || (itemIdx >= start && itemIdx < end)) {
	    			String value = values[i];
	    			int sampleInternalId = Integer.parseInt(sampleInternalIdsList[i]);
	    			GeneticData geneticDataItem =  getSimpleFlatGeneticDataItem(geneticProfile, sampleIdToStableIdMap.get(sampleInternalId), 
	    					geneDataValues.getGeneticEntityId(), value);
	    			result.add(geneticDataItem);
    			} else {
    				break;
    			}
    			itemIdx++;
    		}
    		//avoid unnecessary iterations if end is specified:
    		if (end != null && itemIdx >= end) {
    			break;
    		}
    	}
        return result;
    }
    
    /**
     * Calculate offset.
     * 
     * note: this is a duplication of org.cbioportal.persistence.mybatis.util.OffsetCalculator. Alternative would be 
     * to add the persistence.mybatis module as a dependency in service module...not really worth it just for this:
     */
    private Integer calculateOffset(Integer pageSize, Integer pageNumber) {

        return pageSize == null || pageNumber == null ? null : pageSize * pageNumber;
    }
    
    private Map<Integer,Sample> getSampleStableIdsList(GeneticProfile geneticProfile, String[] sampleInternalIdsList) {
    	
    	List<Integer> sampleInternalIds = new ArrayList<Integer>();
    	for (String internalId : sampleInternalIdsList) {
    		sampleInternalIds.add(Integer.parseInt(internalId));
    	}
    	
    	List<Sample> samples = sampleRepository.fetchSamplesInSameStudyByInternalIds(geneticProfile.getCancerStudyIdentifier(), sampleInternalIds, null);
    	Map<Integer,Sample> sampleIdToStableIdMap = new HashMap<Integer,Sample>();
    	for (Sample sample : samples) {
    		sampleIdToStableIdMap.put(sample.getInternalId(), sample);
    	}
    	return sampleIdToStableIdMap;    
	}

	@Override
    public BaseMeta getMetaGeneticDataInGeneticProfile(String geneticProfileId) {
        return geneticDataRepository.getMetaGeneticDataInGeneticProfile(geneticProfileId);
    }

    
    
    private GeneticData getSimpleFlatGeneticDataItem(GeneticProfile geneticProfile, Sample sample, Integer entityId, String value){
    	GeneticData item = new GeneticData();
    	
    	GeneticEntity geneticEntity;
    	
    	List<GeneticAlterationType> geneBasedTypes = Arrays.asList(GeneticAlterationType.MICRO_RNA_EXPRESSION,
    			GeneticAlterationType.MRNA_EXPRESSION,
    			GeneticAlterationType.MRNA_EXPRESSION_NORMALS,
    			GeneticAlterationType.RNA_EXPRESSION,
    			GeneticAlterationType.METHYLATION,
    			GeneticAlterationType.METHYLATION_BINARY,
    			GeneticAlterationType.PHOSPHORYLATION, //TODO - this will be "protein based" at some point, not gene based
    			GeneticAlterationType.PROTEIN_LEVEL, //TODO - this will be "protein based" at some point, not gene based
    			GeneticAlterationType.PROTEIN_ARRAY_PROTEIN_LEVEL, //TODO - remove? I think this is not used anymore...
    			GeneticAlterationType.PROTEIN_ARRAY_PHOSPHORYLATION); //TODO - remove? I think this is not used anymore...
    	
    	if (geneBasedTypes.contains(geneticProfile.getGeneticAlterationType())) { 
    		geneticEntity = geneticEntityRepository.getGeneticEntity(entityId, GeneticEntity.EntityType.GENE);
    	}
    	else {
    		throw new UnsupportedOperationException("the profile type '" + geneticProfile.getGeneticAlterationType() + 
    				"' is not(yet) supported via this api...");
    	}
    	
		item.setGeneticEntity(geneticEntity);
    	item.setGeneticEntityId(entityId);
    	item.setGeneticEntityStableId(geneticEntity.getEntityStableId());
    	
    	item.setGeneticProfileId(geneticProfile.getGeneticProfileId());
    	item.setGeneticProfileStableId(geneticProfile.getStableId());
    	
    	item.setSampleId(sample.getInternalId());
    	item.setSampleStableId(sample.getStableId());
    	
    	item.setValue(value);
    	
    	return item;
    }
    
}
