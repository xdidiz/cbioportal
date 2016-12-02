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

package org.cbioportal.persistence.mybatis;

import org.cbioportal.model.GeneticEntity;
import org.cbioportal.model.GeneticEntity.EntityType;
import org.cbioportal.persistence.GeneticEntityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
public class GeneticEntityMyBatisRepository implements GeneticEntityRepository {

    @Autowired
    private GeneMapper geneMapper;

    @Override
    public GeneticEntity getGeneticEntity(String entityStableId, EntityType type) {
    	if (type.equals(EntityType.GENE)) {
    		//TODO - use a global cache that is initialized on startup with all gene x entity id mappings
    		return geneMapper.getGeneByHugoGeneSymbol(entityStableId, null); 
    	}
    	else {
    		throw new UnsupportedOperationException("not implemented yet for other entities");
    	}
    		
    }
	
    @Override
    public GeneticEntity getGeneticEntity(Integer entityId, EntityType type) {
    	if (type.equals(EntityType.GENE)) {
    		return geneMapper.getGeneByGeneticEntityId(entityId, null); 
    	}
    	else {
    		throw new UnsupportedOperationException("not implemented yet for other entities");
    	}
    }	
	
    
}
