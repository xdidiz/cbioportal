/*
 * Copyright (c) 2016 The Hyve B.V.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS
 * FOR A PARTICULAR PURPOSE. The software and documentation provided hereunder
 * is on an "as is" basis, and Memorial Sloan-Kettering Cancer Center has no
 * obligations to provide maintenance, support, updates, enhancements or
 * modifications. In no event shall Memorial Sloan-Kettering Cancer Center be
 * liable to any party for direct, indirect, special, incidental or
 * consequential damages, including lost profits, arising out of the use of this
 * software and its documentation, even if Memorial Sloan-Kettering Cancer
 * Center has been advised of the possibility of such damage.
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
*/

package org.mskcc.cbio.portal.scripts;

import java.io.*;
import java.util.*;
import joptsimple.*;
import org.mskcc.cbio.portal.dao.*;
import org.mskcc.cbio.portal.util.ProgressMonitor;
import org.yaml.snakeyaml.Yaml;
import org.cbioportal.model.GeneSet;
import org.cbioportal.model.GeneSetHierarchy;

public class ImportGeneSetHierarchy extends ConsoleRunnable {
	
	// Initiate a database instance
	static DaoGeneSetHierarchy daoGeneSetHierarchy = DaoGeneSetHierarchy.getInstance();
	
	// Initiate variable for validation
	static boolean validate;
	
	// Initiate childNodeId, necessary to test if GeneSetId is present during validation
	// , because true childNodeId will not be retrieved since no database connection is made. 
	static int childNodeId = 0;
	
	// Initiate start nodeId to give to first iteration.
	static int nodeIds = 0;


    @Override
    public void run() {
        try {
            String progName = "ImportGeneSetHierarchy";
            String description = "Import geneset hierarchy files in YAML format.";
            // usage: --data <data_file.yaml> --overwrite
            
            OptionParser parser = new OptionParser();
            OptionSpec<String> data = parser.accepts("data", "Geneset data file")
                    .withRequiredArg().ofType(String.class);
            parser.accepts("overwrite", "Permits overwrite to geneset tree data even if geneset tree is in use");

            OptionSet options = null;
            try {
                options = parser.parse(args);
            }
            catch (Exception ex) {
                throw new UsageException(
                        progName, description, parser, 
                        ex.getMessage());
            }
            
            // if neither option was set then throw UsageException
            if (!options.has(data)) {
                throw new UsageException(
                        progName, description, parser,
                        "'data' argument required");
            }
            
            boolean allowOverwrite = options.has("overwrite");
            
            File genesetFile = new File(options.valueOf(data));
            
        	System.out.println("Input file:");
            System.out.println(genesetFile);
        	System.out.println();
        	
            // First we want to validate that what we can import without errors
            validate = true;
            importData(genesetFile, allowOverwrite);
            
            // If this is succesful, we want to import
            validate = false;
            importData(genesetFile, allowOverwrite);
        }
        catch (Exception ex) {
            ex.printStackTrace();
        }
    }
    
    /**
     * Imports data from geneset hierarchy file.
     */
    private static void importData(File genesetFile, boolean allowOverwrite) throws Exception {
    	
        // Load data and parse with snakeyaml
        InputStream input = new FileInputStream(genesetFile);
        Yaml yaml = new Yaml();
        Map<String, Object> geneSetTree = (Map<String, Object>) yaml.load(input);
    	input.close();

    	// Check if database already contains values
    	boolean emptyDatabase = daoGeneSetHierarchy.checkGeneSetHierarchy();

    	// Check if geneset_hierarchy already filled
    	if (validate) {
	        if (emptyDatabase) {
	        	System.out.println("Table geneset_hierarchy is empty.");
	        } else {
	        	System.out.println("Table geneset_hierarchy is not empty.");
	        }
        	System.out.println();
    	}
    	
    	// Start making changes to database
    	if (emptyDatabase || allowOverwrite) {
        	
    		// Make the database empty
    		if (!emptyDatabase && validate) {
    	    	System.out.println("Emptying geneset_hierarchy and geneset_hierarchy_leaf before filling with new data.");
    	    	System.out.println();
    			daoGeneSetHierarchy.deleteAllGeneSetHierarchyRecords();
    		}

        	// Parse the tree and import to geneset_hierarchy
        	parseTree(geneSetTree, nodeIds);
        
    	} else {
            throw new RuntimeException("\nTable geneset_hierarchy is not empty. Will not overwrite.\n" +
                "Set option '--overwrite' to overwrite existing gene set tree.");
    	}
    }
    
    /**
     * Parses data from geneset hierarchy file and saves in database.
     * @throws DaoException 
     */
    private static void parseTree(Map<String, Object> geneSetTree, int parentNodeId) throws DaoException {
    	
    	// Create set with child nodes
		Set<String> childNodes = geneSetTree.keySet();
		
		// Iterate over the child nodes at this level
		for (String childNode: childNodes) {
			// Add leaf for gene sets
			if (childNode.equals("Gene sets")) {
				
				// Iterate over gene sets
				for (String geneSet: (List<String>) geneSetTree.get("Gene sets")) {
		
					// Add the gene set to the database
					addGeneSetHierarchyLeafs(parentNodeId, geneSet);
				}
				
			// Add nodes for (sub)categories
			} else {

				GeneSetHierarchy geneSetHierarchy = new GeneSetHierarchy();
				geneSetHierarchy.setNodeName(childNode);
				geneSetHierarchy.setParentId(parentNodeId);
				
				try {
					if (!validate) {
						// Add node
						daoGeneSetHierarchy.addGeneSetHierarchy(geneSetHierarchy);
					
						// Get node ID 
						childNodeId = geneSetHierarchy.getNodeId();
						System.out.println("Node id: " + childNodeId + ", Node name: " + childNode + ", Parent id: " + parentNodeId);		
					}
					
					// Go into the node
					parseTree((Map<String, Object>) geneSetTree.get(childNode), childNodeId);
					
				} catch (DaoException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			} 
        }
    }
    
    
    /**
     * Retrieve gene set IDs.
     */
    private static void addGeneSetHierarchyLeafs(int parentNodeId, String geneSetName) throws DaoException {
        DaoGeneSet daoGeneSet = DaoGeneSet.getInstance();
		GeneSet geneSet = daoGeneSet.getGeneSetByExternalId(geneSetName);
		
		// Add leaf to geneset_hierarchy_leaf
		if (geneSet != null) {
			
			// Only write geneset to database when not validating
			if (!validate) {
				System.out.println("Parent id: " + parentNodeId + ", GeneSet id: " + geneSetName);
				daoGeneSetHierarchy.addGeneSetHierarchyLeaf(parentNodeId, geneSet.getId());
			}
		} else {
            throw new RuntimeException("\nGene set `" + geneSetName + "` not in geneset table in database. Please add it first before adding tree containing it.");
		}
    	
    }


    public ImportGeneSetHierarchy(String[] args) {
        super(args);
    }
    
    public static void main(String[] args) {
        ConsoleRunnable runner = new ImportGeneSetHierarchy(args);
        runner.runInConsole();        
    }


    
}
