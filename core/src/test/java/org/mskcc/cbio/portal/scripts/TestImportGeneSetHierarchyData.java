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
import java.util.List;

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
        ProgressMonitor.setConsoleMode(false);
        
        File file = new File("src/test/resources/genesetshierarchy_test_genesets.txt");

        boolean updateInfo = false;
        boolean newVersion = true;
        int skippedGenes = ImportGeneSetData.importData(file, updateInfo, newVersion);
        
        file = new File("src/test/resources/genesetshierarchy_test.yaml");
        boolean validate = false;
        ImportGeneSetHierarchy.importData(file, validate);

        // Test database entries
        
        // Get geneSet id
        GeneSet geneSet = DaoGeneSet.getGeneSetByExternalId("UNITTEST_GENESET8");
        
        // Get parent node id from geneSetHierarchyLeaf
        List<GeneSetHierarchyLeaf> geneSetHierarchyLeafs = DaoGeneSetHierarchyLeaf.getGeneSetHierarchyLeafsByGeneSetId(geneSet.getId());
        
        // Select the first and only gene set
        GeneSetHierarchyLeaf geneSetHierarchyLeaf = geneSetHierarchyLeafs.get(0);
        
        // Get node name from geneSetHierarchy
        GeneSetHierarchy geneSetHierarchy = DaoGeneSetHierarchy.getGeneSetHierarchyFromNodeId(geneSetHierarchyLeaf.getNodeId());
        
        // Check if node name is as expected
        assertEquals("Institutes Subcategory 2", geneSetHierarchy.getNodeName());
    }
}


