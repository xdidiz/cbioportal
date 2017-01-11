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
import org.cbioportal.model.GeneSetHierarchyLeaf;

public class ImportGeneSetHierarchy extends ConsoleRunnable {
	
    @Override
    public void run() {
        try {
            String progName = "ImportGeneSetHierarchy";
            String description = "Import geneset hierarchy files in YAML format.";
            // usage: --data <data_file.yaml>
            
            OptionParser parser = new OptionParser();
            OptionSpec<String> data = parser.accepts("data", "Geneset data file")
                    .withRequiredArg().ofType(String.class);

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
            
            
            File genesetFile = new File(options.valueOf(data));
            
        	System.out.println("Input file:");
            System.out.println(genesetFile);
        	System.out.println();
        	
        	// Check if geneset_hierarchy already filled
         	boolean emptyDatabase = !DaoGeneSetHierarchy.checkGeneSetHierarchy();
	        if (emptyDatabase) {
    	        	System.out.println("Table geneset_hierarchy is empty.");
    	        } else {
    	        	System.out.println("Table geneset_hierarchy is not empty.");
        	}
            
            // First we want to validate that the gene sets we're adding, are in database.
            boolean validate = true;
            importData(genesetFile, validate);

        	// Asks if used wants to continue
//            ProgressMonitor.setCurrentMessage("Previous gene set hierarchy found. Do you want to remove previous hierarchy and continue importing new hierarchy?");
//            ProgressMonitor.setCurrentMessage("Type `yes` to continue or anything else to abort.");
//        	
//            try (Scanner scanner = new Scanner(System.in)) {
//
//            	String confirmEmptyingGeneSetHierarchy = scanner.next().toLowerCase();
//            	ProgressMonitor.setCurrentMessage(confirmEmptyingGeneSetHierarchy);
//            	if (!confirmEmptyingGeneSetHierarchy.equals("yes")) {
//            		throw new UsageException(
//    	                    progName, description, parser,
//    	    				"User did not confirm to remove previous gene set hierarchy.");
//            	}
//            }
            
    		// Make the database empty
    		if (!emptyDatabase) {

    	    	System.out.println("Emptying geneset_hierarchy and geneset_hierarchy_leaf before filling with new data.");
    	    	System.out.println();
    			DaoGeneSetHierarchy.deleteAllGeneSetHierarchyRecords();
    		}	
        	
            // If this is succesful, we want to import
            validate = false;
            importData(genesetFile, validate);
        }
        catch (Exception ex) {
            ex.printStackTrace();
        }
    }
    
    /**
     * Imports data from geneset hierarchy file.
     */
    public static void importData(File genesetFile, boolean validate) throws Exception {
    	
        // Load data and parse with snakeyaml
        InputStream input = new FileInputStream(genesetFile);
        Yaml yaml = new Yaml();
        Map<String, Object> geneSetTree = (Map<String, Object>) yaml.load(input);
    	input.close();

    	// Initiate start nodeId to give to first iteration.
    	int nodeIds = 0;
    	
    	// Parse the tree and import to geneset_hierarchy
    	parseTree(geneSetTree, nodeIds, validate);
    }
    
    /**
     * Parses data from geneset hierarchy file and saves in database.
     * @throws DaoException 
     */
    private static void parseTree(Map<String, Object> geneSetTree, int parentNodeId, boolean validate) throws DaoException {
    	
    	// Create set with child nodes
		Set<String> childNodes = geneSetTree.keySet();
		
		// Iterate over the child nodes at this level
		for (String childNode: childNodes) {
			
			// Add leaf for gene sets
			if (childNode.equals("Gene sets")) {
				
				// Iterate over gene sets
				for (String geneSetName: (List<String>) geneSetTree.get("Gene sets")) {
		
					// Retrieve geneSet from database
					GeneSet geneSet = DaoGeneSet.getGeneSetByExternalId(geneSetName);
					
					// Check if geneSet is in database
					if (geneSet != null) {
						
						// Only write geneset to database when not validating
						if (!validate) {
							GeneSetHierarchyLeaf geneSetHierarchyLeaf = new GeneSetHierarchyLeaf();
							geneSetHierarchyLeaf.setNodeId(parentNodeId);
							geneSetHierarchyLeaf.setGeneSetId(geneSet.getId());

							// Add leaf to geneset_hierarchy_leaf
							System.out.println("Parent id: " + parentNodeId + ", GeneSet id: " + geneSetName);
							DaoGeneSetHierarchyLeaf.addGeneSetHierarchyLeaf(geneSetHierarchyLeaf);
						}
					} else {
			            throw new RuntimeException("\nGene set `" + geneSetName + "` not in geneset table in database. Please add it first before adding tree containing it.");
					}
				}
				
			// Add nodes for (sub)categories
			} else {
				
				try {
					int childNodeId; 
					if (!validate) {
						GeneSetHierarchy geneSetHierarchy = new GeneSetHierarchy();
						geneSetHierarchy.setNodeName(childNode);
						geneSetHierarchy.setParentId(parentNodeId);
						
						// Add node to geneset_hierarchy
						DaoGeneSetHierarchy.addGeneSetHierarchy(geneSetHierarchy);
					
						// Get node ID 
						childNodeId = geneSetHierarchy.getNodeId();
						System.out.println("Node id: " + childNodeId + ", Node name: " + childNode + ", Parent id: " + parentNodeId);		
					} else{
						// Initiate childNodeId, necessary to test if GeneSetId is present during validation
						// , because true childNodeId will not be retrieved since no database connection is made. 
						childNodeId = 0;
					}
					
					// Go into the node
					parseTree((Map<String, Object>) geneSetTree.get(childNode), childNodeId, validate);
					
				} catch (DaoException e) {
		            throw new DaoException(e);
				}
			} 
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




