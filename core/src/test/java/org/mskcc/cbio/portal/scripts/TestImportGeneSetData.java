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
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import static org.junit.Assert.assertEquals;

import java.io.File;
import java.net.URL;

import org.mskcc.cbio.portal.dao.DaoGeneSet;

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
public class TestImportGeneSetData {

    private URL geneSetDataFilePath;
    private URL suppGeneSetDataFilePath;
    
    @Before
    public void setUp() {

        geneSetDataFilePath = this.getClass().getResource("/genesets_test.txt");
        suppGeneSetDataFilePath = this.getClass().getResource("/supp-genesets.txt");
    }

    @Test
    public void testImportGeneSetData() throws Exception {
    	DaoGeneSet daoGeneSet = DaoGeneSet.getInstance();
        ProgressMonitor.setConsoleMode(false);
		// TBD: change this to use getResourceAsStream()
        if (suppGeneSetDataFilePath!=null) {
            File file = new File(suppGeneSetDataFilePath.getFile());
            ImportGeneSetData.importSuppGeneSetData(file);
        }
        
        if (geneSetDataFilePath != null) {
            File file = new File(geneSetDataFilePath.getFile());
            boolean allowUpdates = true;
            String version = "";
            ImportGeneSetData.importData(file, allowUpdates, version);
            // ImportGeneSetData.importData(File genesetFile, boolean allowUpdates, String version);

            GeneSet geneSet = daoGeneSet.getGeneSetById(5);
            assertEquals("UNITTEST_GENESET5", geneSet.getExternalId());
            geneSet = daoGeneSet.getGeneSetById(10);
            assertEquals("UNITTEST_GENESET10", geneSet.getExternalId());

//            geneSet = daoGeneSet.getGeneSetByExternalId("UNITTEST_GENESET8");
//            assertEquals("8", geneSet.getId());
//            geneSet = daoGeneSet.getGeneSetByExternalId("UNITTEST_GENESET2");
//            assertEquals("2", geneSet.getId());
        }
        else {
            throw new IllegalArgumentException("Cannot find test gene file, is PORTAL_HOME set?");
        }
    }
}	