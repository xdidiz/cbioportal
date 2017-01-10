/*
 * Copyright (c) 2016 The Hyve B.V.
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

/*
 * @author Sander Tan
 * code based on TestImportGeneData.java
*/

package org.mskcc.cbio.portal.scripts;

import org.cbioportal.model.GeneSet;
import org.cbioportal.model.GeneSetHierarchy;
import org.cbioportal.model.GeneSetHierarchyLeaf;

import org.junit.Test;
import org.junit.runner.RunWith;

import static org.junit.Assert.assertEquals;

import java.io.File;

import org.mskcc.cbio.portal.dao.DaoGeneSet;
import org.mskcc.cbio.portal.dao.DaoGeneSetHierarchy;
import org.mskcc.cbio.portal.dao.DaoGeneSetHierarchyLeaf;
import org.mskcc.cbio.portal.util.ProgressMonitor;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.transaction.TransactionConfiguration;
import org.springframework.transaction.annotation.Transactional;

/*
 * JUnit tests for ImportGeneSetData class.
*/

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = { "classpath:/applicationContext-dao.xml" })
@TransactionConfiguration(transactionManager = "transactionManager", defaultRollback = true)
@Transactional
public class TestImportGeneSetHierarchyData {

	@Test
    public void testImportGeneSetHierarchyData() throws Exception {
		DaoGeneSet daoGeneSet = DaoGeneSet.getInstance();
		DaoGeneSetHierarchy daoGeneSetHierarchy = DaoGeneSetHierarchy.getInstance();
		DaoGeneSetHierarchyLeaf daoGeneSetHierarchyLeaf = DaoGeneSetHierarchyLeaf.getInstance();

        ProgressMonitor.setConsoleMode(false);
        
        File file = new File("src/test/resources/genesetshierarchy_test_genesets.txt");
        boolean allowUpdates = true;
        String version = "";
        ImportGeneSetData.importData(file, allowUpdates, version);
        
        file = new File("src/test/resources/genesetshierarchy_test.yaml");
        ImportGeneSetHierarchy.importData(file, true);

        // Test database entries
        
        // Get geneSet id
        GeneSet geneSet = daoGeneSet.getGeneSetByExternalId("UNITTEST_GENESET4");
        
        // Get parent node id from geneSetHierarchyLeaf
        GeneSetHierarchyLeaf geneSetHierarchyLeaf = daoGeneSetHierarchyLeaf.getGeneSetHierarchyLeafsByGeneSetId(geneSet.getId());
        
        // Get node name from geneSetHierarchy
        GeneSetHierarchy geneSetHierarchy = daoGeneSetHierarchy.getGeneSetHierarchyFromNodeId(geneSetHierarchyLeaf.getNodeId());
        
        // Check if node name is as expected
        assertEquals("Institutes Subcategory 1", geneSetHierarchy.getNodeName());
        
        // TODO Test warning message
        
    }
}


