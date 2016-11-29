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
import java.util.List;

import org.cbioportal.model.GeneticData;
import org.cbioportal.model.GeneticDataSamples;
import org.cbioportal.model.GeneticDataValues;
import org.cbioportal.model.meta.BaseMeta;
import org.cbioportal.persistence.GeneticDataRepository;
import org.cbioportal.service.GeneticDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class GeneticDataServiceImpl implements GeneticDataService {

    @Autowired
    private GeneticDataRepository geneticDataRepository;

    @Override
    public List<GeneticData> getAllGeneticDataInGeneticProfile(String geneticProfileId, String projectionName, Integer pageSize,
			Integer pageNumber) {
    	//get samples:
    	GeneticDataSamples samples = geneticDataRepository.getGeneticDataSamplesInGeneticProfile(geneticProfileId, pageSize, pageNumber);
    	//get list of genes and respective sample values:
    	List<GeneticDataValues> geneListAndValues =  geneticDataRepository.getGeneticDataValuesInGeneticProfile(geneticProfileId, null, pageSize, pageNumber);
    	
    	//iterate over geneListAndValues and samples and match items together, 
    	//producing the final list of GeneticData items:
    	List<GeneticData> result = new ArrayList<GeneticData>();
    	//TODO - something similar to  https://github.com/cBioPortal/cbioportal/blob/master/business/src/main/java/org/mskcc/cbio/portal/service/ApiService.java#L492
    	//PA write a unit test
    	
    	
    	
    	//push -f
        return result;
    }
    
    @Override
    public BaseMeta getMetaGeneticDataInGeneticProfile(String geneticProfileId) {
        return geneticDataRepository.getMetaGeneticDataInGeneticProfile(geneticProfileId);
    }

}
